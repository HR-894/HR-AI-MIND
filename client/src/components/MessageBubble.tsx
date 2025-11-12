import { memo } from "react";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
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

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-pre:my-2 prose-headings:my-2">
        <ReactMarkdown
          components={{
            code({ inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";
              const codeString = String(children).replace(/\n$/, "");

              return !inline && language ? (
                <CodeBlock language={language} code={codeString} />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
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
        "h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-lg",
        isUser 
          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white" 
          : "bg-gradient-to-br from-emerald-400 to-cyan-500 text-white"
      )}>
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      <div className={cn(
        "flex-1 max-w-3xl",
        isUser ? "flex justify-end" : ""
      )}>
        <div className={cn(
          "rounded-2xl p-4 shadow-md backdrop-blur-sm",
          isUser 
            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white" 
            : "bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-gray-700/50"
        )}>
          {renderContent()}
          
          <div className={cn(
            "text-xs mt-2 flex items-center gap-2",
            isUser ? "text-white/70" : "text-gray-500 dark:text-gray-400"
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
