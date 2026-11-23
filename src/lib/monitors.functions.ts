import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPublicUrl } from "./monitoring/ssrf";
import { performCheck, recordResult, type MonitorRow } from "./monitoring/check";

export const validateMonitorUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { url: string }) => z.object({ url: z.string().url().max(2048) }).parse(i))
  .handler(async ({ data }) => {
    try { await assertPublicUrl(data.url); return { ok: true as const, error: null }; }
    catch (e) { return { ok: false as const, error: e instanceof Error ? e.message : "URL refusée" }; }
  });

export const runCheckNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { monitorId: string }) => z.object({ monitorId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: m, error } = await context.supabase.from("monitors").select("*").eq("id", data.monitorId).maybeSingle();
    if (error || !m) throw new Error("Application introuvable");
    const { data: canEdit } = await context.supabase.rpc("can_edit_org", { _org: m.org_id, _user: context.userId });
    if (!canEdit) throw new Error("Permission insuffisante");
    const result = await performCheck(m as MonitorRow);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await recordResult(supabaseAdmin, m as MonitorRow, result);
    return result;
  });
