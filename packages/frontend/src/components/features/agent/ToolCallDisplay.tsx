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

  const getMessage = () => {
    if (toolCall.status === "success" && toolCall.result) {
      if ("message" in toolCall.result) {
        return String(toolCall.result.message);
      }
      if ("ticket" in toolCall.result && typeof toolCall.result.ticket === "object") {
        const ticket = toolCall.result.ticket as { title?: string };
        return ticket.title ? `Created: ${ticket.title}` : "Success";
      }
    }
    if (toolCall.status === "error" && toolCall.result && "error" in toolCall.result) {
      return String(toolCall.result.error);
    }
    return null;
  };

  const message = getMessage();

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
        className={cn(
          "w-3 h-3 flex-shrink-0",
          toolCall.status === "pending" && "animate-spin"
        )}
      />
      <span className="font-mono">{toolCall.name}</span>
      {message && (
        <span className="text-muted-foreground truncate">— {message}</span>
      )}
    </div>
  );
}
