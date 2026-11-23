import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
export const Route = createFileRoute("/_authenticated/settings")({ component: () => <ComingSoon title="Paramètres" phase="phase 5" points={["Intelligence artificielle → Google Gemini : clé chiffrée côté serveur, test de connexion, activation"]} /> });
