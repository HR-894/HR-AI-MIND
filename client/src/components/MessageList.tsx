import { memo, useRef, useEffect, useCallback, useState } from "react";
import type { ChatMessage } from "@shared/schema";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  autoScroll: boolean;
}

export const MessageList = memo(function MessageList({
  messages,
  isGenerating,
  hasMore,
  onLoadMore,
  autoScroll,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length, autoScroll]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="space-y-3 max-w-md">
          <h2 className="text-xl font-semibold text-foreground">
            Start a conversation
          </h2>
          <p className="text-sm text-muted-foreground">
            Your AI assistant is ready to help. Send a message to begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto" data-testid="message-list">
      {hasMore && (
        <div className="flex justify-center p-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onLoadMore}
            data-testid="button-load-more"
          >
            <ChevronUp className="h-4 w-4 mr-2" />
            Load older messages
          </Button>
        </div>
      )}

      <div className="space-y-4 p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isGenerating && <TypingIndicator />}
      </div>
    </div>
  );
});
