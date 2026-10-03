import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Landmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Juros Diários" },
      { name: "description", content: "Acesse sua conta para controlar seus empréstimos." },
      { property: "og:title", content: "Entrar — Juros Diários" },
      { property: "og:description", content: "Acesse sua conta para controlar seus empréstimos." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo de 6 caracteres").max(72),
});

function translateError(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "E-mail ainda não confirmado.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde um pouco.";
  if (m.includes("signup") || m.includes("not allowed") || m.includes("disabled")) return "Acesso não autorizado para esta conta.";
  if (m.includes("network") || m.includes("fetch")) return "Falha de conexão. Tente novamente.";
  return "Não foi possível entrar. Tente novamente.";
}

function AuthPage() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && session) return <Navigate to="/painel" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) toast.error(translateError(error.message));
    setBusy(false);
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error(translateError(String((result.error as Error).message ?? result.error)));
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero hidden flex-col justify-between p-12 text-primary-foreground lg:flex dark:text-foreground">
        <div className="flex items-center gap-2 font-semibold"><Landmark className="h-5 w-5" /> Juros Diários</div>
        <div>
          <h1 className="font-display text-5xl leading-tight">Seu dinheiro emprestado,<br />rendendo todo mês.</h1>
          <p className="mt-4 max-w-md opacity-80">Juros compostos por mês fechado; o mês em andamento entra como fração.</p>
        </div>
        <p className="text-sm opacity-60">M = P × (1 + i<sub>m</sub>)<sup>meses</sup></p>
      </div>
      <div className="relative flex items-center justify-center p-6">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="font-display text-3xl">Entrar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Bem-vindo de volta.</p>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={google}>Entrar com Google</Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
          <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="pw">Senha</Label><Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Aguarde..." : "Entrar"}</Button>
        </form>
      </div>
    </div>
  );
}
