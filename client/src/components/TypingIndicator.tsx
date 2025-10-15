import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2 } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4 max-w-4xl" data-testid="typing-indicator">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted text-muted-foreground">
          <Building2 className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="bg-card border border-card-border rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
