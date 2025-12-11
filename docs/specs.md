# Project Specifications: Personal Planner + Task Agent

## Overview
A personal planner and task management system that aggregates tasks from multiple sources (GitHub Actions, Jira, Notion) into a unified view. The system features a Google SDK-powered AI agent for natural language interaction, enabling voice-controlled task and project management.

## Core Features

### 1. Unified Task Management
- **Centralized Database**: Stores all tickets/tasks in a unified format.
- **Integrations**:
  - GitHub Actions
  - Jira Tickets
  - Notion (Potential)
  - Custom/Manual Ticket Creation
- **Frontend Application**: Displays a combined view of all tickets from connected sources.
- **Synchronization**: Two-way sync (or at least import) to keep the personal planner updated with external sources.

### 2. AI Agent (Google SDK)
- **Natural Language Processing**:
  - Input: Voice (Microphone) and Text.
  - Function: Translates natural language requests into structural changes (Workspaces, Projects, Tickets).
- **Hierarchy Management**:
  - **Workspace** (Highest Level)
  - **Project**
  - **Ticket** (Lowest Level)
- **Intelligent Routing**:
  - The agent analyzes requests to determine the appropriate context.
  - *Example*: "Create a new task for X" -> Agent asks to confirm placement in existing "Project X" or suggests creating a new project if no match is found.

## Data Structure

### Unified Ticket Format (JSON)
*To be defined. The goal is a standard JSON structure that maps fields from Jira, GitHub, etc., to a common schema.*

```json
{
  "id": "TICKET-123",                 // Required: Unique identifier
  "title": "Implement Login Flow",    // Required: Short summary
  "description": "...",               // Optional: Detailed description
  "status": "To Do",                  // Required: e.g., 'To Do', 'In Progress', 'Done'
  "priority": "High",                 // Optional: e.g., 'Low', 'Medium', 'High', 'Critical'
  "dueDate": "2023-12-31T23:59:59Z",  // Optional: ISO 8601 format
  "project": "Frontend App",          // Required: Project name or ID
  "tags": ["auth", "frontend"],       // Optional: List of tags
  "blockedBy": ["TICKET-100"],        // Optional: List of ticket IDs that block this one
  "sprint": "Sprint 4",               // Optional: Sprint identifier
  "assignee": "user@example.com",     // Optional: User assigned to the task
  "source": "Jira",                   // Required: Origin (Jira, GitHub, Manual, Notion)
  "sourceUrl": "https://...",         // Optional: Link to the original source
  "createdAt": "2023-10-01T10:00:00Z",// Required: Creation timestamp
  "updatedAt": "2023-10-05T15:30:00Z" // Required: Last update timestamp
}
```
