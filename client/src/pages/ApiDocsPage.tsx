import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Copy, Check, Code2 } from "lucide-react";
import { Link } from "wouter";

export default function ApiDocsPage() {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const widgetSnippet = `<!-- IPM Chatbot Widget - Add before closing </body> tag -->
<script src="https://${window.location.hostname}/widget.js"></script>
<script>
  IPMChatbot.init({
    apiUrl: 'https://${window.location.hostname}/api',
    theme: 'light',    // 'light' or 'dark'
    language: 'en',    // 'en' or 'es'
    position: 'bottom-right' // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  });
</script>`;

  const chatApiExample = `// Send a chat message
const response = await fetch('https://${window.location.hostname}/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Tell me about beachfront properties in Tulum",
    sessionId: "unique-session-id", // Optional
    context: {} // Optional additional context
  })
});

const data = await response.json();
console.log(data);
// Returns: { message, sessionId, suggestedQuestions, properties, leadQualificationPrompt }`;

  const leadApiExample = `// Create a lead
const response = await fetch('https://${window.location.hostname}/api/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId: "unique-session-id",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1-555-0100",
    citizenship: "USA",
    budget: "$400K-$600K",
    investmentExperience: "first-time",
    locationPreference: "Mexico",
    timeline: "3-6 months"
  })
});

const lead = await response.json();`;

  const propertiesApiExample = `// Get all properties
const response = await fetch('https://${window.location.hostname}/api/properties');
const properties = await response.json();

// Search properties
const searchResponse = await fetch('https://${window.location.hostname}/api/properties/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: "Tulum",
    minPrice: 300000,
    maxPrice: 500000,
    country: "Mexico"
  })
});
const results = await searchResponse.json();`;

  const currencyApiExample = `// Get current USD/MXN exchange rate
const response = await fetch('https://${window.location.hostname}/api/exchange-rate');
const data = await response.json();
console.log(data.rate); // e.g., 18.5`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            <h1 className="font-serif font-semibold text-xl">API Documentation</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle>IPM Chatbot API</CardTitle>
            <CardDescription>
              RESTful API for integrating the IPM AI chatbot into your website or application.
              Supports real-time property inquiries, lead capture, and multilingual conversations.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="widget" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="widget">Widget</TabsTrigger>
            <TabsTrigger value="chat">Chat API</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="currency">Currency</TabsTrigger>
          </TabsList>

          {/* Widget Integration */}
          <TabsContent value="widget" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Floating Chat Widget</CardTitle>
                <CardDescription>
                  Add a professional floating chat bubble to your website - appears in bottom-right corner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">HTML Embed Code</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(widgetSnippet, 'widget')}
                    >
                      {copiedSnippet === 'widget' ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copiedSnippet === 'widget' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-sm overflow-x-auto">
                      <code>{widgetSnippet}</code>
                    </pre>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Configuration Options</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5 shrink-0">apiUrl</Badge>
                      <p className="text-sm text-muted-foreground">
                        Base URL for the API endpoint (required)
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5 shrink-0">theme</Badge>
                      <p className="text-sm text-muted-foreground">
                        'light' or 'dark' (optional, defaults to 'light')
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5 shrink-0">language</Badge>
                      <p className="text-sm text-muted-foreground">
                        'en' or 'es' (optional, defaults to browser language)
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5 shrink-0">position</Badge>
                      <p className="text-sm text-muted-foreground">
                        'bottom-right', 'bottom-left', 'top-right', or 'top-left' (optional, defaults to 'bottom-right')
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>💡 Pro Tip:</strong> The widget automatically creates a floating chat bubble. No need for HTML containers - just add the script tags before your closing &lt;/body&gt; tag!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat API */}
          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="default">POST</Badge>
                  /api/chat
                </CardTitle>
                <CardDescription>Send a message and receive AI-powered responses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Request Example</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(chatApiExample, 'chat')}
                    >
                      {copiedSnippet === 'chat' ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copiedSnippet === 'chat' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-sm overflow-x-auto">
                      <code>{chatApiExample}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Request Body</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Badge variant="secondary">message</Badge>
                      <span className="text-sm">string (required) - The user's message</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">sessionId</Badge>
                      <span className="text-sm">string (optional) - Session identifier for conversation context</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">context</Badge>
                      <span className="text-sm">object (optional) - Additional context data</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Badge variant="secondary">message</Badge>
                      <span className="text-sm">AI-generated response</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">sessionId</Badge>
                      <span className="text-sm">Session identifier (generated if not provided)</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">suggestedQuestions</Badge>
                      <span className="text-sm">Array of contextual follow-up questions</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">properties</Badge>
                      <span className="text-sm">Relevant property matches (if applicable)</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">leadQualificationPrompt</Badge>
                      <span className="text-sm">Lead capture prompt (when applicable)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="default">GET</Badge>
                  /api/chat/:sessionId
                </CardTitle>
                <CardDescription>Get chat history for a session</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Returns an array of all messages for the specified session ID.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties API */}
          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="default">GET</Badge>
                  /api/properties
                </CardTitle>
                <CardDescription>Get all available properties</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="default">POST</Badge>
                  /api/properties/search
                </CardTitle>
                <CardDescription>Search properties with filters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Request Example</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(propertiesApiExample, 'properties')}
                    >
                      {copiedSnippet === 'properties' ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copiedSnippet === 'properties' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-sm overflow-x-auto">
                      <code>{propertiesApiExample}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Search Parameters</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Badge variant="secondary">location</Badge>
                      <span className="text-sm">string (optional)</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">country</Badge>
                      <span className="text-sm">'Mexico' | 'USA' (optional)</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">propertyType</Badge>
                      <span className="text-sm">'condo' | 'villa' | 'townhouse' (optional)</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">minPrice</Badge>
                      <span className="text-sm">number (optional)</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">maxPrice</Badge>
                      <span className="text-sm">number (optional)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads API */}
          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="default">POST</Badge>
                  /api/leads
                </CardTitle>
                <CardDescription>Create a new lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Request Example</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(leadApiExample, 'lead')}
                    >
                      {copiedSnippet === 'lead' ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copiedSnippet === 'lead' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-sm overflow-x-auto">
                      <code>{leadApiExample}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Required Fields</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Badge variant="secondary">sessionId</Badge>
                      <span className="text-sm">Session identifier</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">name</Badge>
                      <span className="text-sm">Contact name</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">email</Badge>
                      <span className="text-sm">Email address</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">phone</Badge>
                      <span className="text-sm">Phone number</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">citizenship</Badge>
                      <span className="text-sm">Country of citizenship</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">budget</Badge>
                      <span className="text-sm">Budget range</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">investmentExperience</Badge>
                      <span className="text-sm">'first-time' | 'experienced' | 'professional'</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">locationPreference</Badge>
                      <span className="text-sm">Preferred location</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">timeline</Badge>
                      <span className="text-sm">Investment timeline</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Currency API */}
          <TabsContent value="currency" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="default">GET</Badge>
                  /api/exchange-rate
                </CardTitle>
                <CardDescription>Get current USD/MXN exchange rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Request Example</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(currencyApiExample, 'currency')}
                    >
                      {copiedSnippet === 'currency' ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copiedSnippet === 'currency' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-sm overflow-x-auto">
                      <code>{currencyApiExample}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Badge variant="secondary">rate</Badge>
                      <span className="text-sm">Current exchange rate (USD to MXN)</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">timestamp</Badge>
                      <span className="text-sm">Last update time</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CORS Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>CORS Configuration</CardTitle>
            <CardDescription>Allowed Origins</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              The API accepts requests from the following origins:
            </p>
            <div className="space-y-2">
              <Badge variant="outline">https://ipm.services</Badge>
              <Badge variant="outline">https://djzrukff.manus.space</Badge>
              <Badge variant="outline">http://localhost:3000</Badge>
              <Badge variant="outline">http://localhost:5000</Badge>
              <Badge variant="outline">*.replit.dev</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limits & Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Maintain consistent sessionId across user conversations</li>
                <li>Implement exponential backoff for retries</li>
                <li>Cache exchange rates (update every 1 hour)</li>
                <li>Store chat history client-side to reduce API calls</li>
                <li>Use suggested questions to guide user interactions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
