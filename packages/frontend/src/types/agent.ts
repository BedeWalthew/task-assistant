export type AgentEventType =
  | "text"
  | "tool_call"
  | "tool_result"
  | "done"
  | "error";

export interface AgentTextEvent {
  type: "text";
  content: string;
}

export interface AgentToolCallEvent {
  type: "tool_call";
  tool: string;
  args: Record<string, unknown>;
}

export interface AgentToolResultEvent {
  type: "tool_result";
  tool: string;
  result: Record<string, unknown>;
}

export interface AgentDoneEvent {
  type: "done";
  full_response: string;
  session_id: string;
  actions_taken: Array<{
    tool: string;
    args: Record<string, unknown>;
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
