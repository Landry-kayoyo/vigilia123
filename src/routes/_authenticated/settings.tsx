import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/use-org";
import { PageHeader } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/settings")({ component: Set });
function Set() {
  const { data: org } = useOrg();
  const qc = useQueryClient();
  const admin = org?.role === "org_admin";
  const [name, setName] = useState("");
  const [rec, setRec] = useState("");
  const { data: sch } = useQuery({ queryKey: ["schedule", org?.orgId], enabled: !!org, queryFn: async () =>
    (await supabase.from("report_schedules").select("*").eq("org_id", org!.orgId).maybeSingle()).data });
  useEffect(() => { if (org) setName(org.orgName); }, [org]);
  useEffect(() => { if (sch) setRec(sch.recipients.join(", ")); }, [sch]);
  const saveOrg = async () => { const { error } = await supabase.from("organizations").update({ name: name.trim() }).eq("id", org!.orgId);
    if (error) toast.error(error.message); else { toast.success("Enregistré"); qc.invalidateQueries({ queryKey: ["org"] }); } };
  const saveSch = async (patch: { enabled?: boolean; frequency?: string }) => { if (!sch) return;
    const recipients = rec.split(",").map((s) => s.trim()).filter((s) => /^\S+@\S+\.\S+$/.test(s));
    const { error } = await supabase.from("report_schedules").update({ recipients, ...patch }).eq("id", sch.id);
    if (error) toast.error(error.message); else { toast.success("Enregistré"); qc.invalidateQueries({ queryKey: ["schedule"] }); } };
  return (<div className="max-w-xl space-y-6">
    <PageHeader title="Paramètres" sub={`Compte : ${org?.email ?? ""}`} />
    <section className="rounded-lg border bg-card p-5"><h2 className="mb-3 font-medium">Organisation</h2>
      <div className="flex gap-2"><Input value={name} disabled={!admin} onChange={(e) => setName(e.target.value)} /><Button disabled={!admin || !name.trim()} onClick={saveOrg}>Enregistrer</Button></div></section>
    {sch && <section className="rounded-lg border bg-card p-5"><h2 className="mb-3 font-medium">Rapports planifiés</h2>
      <label className="mb-2 block text-xs text-muted-foreground">Destinataires (séparés par des virgules)</label>
      <Input value={rec} disabled={!admin} onChange={(e) => setRec(e.target.value)} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select disabled={!admin} className="rounded-md border bg-background px-2 py-2 text-sm" value={sch.frequency} onChange={(e) => saveSch({ frequency: e.target.value })}>
          <option value="daily">Quotidien</option><option value="weekly">Hebdomadaire</option><option value="monthly">Mensuel</option></select>
        <Button variant="outline" disabled={!admin} onClick={() => saveSch({ enabled: !sch.enabled })}>{sch.enabled ? "Désactiver" : "Activer"}</Button>
        <Button disabled={!admin} onClick={() => saveSch({})}>Enregistrer</Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">L'envoi automatique par e-mail sera activé avec le module e-mail.</p></section>}
  </div>);
}
