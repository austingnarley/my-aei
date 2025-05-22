import os
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any

import groq
from fastapi import FastAPI, HTTPException, Body, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Groq client
groq_client = groq.Groq(api_key=os.environ.get("GROQ_API_KEY"))

# MongoDB setup
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
db_name = os.environ.get("DB_NAME", "test_database")
client = MongoClient(mongo_url)
db = client[db_name]

app = FastAPI(title="My ÆI - Emotional Intelligence API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class MessageAnalysisRequest(BaseModel):
    text: str = Field(..., description="The message text to analyze")
    context: Optional[str] = Field(None, description="Optional context about the conversation")
    relationship_id: Optional[str] = Field(None, description="ID of the related relationship")

class EmotionalFlag(BaseModel):
    type: str = Field(..., description="Type of emotional flag detected")
    severity: float = Field(..., description="Severity score from 0.0 to 1.0")
    evidence: str = Field(..., description="Text evidence of the flag")

class AnalysisResult(BaseModel):
    id: str = Field(..., description="Unique ID for the analysis")
    flags: List[EmotionalFlag] = Field(..., description="List of emotional flags detected")
    overall_sentiment: str = Field(..., description="Overall sentiment of the message")
    suggested_reframe: Optional[str] = Field(None, description="Suggested reframing of the message")
    created_at: datetime = Field(..., description="When the analysis was created")

# AI Analysis System Prompt
ANALYSIS_SYSTEM_PROMPT = """You are My ÆI, an expert emotional intelligence system that specializes in detecting emotional red flags and unhealthy communication patterns.

Your task is to carefully analyze the provided message and identify instances of the following types of emotional red flags:

1. gaslighting - Denying or twisting the other person's reality. Examples: "You're just being dramatic", "That never happened", "You're imagining things"

2. guilt_tripping - Inducing guilt to control or manipulate. Examples: "After all I've done for you", "I've sacrificed so much", "If you really cared about me"

3. blame_shifting - Redirecting fault onto recipient instead of taking responsibility. Examples: "This wouldn't have happened if you just...", "You made me do this", "It's your fault"

4. invalidation - Dismissing or minimizing someone's feelings or experiences. Examples: "You're too sensitive", "You're overreacting", "It's not a big deal"

5. stonewalling - Withholding response / silent treatment. Examples: Long gaps, one-word replies, refusing to engage

6. passive_aggression - Indirect hostility, sarcasm, or backhanded compliments. Examples: "Fine, whatever", "I guess my opinion doesn't matter", subtle digs

Analyze the message thoroughly for these patterns. For each flag you detect, provide:
- The exact type (from the list above)
- A severity score (0.0 to 1.0, where 1.0 is most severe)
- The specific text evidence from the message that demonstrates this flag

Also provide:
- An overall sentiment assessment (positive, neutral, or negative)
- A suggested reframing that could improve the communication

Format your response as a valid JSON object with these fields:
{
  "flags": [
    {"type": "gaslighting", "severity": 0.82, "evidence": "You're just being dramatic"},
    {"type": "invalidation", "severity": 0.65, "evidence": "You're too sensitive"}
  ],
  "overall_sentiment": "negative",
  "suggested_reframe": "I understand this situation is upsetting. I'd like to hear more about how you're feeling so I can better understand your perspective."
}

Be precise and thorough in your analysis. If you detect any red flags in the message, be sure to include them in your response. If no red flags are detected, return an empty array for 'flags'.

IMPORTANT: Do not add any explanation outside of the JSON. Your entire response must be a valid JSON object.
"""

# Routes
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_message(request: MessageAnalysisRequest):
    """Analyze a message for emotional red flags and patterns"""
    try:
        # Prepare the prompt
        user_prompt = f"Message to analyze: {request.text}"
        if request.context:
            user_prompt += f"\n\nContext: {request.context}"
        
        # Call Groq API
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            model="llama3-8b-8192",  # Using Llama 3 8B model (good balance of speed and quality)
            temperature=0.2,  # Lower temperature for more consistent results
            max_tokens=1024,
            top_p=1
        )
        
        # Extract and parse the response
        ai_response = response.choices[0].message.content
        try:
            analysis = json.loads(ai_response)
            print(f"Successfully parsed AI response: {analysis}")
        except json.JSONDecodeError as e:
            print(f"Error parsing AI response: {ai_response}")
            print(f"JSONDecodeError: {str(e)}")
            # If AI doesn't return valid JSON, create a basic structure
            analysis = {
                "flags": [],
                "overall_sentiment": "neutral",
                "suggested_reframe": None
            }
        
        # Create result document
        result = {
            "id": str(uuid.uuid4()),
            "flags": analysis.get("flags", []),
            "overall_sentiment": analysis.get("overall_sentiment", "neutral"),
            "suggested_reframe": analysis.get("suggested_reframe"),
            "created_at": datetime.utcnow(),
            "text": request.text,  # Store original text
            "relationship_id": request.relationship_id
        }
        
        # Save to database
        db.analysis_results.insert_one(result)
        
        # Return the result
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Get a specific analysis by ID"""
    result = db.analysis_results.find_one({"id": analysis_id})
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Convert MongoDB _id to string
    if "_id" in result:
        result["_id"] = str(result["_id"])
    
    # Convert datetime to ISO format string
    if "created_at" in result and isinstance(result["created_at"], datetime):
        result["created_at"] = result["created_at"].isoformat()
        
    return result

@app.get("/api/history")
async def get_analysis_history(limit: int = Query(10, ge=1, le=50)):
    """Get history of previous analyses"""
    try:
        cursor = db.analysis_results.find().sort("created_at", -1).limit(limit)
        results = []
        for doc in cursor:
            # Convert MongoDB _id to string
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            # Convert datetime to ISO format string
            if "created_at" in doc and isinstance(doc["created_at"], datetime):
                doc["created_at"] = doc["created_at"].isoformat()
            results.append(doc)
        return results
    except Exception as e:
        print(f"Error retrieving analysis history: {str(e)}")
        return []

@app.get("/api/dashboard")
async def get_dashboard_data():
    """Get dashboard statistics and metrics"""
    try:
        # Get recent analyses (last 20)
        analyses = list(db.analysis_results.find().sort("created_at", -1).limit(20))
        
        # Initialize counters and metrics
        flag_counts = {}
        sentiments = []
        total_flags = 0
        dates = []
        
        # Process each analysis
        for analysis in analyses:
            # Track dates for timeline
            if "created_at" in analysis and isinstance(analysis["created_at"], datetime):
                dates.append(analysis["created_at"].isoformat())
            
            # Track sentiments
            if "overall_sentiment" in analysis:
                sentiments.append(analysis["overall_sentiment"])
            
            # Count flags by type
            if "flags" in analysis:
                for flag in analysis["flags"]:
                    flag_type = flag.get("type")
                    if flag_type:
                        if flag_type not in flag_counts:
                            flag_counts[flag_type] = 0
                        flag_counts[flag_type] += 1
                        total_flags += 1
        
        # Calculate health score (simplified version)
        # Higher score = better emotional health (fewer flags)
        health_score = 100
        if analyses:
            avg_flags_per_message = total_flags / len(analyses)
            # Subtract points based on average flags per message
            health_score = max(0, 100 - (avg_flags_per_message * 20))
            # Adjust further if negative sentiment dominates
            if sentiments and sentiments.count("negative") > len(sentiments) / 2:
                health_score = max(0, health_score - 15)
        
        # Sort flag counts for graph
        sorted_flags = sorted(flag_counts.items(), key=lambda x: x[1], reverse=True)
        
        # Format the response
        dashboard_data = {
            "health_score": round(health_score),
            "flag_counts": dict(sorted_flags),
            "sentiment_timeline": list(zip(dates, sentiments)) if dates else [],
            "total_analyses": len(analyses),
            "total_flags_detected": total_flags
        }
        
        return dashboard_data
    
    except Exception as e:
        print(f"Error generating dashboard data: {str(e)}")
        return {
            "health_score": 100,
            "flag_counts": {},
            "sentiment_timeline": [],
            "total_analyses": 0,
            "total_flags_detected": 0
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
