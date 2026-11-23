import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg, canEdit } from "@/hooks/use-org";
import { runCheckNow } from "@/lib/monitors.functions";
import { PageHeader, StatusDot, ENV_LABEL, fmtDate, SeverityBadge, IncidentStatus } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/applications/$id")({ component: Detail });

function Detail() {
  const { id } = Route.useParams(); const { data: org } = useOrg(); const qc = useQueryClient(); const navigate = useNavigate();
  const run = useServerFn(runCheckNow); const [busy, setBusy] = useState(false);
  const { data } = useQuery({ queryKey: ["monitor", id], queryFn: async () => {
    const [m, c, i] = await Promise.all([
      supabase.from("monitors").select("*").eq("id", id).single(),
      supabase.from("checks").select("*").eq("monitor_id", id).order("checked_at", { ascending: false }).limit(200),
      supabase.from("incidents").select("id,title,severity,status,started_at").eq("monitor_id", id).order("started_at", { ascending: false }).limit(20),
    ]);
    return { m: m.data, checks: c.data ?? [], incidents: i.data ?? [] };
  } });
  const m = data?.m; if (!m) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  const edit = canEdit(org?.role); const cs = data.checks;
  const uptime = cs.length ? ((cs.filter((c) => c.ok).length / cs.length) * 100).toFixed(2) + " %" : "—";
  const refresh = () => { qc.invalidateQueries({ queryKey: ["monitor", id] }); qc.invalidateQueries({ queryKey: ["monitors"] }); };
  async function check() { setBusy(true); try { const r = await run({ data: { monitorId: id } }); r.ok ? toast.success(`OK — ${r.status_code} en ${r.response_ms} ms`) : toast.error(r.error ?? "Échec"); refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); } finally { setBusy(false); } }
  async function toggle(v: boolean) { const { error } = await supabase.from("monitors").update({ enabled: v }).eq("id", id); error ? toast.error(error.message) : refresh(); }
  async function remove() { if (!confirm("Supprimer cette application et son historique ?")) return; const { error } = await supabase.from("monitors").delete().eq("id", id); if (error) { toast.error(error.message); return; } navigate({ to: "/applications" }); }
  const chart = [...cs].reverse().map((c) => ({ t: new Date(c.checked_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), ms: c.response_ms }));
  return (
    <div>
      <Link to="/applications" className="text-sm text-muted-foreground">← Applications</Link>
      <PageHeader title={m.name} sub={`${ENV_LABEL[m.environment]} · ${m.check_type === "api" ? "Endpoint API" : "Site web"} · toutes les ${m.interval_minutes} min`}>
        {edit && <div className="flex items-center gap-3"><label className="flex items-center gap-2 text-sm"><Switch checked={m.enabled} onCheckedChange={toggle} />Surveillance</label>
          <Button onClick={check} disabled={busy}>{busy ? "Contrôle…" : "Contrôler maintenant"}</Button><Button variant="ghost" onClick={remove}>Supprimer</Button></div>}
      </PageHeader>
      <div className="mb-4 flex items-center gap-2 font-mono text-sm"><StatusDot status={m.last_status} /><a href={m.url} target="_blank" rel="noreferrer" className="truncate text-muted-foreground hover:text-foreground">{m.url}</a></div>
      {m.description && <p className="mb-4 text-sm text-muted-foreground">{m.description}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["État", m.last_status === "up" ? "Disponible" : m.last_status === "down" ? "Indisponible" : "Inconnu"], ["Disponibilité (200 derniers)", uptime], ["Dernier temps", m.last_response_ms != null ? m.last_response_ms + " ms" : "—"], ["Dernier contrôle", fmtDate(m.last_checked_at)]].map(([a, b]) =>
          <div key={a} className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">{a}</div><div className="mt-1 font-mono">{b}</div></div>)}
      </div>
      <div className="mt-4 rounded-lg border bg-card p-4"><div className="mb-2 text-sm font-medium">Temps de réponse</div>
        {chart.length ? <ResponsiveContainer width="100%" height={200}><LineChart data={chart}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} unit=" ms" /><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} /><Line dataKey="ms" stroke="var(--chart-1)" dot={false} /></LineChart></ResponsiveContainer>
          : <p className="py-10 text-center text-sm text-muted-foreground">Aucun contrôle pour le moment.</p>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Expiration du certificat SSL : non mesurée pour l'instant (nécessite un service de vérification TLS dédié, prévu ultérieurement).</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card"><div className="border-b p-3 text-sm font-medium">Historique des contrôles</div>
          <div className="max-h-96 divide-y overflow-y-auto">{cs.map((c) => <div key={c.id} className="flex items-center gap-3 px-3 py-2 font-mono text-xs">
            <StatusDot status={c.ok ? "up" : "down"} /><span className="w-28 text-muted-foreground">{fmtDate(c.checked_at)}</span><span className="w-10">{c.status_code ?? "—"}</span><span className="w-16">{c.response_ms != null ? c.response_ms + " ms" : ""}</span><span className="truncate text-destructive">{c.error}</span></div>)}</div></div>
        <div className="rounded-lg border bg-card"><div className="border-b p-3 text-sm font-medium">Incidents</div>
          <div className="divide-y">{data.incidents.map((x) => <Link key={x.id} to="/incident/$id" params={{ id: x.id }} className="flex items-center gap-2 p-3 text-sm hover:bg-accent/40"><SeverityBadge s={x.severity} /><span className="flex-1 truncate">{x.title}</span><IncidentStatus s={x.status} /></Link>)}
            {!data.incidents.length && <p className="p-3 text-sm text-muted-foreground">Aucun incident.</p>}</div></div>
      </div>
    </div>);
}
