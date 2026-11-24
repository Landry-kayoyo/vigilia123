import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analyzeIncident } from "@/lib/ai.functions";
import { useOrg, canEdit } from "@/hooks/use-org";
import { PageHeader, SeverityBadge, fmtDate } from "@/components/app/status";
import { Md } from "@/components/app/md";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/analysis")({ component: An });
function An() {
  const { data: org } = useOrg();
  const qc = useQueryClient();
  const run = useServerFn(analyzeIncident);
  const [busy, setBusy] = useState<string | null>(null);
  const { data = [] } = useQuery({ queryKey: ["analysis", org?.orgId], enabled: !!org, queryFn: async () =>
    (await supabase.from("incidents").select("*").eq("org_id", org!.orgId).order("started_at", { ascending: false }).limit(30)).data ?? [] });
  const go = async (id: string) => {
    setBusy(id);
    try { await run({ data: { incidentId: id } }); await qc.invalidateQueries({ queryKey: ["analysis"] }); toast.success("Analyse générée"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Échec"); } finally { setBusy(null); }
  };
  return (<div>
    <PageHeader title="Analyse intelligente" sub="Diagnostic IA des incidents à partir des vérifications réelles et de l'historique." />
    {!data.length && <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Aucun incident à analyser pour l'instant.</p>}
    <div className="space-y-3">{data.map((i) => <div key={i.id} className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3"><SeverityBadge s={i.severity} /><Link to="/incident/$id" params={{ id: i.id }} className="font-medium hover:underline">{i.title}</Link><span className="text-xs text-muted-foreground">{fmtDate(i.started_at)}</span></div>
        {canEdit(org?.role) && <Button size="sm" variant={i.ai_analysis ? "outline" : "default"} disabled={busy === i.id} onClick={() => go(i.id)}>{busy === i.id ? "Analyse…" : i.ai_analysis ? "Relancer" : "Analyser"}</Button>}
      </div>
      {i.ai_analysis && <div className="mt-3 border-t pt-3"><Md text={i.ai_analysis} /></div>}
    </div>)}</div>
  </div>);
}
