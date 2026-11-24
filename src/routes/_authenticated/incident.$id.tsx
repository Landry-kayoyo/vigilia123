import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Md } from "@/components/app/md";
import { PageHeader, SeverityBadge, IncidentStatus, fmtDate, fmtDuration } from "@/components/app/status";
export const Route = createFileRoute("/_authenticated/incident/$id")({ component: Inc });
function Inc() {
  const { id } = Route.useParams();
  const { data } = useQuery({ queryKey: ["incident", id], queryFn: async () => {
    const [i, e] = await Promise.all([supabase.from("incidents").select("*").eq("id", id).single(), supabase.from("incident_events").select("*").eq("incident_id", id).order("created_at")]);
    return { i: i.data, e: e.data ?? [] }; } });
  const i = data?.i; if (!i) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  return (<div><Link to="/incidents" className="text-sm text-muted-foreground">← Incidents</Link>
    <PageHeader title={i.title} sub={`${i.type} · début ${fmtDate(i.started_at)} · durée ${fmtDuration(i.started_at, i.resolved_at)}`} />
    <div className="mb-4 flex gap-3"><SeverityBadge s={i.severity} /><IncidentStatus s={i.status} /></div>
    {i.description && <p className="mb-4 rounded-lg border bg-card p-4 font-mono text-sm">{i.description}</p>}
    {i.ai_analysis ? <div className="mb-4 rounded-lg border bg-card p-4"><Md text={i.ai_analysis} /></div> : <p className="mb-4 text-sm text-muted-foreground">Pas encore d'analyse IA — lancez-la depuis « Analyse intelligente ».</p>}
    <div className="rounded-lg border bg-card"><div className="border-b p-3 text-sm font-medium">Historique</div>
      {data.e.map((e) => <div key={e.id} className="border-b p-3 text-sm last:border-0"><span className="mr-3 font-mono text-xs text-muted-foreground">{fmtDate(e.created_at)}</span>{e.message}</div>)}</div></div>);
}
