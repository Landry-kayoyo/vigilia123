import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { performCheck, recordResult, type MonitorRow } from "@/lib/monitoring/check";

export const Route = createFileRoute("/api/public/jobs/run-checks")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: monitors } = await supabaseAdmin.from("monitors").select("*").eq("enabled", true).limit(500);
        const now = Date.now();
        const due = (monitors ?? []).filter((m) => !m.last_checked_at || now - new Date(m.last_checked_at).getTime() >= m.interval_minutes * 60_000 - 30_000).slice(0, 100);
        let checked = 0;
        for (let i = 0; i < due.length; i += 10) {
          await Promise.all(due.slice(i, i + 10).map(async (m) => {
            const r = await performCheck(m as MonitorRow);
            await recordResult(supabaseAdmin, m as MonitorRow, r);
            checked++;
          }));
        }
        return Response.json({ checked });
      },
    },
  },
});
