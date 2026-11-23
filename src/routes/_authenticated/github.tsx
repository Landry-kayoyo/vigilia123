import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
export const Route = createFileRoute("/_authenticated/github")({ component: () => <ComingSoon title="Dépôts GitHub" phase="phase 4" points={["Connexion via GitHub App en lecture seule", "Analyse du code, dépendances et commits", "Premier dépôt : marketnet243/MarketNet"]} /> });
