import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { SuggestedQuestions } from "@/components/SuggestedQuestions";
import { TypingIndicator } from "@/components/TypingIndicator";
import { PropertyCard } from "@/components/PropertyCard";
import { LeadForm } from "@/components/LeadForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Menu, Home as HomeIcon } from "lucide-react";
import type { ChatMessage as ChatMessageType, ChatResponse, Property } from "@shared/schema";

export default function ChatPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "How can IPM help me get more reservations?",
    "What is included in the 10%–20% management tiers?",
    "How does IPM market my property?",
    "Can IPM manage my Airbnb or Booking.com listing?",
  ]);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userQuestionCount = useRef(0);
  const ctaShown = useRef(false);

  // Detect if running in embedded/widget mode
  const isEmbedded = new URLSearchParams(window.location.search).get('embedded') === 'true';

  useEffect(() => {
    const id = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(id);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  useEffect(() => {
    if (properties) {
      setFeaturedProperties(properties.slice(0, 3));
    }
  }, [properties]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest<ChatResponse>("POST", "/api/chat", {
        message,
        sessionId,
      });
      return response;
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessageType = {
        id: `msg-${Date.now()}`,
        sessionId,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        metadata: null,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
        setSuggestedQuestions(data.suggestedQuestions);
      }

      if (data.leadQualificationPrompt) {
        setTimeout(() => setShowLeadForm(true), 1000);
      }

      // After the 3rd user question, gently guide toward contacting IPM
      if (userQuestionCount.current >= 3 && !ctaShown.current) {
        ctaShown.current = true;
        setTimeout(() => {
          const ctaMessage: ChatMessageType = {
            id: `msg-cta-${Date.now()}`,
            sessionId,
            role: "assistant",
            content: `It looks like you have a lot of great questions about property management — that's a great sign!\n\nFor the most personalized guidance, I'd recommend reaching out to the IPM team directly. They can review your property and recommend the right management plan for you.\n\n**Ready to take the next step?**\n\n📧 **Email:** info@ipm.services\n🌐 **Website:** [Contact IPM](https://www.ipm.services/contact)\n\nFeel free to keep asking questions here too — I'm happy to help!`,
            timestamp: new Date(),
            metadata: null,
          };
          setMessages((prev) => [...prev, ctaMessage]);
        }, 800);
      }
    },
  });

  const leadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      return apiRequest("POST", "/api/leads", {
        ...leadData,
        sessionId,
      });
    },
    onSuccess: () => {
      setShowLeadForm(false);
      const confirmMessage: ChatMessageType = {
        id: `msg-${Date.now()}`,
        sessionId,
        role: "assistant",
        content: "Thank you for your information! One of our international investment specialists will contact you within 24 hours to discuss your property investment goals. In the meantime, feel free to continue asking questions.",
        timestamp: new Date(),
        metadata: null,
      };
      setMessages((prev) => [...prev, confirmMessage]);
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
  });

  const handleSendMessage = (message: string) => {
    userQuestionCount.current += 1;
    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      sessionId,
      role: "user",
      content: message,
      timestamp: new Date(),
      metadata: null,
    };
    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(message);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Hidden in embedded mode */}
      {!isEmbedded && (
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="font-serif">{t('property.featuredProperties')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {featuredProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-serif font-semibold text-lg leading-none" data-testid="text-app-title">
                  {t('app.title')}
                </h1>
                <p className="text-xs text-muted-foreground">{t('app.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/analytics">
              <Button variant="ghost" size="sm">
                Analytics
              </Button>
            </Link>
            <Link href="/api-docs">
              <Button variant="ghost" size="sm">
                API Docs
              </Button>
            </Link>
            <LanguageToggle />
            <CurrencyToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop - Hidden in embedded mode */}
        {!isEmbedded && (
        <aside className="hidden md:block w-80 border-r border-border bg-muted/30 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif font-semibold text-lg">{t('property.featuredProperties')}</h2>
              <Link href="/compare">
                <Button variant="outline" size="sm">
                  Compare
                </Button>
              </Link>
            </div>
            <div>
              {featuredProperties.length > 0 ? (
                <div className="space-y-3">
                  {featuredProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <HomeIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Properties loading...</p>
                </div>
              )}
            </div>
          </div>
        </aside>
        )}

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 w-full">
            <div className={isEmbedded ? "w-full px-3 py-4" : "max-w-5xl mx-auto px-4 py-6"} style={isEmbedded ? { maxWidth: '100vw', overflowX: 'hidden' } : {}}>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className={isEmbedded ? "h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4" : "h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"}>
                    <Building2 className={isEmbedded ? "h-6 w-6 text-primary" : "h-8 w-8 text-primary"} />
                  </div>
                  <h2 className={isEmbedded ? "font-serif font-semibold text-lg mb-2" : "font-serif font-semibold text-2xl mb-2"}>{t('welcome.title')}</h2>
                  <p className={isEmbedded ? "text-muted-foreground text-sm mb-4 px-2" : "text-muted-foreground max-w-md mx-auto mb-8"}>
                    {t('welcome.subtitle')}
                  </p>
                  <div className={isEmbedded ? "flex flex-col gap-2" : "grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto"}>
                    {suggestedQuestions.map((q, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className={isEmbedded ? "justify-start text-left h-auto py-2 px-3 text-xs" : "justify-start text-left h-auto py-3 px-4"}
                        onClick={() => handleSendMessage(q)}
                        data-testid={`button-welcome-${idx}`}
                      >
                        <span className="break-words whitespace-normal">{q}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      role={msg.role as "user" | "assistant"}
                      content={msg.content}
                      timestamp={msg.timestamp || undefined}
                    />
                  ))}
                  {chatMutation.isPending && <TypingIndicator />}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Questions */}
          {messages.length > 0 && suggestedQuestions.length > 0 && (
            <SuggestedQuestions
              questions={suggestedQuestions}
              onSelectQuestion={handleSendMessage}
              disabled={chatMutation.isPending}
            />
          )}

          {/* Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={chatMutation.isPending}
            placeholder={t('chat.inputPlaceholder')}
          />
        </main>
      </div>

      {/* Lead Form Dialog */}
      <LeadForm
        open={showLeadForm}
        onOpenChange={setShowLeadForm}
        onSubmit={(data) => leadMutation.mutate(data)}
        sessionId={sessionId}
      />
    </div>
  );
}
