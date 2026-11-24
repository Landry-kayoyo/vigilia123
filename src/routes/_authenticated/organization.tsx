import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/use-org";
import { PageHeader, fmtDate } from "@/components/app/status";
import { Button } from "@/components/ui/button";

const ROLES = { org_admin: "Administrateur", tech_lead: "Responsable technique", viewer: "Lecteur" } as const;
export const Route = createFileRoute("/_authenticated/organization")({ component: Org });
function Org() {
  const { data: org } = useOrg();
  const qc = useQueryClient();
  const admin = org?.role === "org_admin";
  const { data = [] } = useQuery({ queryKey: ["members", org?.orgId], enabled: !!org, queryFn: async () =>
    (await supabase.from("organization_members").select("*").eq("org_id", org!.orgId).order("created_at")).data ?? [] });
  const setRole = async (id: string, role: keyof typeof ROLES) => {
    const { error } = await supabase.from("organization_members").update({ role }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Rôle mis à jour"); qc.invalidateQueries({ queryKey: ["members"] }); } };
  const remove = async (id: string) => { if (!confirm("Retirer ce membre ?")) return;
    const { error } = await supabase.from("organization_members").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["members"] }); };
  return (<div>
    <PageHeader title="Utilisateurs & organisation" sub={`${org?.orgName ?? ""} · votre rôle : ${org ? ROLES[org.role] : ""}`} />
    <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="p-3">Membre</th><th>Rôle</th><th>Depuis</th><th /></tr></thead>
      <tbody>{data.map((m) => { const me = m.user_id === org?.userId; return <tr key={m.id} className="border-b last:border-0">
        <td className="p-3">{m.email ?? m.user_id}{me && <span className="ml-2 text-xs text-muted-foreground">(vous)</span>}</td>
        <td>{admin && !me ? <select className="rounded border bg-background px-2 py-1" value={m.role} onChange={(e) => setRole(m.id, e.target.value as keyof typeof ROLES)}>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select> : ROLES[m.role]}</td>
        <td>{fmtDate(m.created_at)}</td>
        <td className="pr-3 text-right">{admin && !me && <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>Retirer</Button>}</td></tr>; })}</tbody></table></div>
    <p className="mt-4 text-xs text-muted-foreground">Les invitations par e-mail arriveront avec le module d'envoi d'e-mails.</p>
  </div>);
}
