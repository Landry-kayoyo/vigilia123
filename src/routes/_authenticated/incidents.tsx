import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/use-org";
import { PageHeader, SeverityBadge, IncidentStatus, fmtDate, fmtDuration } from "@/components/app/status";
export const Route = createFileRoute("/_authenticated/incidents")({ component: Incidents });
function Incidents() {
  const { data: org } = useOrg();
  const { data } = useQuery({ queryKey: ["incidents", org?.orgId], enabled: !!org,
    queryFn: async () => (await supabase.from("incidents").select("*").eq("org_id", org!.orgId).order("started_at", { ascending: false }).limit(200)).data ?? [] });
  const list = data ?? [];
  return (<div><PageHeader title="Incidents" sub={`${list.filter((i) => i.status !== "resolved").length} actifs · ${list.filter((i) => i.status === "resolved").length} résolus`} />
    <div className="divide-y rounded-lg border bg-card">{list.map((x) => (
      <Link key={x.id} to="/incident/$id" params={{ id: x.id }} className="flex flex-wrap items-center gap-3 p-4 hover:bg-accent/40">
        <SeverityBadge s={x.severity} /><span className="min-w-0 flex-1 truncate">{x.title}</span><IncidentStatus s={x.status} />
        <span className="text-xs text-muted-foreground">{fmtDate(x.started_at)} · {fmtDuration(x.started_at, x.resolved_at)}</span></Link>))}
      {!list.length && <p className="p-6 text-sm text-muted-foreground">Aucun incident.</p>}</div></div>);
}
