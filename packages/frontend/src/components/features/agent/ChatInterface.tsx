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
  const { messages, isLoading, sendMessage, clearChat, cancel } =
    useAgentChat();
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
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            data-testid="chat-close-btn"
            title="Close chat"
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
                Try: &quot;Create a high priority bug ticket for the login
                page&quot;
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
