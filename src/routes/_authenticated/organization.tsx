import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
export const Route = createFileRoute("/_authenticated/organization")({ component: () => <ComingSoon title="Utilisateurs & organisation" phase="phase 7" points={["Invitations", "Rôles : administrateur, responsable technique, lecture seule"]} /> });
