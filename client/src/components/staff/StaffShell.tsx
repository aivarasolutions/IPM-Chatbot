import { useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { Bot, BookMarked, BookOpenText, Users, ChartNoAxesColumn, LogOut, Menu, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StaffProfile } from "./StaffGate";

const nav = [
  { href: "/staff/assistant", label: "IPM Assistant", icon: Bot },
  { href: "/staff/leads", label: "Captured leads", icon: Users },
  { href: "/staff/saved-responses", label: "Saved responses", icon: BookMarked },
  { href: "/staff/ai-knowledge", label: "AI knowledge", icon: BookOpenText, admin: true },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesColumn },
];

export default function StaffShell({ profile, children }: { profile: StaffProfile; children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const links = nav.filter(item => !item.admin || profile.isAdmin);
  return <div className="min-h-[100dvh] bg-background text-foreground">
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X/> : <Menu/>}</Button>
          <Link href="/staff/assistant" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Building2 className="h-5 w-5"/></span>
            <span><span className="block font-serif text-base font-semibold leading-tight">IPM <span className="text-primary">Assistant</span></span><span className="block text-[10px] uppercase tracking-[.18em] text-muted-foreground">Staff workspace</span></span>
          </Link>
        </div>
        <div className="flex items-center gap-2"><span className="hidden text-sm text-muted-foreground sm:block">{user?.primaryEmailAddress?.emailAddress || "IPM staff"}</span><Button variant="ghost" size="sm" onClick={() => signOut({ redirectUrl: "/" })}><LogOut className="mr-2 h-4 w-4"/>Log out</Button></div>
      </div>
    </header>
    <div className="mx-auto flex max-w-[1500px]">
      <aside className={cn("fixed inset-x-0 top-16 z-20 border-b bg-background p-3 md:sticky md:top-16 md:block md:h-[calc(100dvh-4rem)] md:w-60 md:shrink-0 md:border-b-0 md:border-r md:bg-muted/25 md:p-4", open ? "block" : "hidden")}>
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">Workspace</p>
        <nav className="space-y-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", location === href ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="h-4 w-4"/>{label}</Link>)}</nav>
        <div className="mt-8 rounded-xl border bg-card p-4"><p className="text-xs font-semibold">Private workspace</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Drafts and prospect details are visible only to authorized IPM staff.</p></div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  </div>;
}
