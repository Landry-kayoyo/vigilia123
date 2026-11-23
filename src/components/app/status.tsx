import { cn } from "@/lib/utils";
export function StatusDot({ status }: { status: string }) {
  const c = status === "up" ? "bg-success" : status === "down" ? "bg-destructive" : "bg-muted-foreground";
  return <span className={cn("inline-block size-2.5 rounded-full", c, status === "down" && "pulse-dot")} />;
}
const SEV: Record<string, string> = { low: "Faible", medium: "Moyen", high: "Élevé", critical: "Critique" };
const SEVC: Record<string, string> = { low: "text-muted-foreground border-border", medium: "text-warning border-warning/40", high: "text-destructive border-destructive/40", critical: "text-destructive-foreground bg-destructive border-destructive" };
export function SeverityBadge({ s }: { s: string }) {
  return <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", SEVC[s])}>{SEV[s] ?? s}</span>;
}
const ST: Record<string, string> = { open: "Ouvert", in_progress: "En cours", resolved: "Résolu" };
export function IncidentStatus({ s }: { s: string }) {
  return <span className={cn("text-xs font-medium", s === "resolved" ? "text-success" : s === "open" ? "text-destructive" : "text-warning")}>{ST[s] ?? s}</span>;
}
export const ENV_LABEL: Record<string, string> = { production: "Production", staging: "Staging", development: "Développement" };
export function fmtDuration(fromIso: string, toIso?: string | null) {
  const ms = (toIso ? new Date(toIso).getTime() : Date.now()) - new Date(fromIso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 48 ? `${h} h ${m % 60} min` : `${Math.floor(h / 24)} j`;
}
export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");
export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}</div>
      {children}
    </div>
  );
}
