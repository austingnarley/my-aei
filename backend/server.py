import os
import uuid
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import groq
import motor.motor_asyncio
from bson import json_util

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
    # Initialize Groq client
    try:
        groq_api_key = os.environ.get("GROQ_API_KEY", "placeholder-key")
        client = groq.Groq(api_key=groq_api_key)
    except Exception as e:
        # For demo purposes, we'll continue without a real key
        pass
    
    # Extract any relationship info if provided
    relationship_name = None
    if message_input.relationship_id:
        relationship = await db.relationships.find_one({"id": message_input.relationship_id})
        if relationship:
            relationship_name = relationship.get("name")
    
    # Prepare the prompt for the LLM
    prompt = f"""
    You are an emotional intelligence and relationship clarity assistant. Analyze the following conversation for emotional red flags, 
    communication patterns, and relationship dynamics. If any red flags are present, identify them specifically.

    CONVERSATION:
    {message_input.text}
    
    {f"CONTEXT: {message_input.context}" if message_input.context else ""}
    
    Provide a comprehensive analysis in the following format:
    
    1. Identify any emotional red flags from this list (or others you detect):
       - Gaslighting (denial of someone's reality or experience)
       - Guilt-tripping (making someone feel responsible for your emotions)
       - Blame-shifting (redirecting responsibility to avoid accountability)
       - Stonewalling (refusing to communicate or engage)
       - Invalidation (dismissing someone's feelings as unimportant)
       - Passive aggression (indirect expression of hostility)
       - Emotional manipulation (using emotions to control)
       - Controlling behavior (attempting to dictate someone's actions)
       - Non-apology (apologizing without taking responsibility)
       - Defensiveness (protecting oneself at the expense of listening)
    
    2. Provide an interpretation of the emotional dynamics between both parties in the conversation.
    
    3. Suggest constructive responses or boundaries for healthier communication.
    
    4. Determine the overall sentiment (positive, neutral, or negative).
    
    Return your analysis as a valid JSON object with these fields:
    - flags: array of objects with "type" and "description" for each flag detected (empty array if none)
    - interpretation: string with your analysis
    - suggestions: array of strings with suggested responses or boundaries
    - sentiment: string ("positive", "neutral", or "negative")
    """

    # In a real app, this would call the Groq API with the prompt
    # For this demo, we'll simulate a response
    try:
        # Simulate LLM analysis
        time.sleep(1)  # Simulate API latency
        
        # For demo purposes, we'll generate a simple analysis
        # In a real app, this would be the result from the LLM API
        flags = []
        sentiment = "positive"
        
        # Simple keyword detection for demo
        text_lower = message_input.text.lower()
        their_message_raw = ""
        your_message_raw = ""

        if "their message:" in text_lower:
            parts = message_input.text.split("Their message:", 1)
            if len(parts) > 1:
                content_after_their_message = parts[1]
                if "your response:" in content_after_their_message.lower():
                    sub_parts = content_after_their_message.split("Your response:", 1)
                    their_message_raw = sub_parts[0].strip()
                    if len(sub_parts) > 1:
                        your_message_raw = sub_parts[1].strip()
                else:
                    their_message_raw = content_after_their_message.strip()
        elif "your response:" in text_lower:
            parts = message_input.text.split("Your response:", 1)
            if len(parts) > 1:
                your_message_raw = parts[1].strip()
        
        their_message_lower = their_message_raw.lower()
        your_message_lower = your_message_raw.lower()

        detected_flags = [] # Store as dicts for now
        sentiment = "positive"

        # Check for gaslighting patterns (typically from their message)
        if their_message_lower and ("never said" in their_message_lower or "didn't say" in their_message_lower or "you're imagining" in their_message_lower):
            detected_flags.append({
                "type": "Gaslighting",
                "description": "Denying someone's reality or memory of events.",
                "participant": "their"
            })
            sentiment = "negative"

        # Check for invalidation (can be from either)
        if their_message_lower and "never" in their_message_lower and "you" in their_message_lower:
            detected_flags.append({
                "type": "Invalidation",
                "description": "Using 'you never' statements can invalidate the other person's experiences.",
                "participant": "their"
            })
            sentiment = "negative"
        if your_message_lower and "never" in your_message_lower and "you" in your_message_lower:
            detected_flags.append({
                "type": "Invalidation",
                "description": "Using 'you never' statements can invalidate the other person's experiences.",
                "participant": "your"
            })
            sentiment = "negative"

        # Check for controlling behavior (can be from either)
        if their_message_lower and "should" in their_message_lower and "you" in their_message_lower:
            detected_flags.append({
                "type": "Controlling behavior",
                "description": "Using 'you should' suggests imposing your expectations on others.",
                "participant": "their"
            })
            sentiment = "negative"
        if your_message_lower and "should" in your_message_lower and "you" in your_message_lower:
            detected_flags.append({
                "type": "Controlling behavior",
                "description": "Using 'you should' suggests imposing your expectations on others.",
                "participant": "your"
            })
            sentiment = "negative"

        # Check for blame-shifting (typically from their message)
        if their_message_lower and "always" in their_message_lower and "you" in their_message_lower:
            detected_flags.append({
                "type": "Blame-shifting",
                "description": "Using 'you always' can shift blame and overgeneralize.",
                "participant": "their"
            })
            sentiment = "negative"
        
        # Check for non-apology (can be from either)
        if "sorry but" in their_message_lower:
            detected_flags.append({
                "type": "Non-apology",
                "description": "Using 'sorry but' often negates the apology that precedes it.",
                "participant": "their"
            })
            sentiment = "negative"
        if "sorry but" in your_message_lower:
            detected_flags.append({
                "type": "Non-apology",
                "description": "Using 'sorry but' often negates the apology that precedes it.",
                "participant": "your"
            })
            sentiment = "negative"
            
        # Check for defensiveness (typically in your response)
        if your_message_lower and ("i already told you" in your_message_lower or "not my fault" in your_message_lower or "stop blaming me" in your_message_lower):
            detected_flags.append({
                "type": "Defensiveness",
                "description": "Responding to concerns with self-protection rather than listening.",
                "participant": "your"
            })
            sentiment = "negative"
        
        # Detect emotional manipulation (typically from their message)
        if their_message_lower and ("you don't care about me" in their_message_lower or "if you loved me" in their_message_lower or "after all i've done for you" in their_message_lower):
            detected_flags.append({
                "type": "Emotional manipulation",
                "description": "Using emotional appeals to control or influence behavior.",
                "participant": "their"
            })
            sentiment = "negative"

        # Convert detected_flags to Flag model instances for the AnalysisResult
        final_flags = [Flag(type=f["type"], description=f["description"], participant=f.get("participant")) for f in detected_flags]

        # Create the analysis result
        result = AnalysisResult(
            text=message_input.text,
            context=message_input.context,
            relationship_id=message_input.relationship_id,
            relationship_name=relationship_name,
            flags=final_flags, # Use the converted list of Flag models
            interpretation=(
                "This conversation shows patterns that could create emotional distance between the participants. "
                "The language used may contain red flags that could damage trust and emotional safety in the relationship."
                if detected_flags else
                "This conversation demonstrates healthy communication patterns with clear expression, respect, and emotional safety."
            ),
            suggestions=[
                "Consider using 'I feel' statements instead of 'you' statements to express concerns",
                "Try to validate the other person's perspective before sharing your own view",
                "Focus on specific behaviors rather than using generalizations like 'always' or 'never'",
                "If you notice tension rising, take a short pause before responding"
            ] if detected_flags else [
                "Continue using this balanced communication style",
                "Notice how mutual respect strengthens your connection",
                "Consider sharing appreciation for the healthy dialogue"
            ],
            sentiment=sentiment
        )
        
        # Save the result to the database
        await db.analysis_results.insert_one(result.dict())
        
        # If this is related to a relationship, update the relationship's flag history
        if message_input.relationship_id:
            flag_entry = {
                "date": datetime.now().isoformat(),
                "text": message_input.text[:100] + ("..." if len(message_input.text) > 100 else ""),
                "flags": [f["type"] for f in detected_flags], # Use types from detected_flags
                "sentiment": sentiment
            }
            
            await db.relationships.update_one(
                {"id": message_input.relationship_id},
                {
                    "$set": {
                        "last_contact": datetime.now().isoformat(),
                        "sentiment": sentiment
                    },
                    "$push": {"flag_history": flag_entry}
                }
            )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

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
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
