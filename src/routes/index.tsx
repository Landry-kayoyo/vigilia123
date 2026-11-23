import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Vigilia — Surveillance intelligente de vos applications" },
    { name: "description", content: "Disponibilité, temps de réponse, incidents et rapports pour vos sites, API et applications." },
    { property: "og:title", content: "Vigilia — Surveillance intelligente" },
    { property: "og:description", content: "Surveillez vos sites, API et applications, détectez les incidents et recevez des rapports." },
  ] }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-signal">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-primary pulse-dot" /><span className="font-semibold">Vigilia</span></div>
        <Button asChild variant="outline" size="sm"><Link to="/auth">Connexion</Link></Button>
      </header>
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-24">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">Surveillance · Incidents · Rapports</p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">Sachez avant vos clients quand une application tombe.</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">Vigilia contrôle vos sites et API, mesure les temps de réponse, ouvre les incidents automatiquement et vous envoie des rapports clairs.</p>
        <div className="mt-8 flex gap-3"><Button asChild size="lg"><Link to="/auth">Commencer</Link></Button></div>
        <div className="mt-16 grid gap-4 font-mono text-sm md:grid-cols-3">
          {[["HTTP/HTTPS", "Disponibilité et codes 4xx/5xx"], ["Incidents", "Ouverture et résolution automatiques"], ["Multi-organisation", "Données isolées par équipe"]].map(([a, b]) => (
            <div key={a} className="rounded-lg border bg-card/60 p-4"><div className="text-primary">{a}</div><div className="mt-1 text-muted-foreground">{b}</div></div>
          ))}
        </div>
      </section>
    </div>
  );
}
