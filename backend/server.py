import os
import uuid
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
# import groq # No longer directly used here
import motor.motor_asyncio
from bson import json_util
from backend.external_integrations.groq_client import analyze_text_with_groq

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
db = client.test_database

# Models
class MessageInput(BaseModel):
    text: str
    context: Optional[str] = None
    relationship_id: Optional[str] = None

class Flag(BaseModel):
    type: str
    description: str
    participant: Optional[str] = None

class AnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    context: Optional[str] = None
    relationship_id: Optional[str] = None
    relationship_name: Optional[str] = None
    flags: List[Flag] = []
    interpretation: str
    suggestions: List[str] = []
    sentiment: str
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    # Enhanced emotional intelligence fields from Groq API
    emotional_tone: Optional[str] = None
    communication_style: Optional[str] = None
    potential_triggers: List[str] = []
    confidence_score: Optional[float] = None
    emotional_flags: List[str] = []
    relationship_insights: Optional[str] = None
    emotional_maturity_level: Optional[str] = None

class Relationship(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    notes: Optional[str] = None
    health_score: int = 75
    last_contact: str = Field(default_factory=lambda: datetime.now().isoformat())
    sentiment: str = "neutral"
    flag_history: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class GrowthActivity(BaseModel):
    day: int
    title: str
    activity_type: str
    content: str

class WeeklyPlan(BaseModel):
    theme: str
    days: List[GrowthActivity]

class GrowthPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    current_week: WeeklyPlan
    goals: List[str]
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

# Helper to parse MongoDB results
def parse_json(data):
    return json.loads(json_util.dumps(data))

# Routes
@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_message(message_input: MessageInput):
    relationship_name = None
    if message_input.relationship_id:
        relationship = await db.relationships.find_one({"id": message_input.relationship_id})
        if relationship:
            relationship_name = relationship.get("name")

    try:
        # Call the new Groq client function
        # analyze_text_with_groq is expected to raise HTTPException on API errors or ValueError if API key is missing
        analysis_data = analyze_text_with_groq(text=message_input.text, context=message_input.context)

        # The groq_client returns a dict. We need to map its fields to AnalysisResult.
        # `analyze_text_with_groq` returns:
        # {'flags': [{'type': '...', 'description': '...', 'participant': '...'}, ...], 
        #  'interpretation': '...', 'suggestions': ['...'], 'sentiment': '...'}
        # The 'participant' field in flags is optional.

        raw_flags_from_groq = analysis_data.get("flags", [])
        parsed_flags_for_result = []
        for flag_data_dict in raw_flags_from_groq:
            # Ensure all required fields for Flag model are present or provide defaults if appropriate
            # The Flag model has 'type' and 'description' as required, 'participant' is optional.
            # The groq_client should be returning dicts compatible with Flag(**flag_data_dict)
            parsed_flags_for_result.append(Flag(**flag_data_dict))

        result = AnalysisResult(
            text=message_input.text,
            context=message_input.context,
            relationship_id=message_input.relationship_id,
            relationship_name=relationship_name,
            flags=parsed_flags_for_result,
            interpretation=analysis_data.get("interpretation", "No interpretation provided."),
            suggestions=analysis_data.get("suggestions", []),
            sentiment=analysis_data.get("sentiment", "neutral"),
            # Enhanced emotional intelligence fields
            emotional_tone=analysis_data.get("emotional_tone"),
            communication_style=analysis_data.get("communication_style"),
            potential_triggers=analysis_data.get("potential_triggers", []),
            confidence_score=analysis_data.get("confidence_score"),
            emotional_flags=analysis_data.get("emotional_flags", []),
            relationship_insights=analysis_data.get("relationship_insights"),
            emotional_maturity_level=analysis_data.get("emotional_maturity_level")
        )
        
        # Save the result to the database
        # Using result.dict(by_alias=True) is good practice if your Pydantic models use aliases (e.g. for '_id')
        # but AnalysisResult uses 'id' directly, so result.dict() is fine.
        await db.analysis_results.insert_one(result.model_dump()) # Pydantic v2 uses model_dump()
        
        # If this is related to a relationship, update the relationship's flag history
        if message_input.relationship_id:
            # The flag_history expects a list of dicts, and `raw_flags_from_groq` is already in that format.
            # Specifically, it was `[f["type"] for f in detected_flags]`
            # So we should extract just the types from raw_flags_from_groq
            flag_types_for_history = [f_dict.get("type", "Unknown") for f_dict in raw_flags_from_groq]
            
            flag_entry = {
                "date": datetime.now().isoformat(),
                "text": message_input.text[:100] + ("..." if len(message_input.text) > 100 else ""),
                "flags": flag_types_for_history, 
                "sentiment": result.sentiment
            }
            
            await db.relationships.update_one(
                {"id": message_input.relationship_id},
                {
                    "$set": {
                        "last_contact": datetime.now().isoformat(),
                        "sentiment": result.sentiment
                    },
                    "$push": {"flag_history": flag_entry}
                }
            )
        
        return result
        
    except ValueError as ve: # Specifically for GROQ_API_KEY not set, raised by groq_client
        # Log the error for server visibility
        print(f"Configuration error: {ve}")
        raise HTTPException(status_code=500, detail=str(ve))
    except HTTPException as http_exc: # Re-raise HTTPExceptions from analyze_text_with_groq
        raise http_exc
    except Exception as e:
        # Catch any other unexpected errors during the process
        print(f"An unexpected error occurred in analyze_message: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed due to an unexpected error: {str(e)}")

@app.get("/api/history")
async def get_history():
    try:
        results = await db.analysis_results.find().sort("created_at", -1).to_list(50)
        return parse_json(results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")

@app.get("/api/dashboard")
async def get_dashboard():
    try:
        # Get analysis history
        analysis_results = await db.analysis_results.find().sort("created_at", -1).to_list(100)
        
        # Calculate overall health score based on flag frequency and sentiment
        total_analyses = len(analysis_results)
        if total_analyses == 0:
            return {
                "health_score": 75,  # Default score
                "total_analyses": 0,
                "total_flags_detected": 0,
                "flag_counts": {},
                "sentiment_timeline": []
            }
        
        # Count flags
        total_flags = 0
        flag_counts = {}
        for result in analysis_results:
            flags = result.get("flags", [])
            total_flags += len(flags)
            
            for flag in flags:
                flag_type = flag.get("type", "Unknown")
                flag_counts[flag_type] = flag_counts.get(flag_type, 0) + 1
        
        # Calculate health score (simple algorithm for demo)
        flag_ratio = total_flags / total_analyses
        health_score = max(0, min(100, int(100 - (flag_ratio * 100))))
        
        # Build sentiment timeline
        sentiment_timeline = []
        dates_seen = set()
        for result in analysis_results:
            date = result.get("created_at", "").split("T")[0]
            if date and date not in dates_seen:
                dates_seen.add(date)
                sentiment_timeline.append([date, result.get("sentiment", "neutral")])
        
        # Sort chronologically
        sentiment_timeline.sort(key=lambda x: x[0])
        
        return {
            "health_score": health_score,
            "total_analyses": total_analyses,
            "total_flags_detected": total_flags,
            "flag_counts": flag_counts,
            "sentiment_timeline": sentiment_timeline
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve dashboard data: {str(e)}")

@app.get("/api/relationships")
async def get_relationships():
    try:
        relationships = await db.relationships.find().sort("created_at", -1).to_list(50)
        return parse_json(relationships)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve relationships: {str(e)}")

@app.post("/api/relationships", response_model=Relationship)
async def create_relationship(relationship: Relationship):
    try:
        await db.relationships.insert_one(relationship.dict())
        return relationship
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create relationship: {str(e)}")

@app.get("/api/relationships/{relationship_id}")
async def get_relationship(relationship_id: str):
    try:
        relationship = await db.relationships.find_one({"id": relationship_id})
        if not relationship:
            raise HTTPException(status_code=404, detail="Relationship not found")
        return parse_json(relationship)
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve relationship: {str(e)}")

@app.post("/api/relationships/{relationship_id}/analyze", response_model=AnalysisResult)
async def analyze_relationship_message(relationship_id: str, message_input: MessageInput):
    try:
        # Verify relationship exists
        relationship = await db.relationships.find_one({"id": relationship_id})
        if not relationship:
            raise HTTPException(status_code=404, detail="Relationship not found")
        
        # Add relationship_id to the message input if not already present
        if not message_input.relationship_id:
            message_input.relationship_id = relationship_id
        
        # Call the analyze endpoint
        result = await analyze_message(message_input)
        
        return result
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze message: {str(e)}")

@app.get("/api/relationships/{relationship_id}/history")
async def get_relationship_history(relationship_id: str):
    try:
        # Get all analyses for this relationship
        analyses = await db.analysis_results.find(
            {"relationship_id": relationship_id}
        ).sort("created_at", -1).to_list(100)
        
        # Get the relationship
        relationship = await db.relationships.find_one({"id": relationship_id})
        if not relationship:
            raise HTTPException(status_code=404, detail="Relationship not found")
        
        # Create trend data
        health_trend = []
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
        flag_types = {}
        
        # Group analyses by date
        analyses_by_date = {}
        for analysis in analyses:
            date = analysis.get("created_at", "").split("T")[0]
            if date not in analyses_by_date:
                analyses_by_date[date] = []
            analyses_by_date[date].append(analysis)
            
            # Count sentiments
            sentiment = analysis.get("sentiment", "neutral")
            sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
            
            # Count flag types
            for flag in analysis.get("flags", []):
                flag_type = flag.get("type", "Unknown")
                flag_types[flag_type] = flag_types.get(flag_type, 0) + 1
        
        # Create daily health scores (simulated for demo)
        dates = sorted(analyses_by_date.keys())
        for date in dates:
            day_analyses = analyses_by_date[date]
            # Simple algorithm: start with base score and reduce for each flag
            day_score = 75
            total_flags = sum(len(a.get("flags", [])) for a in day_analyses)
            day_score = max(0, min(100, day_score - (total_flags * 5)))
            
            health_trend.append({
                "date": date,
                "score": day_score
            })
        
        return {
            "relationship": parse_json(relationship),
            "analyses": parse_json(analyses),
            "health_trend": health_trend,
            "sentiment_counts": sentiment_counts,
            "flag_types": flag_types
        }
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve relationship history: {str(e)}")

@app.put("/api/relationships/{relationship_id}", response_model=Relationship)
async def update_relationship(relationship_id: str, relationship_update: dict):
    try:
        # Ensure id isn't changed
        if "id" in relationship_update and relationship_update["id"] != relationship_id:
            raise HTTPException(status_code=400, detail="Cannot change relationship ID")
        
        # Make sure the relationship exists
        existing = await db.relationships.find_one({"id": relationship_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Relationship not found")
        
        # Update the relationship
        await db.relationships.update_one(
            {"id": relationship_id},
            {"$set": {**relationship_update, "updated_at": datetime.now().isoformat()}}
        )
        
        # Return the updated relationship
        updated = await db.relationships.find_one({"id": relationship_id})
        return parse_json(updated)
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update relationship: {str(e)}")

@app.delete("/api/relationships/{relationship_id}")
async def delete_relationship(relationship_id: str):
    try:
        # Make sure the relationship exists
        existing = await db.relationships.find_one({"id": relationship_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Relationship not found")
        
        # Delete the relationship
        await db.relationships.delete_one({"id": relationship_id})
        
        # Optionally, you could also delete all analyses related to this relationship
        await db.analysis_results.delete_many({"relationship_id": relationship_id})
        
        return {"success": True, "message": "Relationship deleted successfully"}
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete relationship: {str(e)}")

@app.get("/api/growth-plan")
async def get_growth_plan(user_id: Optional[str] = None):
    try:
        # In a real app, we'd filter by user_id
        growth_plan = await db.growth_plans.find_one({"user_id": user_id} if user_id else {})
        
        if not growth_plan:
            # Create a default growth plan
            default_plan = GrowthPlan(
                user_id=user_id,
                current_week=WeeklyPlan(
                    theme="Emotional self-validation",
                    days=[
                        GrowthActivity(
                            day=1,
                            title="Understanding Self-Validation",
                            activity_type="Guided Self-Inquiry",
                            content="Reflect on when you've dismissed your own feelings. What triggers self-doubt about your emotional responses?"
                        ),
                        GrowthActivity(
                            day=2,
                            title="Recognizing Emotional Patterns",
                            activity_type="Emotional Pattern Reframe",
                            content="Identify a recurring emotional response that you often judge. How would you respond to a friend with the same feelings?"
                        ),
                        GrowthActivity(
                            day=3,
                            title="Practice Validating Language",
                            activity_type="Practice/Script Challenge",
                            content="Write three statements that validate your feelings about a recent difficult situation."
                        ),
                        GrowthActivity(
                            day=4,
                            title="Micro-Ritual",
                            activity_type="Daily Practice",
                            content="Each time you notice self-criticism today, place a hand over your heart and say 'This feeling is valid.'"
                        ),
                        GrowthActivity(
                            day=5,
                            title="Weekly Reflection",
                            activity_type="Journal Prompt",
                            content="How has validating your emotions changed your interactions this week? What differences did you notice?"
                        )
                    ]
                ),
                goals=[
                    "Affirm my feelings without judgment",
                    "Recognize when I'm dismissing my own emotions",
                    "Respond to myself with the same compassion I'd offer others"
                ]
            )
            
            await db.growth_plans.insert_one(default_plan.dict())
            return default_plan
        
        return parse_json(growth_plan)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve growth plan: {str(e)}")

@app.post("/api/journal-entry")
async def create_journal_entry(
    request: Request,
    background_tasks: BackgroundTasks
):
    try:
        data = await request.json()
        entry = {
            "id": str(uuid.uuid4()),
            "user_id": data.get("user_id"),
            "content": data.get("content"),
            "day": data.get("day"),
            "activity_id": data.get("activity_id"),
            "created_at": datetime.now().isoformat()
        }
        
        await db.journal_entries.insert_one(entry)
        
        # In a real app, we would queue a background task to analyze the journal entry
        # and update the user's growth plan based on the content
        
        return {"success": True, "id": entry["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save journal entry: {str(e)}")

# Run the server if executed directly
if __name__ == "__main__":
    import uvicorn
    # Ensure GROQ_API_KEY is set for local development if you want to test the Groq integration
    # For example, you can set it in your shell: export GROQ_API_KEY="your_actual_api_key"
    # Or use a .env file with a library like python-dotenv if you modify the script to load it.
    print("Starting server. Ensure GROQ_API_KEY is set in your environment for full functionality.")
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
