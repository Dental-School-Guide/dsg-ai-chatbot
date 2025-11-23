"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send, Check } from "lucide-react";
import { toast } from "sonner";

interface ChatComposerProps {
  className?: string;
  onSend?: (message: string) => void;
  isLoading?: boolean;
  agentMode?: string | null;
  onAgentModeChange?: (mode: string | null) => void;
}

export function ChatComposer({ className, onSend, isLoading, agentMode, onAgentModeChange }: ChatComposerProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousAgentModeRef = useRef<string | null | undefined>(agentMode);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // When agent mode changes externally (e.g. via sidebar quick prompts),
  // always pre-fill the textbox with the appropriate starter prompt.
  useEffect(() => {
    if (agentMode === previousAgentModeRef.current) return;
    previousAgentModeRef.current = agentMode;

    if (agentMode === "School Info") {
      setMessage("Can you help me learn about a specific school?");
    } else if (agentMode === "Volunteer Ideas") {
      setMessage("Help me find volunteer opportunities");
    } else if (agentMode === "Interview Drill") {
      setMessage("Give me 6-question mock interview practice. Ask one at a time and wait for my answer.");
    }
    // Essay feedback intentionally does not auto-fill
  }, [agentMode]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
    setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 900);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    setIsTyping(false);
  };

  const showAnimatedBorder = isFocused || isTyping;

  const handleSend = () => {
    if (message.trim() && !isLoading && onSend) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Top: input + send in two columns */}
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        {/* Left: glowing input shell only */}
        <div className="chat-composer-border-shell">
          <div
            aria-hidden
            className={cn(
              "chat-composer-border-glow",
              showAnimatedBorder ? "chat-composer-border-active" : ""
            )}
          />
          <div
            aria-hidden
            className={cn(
              "chat-composer-border",
              showAnimatedBorder ? "chat-composer-border-active" : ""
            )}
          />
          <div className="chat-composer-panel rounded-2xl">
            <div className="rounded-2xl border border-none ">
              <Textarea
                className="min-h-[70px] w-full resize-none rounded-xl border-0 bg-transparent text-sm text-[--dsg-text] placeholder:text-[--dsg-muted] focus-visible:ring-0"
                value={message}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter = new line)"
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {['Essay feedback', 'Volunteer Ideas', 'School Info', 'Interview Drill'].map((mode) => {
                const isSelected = agentMode === mode;
                return (
                  <Button 
                    key={mode}
                    size="sm" 
                    onClick={() => {
                      const newValue = isSelected ? null : mode;
                      onAgentModeChange?.(newValue);
                      
                      // Pre-fill prompt based on mode
                      if (newValue === 'School Info') {
                        setMessage("Can you help me learn about a specific school?");
                      } else if (newValue === 'Volunteer Ideas') {
                        setMessage("Help me find volunteer opportunities");
                      } else if (newValue === 'Interview Drill') {
                        setMessage("Give me 6-question mock interview practice. Ask one at a time and wait for my answer.");
                      } else {
                        setMessage("");
                      }
                      
                      // Show toast notification
                      if (newValue) {
                        toast.success(`${mode} mode activated`, {
                          description: "AI agent switched successfully",
                          duration: 2000,
                        });
                      } else {
                        toast.info("Agent mode deactivated", {
                          description: "Switched back to default mode",
                          duration: 2000,
                        });
                      }
                    }}
                    className={cn(
                      "relative h-7 rounded-full cursor-pointer transition-all duration-200 text-xs font-medium px-3",
                      "dsg-toolbar-pill border-dashed",
                      "hover:scale-105 hover:brightness-110",
                      isSelected && "border-solid bg-[--dsg-gold] text-black font-semibold scale-105 shadow-lg shadow-[--dsg-gold]/20"
                    )}
                  >
                    {mode}
                    {isSelected && (
                      <Check className="ml-1.5 h-3 w-3" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: send button OUTSIDE the glow */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="flex h-10 items-center gap-2 rounded-xl dsg-send-btn px-4 text-[--dsg-almost-black] shadow-sm hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-label="Send"
          >
            <Send className="h-4 w-4 text-white" />
            <span className="text-xs font-semibold text-white">{isLoading ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </div>

      {/* Pro tip section */}
      <div className="mt-2 text-xs text-[--dsg-muted] inline-flex items-center gap-2">
        ⚡Pro tip: Click on Essay Feedback to have your personal statement scored and edited.
      </div>
    </div>
  );
}
