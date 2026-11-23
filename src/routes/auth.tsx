import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Connexion — Vigilia" }, { name: "description", content: "Connectez-vous à Vigilia pour surveiller vos applications." },
    { property: "og:title", content: "Connexion — Vigilia" }, { property: "og:description", content: "Accès à votre espace de surveillance Vigilia." },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [org, setOrg] = useState("");
  const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/dashboard", data: { org_name: org.trim().slice(0, 120) } } });
        if (error) throw error;
        setSent(true);
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erreur"); } finally { setBusy(false); }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-signal px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6">
        <div className="mb-6 flex items-center gap-2"><span className="size-2.5 rounded-full bg-primary pulse-dot" /><span className="font-semibold">Vigilia</span></div>
        {sent ? <p className="text-sm">Vérifiez votre boîte mail pour confirmer votre compte, puis connectez-vous.</p> : (
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-xl font-semibold">{mode === "in" ? "Connexion" : "Créer un compte"}</h1>
            {mode === "up" && <div className="space-y-1.5"><Label htmlFor="org">Nom de l'organisation</Label><Input id="org" value={org} onChange={(e) => setOrg(e.target.value)} required maxLength={120} /></div>}
            <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="pw">Mot de passe</Label><Input id="pw" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button className="w-full" disabled={busy}>{mode === "in" ? "Se connecter" : "Créer le compte"}</Button>
            <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "Pas de compte ? Inscription" : "Déjà inscrit ? Connexion"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
