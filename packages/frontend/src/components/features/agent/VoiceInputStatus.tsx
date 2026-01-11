"use client";

import { cn } from "@/lib/utils";
import type { VoiceInputStatus, VoiceInputError } from "@/hooks/useVoiceInput";
import { AlertCircle } from "lucide-react";

interface VoiceInputStatusProps {
  status: VoiceInputStatus;
  interimTranscript: string;
  error: VoiceInputError | null;
  errorMessage: string | null;
  onDismissError?: () => void;
  className?: string;
}

export function VoiceInputStatus({
  status,
  interimTranscript,
  error,
  errorMessage,
  onDismissError,
  className,
}: VoiceInputStatusProps) {
  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isRequesting = status === "requesting-permission";
  const isError = status === "error";

  if (!isListening && !isProcessing && !isRequesting && !isError) {
    return null;
  }

  return (
    <div
      className={cn(
        "px-3 py-2 text-sm border-t bg-muted/30",
        isError && "bg-red-50 border-red-200",
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {isError && error && (
        <div className="flex items-start gap-2 text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Voice input error</p>
            <p className="text-xs text-red-500">{errorMessage}</p>
            {onDismissError && (
              <button
                onClick={onDismissError}
                className="text-xs underline hover:no-underline mt-1"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {isRequesting && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span>Requesting microphone access...</span>
        </div>
      )}

      {isListening && (
        <div className="flex items-center gap-2">
          {/* Sound wave animation */}
          <div className="flex items-center gap-0.5 h-4" aria-hidden="true">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="w-1 bg-red-500 rounded-full animate-pulse"
                style={{
                  height: `${8 + Math.random() * 8}px`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: "0.5s",
                }}
              />
            ))}
          </div>
          <span className="text-muted-foreground">
            Listening...{" "}
            {interimTranscript && (
              <span className="text-foreground italic">
                &ldquo;{interimTranscript}&rdquo;
              </span>
            )}
          </span>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span>Processing speech...</span>
        </div>
      )}
    </div>
  );
}
