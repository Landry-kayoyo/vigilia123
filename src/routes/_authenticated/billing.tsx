import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
export const Route = createFileRoute("/_authenticated/billing")({ component: () => <ComingSoon title="Abonnements" phase="une phase future" points={["Plans tarifaires", "Quotas", "Facturation"]} /> });
