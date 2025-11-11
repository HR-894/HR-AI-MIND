import { memo } from "react";
import { User, Bot } from "lucide-react";
import { sanitizeMarkdown } from "@/lib/markdown";
import type { ChatMessage } from "@shared/schema";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = memo(function MessageBubble({ 
  message
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  const renderContent = () => {
    if (isUser) {
      return <div className="whitespace-pre-wrap text-sm">{message.content}</div>;
    }

    const sanitized = sanitizeMarkdown(message.content);
    
    return (
      <div 
        className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-pre:my-2 prose-headings:my-2"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  };

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser && "flex-row-reverse"
      )}
      data-testid={`message-${message.role}-${message.id}`}
    >
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn(
        "flex-1 max-w-3xl",
        isUser ? "flex justify-end" : ""
      )}>
        <div className={cn(
          "rounded-2xl p-4",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-card border border-card-border"
        )}>
          {renderContent()}
          
          <div className={cn(
            "text-xs mt-2 flex items-center gap-2",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            <time dateTime={new Date(message.timestamp).toISOString()}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
});
