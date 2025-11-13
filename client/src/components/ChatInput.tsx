import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createSpeechRecognition, isSTTSupported } from "@/lib/speech";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled: boolean;
  enableSTT: boolean;
}

export function ChatInput({ 
  onSend, 
  onStop, 
  isGenerating, 
  disabled,
  enableSTT 
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const sttSupported = isSTTSupported();
  const canUseSTT = enableSTT && sttSupported;

  useEffect(() => {
    if (!canUseSTT) return;

    recognitionRef.current = createSpeechRecognition();
    
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInput(prev => prev + (prev ? " " : "") + transcript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Speech recognition error",
          description: "Could not process speech input",
          variant: "destructive",
        });
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [canUseSTT, toast]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled || isGenerating) return;
    
    onSend(trimmed);
    setInput("");
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech input not available",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  return (
    <div className="px-2.5 py-2" data-testid="chat-input-container">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isGenerating ? "Generating..." : "Type your message... (Shift+Enter for new line)"}
              disabled={disabled || isGenerating}
              className="min-h-[40px] max-h-[100px] resize-none pr-10 text-sm bg-white/95 dark:bg-slate-700/95 backdrop-blur-sm border-indigo-200/60 dark:border-indigo-600/60 focus:border-indigo-400 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700/50 rounded-xl shadow-sm transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              data-testid="input-message"
              aria-label="Chat message input"
              aria-describedby="input-help-text"
            />
            
            {canUseSTT && (
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleListening}
                disabled={disabled || isGenerating}
                className="absolute right-1.5 top-1.5 h-7 w-7"
                data-testid="button-voice-input"
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                aria-pressed={isListening}
              >
                {isListening ? (
                  <MicOff className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                ) : (
                  <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
            )}
          </div>

          {isGenerating ? (
            <Button
              onClick={onStop}
              variant="destructive"
              size="icon"
              className="h-9 w-9 shrink-0 bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg"
              data-testid="button-stop"
              aria-label="Stop generating response"
            >
              <Square className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              size="icon"
              className="h-9 w-9 shrink-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              data-testid="button-send"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
        
        <div id="input-help-text" className="mt-1.5 flex items-center justify-between text-[9px] text-indigo-600/60 dark:text-indigo-400/60">
          <span>Enter to send • Shift+Enter for new line</span>
          <span aria-live="polite" className="font-medium">{input.length}</span>
        </div>
      </div>
    </div>
  );
}
