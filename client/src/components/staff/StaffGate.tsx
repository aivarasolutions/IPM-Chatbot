import { useQuery } from "@tanstack/react-query";
import { useAuth, useClerk } from "@clerk/react";
import { Link } from "wouter";
import { AlertTriangle, LockKeyhole, LogIn, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staffRequest, statusCode } from "@/lib/staff-api";

export interface StaffProfile { userId: string; isAdmin: boolean }

export default function StaffGate({ children }: { children: (profile: StaffProfile) => React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const me = useQuery<StaffProfile>({
    queryKey: ["/api/staff/me"],
    queryFn: () => staffRequest("GET", "/api/staff/me"),
    enabled: isLoaded && !!isSignedIn,
    retry: false,
  });
  if (!isLoaded || (isSignedIn && me.isLoading)) return <div className="min-h-[100dvh] grid place-items-center bg-background"><div className="w-64 space-y-3"><div className="h-3 rounded bg-muted animate-pulse"/><div className="h-20 rounded-xl bg-muted animate-pulse"/><div className="h-3 w-2/3 rounded bg-muted animate-pulse"/></div></div>;
  if (!isSignedIn) return <GateMessage icon={<LockKeyhole />} title="Staff access" detail="Sign in with your IPM staff account to open the internal portal." action={<Link href="/sign-in" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><LogIn className="mr-2 h-4 w-4"/>Sign in to staff portal</Link>} />;
  if (me.isError) {
    const code = statusCode(me.error);
    const backendMessage = me.error instanceof Error ? me.error.message.replace(/^\d+:/, "").trim() : "";
    const detail = code === 403
      ? backendMessage || "This account is not on the IPM staff allowlist. Ask an administrator to check IPM_STAFF_EMAILS."
      : code === 401
        ? backendMessage || "Your staff session has expired. Sign in again to continue."
        : code === 503
          ? backendMessage || "Staff access is not configured yet. Ask an administrator to complete setup."
          : backendMessage || "The staff authorization service is unavailable. Please try again shortly.";
    return <GateMessage icon={<AlertTriangle />} title={code === 403 ? "Staff access not authorized" : code === 503 ? "Staff access is not configured" : "Staff access could not be confirmed"} detail={detail} action={<div className="flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={() => me.refetch()}>Try again</Button><Button variant="outline" onClick={() => signOut({redirectUrl:"/"})}><LogOut className="mr-2 h-4 w-4"/>Log out</Button><Link href="/" className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground hover:bg-muted"><Home className="mr-2 h-4 w-4"/>Public chat</Link></div>} />;
  }
  if (!me.data) return null;
  return <>{children(me.data)}</>;
}

function GateMessage({ icon, title, detail, action }: { icon: React.ReactNode; title: string; detail: string; action: React.ReactNode }) {
  return <main className="min-h-[100dvh] bg-background grid place-items-center p-5"><section className="w-full max-w-md rounded-2xl border bg-card p-7 text-center shadow-sm"><div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">IPM staff portal</p><h1 className="mt-2 font-serif text-2xl font-semibold">{title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p><div className="mt-6">{action}</div></section></main>;
}
