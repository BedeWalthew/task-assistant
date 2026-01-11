"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, Square } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { VoiceChatButton } from "./VoiceChatButton";
import { VoiceInputStatus } from "./VoiceInputStatus";

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  disabled?: boolean;
  autoSendVoice?: boolean; // Auto-send message after voice input completes
}

export function ChatInput({
  onSend,
  onCancel,
  isLoading,
  disabled,
  autoSendVoice = true, // Default to auto-send
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [voiceError, setVoiceError] = useState<{ error: string; message: string } | null>(null);
  const prevVoiceStatusRef = useRef<string>("idle");
  const pendingAutoSendRef = useRef<string | null>(null);

  const handleVoiceResult = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal && transcript.trim()) {
      setValue((prev) => {
        const newValue = prev ? `${prev} ${transcript}` : transcript;
        // Store the value for potential auto-send
        pendingAutoSendRef.current = newValue;
        return newValue;
      });
    }
  }, []);

  const handleVoiceError = useCallback((error: string, message: string) => {
    setVoiceError({ error, message });
  }, []);

  const {
    status: voiceStatus,
    interimTranscript,
    error,
    errorMessage,
    isSupported,
    startListening,
    stopListening,
    cancelListening,
    resetTranscript,
  } = useVoiceInput({
    language: "en-US",
    continuous: false,
    interimResults: true,
    onResult: handleVoiceResult,
    onError: handleVoiceError,
  });

  const dismissVoiceError = useCallback(() => {
    setVoiceError(null);
  }, []);

  // Auto-send when voice recognition completes
  useEffect(() => {
    const wasActive = 
      prevVoiceStatusRef.current === "listening" || 
      prevVoiceStatusRef.current === "processing";
    const isNowIdle = voiceStatus === "idle";
    
    if (autoSendVoice && wasActive && isNowIdle && pendingAutoSendRef.current) {
      const messageToSend = pendingAutoSendRef.current.trim();
      if (messageToSend && !isLoading) {
        // Small delay to ensure UI updates before sending
        setTimeout(() => {
          onSend(messageToSend);
          setValue("");
          resetTranscript();
          pendingAutoSendRef.current = null;
        }, 100);
      }
    }
    
    prevVoiceStatusRef.current = voiceStatus;
  }, [voiceStatus, autoSendVoice, isLoading, onSend, resetTranscript]);

  // Handle keyboard shortcut (Ctrl+Shift+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "V") {
        e.preventDefault();
        if (voiceStatus === "listening") {
          stopListening();
        } else if (voiceStatus === "idle" || voiceStatus === "error") {
          dismissVoiceError();
          resetTranscript();
          startListening();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [voiceStatus, startListening, stopListening, resetTranscript, dismissVoiceError]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSend(value.trim());
      setValue("");
      resetTranscript();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleStartVoice = () => {
    dismissVoiceError();
    resetTranscript();
    startListening();
  };

  const isVoiceActive =
    voiceStatus === "listening" ||
    voiceStatus === "processing" ||
    voiceStatus === "requesting-permission";

  return (
    <div className="border-t" data-testid="chat-input-container">
      {/* Voice status indicator */}
      <VoiceInputStatus
        status={voiceStatus}
        interimTranscript={interimTranscript}
        error={error}
        errorMessage={errorMessage}
        onDismissError={dismissVoiceError}
      />

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-4"
        data-testid="chat-input-form"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            voiceStatus === "listening"
              ? "Listening... Speak your message"
              : "Type or speak your message..."
          }
          disabled={disabled || isVoiceActive}
          className="flex-1 resize-none rounded-md border px-3 py-2 text-sm min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          rows={1}
          data-testid="chat-input"
          aria-label="Message input. Press Ctrl+Shift+V to use voice input."
        />

        {/* Voice input button */}
        <VoiceChatButton
          status={voiceStatus}
          isSupported={isSupported}
          onStart={handleStartVoice}
          onStop={stopListening}
          onCancel={cancelListening}
          disabled={disabled || isLoading}
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
            disabled={!value.trim() || disabled || isVoiceActive}
            data-testid="chat-send-btn"
          >
            <Send className="w-4 h-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
