import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { generateReport } from "@/lib/ai.functions";
import { useOrg } from "@/hooks/use-org";
import { PageHeader, fmtDate, ENV_LABEL } from "@/components/app/status";
import { Md } from "@/components/app/md";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports")({ component: Rep });
type R = Awaited<ReturnType<typeof generateReport>>;
function Rep() {
  const { data: org } = useOrg();
  const run = useServerFn(generateReport);
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState<R | null>(null);
  const go = async () => { if (!org) return; setBusy(true);
    try { setR(await run({ data: { orgId: org.orgId, days } })); } catch (e) { toast.error(e instanceof Error ? e.message : "Échec"); } finally { setBusy(false); } };
  return (<div>
    <PageHeader title="Rapports" sub="Disponibilité, temps de réponse et incidents, avec synthèse IA.">
      <div className="flex gap-2 print:hidden">
        <select className="rounded-md border bg-background px-2 text-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={1}>24 h</option><option value={7}>7 jours</option><option value={30}>30 jours</option></select>
        <Button onClick={go} disabled={busy}>{busy ? "Génération…" : "Générer"}</Button>
        {r && <Button variant="outline" onClick={() => window.print()}>Exporter PDF</Button>}
      </div>
    </PageHeader>
    {r && <>
      <p className="mb-3 text-xs text-muted-foreground">Généré le {fmtDate(r.generatedAt)} · {org?.orgName}</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-4">{[["Applications", r.totals.applications], ["Vérifications", r.totals.checks], ["Incidents", r.totals.incidents], ["Ouverts", r.totals.open_incidents]].map(([k, v]) =>
        <div key={String(k)} className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">{k}</div><div className="mt-1 text-xl font-semibold">{v}</div></div>)}</div>
      <div className="mb-4 overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="p-3">Application</th><th>Env.</th><th>Disponibilité</th><th>Temps moyen</th><th>Vérifs</th></tr></thead>
        <tbody>{r.per.map((p) => <tr key={p.name} className="border-b last:border-0"><td className="p-3">{p.name}</td><td>{ENV_LABEL[p.environment]}</td><td>{p.uptime == null ? "—" : `${p.uptime} %`}</td><td>{p.avg_ms == null ? "—" : `${p.avg_ms} ms`}</td><td>{p.checks}</td></tr>)}</tbody></table></div>
      <div className="rounded-lg border bg-card p-5"><Md text={r.summary} /></div>
    </>}
  </div>);
}
