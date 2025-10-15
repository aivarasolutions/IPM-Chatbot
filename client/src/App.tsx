import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ChatPage from "@/pages/ChatPage";
import ComparisonPage from "@/pages/ComparisonPage";
import ApiDocsPage from "@/pages/ApiDocsPage";
import NotFound from "@/pages/not-found";
import "./i18n"; // Initialize i18n

function Router() {
  return (
    <Switch>
      <Route path="/" component={ChatPage} />
      <Route path="/compare" component={ComparisonPage} />
      <Route path="/api-docs" component={ApiDocsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
