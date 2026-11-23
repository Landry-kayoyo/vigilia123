import { PageHeader } from "./status";
export function ComingSoon({ title, phase, points }: { title: string; phase: string; points: string[] }) {
  return (
    <div>
      <PageHeader title={title} sub={`Prévu en ${phase} — pas encore actif.`} />
      <div className="rounded-lg border border-dashed bg-card p-6">
        <p className="mb-3 text-sm text-muted-foreground">Ce module n'est pas encore branché. Aucune donnée affichée ici n'est simulée. Il comprendra :</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">{points.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
    </div>
  );
}
