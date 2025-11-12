import { memo, useRef, useEffect } from "react";
import { FixedSizeList } from "react-window";
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

  // Row renderer for virtualized list
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    if (!message) return null;
    return (
      <div style={{...style}} className="px-4">
        <MessageBubble message={message} />
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col" data-testid="message-list">
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

      {messages.length > 20 ? (
        // Use virtualization for long lists (>20 messages)
        <FixedSizeList
          height={containerRef.current?.clientHeight || 600}
          itemCount={messages.length}
          itemSize={150} // Average message height
          width="100%"
          overscanCount={5}
        >
          {Row}
        </FixedSizeList>
      ) : (
        // Use regular rendering for short lists
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>
      )}
      
      {isGenerating && (
        <div className="p-4">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
});
