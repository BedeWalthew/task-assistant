# @task-assistant/agent

AI Agent for natural language ticket management using Google ADK and Gemini.

## Overview

This agent allows users to manage tickets through natural conversation:

```
User: "Create a ticket to fix the login bug"
Agent: I've created the ticket "Fix the login bug" in your Frontend project. It's set to TODO with MEDIUM priority.

User: "Move it to in progress"
Agent: Done! Moved "Fix the login bug" from TODO to IN_PROGRESS.

User: "What's on my board?"
Agent: Here's your Frontend project:
- TODO: 5 tickets
- IN_PROGRESS: 3 tickets
- DONE: 12 tickets
- BLOCKED: 1 ticket
```

## Features

✅ **Natural Language Processing** - Understands conversational queries  
✅ **Project Resolution** - Automatically resolves project names to IDs  
✅ **Ticket Search** - Finds tickets by title or description  
✅ **Status Management** - Moves tickets between Kanban columns  
✅ **Smart Confirmation** - Asks before destructive actions  
✅ **Session Memory** - Maintains conversation context  
✅ **Streaming Responses** - Real-time SSE streaming support  

## Tech Stack

- **Framework**: Google Agent Development Kit (ADK) v0.3.0+
- **LLM**: Gemini 2.0 Flash (via Google AI API)
- **API**: FastAPI 0.115+ with SSE streaming
- **Language**: Python 3.11+
- **HTTP Client**: httpx 0.28+ (async)

## Available Tools

### Ticket Management
| Tool | Description | Example |
|------|-------------|---------|
| `create_ticket` | Create a new ticket | "Add a high priority ticket for API refactoring" |
| `update_ticket` | Modify ticket details | "Update the login bug description" |
| `move_ticket` | Change ticket status | "Move the auth ticket to done" |
| `delete_ticket` | Remove a ticket (requires confirmation) | "Delete the duplicate ticket" |
| `list_tickets` | List tickets with filters | "Show me blocked tickets" |
| `search_tickets` | Search by text | "Find tickets about authentication" |
| `get_ticket` | Get detailed ticket info | "Show me ticket TA-42" |

### Project Management
| Tool | Description | Example |
|------|-------------|---------|
| `list_projects` | Get all projects | "What projects do I have?" |
| `get_project` | Get project details | "Tell me about the Frontend project" |
| `get_board_summary` | Kanban board overview | "Show me the board summary" |

## Quick Start

### 1. Get a Gemini API Key

Visit [Google AI Studio](https://aistudio.google.com/apikey) and create an API key.

### 2. Set Up Environment

```bash
cd packages/agent

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows

# Install dependencies
pip install -e ".[dev]"

# Create .env file
cat > .env << EOF
GEMINI_API_KEY=your-api-key-here
BACKEND_API_URL=http://localhost:3001
AGENT_PORT=8000
LOG_LEVEL=INFO
EOF
```

### 3. Start Backend

Make sure the backend is running:
```bash
# From project root
docker-compose up backend
```

### 4. Test the Agent

**Interactive Mode:**
```bash
python -m src.test_agent -i
```

**Automated Test:**
```bash
python -m src.test_agent
```

### 5. Run API Server

```bash
uvicorn src.main:app --reload --port 8000
```

Then test with curl:
```bash
# Non-streaming
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "List my projects", "user_id": "test_user"}'

# Streaming (SSE)
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a ticket for testing", "user_id": "test_user"}'
```

## Project Structure

```
src/
├── agent/
│   ├── __init__.py
│   ├── task_agent.py       # TaskAgentService (LlmAgent + Runner)
│   └── prompts.py          # System prompt
├── api/
│   ├── client.py           # HTTP client for backend API
│   └── schemas.py          # Pydantic models
├── config/
│   └── settings.py         # Pydantic settings
├── main.py                 # FastAPI application
└── test_agent.py           # Test script
```

## Architecture

### Components

1. **TaskAgentService** - Main service class that manages:
   - `LlmAgent` - ADK agent with Gemini LLM
   - `Runner` - Executes agent with session management
   - `InMemorySessionService` - Session storage (conversation history)
   - `APIClient` - HTTP client for backend communication

2. **Tool Functions** - Async functions decorated for ADK:
   - Automatically extract parameters from natural language
   - Call backend API via APIClient
   - Return structured responses

3. **Session Management** - Built-in ADK features:
   - `session.events` - Full conversation history
   - `session.state` - Persistent state (active project, etc.)
   - Automatic event tracking by Runner

### Flow Diagram

```
User Query
    ↓
FastAPI Endpoint (/chat or /chat/stream)
    ↓
TaskAgentService.chat() / .chat_stream()
    ↓
Runner.run_async()
    ↓
LlmAgent (Gemini)
    ↓
Tool Selection & Execution
    ↓
APIClient → Backend API
    ↓
Tool Result → Agent
    ↓
Final Response → User
```

## API Endpoints

### POST `/chat`
Non-streaming chat endpoint.

**Request:**
```json
{
  "message": "Create a ticket for bug fix",
  "user_id": "user123",
  "session_id": "session456"  // optional
}
```

**Response:**
```json
{
  "response": "I've created the ticket...",
  "session_id": "session456",
  "actions_taken": [
    {
      "tool": "create_ticket",
      "args": {"title": "Bug fix", "priority": "HIGH"},
      "result": {"success": true, "ticket": {...}}
    }
  ]
}
```

### POST `/chat/stream`
Server-Sent Events (SSE) streaming endpoint.

**Events:**
- `text` - Text chunks as they're generated
- `tool_call` - Agent is calling a tool
- `tool_result` - Tool execution result
- `done` - Stream complete with full response

### GET `/health`
Health check endpoint.

### GET `/sessions/{user_id}/{session_id}`
Get session information.

### DELETE `/sessions/{user_id}/{session_id}`
Delete a session.

## Configuration

All settings are loaded from environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | (required) | Google AI API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Model to use |
| `BACKEND_API_URL` | `http://backend:3001` | Backend API base URL |
| `AGENT_PORT` | `8000` | API server port |
| `LOG_LEVEL` | `INFO` | Logging level |
| `SESSION_TTL_HOURS` | `24` | Session expiry time |
| `MAX_CONVERSATION_LENGTH` | `50` | Max messages to keep |
| `REQUESTS_PER_MINUTE` | `20` | Rate limit (future) |
| `REQUESTS_PER_DAY` | `500` | Rate limit (future) |

## Example Interactions

### Create a Ticket
```
User: Create a high priority ticket to refactor the auth module
Agent: I've created the ticket "Refactor auth module" in your Backend project 
      with HIGH priority. It's currently in TODO status.
```

### Search and Update
```
User: Find tickets about authentication
Agent: Found 2 tickets:
      1. "Implement OAuth login" (IN_PROGRESS)
      2. "Fix session timeout" (TODO)

User: Move the OAuth ticket to done
Agent: Done! Moved "Implement OAuth login" to DONE.
```

### Board Overview
```
User: What's on my board?
Agent: Here's your Frontend project board:
      - TODO: 5 tickets (including "Add loading spinner", "Fix mobile nav")
      - IN_PROGRESS: 3 tickets
      - DONE: 12 tickets
      - BLOCKED: 1 ticket
      
      Total: 21 tickets
```

## Development

### Running Tests

```bash
# Interactive test
python -m src.test_agent -i

# Automated test suite
python -m src.test_agent

# With pytest (future)
pytest tests/
```

### Code Quality

```bash
# Linting
ruff check src/

# Type checking
mypy src/

# Formatting
ruff format src/
```

### Docker

```bash
# Build image
docker build -t task-assistant-agent .

# Run container
docker run -p 8000:8000 \
  -e GEMINI_API_KEY=your-key \
  -e BACKEND_API_URL=http://backend:3001 \
  task-assistant-agent
```

## Troubleshooting

### "Missing key inputs argument"
- Ensure `GEMINI_API_KEY` is set in `.env`
- The agent automatically configures `GOOGLE_GENAI_API_KEY` for ADK

### Backend Connection Errors
- Verify backend is running: `curl http://localhost:3001/health`
- Check `BACKEND_API_URL` matches your backend

### Tool Errors
- Check backend logs for API errors
- Ensure database is seeded with projects
- Verify ticket/project IDs exist

## Future Enhancements

- [ ] Voice input/output support
- [ ] Multi-user authentication
- [ ] Database-backed session storage (`DatabaseSessionService`)
- [ ] Cloud deployment with `VertexAiSessionService`
- [ ] Rate limiting implementation
- [ ] Batch operations ("create 5 tickets")
- [ ] Ticket assignment and comments
- [ ] Advanced analytics queries
- [ ] Integration with frontend chat UI

## Resources

- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Pydantic](https://docs.pydantic.dev/)

## License

See root LICENSE file.

src/
├── main.py                 # FastAPI entry point
├── agent/
│   ├── task_agent.py       # Main agent definition
│   └── prompts.py          # System prompts
├── tools/
│   ├── ticket_tools.py     # Ticket CRUD tools
│   ├── project_tools.py    # Project tools
│   └── base.py             # Base tool utilities
├── api/
│   ├── client.py           # HTTP client for backend
│   └── schemas.py          # Pydantic models
├── session/
│   └── manager.py          # Session management
└── config/
    └── settings.py         # Environment config
```

## Environment Variables

```bash
GEMINI_API_KEY=your-api-key
BACKEND_API_URL=http://backend:3001
AGENT_PORT=8000
LOG_LEVEL=INFO
```

## Development

```bash
# Install dependencies
uv pip install -e ".[dev]"

# Run locally
uvicorn src.main:app --reload --port 8000

# Run tests
pytest

# Lint
ruff check src/
```

## API Endpoints

### POST /chat
Send a message to the agent.

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a ticket for login bug", "session_id": "optional"}'
```

### POST /chat/stream
Stream agent response via SSE.

```bash
curl -N http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "What tickets are in progress?"}'
```

### GET /health
Health check endpoint.
