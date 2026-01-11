"""FastAPI application for the Task Assistant Agent.

Uses Google ADK with LlmAgent, Runner, and InMemorySessionService.
"""

import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from .agent import TaskAgentService
from .config import settings


def json_serializer(obj: Any) -> str:
    """Custom JSON serializer for objects not serializable by default."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global agent service instance
agent_service: TaskAgentService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    global agent_service

    # Startup
    logger.info("Starting Task Assistant Agent...")

    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not set - agent will not function")
    else:
        agent_service = TaskAgentService()
        logger.info(f"Agent initialized with model: {settings.gemini_model}")

    yield

    # Shutdown
    logger.info("Shutting down Task Assistant Agent...")


app = FastAPI(
    title="Task Assistant Agent",
    description="AI Agent for natural language ticket management using Google ADK",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Request/Response Models
# ============================================================================


class ChatRequest(BaseModel):
    """Request to chat with the agent."""

    message: str = Field(..., description="The user's message")
    user_id: str = Field(default="default_user", description="User identifier")
    session_id: str | None = Field(default=None, description="Session ID to continue")


class ChatResponse(BaseModel):
    """Response from the agent."""

    response: str = Field(..., description="Agent's response text")
    session_id: str = Field(..., description="Session ID for continuing the conversation")
    actions_taken: list[dict[str, Any]] = Field(
        default_factory=list, description="Tools that were called"
    )


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    agent_ready: bool
    model: str


class SessionInfo(BaseModel):
    """Session information."""

    id: str
    user_id: str | None
    event_count: int
    state: dict[str, Any]


# ============================================================================
# Endpoints
# ============================================================================


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        agent_ready=agent_service is not None,
        model=settings.gemini_model,
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Process a chat message and return a response.

    This endpoint processes the message and returns the complete response.
    For streaming responses, use /chat/stream.
    """
    if agent_service is None:
        raise HTTPException(
            status_code=503,
            detail="Agent not initialized. Check GEMINI_API_KEY configuration.",
        )

    try:
        result = await agent_service.chat(
            message=request.message,
            user_id=request.user_id,
            session_id=request.session_id,
        )

        return ChatResponse(
            response=result["response"],
            session_id=result["session_id"],
            actions_taken=result["actions_taken"],
        )

    except Exception as e:
        logger.exception("Error processing chat message")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Process a chat message and stream the response.

    Uses Server-Sent Events (SSE) to stream the response in real-time.

    Event types:
    - text: Text chunk of the response
    - tool_call: Agent is calling a tool
    - tool_result: Result from tool execution
    - done: Stream complete with full response
    - error: An error occurred
    """
    if agent_service is None:
        raise HTTPException(
            status_code=503,
            detail="Agent not initialized. Check GEMINI_API_KEY configuration.",
        )

    async def event_generator():
        """Generate SSE events from agent stream."""
        try:
            async for chunk in agent_service.chat_stream(
                message=request.message,
                user_id=request.user_id,
                session_id=request.session_id,
            ):
                event_type = chunk.get("type", "text")
                yield {
                    "event": event_type,
                    "data": json.dumps(chunk, default=json_serializer),
                }

        except Exception as e:
            logger.exception("Error in stream")
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)}),
            }

    return EventSourceResponse(event_generator())


@app.get("/sessions/{user_id}/{session_id}", response_model=SessionInfo)
async def get_session(user_id: str, session_id: str) -> SessionInfo:
    """Get information about a session."""
    if agent_service is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    session_info = await agent_service.get_session_info(user_id, session_id)
    if not session_info:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionInfo(
        id=session_info["id"],
        user_id=session_info["user_id"],
        event_count=session_info["event_count"],
        state=session_info["state"],
    )


@app.delete("/sessions/{user_id}/{session_id}")
async def delete_session(user_id: str, session_id: str) -> dict[str, str]:
    """Delete a session."""
    if agent_service is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    if await agent_service.delete_session(user_id, session_id):
        return {"status": "deleted", "session_id": session_id}
    raise HTTPException(status_code=404, detail="Session not found")


# ============================================================================
# CLI Entry Point
# ============================================================================


def main():
    """Run the FastAPI server."""
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.agent_port,
        reload=True,
    )


if __name__ == "__main__":
    main()
