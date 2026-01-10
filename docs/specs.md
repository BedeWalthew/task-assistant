# Project Specifications: Personal Planner + Task Agent

> **Last Updated:** 2026-01-10  
> **Status:** Phase 2 Complete, Phase 3 (Authentication) Next

## Overview

A personal planner and task management system that aggregates tasks from multiple sources (GitHub Actions, Jira, Notion) into a unified view. The system features a Kanban board with drag-and-drop reordering, and will include a Google SDK-powered AI agent for natural language interaction.

## Current Implementation Status

### ✅ Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| Project CRUD | ✅ Complete | Create, read, update, delete with unique keys |
| Ticket CRUD | ✅ Complete | Full lifecycle with validation |
| Kanban Board | ✅ Complete | 4 status columns with drag-and-drop |
| Filtering/Sorting | ✅ Complete | URL-driven, server-rendered |
| Reorder API | ✅ Complete | Fractional positioning with optimistic updates |
| API Documentation | ✅ Complete | Swagger/OpenAPI at /api-docs |
| E2E Tests | ✅ Complete | Playwright test suites |

### 🔜 Planned Features

| Feature | Phase | Priority |
|---------|-------|----------|
| Authentication | Phase 3 | High |
| External Integrations | Phase 4 | Medium |
| AI Agent | Phase 4 | Medium |
| Real-time Updates | Phase 5 | Low |

## Core Features

### 1. Unified Task Management

- **Centralized Database**: Stores all tickets/tasks in a unified format
- **Kanban Board**: Visual status management with drag-and-drop
- **Filtering**: Filter by project, status, priority, search term
- **Pagination**: Server-side pagination with URL state

### 2. Planned Integrations

- GitHub Actions
- Jira Tickets
- Notion (Potential)
- Custom/Manual Ticket Creation

### 3. AI Agent (Planned - Phase 4)

- **Natural Language Processing**: Voice and text input
- **Hierarchy Management**: Workspace → Project → Ticket
- **Intelligent Routing**: Context-aware task creation

## Data Structure

### Ticket Schema (Current Implementation)

```json
{
  "id": "uuid",                       // Auto-generated UUID
  "title": "Implement Login Flow",    // Required: Short summary
  "description": "...",               // Optional: Detailed description
  "status": "TODO",                   // Required: TODO, IN_PROGRESS, DONE, BLOCKED
  "priority": "MEDIUM",               // Required: LOW, MEDIUM, HIGH, CRITICAL
  "position": 1.5,                    // Float: Ordering within status column
  "projectId": "uuid",                // Required: Parent project reference
  "assigneeId": "uuid",               // Optional: Assigned user
  "source": "MANUAL",                 // Required: MANUAL, JIRA, GITHUB
  "sourceUrl": "https://...",         // Optional: Link to external source
  "createdAt": "2026-01-10T10:00:00Z",// Auto-generated timestamp
  "updatedAt": "2026-01-10T15:30:00Z" // Auto-updated timestamp
}
```

### Project Schema

```json
{
  "id": "uuid",                       // Auto-generated UUID
  "name": "Frontend App",             // Required: Project name
  "description": "...",               // Optional: Description
  "key": "FRONT",                     // Required: Unique 2-10 char code
  "createdAt": "2026-01-01T10:00:00Z",
  "updatedAt": "2026-01-10T15:30:00Z"
}
```
