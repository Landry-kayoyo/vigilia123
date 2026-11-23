import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useOrg, canEdit } from "@/hooks/use-org";
import { validateMonitorUrl } from "@/lib/monitors.functions";
import { PageHeader, StatusDot, ENV_LABEL, fmtDate } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/applications/")({ component: Apps });

const schema = z.object({
  name: z.string().trim().min(1).max(120), url: z.string().trim().url().max(2048).regex(/^https?:\/\//),
  description: z.string().max(1000).optional(), category: z.string().trim().max(60).optional(),
  environment: z.enum(["production", "staging", "development"]), check_type: z.enum(["http", "api"]),
  http_method: z.enum(["GET", "HEAD", "POST"]), expected_status: z.coerce.number().int().min(100).max(599),
  expected_keyword: z.string().max(200).optional(), interval_minutes: z.coerce.number().refine((n) => [5, 10, 15, 30, 60].includes(n)),
});

function AddDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false); const qc = useQueryClient(); const validate = useServerFn(validateMonitorUrl);
  const [f, setF] = useState({ name: "", url: "https://", description: "", category: "", environment: "production", check_type: "http", http_method: "GET", expected_status: "200", expected_keyword: "", interval_minutes: "5" });
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  async function save() {
    const p = schema.safeParse(f); if (!p.success) { toast.error("Vérifiez les champs : " + p.error.issues[0]?.path.join(".")); return; }
    const v = await validate({ data: { url: p.data.url } }); if (!v.ok) { toast.error(v.error ?? "URL refusée"); return; }
    const { error } = await supabase.from("monitors").insert({ ...p.data, org_id: orgId, description: p.data.description || null, category: p.data.category || null, expected_keyword: p.data.expected_keyword || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Application ajoutée"); setOpen(false); qc.invalidateQueries({ queryKey: ["monitors"] });
  }
  const sel = (k: keyof typeof f, opts: [string, string][]) => (
    <Select value={f[k]} onValueChange={set(k)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{opts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>);
  return (
    <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Ajouter une application</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nouvelle application</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Nom</Label><Input value={f.name} onChange={(e) => set("name")(e.target.value)} /></div>
          <div><Label>URL ou endpoint</Label><Input value={f.url} onChange={(e) => set("url")(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => set("description")(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Catégorie</Label><Input value={f.category} onChange={(e) => set("category")(e.target.value)} placeholder="ex. E-commerce" /></div>
            <div><Label>Environnement</Label>{sel("environment", [["production", "Production"], ["staging", "Staging"], ["development", "Développement"]])}</div>
            <div><Label>Type</Label>{sel("check_type", [["http", "Site web"], ["api", "Endpoint API"]])}</div>
            <div><Label>Méthode</Label>{sel("http_method", [["GET", "GET"], ["HEAD", "HEAD"], ["POST", "POST"]])}</div>
            <div><Label>Code attendu</Label><Input value={f.expected_status} onChange={(e) => set("expected_status")(e.target.value)} /></div>
            <div><Label>Fréquence</Label>{sel("interval_minutes", [["5", "5 min"], ["10", "10 min"], ["15", "15 min"], ["30", "30 min"], ["60", "1 h"]])}</div>
          </div>
          <div><Label>Mot-clé attendu (optionnel)</Label><Input value={f.expected_keyword} onChange={(e) => set("expected_keyword")(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">Les adresses internes ou privées sont refusées.</p>
          <Button onClick={save}>Enregistrer</Button>
        </div>
      </DialogContent></Dialog>);
}

function Apps() {
  const { data: org } = useOrg(); const [env, setEnv] = useState("all");
  const { data } = useQuery({ queryKey: ["monitors", org?.orgId], enabled: !!org,
    queryFn: async () => (await supabase.from("monitors").select("*").eq("org_id", org!.orgId).order("category").order("name")).data ?? [] });
  const list = (data ?? []).filter((m) => env === "all" || m.environment === env);
  const groups = new Map<string, typeof list>(); list.forEach((m) => groups.set(m.category ?? "Sans catégorie", [...(groups.get(m.category ?? "Sans catégorie") ?? []), m]));
  return (
    <div>
      <PageHeader title="Applications" sub="Sites, API et services surveillés">{org && canEdit(org.role) && <AddDialog orgId={org.orgId} />}</PageHeader>
      <div className="mb-4 flex gap-2">{["all", "production", "staging", "development"].map((e) => <Button key={e} size="sm" variant={env === e ? "secondary" : "ghost"} onClick={() => setEnv(e)}>{e === "all" ? "Tous" : ENV_LABEL[e]}</Button>)}</div>
      {!list.length && <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Aucune application pour l'instant.</p>}
      {[...groups.entries()].map(([cat, items]) => (
        <div key={cat} className="mb-6"><h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{cat}</h2>
          <div className="divide-y rounded-lg border bg-card">{items.map((m) => (
            <Link key={m.id} to="/applications/$id" params={{ id: m.id }} className="flex items-center gap-3 p-4 hover:bg-accent/40">
              <StatusDot status={m.enabled ? m.last_status : "unknown"} />
              <div className="min-w-0 flex-1"><div className="truncate font-medium">{m.name}</div><div className="truncate font-mono text-xs text-muted-foreground">{m.url}</div></div>
              <span className="hidden text-xs text-muted-foreground sm:inline">{ENV_LABEL[m.environment]}</span>
              <span className="w-20 text-right font-mono text-xs">{m.last_response_ms != null ? `${m.last_response_ms} ms` : "—"}</span>
              <span className="hidden w-28 text-right text-xs text-muted-foreground md:inline">{m.enabled ? fmtDate(m.last_checked_at) : "Désactivée"}</span>
            </Link>))}</div></div>))}
    </div>);
}
