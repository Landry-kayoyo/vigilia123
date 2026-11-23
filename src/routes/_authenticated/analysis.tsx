import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
export const Route = createFileRoute("/_authenticated/analysis")({ component: () => <ComingSoon title="Analyse intelligente" phase="phase 5" points={["Analyse des incidents par Gemini", "Causes probables et recommandations"]} /> });
