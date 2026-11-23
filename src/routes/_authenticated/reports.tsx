import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
export const Route = createFileRoute("/_authenticated/reports")({ component: () => <ComingSoon title="Rapports" phase="phase 6" points={["Rapports quotidiens à 07h00 (Africa/Lubumbashi) vers marketnet243@gmail.com", "Hebdomadaires, mensuels, incidents, performances"]} /> });
