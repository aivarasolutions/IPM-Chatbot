import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ChatPage from "@/pages/ChatPage";
import ComparisonPage from "@/pages/ComparisonPage";
import ApiDocsPage from "@/pages/ApiDocsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import StaffAssistantPage from "@/pages/StaffAssistantPage";
import StaffLibraryPage from "@/pages/StaffLibraryPage";
import StaffLeadsPage from "@/pages/StaffLeadsPage";
import StaffGate from "@/components/staff/StaffGate";
import StaffShell from "@/components/staff/StaffShell";
import { ClerkProvider, SignIn, SignUp, useClerk, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { useEffect, useRef } from "react";
import NotFound from "@/pages/not-found";
import "./i18n"; // Initialize i18n

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");

const clerkAppearance = {
  theme: shadcn,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(var(--primary))",
    colorForeground: "hsl(var(--foreground))",
    colorMutedForeground: "hsl(var(--muted-foreground))",
    colorDanger: "hsl(var(--destructive))",
    colorBackground: "hsl(var(--background))",
    colorInput: "hsl(var(--background))",
    colorInputForeground: "hsl(var(--foreground))",
    colorNeutral: "hsl(var(--border))",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.65rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-background text-foreground rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-semibold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary font-semibold",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-emerald-700 dark:text-emerald-300",
    alertText: "text-foreground",
    logoBox: "rounded-lg",
    logoImage: "object-contain",
    socialButtonsBlockButton: "border-border bg-background text-foreground hover:bg-muted",
    formButtonPrimary: "bg-primary hover:opacity-90 text-primary-foreground",
    formFieldInput: "border-border bg-background text-foreground",
    footerAction: "text-muted-foreground",
    dividerLine: "bg-border",
    alert: "border-border",
    otpCodeFieldInput: "border-border bg-background",
    formFieldRow: "text-foreground",
    main: "text-foreground",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) client.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function Protected({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  return <StaffGate>{profile => admin && !profile.isAdmin
    ? <div className="mx-auto mt-12 max-w-lg rounded-2xl border bg-card p-7 text-center"><h1 className="font-serif text-2xl font-semibold">Administrator access required</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">AI knowledge is restricted to authorized IPM administrators. Ask an administrator to check IPM_ADMIN_EMAILS.</p></div>
    : <StaffShell profile={profile}>{children}</StaffShell>}</StaffGate>;
}

function SignInPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} forceRedirectUrl={`${basePath}/staff/assistant`} fallbackRedirectUrl={`${basePath}/staff/assistant`} /></div>;
}

function SignUpPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} forceRedirectUrl={`${basePath}/staff/assistant`} fallbackRedirectUrl={`${basePath}/staff/assistant`} /></div>;
}

function HomeRoute() {
  const { isSignedIn } = useAuth();
  // Staff land in their workspace; the public embedded widget must never redirect.
  const embedded = new URLSearchParams(window.location.search).get("embedded") === "true";
  return isSignedIn && !embedded ? <Redirect to="/staff/assistant" /> : <ChatPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/compare" component={ComparisonPage} />
      <Route path="/api-docs" component={ApiDocsPage} />
      <Route path="/analytics">{() => <Protected><AnalyticsPage /></Protected>}</Route>
      <Route path="/staff/assistant">{() => <Protected><StaffAssistantPage /></Protected>}</Route>
      <Route path="/staff/leads">{() => <Protected><StaffLeadsPage /></Protected>}</Route>
      <Route path="/staff/saved-responses">{() => <Protected><StaffLibraryPage /></Protected>}</Route>
      <Route path="/staff/ai-knowledge">{() => <Protected admin><StaffLibraryPage knowledge /></Protected>}</Route>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      signIn: { start: { title: "Welcome back", subtitle: "Sign in to the IPM staff portal" } },
      signUp: { start: { title: "Create your account", subtitle: "Request access to the IPM staff portal" } },
    }}
    routerPush={to => setLocation(stripBase(to))}
    routerReplace={to => setLocation(stripBase(to), { replace: true })}
  >
    <QueryClientProvider client={queryClient}>
      <ClerkQueryClientCacheInvalidator />
      <TooltipProvider><Toaster /><Router /></TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>;
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkRoutes />
    </WouterRouter>
  );
}

export default App;
