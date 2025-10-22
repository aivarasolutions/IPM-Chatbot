import { cn } from "@/lib/utils";
import { Building2, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date | null;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user";
  
  const formatTimestamp = () => {
    if (!timestamp) return null;
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp as any);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 w-full",
        isUser ? "justify-end flex-row-reverse" : "justify-start"
      )}
      data-testid={`message-${role}`}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "rounded-2xl px-4 py-3 shadow-sm shrink",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-card-border"
        )}
        style={{
          maxWidth: '85%',
          flexGrow: 0,
          flexShrink: 1,
          wordWrap: 'break-word',
          overflowWrap: 'anywhere',
          wordBreak: 'break-all'
        }}
      >
        <div className={cn(
          "text-sm leading-relaxed prose prose-sm max-w-none",
          isUser ? "prose-invert" : "dark:prose-invert",
          "prose-headings:font-serif prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2",
          "prose-p:my-1.5 prose-p:leading-relaxed",
          "prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5",
          "prose-strong:font-semibold",
          "prose-code:text-xs prose-code:bg-muted/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          isUser ? "prose-strong:text-primary-foreground" : "prose-strong:text-foreground"
        )}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-0.5" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-0.5" {...props} />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {formatTimestamp() && (
          <p className={cn(
            "text-xs mt-2 opacity-70",
            isUser ? "text-primary-foreground" : "text-muted-foreground"
          )}>
            {formatTimestamp()}
          </p>
        )}
      </div>
    </div>
  );
}
