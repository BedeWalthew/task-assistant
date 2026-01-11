"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceInputStatus } from "@/hooks/useVoiceInput";

interface VoiceChatButtonProps {
  status: VoiceInputStatus;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceChatButton({
  status,
  isSupported,
  onStart,
  onStop,
  onCancel,
  disabled,
  className,
}: VoiceChatButtonProps) {
  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isRequesting = status === "requesting-permission";
  const isError = status === "error";
  const isActive = isListening || isProcessing || isRequesting;

  const handleClick = () => {
    if (isActive) {
      if (isListening) {
        onStop();
      } else {
        onCancel();
      }
    } else {
      onStart();
    }
  };

  const getAriaLabel = () => {
    if (!isSupported) return "Voice input not supported";
    if (isListening) return "Stop recording. Press to finish voice input.";
    if (isProcessing) return "Processing voice input...";
    if (isRequesting) return "Requesting microphone permission...";
    if (isError) return "Voice input error. Press to try again.";
    return "Start voice input. Press to speak your message.";
  };

  const getTitle = () => {
    if (!isSupported) return "Voice input not supported in this browser";
    if (isListening) return "Click to stop recording (Ctrl+Shift+V)";
    if (isProcessing) return "Processing...";
    if (isRequesting) return "Requesting microphone access...";
    if (isError) return "Click to try again";
    return "Voice input (Ctrl+Shift+V)";
  };

  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        className={cn("h-9 w-9 text-muted-foreground", className)}
        aria-label={getAriaLabel()}
        title={getTitle()}
        data-testid="voice-input-btn-unsupported"
      >
        <MicOff className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={isActive ? "destructive" : isError ? "outline" : "ghost"}
      size="icon"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "h-9 w-9 transition-all",
        isListening && "animate-pulse bg-red-500 hover:bg-red-600",
        isError && "border-red-500 text-red-500 hover:bg-red-50",
        className
      )}
      aria-label={getAriaLabel()}
      aria-pressed={isActive}
      title={getTitle()}
      data-testid="voice-input-btn"
    >
      {isProcessing || isRequesting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isListening ? (
        <div className="relative flex items-center justify-center">
          <Mic className="w-4 h-4" />
          {/* Recording indicator dot */}
          <span
            className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse"
            aria-hidden="true"
          />
        </div>
      ) : (
        <Mic className={cn("w-4 h-4", isError && "text-red-500")} />
      )}
    </Button>
  );
}
