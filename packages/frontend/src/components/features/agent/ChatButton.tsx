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
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    </>
  );
}
