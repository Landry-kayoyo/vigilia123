import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
export const Route = createFileRoute("/_authenticated/integrations")({ component: () => <ComingSoon title="Intégrations" phase="phase 5+" points={["Webhooks", "Contrôles de processus métier", "Services externes"]} /> });
