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
      className={cn("flex gap-3 p-4", isUser ? "bg-muted/50" : "bg-background")}
      data-testid={`chat-message-${message.role}`}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content || (message.role === "assistant" && "...")}
        </p>
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
