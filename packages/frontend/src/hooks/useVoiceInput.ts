"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type VoiceInputStatus =
  | "idle"
  | "requesting-permission"
  | "listening"
  | "processing"
  | "error";

export type VoiceInputError =
  | "not-supported"
  | "permission-denied"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "unknown";

interface UseVoiceInputOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: VoiceInputError, message: string) => void;
}

interface UseVoiceInputReturn {
  status: VoiceInputStatus;
  transcript: string;
  interimTranscript: string;
  error: VoiceInputError | null;
  errorMessage: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  cancelListening: () => void;
  resetTranscript: () => void;
}

// Type definitions for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useVoiceInput(
  options: UseVoiceInputOptions = {}
): UseVoiceInputReturn {
  const {
    language = "en-US",
    continuous = false,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<VoiceInputError | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  const SpeechRecognitionAPI = getSpeechRecognition();
  const isSupported = SpeechRecognitionAPI !== null;

  const mapErrorToType = useCallback(
    (errorCode: string): VoiceInputError => {
      switch (errorCode) {
        case "not-allowed":
          return "permission-denied";
        case "no-speech":
          return "no-speech";
        case "audio-capture":
          return "audio-capture";
        case "network":
          return "network";
        case "aborted":
          return "unknown";
        default:
          return "unknown";
      }
    },
    []
  );

  const getErrorMessage = useCallback((errorType: VoiceInputError): string => {
    switch (errorType) {
      case "not-supported":
        return "Voice input is not supported in this browser. Please try Chrome or Edge.";
      case "permission-denied":
        return "Microphone access was denied. Please allow microphone access in your browser settings.";
      case "no-speech":
        return "No speech was detected. Please try again.";
      case "audio-capture":
        return "Could not access the microphone. Please check your audio settings.";
      case "network":
        return "A network error occurred. Please check your internet connection.";
      default:
        return "An error occurred with voice input. Please try again.";
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      isListeningRef.current = false;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setStatus("idle");
    resetTranscript();
  }, [resetTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !SpeechRecognitionAPI) {
      const errorType = "not-supported" as VoiceInputError;
      setError(errorType);
      setErrorMessage(getErrorMessage(errorType));
      setStatus("error");
      onError?.(errorType, getErrorMessage(errorType));
      return;
    }

    // Reset previous state
    setError(null);
    setErrorMessage(null);
    setInterimTranscript("");
    setStatus("requesting-permission");

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setStatus("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptText;
        } else {
          interim += transcriptText;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript("");
        onResult?.(finalTranscript, true);
      } else {
        setInterimTranscript(interim);
        onResult?.(interim, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorType = mapErrorToType(event.error);
      const message = getErrorMessage(errorType);
      setError(errorType);
      setErrorMessage(message);
      setStatus("error");
      isListeningRef.current = false;
      onError?.(errorType, message);
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        // Recognition ended naturally (not cancelled)
        setStatus("idle");
      }
      isListeningRef.current = false;
      recognitionRef.current = null;
    };

    recognition.onspeechend = () => {
      setStatus("processing");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      const errorType = "unknown" as VoiceInputError;
      const message = getErrorMessage(errorType);
      setError(errorType);
      setErrorMessage(message);
      setStatus("error");
      onError?.(errorType, message);
    }
  }, [
    isSupported,
    SpeechRecognitionAPI,
    continuous,
    interimResults,
    language,
    onResult,
    onError,
    mapErrorToType,
    getErrorMessage,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    status,
    transcript,
    interimTranscript,
    error,
    errorMessage,
    isSupported,
    startListening,
    stopListening,
    cancelListening,
    resetTranscript,
  };
}
