import { createFileRoute, redirect, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, AppWindow, Activity, AlertTriangle, Github, Sparkles, FileText, Plug, Users, Settings, CreditCard, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useOrg } from "@/hooks/use-org";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Shell,
});

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/applications", label: "Applications", icon: AppWindow },
  { to: "/monitoring", label: "Surveillance", icon: Activity },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/github", label: "Dépôts GitHub", icon: Github },
  { to: "/analysis", label: "Analyse intelligente", icon: Sparkles },
  { to: "/reports", label: "Rapports", icon: FileText },
  { to: "/integrations", label: "Intégrations", icon: Plug },
  { to: "/organization", label: "Utilisateurs & organisation", icon: Users },
  { to: "/settings", label: "Paramètres", icon: Settings },
  { to: "/billing", label: "Abonnements", icon: CreditCard },
] as const;

function Shell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { data: org } = useOrg();
  const navigate = useNavigate();
  const nav = (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} onClick={() => setOpen(false)}
          className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent", path.startsWith(to) && "bg-sidebar-accent text-sidebar-primary")}>
          <Icon className="size-4" />{label}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar transition-transform md:static md:w-auto md:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <span className="size-2.5 rounded-full bg-primary pulse-dot" />
          <span className="font-semibold tracking-tight">Vigilia</span>
        </div>
        <div className="px-5 pt-4 text-xs text-muted-foreground">{org?.orgName}</div>
        {nav}
        <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
          className="mx-3 mt-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent">
          <LogOut className="size-4" />Déconnexion
        </button>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-background/70 md:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0">
        <header className="flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <button aria-label="Menu" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <span className="font-semibold">Vigilia</span>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
