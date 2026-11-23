import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/use-org";
import { PageHeader, SeverityBadge, IncidentStatus, fmtDate } from "@/components/app/status";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "ok" | "bad" }) {
  return <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">{label}</div>
    <div className={`mt-1 font-mono text-2xl ${tone === "ok" ? "text-success" : tone === "bad" ? "text-destructive" : ""}`}>{value}</div></div>;
}

function Dashboard() {
  const { data: org } = useOrg();
  const { data } = useQuery({
    queryKey: ["dashboard", org?.orgId], enabled: !!org, refetchInterval: 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      const [m, i, c] = await Promise.all([
        supabase.from("monitors").select("id,last_status,enabled").eq("org_id", org!.orgId),
        supabase.from("incidents").select("id,title,severity,status,started_at").eq("org_id", org!.orgId).order("started_at", { ascending: false }).limit(200),
        supabase.from("checks").select("ok,response_ms,checked_at").eq("org_id", org!.orgId).gte("checked_at", since).order("checked_at").limit(1000),
      ]);
      return { monitors: m.data ?? [], incidents: i.data ?? [], checks: c.data ?? [] };
    },
  });
  const ms = data?.monitors ?? []; const cs = data?.checks ?? []; const inc = data?.incidents ?? [];
  const up = ms.filter((m) => m.last_status === "up").length; const down = ms.filter((m) => m.last_status === "down").length;
  const uptime = cs.length ? ((cs.filter((c) => c.ok).length / cs.length) * 100).toFixed(2) + " %" : "—";
  const rts = cs.filter((c) => c.response_ms != null).map((c) => c.response_ms!);
  const avg = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) + " ms" : "—";
  const buckets = new Map<string, number[]>();
  cs.forEach((c) => { if (c.response_ms == null) return; const h = new Date(c.checked_at); h.setMinutes(0, 0, 0); const k = h.toISOString(); buckets.set(k, [...(buckets.get(k) ?? []), c.response_ms]); });
  const chart = [...buckets.entries()].map(([k, v]) => ({ h: new Date(k).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), ms: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }));
  return (
    <div>
      <PageHeader title="Tableau de bord" sub="Données réelles des dernières 24 heures" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Applications" value={ms.length} />
        <Stat label="Disponibles" value={up} tone="ok" />
        <Stat label="Indisponibles" value={down} tone={down ? "bad" : undefined} />
        <Stat label="Disponibilité 24 h" value={uptime} />
        <Stat label="Temps de réponse moyen" value={avg} />
        <Stat label="Incidents actifs" value={inc.filter((x) => x.status !== "resolved").length} tone={inc.some((x) => x.status !== "resolved") ? "bad" : undefined} />
        <Stat label="Incidents résolus" value={inc.filter((x) => x.status === "resolved").length} />
        <Stat label="Contrôles 24 h" value={cs.length} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 lg:col-span-2">
          <div className="mb-3 text-sm font-medium">Temps de réponse moyen par heure</div>
          {chart.length ? <ResponsiveContainer width="100%" height={220}><AreaChart data={chart}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="h" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} unit=" ms" />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
            <Area dataKey="ms" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} /></AreaChart></ResponsiveContainer>
            : <p className="py-16 text-center text-sm text-muted-foreground">Aucun contrôle encore. <Link to="/applications" className="text-primary">Ajoutez une application</Link>.</p>}
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 text-sm font-medium">Alertes récentes</div>
          <ul className="space-y-3">{inc.slice(0, 6).map((x) => (
            <li key={x.id}><Link to="/incidents/$id" params={{ id: x.id }} className="block hover:opacity-80">
              <div className="flex items-center gap-2"><SeverityBadge s={x.severity} /><IncidentStatus s={x.status} /></div>
              <div className="mt-1 truncate text-sm">{x.title}</div><div className="text-xs text-muted-foreground">{fmtDate(x.started_at)}</div></Link></li>))}
            {!inc.length && <li className="text-sm text-muted-foreground">Aucune alerte.</li>}</ul>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 text-sm"><div className="font-medium">Intégrations GitHub</div><p className="mt-1 text-muted-foreground">Aucun dépôt connecté (phase 4).</p></div>
        <div className="rounded-lg border bg-card p-4 text-sm"><div className="font-medium">Dernières analyses IA</div><p className="mt-1 text-muted-foreground">Gemini non configuré (phase 5).</p></div>
      </div>
    </div>
  );
}
