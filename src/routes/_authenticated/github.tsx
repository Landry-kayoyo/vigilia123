import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { analyzeRepo } from "@/lib/ai.functions";
import { PageHeader } from "@/components/app/status";
import { Md } from "@/components/app/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/github")({ component: Gh });
type Res = Awaited<ReturnType<typeof analyzeRepo>>;
function Gh() {
  const run = useServerFn(analyzeRepo);
  const [repo, setRepo] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Res | null>(null);
  const go = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setRes(null);
    try { setRes(await run({ data: { repo: repo.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$|\/$/g, "") } })); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Échec"); } finally { setBusy(false); }
  };
  const m = res?.meta;
  return (<div>
    <PageHeader title="Dépôts GitHub" sub="Audit en lecture seule d'un dépôt public : structure, tests, CI, secrets, activité." />
    <form onSubmit={go} className="mb-6 flex gap-2"><Input placeholder="propriétaire/dépôt ou URL GitHub" value={repo} onChange={(e) => setRepo(e.target.value)} required />
      <Button disabled={busy}>{busy ? "Analyse…" : "Analyser"}</Button></form>
    {m && <div className="mb-4 grid gap-3 sm:grid-cols-4">
      {[["Fichiers", m.file_count], ["Tests", m.has_tests ? "Oui" : "Non"], ["CI", m.has_ci ? "Oui" : "Non"], ["Fichiers .env exposés", m.has_env_committed.length]].map(([k, v]) =>
        <div key={String(k)} className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">{k}</div><div className="mt-1 text-xl font-semibold">{v}</div></div>)}
    </div>}
    {res && <div className="rounded-lg border bg-card p-5"><Md text={res.report} /></div>}
  </div>);
}
