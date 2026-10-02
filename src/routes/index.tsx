import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Juros Diários — Controle de Empréstimos" },
      { name: "description", content: "Acompanhe empréstimos pessoais com juros compostos diários calculados automaticamente." },
      { property: "og:title", content: "Juros Diários — Controle de Empréstimos" },
      { property: "og:description", content: "Acompanhe empréstimos pessoais com juros compostos diários calculados automaticamente." },
    ],
  }),
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  return <Navigate to={session ? "/painel" : "/auth"} replace />;
}
