import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrgCtx = { orgId: string; orgName: string; role: "org_admin" | "tech_lead" | "viewer"; userId: string; email: string };

export function useOrg() {
  return useQuery({
    queryKey: ["org"],
    queryFn: async (): Promise<OrgCtx> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Non connecté");
      const { data, error } = await supabase.from("organization_members")
        .select("org_id, role, organizations(name)").eq("user_id", u.user.id).order("created_at").limit(1).single();
      if (error) throw error;
      const org = data.organizations as unknown as { name: string } | null;
      return { orgId: data.org_id, orgName: org?.name ?? "", role: data.role, userId: u.user.id, email: u.user.email ?? "" };
    },
    staleTime: 60_000,
  });
}
export const canEdit = (r?: string) => r === "org_admin" || r === "tech_lead";
