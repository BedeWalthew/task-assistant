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

  const sendMessage = useCallback(
    async (content: string) => {
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

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status}`);
        }

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
                        return { ...msg, content: msg.content + event.content };
                      case "tool_call":
                        return {
                          ...msg,
                          toolCalls: [
                            ...(msg.toolCalls || []),
                            {
                              name: event.tool,
                              status: "pending" as const,
                            },
                          ],
                        };
                      case "tool_result": {
                        const isSuccess =
                          event.result &&
                          typeof event.result === "object" &&
                          "success" in event.result &&
                          event.result.success === true;
                        return {
                          ...msg,
                          toolCalls: msg.toolCalls?.map((tc) =>
                            tc.name === event.tool
                              ? {
                                  ...tc,
                                  status: isSuccess
                                    ? ("success" as const)
                                    : ("error" as const),
                                  result: event.result,
                                }
                              : tc
                          ),
                        };
                      }
                      case "done":
                        setSessionId(event.session_id);
                        // Invalidate queries to refresh ticket board
                        queryClient.invalidateQueries({ queryKey: ["tickets"] });
                        queryClient.invalidateQueries({
                          queryKey: ["projects"],
                        });
                        return { ...msg, content: event.full_response };
                      case "error":
                        return { ...msg, content: `Error: ${event.error}` };
                      default:
                        return msg;
                    }
                  })
                );
              } catch {
                // Ignore parse errors for incomplete SSE data
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "Sorry, there was an error. Please try again.",
                }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, sessionId, queryClient]
  );

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
