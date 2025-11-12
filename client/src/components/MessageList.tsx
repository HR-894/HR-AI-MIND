import { memo, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ChatMessage } from "@shared/schema";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { MessageListSkeleton } from "./MessageListSkeleton";
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

  // Setup virtualizer for efficient rendering of long message lists
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 80, // Estimated message height (reduced for compact design), will auto-adjust
    overscan: 5, // Render 5 extra items above/below viewport
  });

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length, autoScroll]);

  // Show skeleton on first load when no messages yet
  if (messages.length === 0 && isGenerating) {
    return <MessageListSkeleton />;
  }

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
    <div className="h-full flex flex-col" data-testid="message-list">
      {hasMore && (
        <div className="flex justify-center p-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onLoadMore}
            data-testid="button-load-more"
          >
            <ChevronUp className="h-3 w-3 mr-1.5" />
            Load older messages
          </Button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const message = messages[virtualItem.index];
            if (!message) return null;
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full px-3 py-2"
                style={{ transform: `translateY(${virtualItem.start}px)` }}
              >
                <MessageBubble message={message} />
              </div>
            );
          })}
        </div>
      </div>
      
      {isGenerating && (
        <div className="px-3 py-2 shrink-0">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
});
