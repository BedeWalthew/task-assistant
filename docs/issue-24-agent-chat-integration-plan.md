# Issue #24: AI Agent Chat Interface Integration Plan

**Issue Link:** https://github.com/BedeWalthew/task-assistant/issues/24  
**Last Updated:** 2026-01-11  
**Estimated Effort:** 4-6 hours

---

## 📋 Overview

Integrate a minimal chat interface in the Next.js frontend that allows users to interact with the AI agent for natural language ticket management. The chat should enable creating, editing, and managing tickets via conversational commands, with real-time updates reflected in the Kanban board.

---

## ✅ Prerequisites

| Requirement | Status | Notes |
|-------------|--------|-------|
| Agent service in Docker Compose | ✅ Done | Already configured in `docker-compose.yml` |
| Agent `/chat/stream` SSE endpoint | ✅ Done | Implemented in `packages/agent/src/main.py` |
| TanStack Query setup | ✅ Done | `QueryProvider` in `components/providers/` |
| `NEXT_PUBLIC_AGENT_URL` env var | ✅ Done | Set in `docker-compose.yml` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────┐  │
│  │ ChatButton  │───▶│ ChatInterface    │───▶│/api/agent/chat │  │
│  │ (Floating)  │    │ (SSE Consumer)   │    │(API Route Proxy)│  │
│  └─────────────┘    └──────────────────┘    └───────┬────────┘  │
│                              │                       │           │
│                              ▼                       │           │
│                     Invalidate TanStack              │           │
│                     Query Cache                      │           │
└──────────────────────────────────────────────────────┼───────────┘
                                                       │
                                            Docker Network
                                                       │
┌──────────────────────────────────────────────────────▼───────────┐
│                       Agent Service (FastAPI)                     │
│  ┌────────────────┐    ┌─────────────────┐    ┌───────────────┐  │
│  │ /chat/stream   │───▶│ TaskAgentService│───▶│ Backend API   │  │
│  │ (SSE Endpoint) │    │ (Google ADK)    │    │ (Express)     │  │
│  └────────────────┘    └─────────────────┘    └───────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
packages/frontend/src/
├── app/
│   └── api/
│       └── agent/
│           └── chat/
│               └── route.ts          # SSE proxy to agent service
├── components/
│   └── features/
│       └── agent/
│           ├── ChatInterface.tsx     # Main chat panel component
│           ├── ChatMessage.tsx       # Individual message bubble
│           ├── ChatInput.tsx         # Message input with send button
│           ├── ChatButton.tsx        # Floating trigger button
│           ├── ToolCallDisplay.tsx   # Shows tool execution status
│           └── index.ts              # Barrel export
├── hooks/
│   └── useAgentChat.ts               # SSE connection + state management
└── types/
    └── agent.ts                      # Agent-related TypeScript types

packages/frontend/e2e/
└── features/
    └── agent-chat.spec.ts            # E2E tests for chat interface
```

---

## 🔧 Implementation Tasks

### Phase 1: Backend Proxy Endpoint (30 min)

#### Task 1.1: Create API Route `/api/agent/chat/route.ts`

```typescript
// packages/frontend/src/app/api/agent/chat/route.ts
import { NextRequest } from "next/server";

const AGENT_URL = process.env.INTERNAL_AGENT_URL || "http://agent:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${AGENT_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: body.message,
        user_id: body.userId || "default_user",
        session_id: body.sessionId || null,
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Agent request failed" }),
        { status: response.status }
      );
    }

    // Forward SSE stream to client
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Agent chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to connect to agent" }),
      { status: 500 }
    );
  }
}
```

#### Task 1.2: Add Environment Variable

Add to `.env.local` and `docker-compose.yml`:
```
INTERNAL_AGENT_URL=http://agent:8000
```

---

### Phase 2: Types & Hooks (45 min)

#### Task 2.1: Define Types `types/agent.ts`

```typescript
// packages/frontend/src/types/agent.ts

export type AgentEventType = 
  | "text" 
  | "tool_call" 
  | "tool_result" 
  | "done" 
  | "error";

export interface AgentTextEvent {
  type: "text";
  text: string;
}

export interface AgentToolCallEvent {
  type: "tool_call";
  tool_name: string;
  args: Record<string, unknown>;
}

export interface AgentToolResultEvent {
  type: "tool_result";
  tool_name: string;
  result: Record<string, unknown>;
}

export interface AgentDoneEvent {
  type: "done";
  response: string;
  session_id: string;
  actions_taken: Array<{
    tool_name: string;
    args: Record<string, unknown>;
    result: Record<string, unknown>;
  }>;
}

export interface AgentErrorEvent {
  type: "error";
  error: string;
}

export type AgentEvent = 
  | AgentTextEvent 
  | AgentToolCallEvent 
  | AgentToolResultEvent 
  | AgentDoneEvent 
  | AgentErrorEvent;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    name: string;
    status: "pending" | "success" | "error";
    result?: Record<string, unknown>;
  }>;
}
```

#### Task 2.2: Create Hook `hooks/useAgentChat.ts`

```typescript
// packages/frontend/src/hooks/useAgentChat.ts
"use client";

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatMessage, AgentEvent } from "@/types/agent";

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Prepare assistant message placeholder
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      toolCalls: [],
    };
    setMessages((prev) => [...prev, assistantMessage]);

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          sessionId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event: AgentEvent = JSON.parse(data);
              
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id !== assistantMessageId) return msg;
                  
                  switch (event.type) {
                    case "text":
                      return { ...msg, content: msg.content + event.text };
                    case "tool_call":
                      return {
                        ...msg,
                        toolCalls: [
                          ...(msg.toolCalls || []),
                          { name: event.tool_name, status: "pending" as const },
                        ],
                      };
                    case "tool_result":
                      return {
                        ...msg,
                        toolCalls: msg.toolCalls?.map((tc) =>
                          tc.name === event.tool_name
                            ? { ...tc, status: "success" as const, result: event.result }
                            : tc
                        ),
                      };
                    case "done":
                      setSessionId(event.session_id);
                      // Invalidate queries to refresh ticket board
                      queryClient.invalidateQueries({ queryKey: ["tickets"] });
                      queryClient.invalidateQueries({ queryKey: ["projects"] });
                      return { ...msg, content: event.response };
                    case "error":
                      return { ...msg, content: `Error: ${event.error}` };
                    default:
                      return msg;
                  }
                })
              );
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Sorry, there was an error. Please try again." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, sessionId, queryClient]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    cancel,
    sessionId,
  };
}
```

---

### Phase 3: UI Components (2 hours)

#### Task 3.1: ChatMessage Component

```typescript
// packages/frontend/src/components/features/agent/ChatMessage.tsx
"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/agent";
import { ToolCallDisplay } from "./ToolCallDisplay";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "bg-muted/50" : "bg-background"
      )}
      data-testid={`chat-message-${message.role}`}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-1">
            {message.toolCalls.map((tool, idx) => (
              <ToolCallDisplay key={idx} toolCall={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Task 3.2: ToolCallDisplay Component

```typescript
// packages/frontend/src/components/features/agent/ToolCallDisplay.tsx
"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

interface ToolCallDisplayProps {
  toolCall: {
    name: string;
    status: "pending" | "success" | "error";
    result?: Record<string, unknown>;
  };
}

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const Icon = {
    pending: Loader2,
    success: CheckCircle,
    error: XCircle,
  }[toolCall.status];

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs px-2 py-1 rounded bg-muted",
        toolCall.status === "pending" && "text-muted-foreground",
        toolCall.status === "success" && "text-green-600",
        toolCall.status === "error" && "text-red-600"
      )}
      data-testid="tool-call"
    >
      <Icon
        className={cn("w-3 h-3", toolCall.status === "pending" && "animate-spin")}
      />
      <span className="font-mono">{toolCall.name}</span>
      {toolCall.status === "success" && toolCall.result?.message && (
        <span className="text-muted-foreground">
          — {String(toolCall.result.message)}
        </span>
      )}
    </div>
  );
}
```

#### Task 3.3: ChatInput Component

```typescript
// packages/frontend/src/components/features/agent/ChatInput.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onCancel, isLoading, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSend(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-4 border-t"
      data-testid="chat-input-form"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask the AI assistant..."
        disabled={disabled}
        className="flex-1 resize-none rounded-md border px-3 py-2 text-sm min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
        rows={1}
        data-testid="chat-input"
      />
      {isLoading ? (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={onCancel}
          data-testid="chat-cancel-btn"
        >
          <Square className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim() || disabled}
          data-testid="chat-send-btn"
        >
          <Send className="w-4 h-4" />
        </Button>
      )}
    </form>
  );
}
```

#### Task 3.4: ChatInterface Component

```typescript
// packages/frontend/src/components/features/agent/ChatInterface.tsx
"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import { useAgentChat } from "@/hooks/useAgentChat";
import { ChatMessageComponent } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatInterfaceProps {
  onClose: () => void;
}

export function ChatInterface({ onClose }: ChatInterfaceProps) {
  const { messages, isLoading, sendMessage, clearChat, cancel } = useAgentChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className="fixed bottom-20 right-4 w-96 h-[500px] bg-background border rounded-lg shadow-lg flex flex-col z-50"
      data-testid="chat-interface"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">AI Assistant</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            disabled={messages.length === 0 || isLoading}
            className="h-8 w-8"
            data-testid="chat-clear-btn"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            data-testid="chat-close-btn"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
            <div>
              <p className="font-medium mb-2">Welcome to Task Assistant AI</p>
              <p className="text-xs">
                Try: "Create a high priority bug ticket for the login page"
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onCancel={cancel}
        isLoading={isLoading}
      />
    </div>
  );
}
```

#### Task 3.5: ChatButton (Floating Trigger)

```typescript
// packages/frontend/src/components/features/agent/ChatButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { ChatInterface } from "./ChatInterface";

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && <ChatInterface onClose={() => setIsOpen(false)} />}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50"
        size="icon"
        data-testid="chat-toggle-btn"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    </>
  );
}
```

#### Task 3.6: Barrel Export

```typescript
// packages/frontend/src/components/features/agent/index.ts
export { ChatButton } from "./ChatButton";
export { ChatInterface } from "./ChatInterface";
export { ChatInput } from "./ChatInput";
export { ChatMessageComponent } from "./ChatMessage";
export { ToolCallDisplay } from "./ToolCallDisplay";
```

---

### Phase 4: Layout Integration (15 min)

#### Task 4.1: Add ChatButton to Layout

Update `packages/frontend/src/app/layout.tsx`:

```diff
  import { QueryProvider } from "@/components/providers/QueryProvider";
+ import { ChatButton } from "@/components/features/agent";
  import Link from "next/link";

  // ... existing code ...

            <main className="flex-1">{children}</main>
          </div>
+         <ChatButton />
          <Toaster />
```

---

### Phase 5: Docker Integration (15 min)

#### Task 5.1: Update Environment Variables

Add to `docker-compose.yml` frontend service:

```yaml
environment:
  # ... existing vars ...
  INTERNAL_AGENT_URL: http://agent:8000
```

#### Task 5.2: Verify Agent Healthcheck

The agent already has a healthcheck in `docker-compose.yml`. Ensure it's working:

```bash
pnpm docker:dev
docker compose ps  # Check all services are healthy
curl http://localhost:8000/health
```

---

### Phase 6: E2E Testing (1 hour)

#### Task 6.1: Create E2E Test File

```typescript
// packages/frontend/e2e/features/agent-chat.spec.ts
import { test, expect } from "@playwright/test";

test.describe("AI Agent Chat Interface", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tickets");
  });

  test.describe("Chat Toggle", () => {
    test("floating chat button is visible", async ({ page }) => {
      await expect(page.locator('[data-testid="chat-toggle-btn"]')).toBeVisible();
    });

    test("clicking chat button opens chat interface", async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    });

    test("close button closes chat interface", async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
      
      await page.locator('[data-testid="chat-close-btn"]').click();
      await expect(page.locator('[data-testid="chat-interface"]')).not.toBeVisible();
    });
  });

  test.describe("Chat UI Elements", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();
    });

    test("chat interface has input field", async ({ page }) => {
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    });

    test("chat interface has send button", async ({ page }) => {
      await expect(page.locator('[data-testid="chat-send-btn"]')).toBeVisible();
    });

    test("chat interface has clear button", async ({ page }) => {
      await expect(page.locator('[data-testid="chat-clear-btn"]')).toBeVisible();
    });

    test("send button is disabled when input is empty", async ({ page }) => {
      await expect(page.locator('[data-testid="chat-send-btn"]')).toBeDisabled();
    });

    test("send button is enabled when input has text", async ({ page }) => {
      await page.locator('[data-testid="chat-input"]').fill("Hello");
      await expect(page.locator('[data-testid="chat-send-btn"]')).toBeEnabled();
    });

    test("welcome message is shown initially", async ({ page }) => {
      await expect(page.getByText("Welcome to Task Assistant AI")).toBeVisible();
    });
  });

  test.describe("Chat Messaging", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();
    });

    test("user can send a message", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("Hello, AI assistant");
      await page.locator('[data-testid="chat-send-btn"]').click();

      // User message should appear
      await expect(page.locator('[data-testid="chat-message-user"]')).toBeVisible();
      await expect(page.getByText("Hello, AI assistant")).toBeVisible();
    });

    test("input clears after sending", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("Test message");
      await page.locator('[data-testid="chat-send-btn"]').click();

      await expect(input).toHaveValue("");
    });

    test("can send message with Enter key", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("Enter key test");
      await input.press("Enter");

      await expect(page.getByText("Enter key test")).toBeVisible();
    });

    test("clear button resets conversation", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("Message to clear");
      await page.locator('[data-testid="chat-send-btn"]').click();

      await expect(page.locator('[data-testid="chat-message-user"]')).toBeVisible();

      await page.locator('[data-testid="chat-clear-btn"]').click();

      await expect(page.locator('[data-testid="chat-message-user"]')).not.toBeVisible();
      await expect(page.getByText("Welcome to Task Assistant AI")).toBeVisible();
    });
  });

  test.describe("Agent Response Handling", () => {
    // Note: These tests require the agent service to be running
    // They will be skipped if agent is unavailable

    test("assistant responds to user message", async ({ page }) => {
      // Skip if agent not available
      const healthCheck = await page.request.get("/api/agent/health").catch(() => null);
      test.skip(!healthCheck?.ok(), "Agent service not available");

      await page.locator('[data-testid="chat-toggle-btn"]').click();
      
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("List all projects");
      await page.locator('[data-testid="chat-send-btn"]').click();

      // Wait for assistant response (with longer timeout for SSE)
      await expect(page.locator('[data-testid="chat-message-assistant"]')).toBeVisible({
        timeout: 30000,
      });
    });
  });

  test.describe("Ticket Creation via Chat", () => {
    // Integration test requiring agent service
    
    test("creating a ticket via chat updates the board", async ({ page }) => {
      // Skip if agent not available
      const healthCheck = await page.request.get("/api/agent/health").catch(() => null);
      test.skip(!healthCheck?.ok(), "Agent service not available");

      // Get initial ticket count
      await page.goto("/tickets?view=board");
      const initialTodoCount = await page
        .locator('[data-testid="column-TODO"] [data-testid^="ticket-card-"]')
        .count();

      // Open chat and create ticket
      await page.locator('[data-testid="chat-toggle-btn"]').click();
      
      const input = page.locator('[data-testid="chat-input"]');
      const uniqueTitle = `Test ticket ${Date.now()}`;
      await input.fill(`Create a TODO ticket titled "${uniqueTitle}"`);
      await page.locator('[data-testid="chat-send-btn"]').click();

      // Wait for tool execution to complete
      await expect(page.locator('[data-testid="tool-call"]')).toBeVisible({
        timeout: 30000,
      });

      // Wait for success status on tool call
      await expect(page.locator('[data-testid="tool-call"]').locator("text=create_ticket")).toBeVisible();

      // Board should automatically refresh and show new ticket
      await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });

      // Verify count increased
      const finalTodoCount = await page
        .locator('[data-testid="column-TODO"] [data-testid^="ticket-card-"]')
        .count();
      expect(finalTodoCount).toBeGreaterThan(initialTodoCount);
    });
  });

  test.describe("Accessibility", () => {
    test("chat interface is keyboard navigable", async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();
      
      // Tab should move focus through interactive elements
      await page.keyboard.press("Tab");
      await expect(page.locator('[data-testid="chat-clear-btn"]')).toBeFocused();
      
      await page.keyboard.press("Tab");
      await expect(page.locator('[data-testid="chat-close-btn"]')).toBeFocused();
    });

    test("chat input has accessible placeholder", async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();
      
      const input = page.locator('[data-testid="chat-input"]');
      await expect(input).toHaveAttribute("placeholder", "Ask the AI assistant...");
    });
  });

  test.describe("Chat on Different Pages", () => {
    test("chat works on projects page", async ({ page }) => {
      await page.goto("/projects");
      await expect(page.locator('[data-testid="chat-toggle-btn"]')).toBeVisible();
      
      await page.locator('[data-testid="chat-toggle-btn"]').click();
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    });

    test("chat works on home page", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator('[data-testid="chat-toggle-btn"]')).toBeVisible();
    });
  });
});
```

#### Task 6.2: Add Agent Health Check API Route

```typescript
// packages/frontend/src/app/api/agent/health/route.ts
import { NextResponse } from "next/server";

const AGENT_URL = process.env.INTERNAL_AGENT_URL || "http://agent:8000";

export async function GET() {
  try {
    const response = await fetch(`${AGENT_URL}/health`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ status: "unhealthy" }, { status: 503 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Agent health check failed:", error);
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Optional - Lower Priority)
- Hook behavior mocking
- Component rendering

### E2E Tests (Primary Focus)

| Test Category | Test Cases | Priority |
|---------------|------------|----------|
| UI Interaction | Toggle, open/close, input focus | Critical |
| Message Flow | Send message, receive response, clear | Critical |
| Tool Execution | Show tool calls, success/error states | High |
| Board Integration | Ticket creation refreshes board | Critical |
| Multi-page | Chat works on all pages | Medium |
| Accessibility | Keyboard navigation, ARIA | Medium |

### Manual Testing Checklist

- [ ] Open chat with button click
- [ ] Close chat with X button
- [ ] Close chat by clicking button again
- [ ] Send message and see user bubble
- [ ] Receive streaming response
- [ ] See tool calls during execution
- [ ] Create ticket and see board update
- [ ] Move ticket and see confirmation
- [ ] Clear conversation
- [ ] Works on /projects page
- [ ] Works on /tickets page
- [ ] Works on / (home) page
- [ ] Responsive on mobile viewport

---

## 🐳 Docker Verification

### Startup Command

```bash
# Start all services including agent
pnpm docker:dev

# Verify all services are running
docker compose ps

# Check agent health
curl http://localhost:8000/health

# Check frontend can reach agent
curl http://localhost:3000/api/agent/health
```

### Expected Output

```
NAME                    STATUS    PORTS
task-assistant-agent    Up        0.0.0.0:8000->8000/tcp
task-assistant-backend  Up        0.0.0.0:3001->3001/tcp
task-assistant-frontend Up        0.0.0.0:3000->3000/tcp
task-assistant-postgres Up        0.0.0.0:5433->5432/tcp
```

### Logs Debugging

```bash
# View agent logs
docker compose logs -f agent

# View frontend logs
docker compose logs -f frontend

# Check for errors
docker compose logs agent | grep -i error
```

---

## 📝 Environment Variables Summary

| Variable | Location | Value |
|----------|----------|-------|
| `NEXT_PUBLIC_AGENT_URL` | docker-compose.yml (frontend) | `http://localhost:8000` |
| `INTERNAL_AGENT_URL` | docker-compose.yml (frontend) | `http://agent:8000` |
| `GEMINI_API_KEY` | .env / docker-compose.yml (agent) | Your API key |
| `BACKEND_API_URL` | docker-compose.yml (agent) | `http://backend:3001` |

---

## 📊 Acceptance Criteria Checklist

From GitHub Issue #24:

- [ ] Users can open/close chat interface
- [ ] Users can send natural language commands
- [ ] Agent responses stream in real-time
- [ ] Tool executions are visible in chat
- [ ] Ticket board updates automatically after agent actions
- [ ] Error messages are clear and actionable
- [ ] Works in both projects and tickets pages

---

## 🚀 Implementation Order

1. **API Route** → `/api/agent/chat/route.ts` and `/api/agent/health/route.ts`
2. **Types** → `types/agent.ts`
3. **Hook** → `hooks/useAgentChat.ts`
4. **UI Components** → ChatMessage, ToolCallDisplay, ChatInput, ChatInterface, ChatButton
5. **Layout Integration** → Add ChatButton to layout
6. **Docker Verification** → Test with `pnpm docker:dev`
7. **E2E Tests** → Write and run agent-chat.spec.ts
8. **Manual Testing** → Complete checklist above

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| [docker-compose.yml](docker-compose.yml) | Service definitions |
| [packages/agent/src/main.py](packages/agent/src/main.py) | Agent API endpoints |
| [packages/frontend/src/app/layout.tsx](packages/frontend/src/app/layout.tsx) | App layout (ChatButton goes here) |
| [packages/frontend/src/components/providers/QueryProvider.tsx](packages/frontend/src/components/providers/QueryProvider.tsx) | TanStack Query setup |
| [docs/e2e-testing-plan.md](docs/e2e-testing-plan.md) | E2E testing strategy |
