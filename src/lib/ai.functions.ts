import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ask(system: string, prompt: string): Promise<string> {
  const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
  try {
    const r = await generateResponse({ model: "openai/gpt-6-astra", instructions: system, input: prompt });
    const parts: string[] = [];
    for (const item of (r as { output?: unknown[] }).output ?? []) {
      const content = (item as { content?: unknown[] }).content ?? [];
      for (const c of content) { const t = c as { type?: string; text?: string }; if (t.type === "output_text" && t.text) parts.push(t.text); }
    }
    return parts.join("\n").trim() || "Aucune réponse générée.";
  } catch (e) {
    if (e instanceof GatewayError) {
      if (e.httpStatus === 402) throw new Error("Crédits IA épuisés. Rechargez votre espace pour continuer.");
      if (e.httpStatus === 429) throw new Error("Trop de demandes IA, réessayez dans un instant.");
      throw new Error(`Analyse IA indisponible (${e.code}).`);
    }
    throw e;
  }
}
const SYS = "Tu es Vigilia, expert SRE et sécurité applicative. Réponds en français, en Markdown concis, avec des titres courts et des listes. N'invente jamais de faits absents des données fournies ; signale ce qui manque.";

export const analyzeIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { incidentId: string }) => z.object({ incidentId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: inc } = await sb.from("incidents").select("*").eq("id", data.incidentId).maybeSingle();
    if (!inc) throw new Error("Incident introuvable");
    const { data: ok } = await sb.rpc("can_edit_org", { _org: inc.org_id, _user: context.userId });
    if (!ok) throw new Error("Permission insuffisante");
    const [{ data: mon }, { data: checks }, { data: events }] = await Promise.all([
      inc.monitor_id ? sb.from("monitors").select("name,url,http_method,expected_status,expected_keyword,environment").eq("id", inc.monitor_id).maybeSingle() : Promise.resolve({ data: null }),
      inc.monitor_id ? sb.from("checks").select("checked_at,ok,status_code,response_ms,error").eq("monitor_id", inc.monitor_id).order("checked_at", { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
      sb.from("incident_events").select("created_at,message").eq("incident_id", inc.id).order("created_at"),
    ]);
    const text = await ask(SYS, `Analyse cet incident et donne : 1) Diagnostic probable 2) Impact 3) Actions correctives prioritaires 4) Prévention.\n\nIncident: ${JSON.stringify({ title: inc.title, type: inc.type, severity: inc.severity, status: inc.status, description: inc.description, started_at: inc.started_at })}\nApplication: ${JSON.stringify(mon)}\nDernières vérifications: ${JSON.stringify(checks)}\nHistorique: ${JSON.stringify(events)}`);
    const split = text.split(/#+\s*3\)|#+\s*Actions/i);
    await sb.from("incidents").update({ ai_analysis: text, recommendations: split[1] ? "Actions" + split[1] : null }).eq("id", inc.id);
    await sb.from("incident_events").insert({ incident_id: inc.id, org_id: inc.org_id, message: "Analyse IA générée" });
    return { analysis: text };
  });

const repoSchema = z.object({ repo: z.string().trim().regex(/^[\w.-]+\/[\w.-]+$/, "Format attendu : propriétaire/dépôt") });
async function gh(path: string) {
  const r = await fetch(`https://api.github.com/${path}`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "Vigilia" } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub a répondu ${r.status}`);
  return r.json();
}
export const analyzeRepo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { repo: string }) => repoSchema.parse(i))
  .handler(async ({ data }) => {
    const info = await gh(`repos/${data.repo}`);
    if (!info) throw new Error("Dépôt introuvable ou privé (seuls les dépôts publics sont pris en charge pour l'instant).");
    const [langs, commits, tree, readme, pkg] = await Promise.all([
      gh(`repos/${data.repo}/languages`), gh(`repos/${data.repo}/commits?per_page=10`),
      gh(`repos/${data.repo}/git/trees/${info.default_branch}?recursive=1`), gh(`repos/${data.repo}/readme`), gh(`repos/${data.repo}/contents/package.json`),
    ]);
    const files: string[] = (tree?.tree ?? []).filter((f: { type: string }) => f.type === "blob").map((f: { path: string }) => f.path);
    const dec = (b?: { content?: string }) => (b?.content ? atob(b.content.replace(/\n/g, "")).slice(0, 4000) : null);
    const meta = {
      name: info.full_name, description: info.description, stars: info.stargazers_count, open_issues: info.open_issues_count,
      default_branch: info.default_branch, pushed_at: info.pushed_at, license: info.license?.spdx_id ?? null, languages: langs,
      file_count: files.length,
      has_tests: files.some((f) => /(^|\/)(test|tests|__tests__)\/|\.(test|spec)\.[jt]sx?$/.test(f)),
      has_ci: files.some((f) => f.startsWith(".github/workflows/")),
      has_dockerfile: files.some((f) => /Dockerfile$/.test(f)),
      has_env_committed: files.filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !/example|sample/.test(f)),
      recent_commits: (commits ?? []).map((c: { commit: { message: string; author: { date: string } } }) => ({ date: c.commit.author.date, msg: c.commit.message.split("\n")[0] })),
    };
    const report = await ask(SYS, `Audit en lecture seule d'un dépôt GitHub. Donne : Score global /100, Architecture, Qualité & tests, Sécurité (secrets, dépendances), Activité, puis 5 recommandations priorisées.\n\nMétadonnées: ${JSON.stringify(meta)}\nArborescence (extrait): ${files.slice(0, 300).join("\n")}\npackage.json: ${dec(pkg) ?? "absent"}\nREADME (extrait): ${dec(readme)?.slice(0, 2000) ?? "absent"}`);
    return { meta, report };
  });

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { orgId: string; days: number }) => z.object({ orgId: z.string().uuid(), days: z.number().int().min(1).max(90) }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: member } = await sb.rpc("is_org_member", { _org: data.orgId, _user: context.userId });
    if (!member) throw new Error("Accès refusé");
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const [{ data: mons }, { data: checks }, { data: incs }] = await Promise.all([
      sb.from("monitors").select("id,name,environment,last_status").eq("org_id", data.orgId),
      sb.from("checks").select("monitor_id,ok,response_ms").eq("org_id", data.orgId).gte("checked_at", since).limit(10000),
      sb.from("incidents").select("title,severity,status,started_at,resolved_at").eq("org_id", data.orgId).gte("started_at", since),
    ]);
    const per = (mons ?? []).map((m) => {
      const c = (checks ?? []).filter((x) => x.monitor_id === m.id);
      const okN = c.filter((x) => x.ok).length;
      const ms = c.map((x) => x.response_ms).filter((x): x is number => x != null);
      return { name: m.name, environment: m.environment, status: m.last_status, checks: c.length,
        uptime: c.length ? Math.round((okN / c.length) * 10000) / 100 : null, avg_ms: ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : null };
    });
    const totals = { applications: per.length, checks: checks?.length ?? 0, incidents: incs?.length ?? 0, open_incidents: (incs ?? []).filter((i) => i.status !== "resolved").length };
    const summary = per.length ? await ask(SYS, `Rédige un rapport exécutif (${data.days} derniers jours) : synthèse, points forts, risques, recommandations.\nTotaux: ${JSON.stringify(totals)}\nApplications: ${JSON.stringify(per)}\nIncidents: ${JSON.stringify(incs)}`) : "Aucune application surveillée sur la période.";
    return { totals, per, summary, generatedAt: new Date().toISOString() };
  });
