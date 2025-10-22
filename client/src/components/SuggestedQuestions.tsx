import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SuggestedQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({ questions, onSelectQuestion, disabled }: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="border-t border-border bg-muted/30 p-3">
      <div className="w-full">
        <p className="text-xs text-muted-foreground mb-2 px-1">Suggested questions:</p>
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {questions.map((question, idx) => (
              <Button
                key={idx}
                data-testid={`button-suggested-${idx}`}
                variant="secondary"
                size="sm"
                onClick={() => onSelectQuestion(question)}
                disabled={disabled}
                className="whitespace-nowrap shrink-0 rounded-full text-xs max-w-[200px] overflow-hidden text-ellipsis"
              >
                {question}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
