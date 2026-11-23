import { assertPublicUrl } from "./ssrf";

export type MonitorRow = {
  id: string; org_id: string; name: string; url: string; http_method: string;
  expected_status: number; expected_keyword: string | null; timeout_ms: number; last_status: string;
};
export type CheckResult = { ok: boolean; status_code: number | null; response_ms: number | null; error: string | null };

export async function performCheck(m: MonitorRow): Promise<CheckResult> {
  const start = Date.now();
  try {
    let target = (await assertPublicUrl(m.url)).toString();
    let res: Response | null = null;
    for (let hop = 0; hop < 5; hop++) {
      res = await fetch(target, {
        method: m.http_method, redirect: "manual",
        headers: { "user-agent": "VigiliaMonitor/1.0 (+uptime check)" },
        signal: AbortSignal.timeout(m.timeout_ms),
      });
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) {
        target = (await assertPublicUrl(new URL(loc, target).toString())).toString();
        continue;
      }
      break;
    }
    if (!res) throw new Error("Aucune réponse");
    const ms = Date.now() - start;
    let ok = res.status === m.expected_status;
    let error: string | null = ok ? null : `Code HTTP ${res.status} (attendu ${m.expected_status})`;
    if (ok && m.expected_keyword && m.http_method !== "HEAD") {
      const body = (await res.text()).slice(0, 500_000);
      if (!body.includes(m.expected_keyword)) { ok = false; error = "Mot-clé attendu absent de la réponse"; }
    }
    return { ok, status_code: res.status, response_ms: ms, error };
  } catch (e) {
    const msg = e instanceof Error ? (e.name === "TimeoutError" ? `Délai dépassé (${m.timeout_ms} ms)` : e.message) : "Erreur inconnue";
    return { ok: false, status_code: null, response_ms: null, error: msg.slice(0, 500) };
  }
}

export function severityFor(r: CheckResult): "medium" | "high" | "critical" {
  if (r.status_code === null) return "critical";
  if (r.status_code >= 500) return "high";
  return "medium";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recordResult(admin: any, m: MonitorRow, r: CheckResult) {
  await admin.from("checks").insert({ monitor_id: m.id, org_id: m.org_id, ok: r.ok, status_code: r.status_code, response_ms: r.response_ms, error: r.error });
  await admin.from("monitors").update({ last_status: r.ok ? "up" : "down", last_checked_at: new Date().toISOString(), last_response_ms: r.response_ms }).eq("id", m.id);

  const { data: open } = await admin.from("incidents").select("id").eq("monitor_id", m.id).neq("status", "resolved").limit(1).maybeSingle();
  if (!r.ok && !open) {
    const type = r.status_code === null ? "Interruption" : r.status_code >= 500 ? "Erreur serveur 5xx" : r.status_code >= 400 ? "Erreur client 4xx" : "Réponse inattendue";
    const { data: inc } = await admin.from("incidents").insert({
      org_id: m.org_id, monitor_id: m.id, type, severity: severityFor(r),
      title: `${m.name} : ${type}`, description: r.error,
    }).select("id").single();
    if (inc) await admin.from("incident_events").insert({ incident_id: inc.id, org_id: m.org_id, message: `Détecté automatiquement : ${r.error}` });
  } else if (r.ok && open) {
    await admin.from("incidents").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", open.id);
    await admin.from("incident_events").insert({ incident_id: open.id, org_id: m.org_id, message: `Service rétabli (HTTP ${r.status_code}, ${r.response_ms} ms)` });
  } else if (!r.ok && open) {
    // still down — no new event to avoid noise
  }
}
