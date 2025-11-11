import { memo, useRef, useEffect, useCallback, useState } from "react";
import { VariableSizeList as List } from "react-window";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import type { ChatMessage } from "@shared/schema";

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
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowHeights = useRef<Map<number, number>>(new Map());
  const [, forceUpdate] = useState({});

  const getRowHeight = useCallback((index: number) => {
    return rowHeights.current.get(index) || 100;
  }, []);

  const setRowHeight = useCallback((index: number, height: number) => {
    if (rowHeights.current.get(index) !== height) {
      rowHeights.current.set(index, height);
      listRef.current?.resetAfterIndex(index);
      forceUpdate({});
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, "end");
    }
  }, [messages.length]);

  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, autoScroll, scrollToBottom]);

  const Row = useCallback(({ index, style }: { index: number; style: any }) => {
    const message = messages[index];
    if (!message) return null;

    return (
      <div style={style}>
        <MessageBubble
          message={message}
          onHeightChange={() => {
            const element = document.querySelector(`[data-testid="message-${message.role}-${message.id}"]`);
            if (element) {
              setRowHeight(index, element.clientHeight);
            }
          }}
        />
      </div>
    );
  }, [messages, setRowHeight]);

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
    <div ref={containerRef} className="flex-1 relative" data-testid="message-list">
      {hasMore && (
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center p-4">
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

      <List
        ref={listRef}
        height={containerRef.current?.clientHeight || 600}
        width="100%"
        itemCount={messages.length + (isGenerating ? 1 : 0)}
        itemSize={getRowHeight}
        overscanCount={3}
      >
        {({ index, style }) => {
          if (index === messages.length && isGenerating) {
            return (
              <div style={style}>
                <TypingIndicator />
              </div>
            );
          }
          return <Row index={index} style={style} />;
        }}
      </List>
    </div>
  );
});
