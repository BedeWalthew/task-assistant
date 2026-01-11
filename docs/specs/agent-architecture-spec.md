# AI Agent Architecture Specification

> **Version:** 1.0  
> **Date:** 2026-01-10  
> **Status:** Draft - Awaiting Review  
> **Author:** Development Team

---

## 1. Executive Summary

### 1.1 Goal

Build a natural language AI agent that allows users to create, edit, move, and query tickets through conversational interactions. The agent will use **Google Agent Development Kit (ADK)** and call our existing REST API via custom tools.

### 1.2 Key Decisions Required

| Decision | Options | Recommendation | Status |
|----------|---------|----------------|--------|
| Agent Framework | Google ADK | ✅ Confirmed | **Decided** |
| Hosting | Google Cloud Run vs Self-hosted | Self-hosted (Docker) | **Decided** |
| Multi-tenancy | Session-based vs User-scoped | Session-based | **Decided** |
| LLM Provider | Gemini (Google) | Gemini via API | **Decided** |
| Streaming | SSE vs WebSocket | SSE streaming | **Decided** |
| Voice Input | Web Speech API | Deferred (post-MVP) | **Decided** |

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web UI    │  │  Mobile App │  │   Slack Bot │  │  Voice/API  │        │
│  │  (Next.js)  │  │  (Future)   │  │  (Future)   │  │  (Future)   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                          │
│                                   ▼                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Backend API (Express.js)                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │  /projects  │  │  /tickets   │  │   /agent    │ ◄── NEW          │   │
│  │  └─────────────┘  └─────────────┘  └──────┬──────┘                  │   │
│  └───────────────────────────────────────────┼─────────────────────────┘   │
└──────────────────────────────────────────────┼──────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT SERVICE LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Google ADK Agent (Python)                         │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │   Gemini    │  │    Tools    │  │   Memory    │                  │   │
│  │  │    LLM      │  │  Registry   │  │   Store     │                  │   │
│  │  └─────────────┘  └──────┬──────┘  └─────────────┘                  │   │
│  │                          │                                           │   │
│  │         ┌────────────────┼────────────────┐                         │   │
│  │         ▼                ▼                ▼                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                    │   │
│  │  │  create_   │  │  update_   │  │   move_    │  ... more tools    │   │
│  │  │  ticket    │  │  ticket    │  │   ticket   │                    │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                    │   │
│  │        │               │               │                            │   │
│  └────────┼───────────────┼───────────────┼────────────────────────────┘   │
│           │               │               │                                 │
│           └───────────────┴───────────────┘                                 │
│                           │                                                  │
│                           ▼                                                  │
│           ┌───────────────────────────────┐                                 │
│           │   Internal API Client         │                                 │
│           │   (calls Express.js API)      │                                 │
│           └───────────────────────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      PostgreSQL Database                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐        │   │
│  │  │ Projects│  │ Tickets │  │  Users  │  │ Agent Sessions  │ ◄ NEW  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|----------------|------------|
| **Web UI** | Chat interface for agent interaction | Next.js, React |
| **Backend API** | REST API, request routing, auth | Express.js, TypeScript |
| **Agent Service** | NLP processing, tool orchestration | Google ADK, Python |
| **Tools** | Execute specific actions (CRUD) | Python → REST API calls |
| **Database** | Persist tickets, projects, sessions | PostgreSQL, Prisma |

---

## 3. Hosting Strategy

### 3.1 Option A: Google Cloud Run (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Google Cloud Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │   Cloud Run      │      │   Cloud Run      │                │
│  │   (Agent)        │◄────►│   (Backend API)  │                │
│  │   Python/ADK     │      │   Node.js        │                │
│  │   Auto-scales    │      │   Auto-scales    │                │
│  └────────┬─────────┘      └────────┬─────────┘                │
│           │                         │                           │
│           │    ┌────────────────────┘                           │
│           │    │                                                 │
│           ▼    ▼                                                 │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │   Cloud SQL      │      │   Secret Manager │                │
│  │   (PostgreSQL)   │      │   (API Keys)     │                │
│  └──────────────────┘      └──────────────────┘                │
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │   Cloud Storage  │      │   Vertex AI      │                │
│  │   (Attachments)  │      │   (Gemini API)   │                │
│  └──────────────────┘      └──────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Auto-scaling (0 to N instances based on traffic)
- ✅ Pay-per-use (cost-effective for variable load)
- ✅ Native Gemini/Vertex AI integration
- ✅ Managed infrastructure (no server maintenance)
- ✅ Built-in HTTPS, load balancing
- ✅ Easy CI/CD with Cloud Build

**Cons:**
- ⚠️ Cold start latency (~1-3s for first request)
- ⚠️ Vendor lock-in to Google Cloud
- ⚠️ Requires GCP account and billing setup

**Estimated Costs (Monthly):**
| Resource | Estimate |
|----------|----------|
| Cloud Run (Agent) | $20-50 (depending on usage) |
| Cloud Run (API) | $10-30 |
| Cloud SQL | $30-50 (smallest instance) |
| Vertex AI/Gemini | $10-100 (token-based) |
| **Total** | **$70-230/month** |

### 3.2 Option B: Self-Hosted (Docker Compose)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Self-Hosted Server (VPS)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Docker Compose                         │  │
│  │                                                           │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │  │
│  │  │ nginx   │  │ backend │  │  agent  │  │postgres │     │  │
│  │  │ (proxy) │  │ (node)  │  │ (python)│  │  (db)   │     │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘     │  │
│  │       │            │            │            │           │  │
│  │       └────────────┴────────────┴────────────┘           │  │
│  │                         │                                 │  │
│  │                    Docker Network                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Gemini API    │
                    │   (External)    │
                    └─────────────────┘
```

**Pros:**
- ✅ Full control over infrastructure
- ✅ No vendor lock-in
- ✅ Predictable monthly cost
- ✅ Easier local development parity
- ✅ Can use any LLM provider

**Cons:**
- ⚠️ Manual scaling (need to provision for peak load)
- ⚠️ Server maintenance responsibility
- ⚠️ Need to handle SSL, backups, monitoring
- ⚠️ Higher fixed cost for low usage

**Estimated Costs (Monthly):**
| Resource | Estimate |
|----------|----------|
| VPS (4 vCPU, 8GB RAM) | $40-80 |
| Gemini API | $10-100 (token-based) |
| Domain + SSL | $1-5 |
| **Total** | **$50-185/month** |

### 3.3 Recommendation

**Start with Option B (Self-Hosted)** for development and MVP:
- Faster iteration during development
- Full Docker Compose integration with existing stack
- Lower initial complexity

**Migrate to Option A (Cloud Run)** when:
- User base grows beyond single-server capacity
- Need automatic scaling for variable load
- Want to reduce operational overhead

---

## 4. Multi-User & Multi-Tenancy Strategy

### 4.1 User Isolation Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     Request Flow with Auth                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Request                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   API Gateway                            │   │
│  │  1. Validate JWT token                                   │   │
│  │  2. Extract user_id, tenant_id (if multi-tenant)        │   │
│  │  3. Attach to request context                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Agent Service                          │   │
│  │  1. Create/retrieve session for user                     │   │
│  │  2. Load user's projects (scoped query)                  │   │
│  │  3. Execute tools with user context                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Database Queries                       │   │
│  │  WHERE user_id = {current_user}                         │   │
│  │  AND project_id IN (user's accessible projects)          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Session Management

Each user gets their own agent session to maintain conversation context:

```python
# Agent Session Model
class AgentSession:
    id: str                    # UUID
    user_id: str               # Owning user
    created_at: datetime
    updated_at: datetime
    conversation_history: List[Message]  # Chat history
    context: dict              # User's current project, preferences
    expires_at: datetime       # Session TTL (e.g., 24 hours)
```

**Session Storage Options:**

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| PostgreSQL | Persistent, queryable | Slower for high-frequency reads | ✅ MVP |
| Redis | Fast, built-in TTL | Additional service to manage | Future |
| In-Memory | Fastest | Lost on restart | Development only |

### 4.3 Database Schema Changes

```prisma
// Add to schema.prisma

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String?
  projects      Project[]      @relation("UserProjects")
  tickets       Ticket[]       @relation("AssignedTickets")
  agentSessions AgentSession[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model AgentSession {
  id                  String   @id @default(uuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id])
  conversationHistory Json     @default("[]")
  context             Json     @default("{}")
  expiresAt           DateTime
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([userId])
  @@index([expiresAt])
  @@map("agent_sessions")
}
```

### 4.4 Rate Limiting & Quotas

To prevent abuse and control costs:

```typescript
// Rate limits per user
const RATE_LIMITS = {
  requests_per_minute: 20,      // Max agent requests/min
  requests_per_day: 500,        // Max agent requests/day
  tokens_per_day: 100_000,      // Max LLM tokens/day
  max_conversation_length: 50,  // Max messages before reset
};
```

---

## 5. Google ADK Agent Design

### 5.1 Agent Structure

```
agent/
├── pyproject.toml              # Python dependencies
├── Dockerfile                  # Container build
├── src/
│   ├── __init__.py
│   ├── main.py                 # FastAPI entry point
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── task_agent.py       # Main agent definition
│   │   └── prompts.py          # System prompts
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── ticket_tools.py     # Ticket CRUD tools
│   │   ├── project_tools.py    # Project tools
│   │   └── search_tools.py     # Search/query tools
│   ├── api/
│   │   ├── __init__.py
│   │   ├── client.py           # HTTP client for backend API
│   │   └── schemas.py          # Pydantic models
│   └── config/
│       ├── __init__.py
│       └── settings.py         # Environment config
└── tests/
    ├── test_tools.py
    └── test_agent.py
```

### 5.2 Tool Definitions

The agent will have access to these tools:

#### Ticket Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `create_ticket` | Create a new ticket | title, description?, priority?, status?, project_name |
| `update_ticket` | Modify an existing ticket | ticket_id OR title, fields to update |
| `move_ticket` | Change ticket status | ticket_id OR title, new_status |
| `delete_ticket` | Remove a ticket | ticket_id OR title (with confirmation) |
| `get_ticket` | Get ticket details | ticket_id OR title |
| `list_tickets` | List tickets with filters | project?, status?, priority?, limit? |
| `search_tickets` | Search by text | query, project? |

#### Project Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_projects` | Get all user's projects | none |
| `get_project` | Get project details | project_id OR name |
| `create_project` | Create new project | name, key, description? |

#### Context Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `set_active_project` | Set default project for session | project_name |
| `get_board_summary` | Get Kanban board overview | project? |

### 5.3 System Prompt

```python
SYSTEM_PROMPT = """
You are a helpful task management assistant. You help users manage their tickets and projects through natural conversation.

## Your Capabilities:
- Create, update, and delete tickets
- Move tickets between status columns (TODO, IN_PROGRESS, DONE, BLOCKED)
- Search and filter tickets
- Provide summaries of project status

## Guidelines:
1. Always confirm destructive actions (delete) before executing
2. When a ticket title is ambiguous, ask for clarification or list matching tickets
3. If no project is specified, use the user's active project or ask which project
4. Be concise but friendly in responses
5. After making changes, briefly confirm what was done

## Status Values:
- TODO: Not started
- IN_PROGRESS: Currently being worked on
- DONE: Completed
- BLOCKED: Waiting on something

## Priority Values:
- LOW, MEDIUM, HIGH, CRITICAL

## Examples:
User: "Create a ticket to fix the login bug"
→ Use create_ticket with title "Fix the login bug", default priority MEDIUM, status TODO

User: "Move the login bug to in progress"
→ Search for ticket, then use move_ticket to IN_PROGRESS

User: "What's on my board?"
→ Use get_board_summary to show ticket counts by status
"""
```

### 5.4 Example Tool Implementation

```python
# tools/ticket_tools.py
from google.adk import Tool, ToolResult
from pydantic import BaseModel, Field
from typing import Optional
from ..api.client import APIClient

class CreateTicketParams(BaseModel):
    title: str = Field(description="Title of the ticket")
    description: Optional[str] = Field(default=None, description="Detailed description")
    priority: Optional[str] = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH, or CRITICAL")
    status: Optional[str] = Field(default="TODO", description="TODO, IN_PROGRESS, DONE, or BLOCKED")
    project_name: Optional[str] = Field(default=None, description="Project name or key")

@Tool(
    name="create_ticket",
    description="Create a new ticket in the task management system"
)
async def create_ticket(params: CreateTicketParams, context: dict) -> ToolResult:
    """Create a new ticket."""
    client = APIClient(context["api_base_url"], context["auth_token"])
    
    # Resolve project
    project_id = context.get("active_project_id")
    if params.project_name:
        project = await client.get_project_by_name(params.project_name)
        project_id = project["id"]
    
    if not project_id:
        return ToolResult(
            success=False,
            message="No project specified. Please specify a project or set an active project."
        )
    
    ticket = await client.create_ticket({
        "title": params.title,
        "description": params.description,
        "priority": params.priority,
        "status": params.status,
        "projectId": project_id,
    })
    
    return ToolResult(
        success=True,
        data=ticket,
        message=f"Created ticket '{ticket['title']}' in {params.project_name or 'active project'}"
    )
```

---

## 6. API Design

### 6.1 Agent Endpoints (Added to Express Backend)

```typescript
// New routes: /api/agent/*

POST /api/agent/chat
// Send a message to the agent
Request:
{
  "message": "Create a ticket to fix the login bug",
  "session_id": "optional-uuid"  // Omit for new session
}
Response:
{
  "response": "I've created a ticket 'Fix the login bug' in your Frontend project.",
  "session_id": "uuid",
  "actions_taken": [
    { "tool": "create_ticket", "result": { "id": "...", "title": "Fix the login bug" } }
  ]
}

GET /api/agent/sessions
// List user's agent sessions

DELETE /api/agent/sessions/:id
// End/delete a session

GET /api/agent/sessions/:id/history
// Get conversation history for a session
```

### 6.2 Internal Agent API (Express → Agent Service)

```
POST http://agent-service:8000/chat
{
  "user_id": "uuid",
  "session_id": "uuid",
  "message": "user's natural language input",
  "context": {
    "api_base_url": "http://backend:3001",
    "auth_token": "jwt-token",
    "active_project_id": "uuid"
  }
}
```

---

## 7. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up agent package structure (Python + FastAPI)
- [ ] Implement API client for backend communication
- [ ] Create basic tool definitions (create_ticket, list_tickets)
- [ ] Set up Google ADK with Gemini
- [ ] Add agent service to Docker Compose
- [ ] Basic /agent/chat endpoint

### Phase 2: Core Tools (Week 3)
- [ ] Implement all ticket tools
- [ ] Implement project tools
- [ ] Add session management
- [ ] Context/memory within conversation
- [ ] Error handling and validation

### Phase 3: Integration (Week 4)
- [ ] Frontend chat UI component
- [ ] Real-time streaming responses (SSE)
- [ ] Rate limiting
- [ ] Logging and monitoring

### Phase 4: Polish (Week 5+)
- [ ] Multi-turn conversation improvements
- [ ] Ambiguity resolution
- [ ] Voice input (Web Speech API)
- [ ] Mobile-optimized chat UI

---

## 8. Security Considerations

### 8.1 Authentication Flow

```
User → JWT Token → Backend → Validates → Passes user context to Agent
                                              ↓
                            Agent uses context for scoped API calls
```

### 8.2 Security Measures

| Concern | Mitigation |
|---------|------------|
| Prompt injection | Structured tool outputs, no raw LLM → DB queries |
| Data leakage | All queries scoped to user's projects |
| API abuse | Rate limiting per user |
| Token security | Short-lived JWTs, refresh tokens |
| Agent API access | Internal network only, not exposed publicly |

---

## 9. Open Questions

1. **Should the agent support voice input in v1?**
   - Web Speech API is relatively simple to add
   - Adds UX complexity

2. **How should we handle ticket disambiguation?**
   - Option A: Always show list if multiple matches
   - Option B: Use most recent/relevant match
   - Option C: Ask user to clarify

3. **Should agent responses stream in real-time?**
   - Better UX for longer responses
   - Adds complexity (SSE/WebSocket)

4. **Multi-language support?**
   - Gemini handles multiple languages
   - UI strings would need translation

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Response latency (p95) | < 3 seconds |
| Tool execution success rate | > 95% |
| User satisfaction (feedback) | > 4/5 stars |
| Daily active users using agent | Track growth |
| Tokens per conversation (cost) | Monitor and optimize |

---

## Appendix A: Technology References

- [Google ADK Documentation](https://cloud.google.com/agent-development-kit)
- [Gemini API](https://ai.google.dev/docs)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Cloud Run](https://cloud.google.com/run/docs)

---

## Appendix B: Environment Variables

```bash
# Agent Service
GEMINI_API_KEY=your-gemini-api-key
BACKEND_API_URL=http://backend:3001
AGENT_PORT=8000

# Backend (existing)
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret

# Optional: Cloud deployment
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_REGION=us-central1
```
