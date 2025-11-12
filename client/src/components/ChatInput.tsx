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
    <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-slate-900/90 dark:via-blue-950/90 dark:to-purple-950/90 backdrop-blur-md p-4 shadow-lg" data-testid="chat-input-container">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isGenerating ? "Generating..." : "Type your message... (Shift+Enter for new line)"}
              disabled={disabled || isGenerating}
              className="min-h-[44px] max-h-[120px] resize-none pr-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700"
              data-testid="input-message"
            />
            
            {canUseSTT && (
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleListening}
                disabled={disabled || isGenerating}
                className="absolute right-2 top-2 h-8 w-8"
                data-testid="button-voice-input"
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-destructive" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {isGenerating ? (
            <Button
              onClick={onStop}
              variant="destructive"
              size="icon"
              className="h-10 w-10 shrink-0 bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg"
              data-testid="button-stop"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              size="icon"
              className="h-10 w-10 shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
              data-testid="button-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{input.length} characters</span>
        </div>
      </div>
    </div>
  );
}
