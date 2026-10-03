import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Landmark, LogOut, MoreHorizontal, Pencil, Plus, RotateCcw, Search, Trash2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { computeLoan, formatBRL, formatDate, type Loan } from "@/lib/loans";
import { LoanFormDialog, type LoanFormValues } from "@/components/LoanFormDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [
    { title: "Painel — Juros Diários" },
    { name: "description", content: "Resumo dos seus empréstimos e juros acumulados." },
    { property: "og:title", content: "Painel — Juros Diários" },
    { property: "og:description", content: "Resumo dos seus empréstimos e juros acumulados." },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "paid">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [deleting, setDeleting] = useState<Loan | null>(null);

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("loans").select("*").order("loan_date", { ascending: false });
      if (error) throw error;
      return data as Loan[];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["loans"] });
  const save = async (v: LoanFormValues) => {
    const payload = { ...v, notes: v.notes || null };
    const { error } = editing ? await supabase.from("loans").update(payload).eq("id", editing.id) : await supabase.from("loans").insert({ ...payload, user_id: session!.user.id });
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success(editing ? "Empréstimo atualizado" : "Empréstimo adicionado"); setFormOpen(false); refresh();
  };
  const toggleStatus = useMutation({
    mutationFn: async (l: Loan) => { const { error } = await supabase.from("loans").update({ status: l.status === "active" ? "paid" : "active" }).eq("id", l.id); if (error) throw error; },
    onSuccess: () => { toast.success("Status atualizado"); refresh(); }, onError: () => toast.error("Erro ao atualizar status"),
  });
  const remove = async () => { if (!deleting) return; const { error } = await supabase.from("loans").delete().eq("id", deleting.id); setDeleting(null); if (error) return void toast.error("Erro ao excluir"); toast.success("Empréstimo excluído"); refresh(); };

  const today = new Date();
  const rows = useMemo(() => loans.map((l) => ({ loan: l, ...computeLoan(l, today) })), [loans]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = rows.filter((r) => r.loan.status === "active");
  const totals = active.reduce((a, r) => ({ p: a.p + Number(r.loan.principal_amount), m: a.m + r.amount }), { p: 0, m: 0 });
  const filtered = rows.filter((r) => (status === "all" || r.loan.status === status) && r.loan.person_name.toLowerCase().includes(search.trim().toLowerCase()));

  return <div className="min-h-screen">
    <header className="border-b bg-card/60 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2 font-semibold"><Landmark className="h-5 w-5 text-primary" /> Juros Diários</div>
      <div className="flex items-center gap-1"><span className="mr-2 hidden text-sm text-muted-foreground sm:inline">{session?.user.email}</span><ThemeToggle /><Button variant="ghost" size="icon" aria-label="Sair" onClick={() => supabase.auth.signOut()}><LogOut className="h-4 w-4" /></Button></div>
    </div></header>
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Atualizado em {today.toLocaleDateString("pt-BR")}</p><h1 className="font-display text-4xl">Seus empréstimos</h1></div><Button size="lg" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Novo Empréstimo</Button></div>
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total original emprestado" value={formatBRL(totals.p)} hint={`${active.length} ativo(s)`} />
        <SummaryCard label="Total atualizado com juros" value={formatBRL(totals.m)} hint="Até hoje" />
        <div className="bg-hero rounded-xl p-6 text-primary-foreground shadow-card dark:text-foreground"><div className="flex items-center justify-between text-sm opacity-80">Total de juros acumulados <TrendingUp className="h-4 w-4" /></div><div className="tabular mt-3 text-3xl font-semibold">{formatBRL(totals.m - totals.p)}</div><Badge className="mt-3 bg-success text-success-foreground hover:bg-success">+{totals.p ? (((totals.m - totals.p) / totals.p) * 100).toFixed(2) : "0.00"}% rendimento</Badge></div>
      </section>
      <section className="rounded-xl border bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por nome..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div><Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}><TabsList><TabsTrigger value="all">Todos</TabsTrigger><TabsTrigger value="active">Ativos</TabsTrigger><TabsTrigger value="paid">Quitados</TabsTrigger></TabsList></Tabs></div>
        <Table className="table-fixed sm:table-auto">
          <TableHeader><TableRow>
            <TableHead className="w-[44%] sm:w-auto">Pessoa</TableHead><TableHead className="hidden md:table-cell">Início</TableHead><TableHead className="hidden text-right lg:table-cell">Dias</TableHead><TableHead className="hidden text-right md:table-cell">Taxa</TableHead><TableHead className="hidden text-right lg:table-cell">Original</TableHead><TableHead className="w-[42%] text-right sm:w-auto"><span className="sm:hidden">Atual</span><span className="hidden sm:inline">Montante atual</span></TableHead><TableHead className="hidden text-right md:table-cell">Juros</TableHead><TableHead className="hidden sm:table-cell">Status</TableHead><TableHead className="w-12" />
          </TableRow></TableHeader>
          <TableBody>{isLoading ? <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">Carregando...</TableCell></TableRow> : filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="py-12 text-center text-muted-foreground">{loans.length ? "Nenhum resultado para os filtros." : "Nenhum empréstimo ainda. Clique em “Novo Empréstimo”."}</TableCell></TableRow> : filtered.map(({ loan, days, amount, interest }) => <TableRow key={loan.id} className={loan.status === "paid" ? "opacity-60" : ""}>
            <TableCell className="min-w-0 font-medium"><div className="truncate">{loan.person_name}</div><div className="mt-1 sm:hidden">{loan.status === "active" ? <Badge variant="outline" className="h-5 border-success/40 bg-success-soft px-1.5 text-[10px] text-success">Ativo</Badge> : <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Quitado</Badge>}</div></TableCell>
            <TableCell className="tabular hidden text-sm md:table-cell">{formatDate(loan.loan_date)}</TableCell><TableCell className="tabular hidden text-right text-sm lg:table-cell">{days}</TableCell><TableCell className="tabular hidden text-right text-sm md:table-cell">{Number(loan.interest_rate).toLocaleString("pt-BR")}% {loan.rate_period === "monthly" ? "a.m." : "a.a."}</TableCell><TableCell className="tabular hidden text-right text-sm lg:table-cell">{formatBRL(Number(loan.principal_amount))}</TableCell><TableCell className="tabular whitespace-nowrap text-right text-xs font-semibold sm:text-sm">{formatBRL(amount)}</TableCell><TableCell className="tabular hidden text-right text-sm text-success md:table-cell">+{formatBRL(interest)}</TableCell>
            <TableCell className="hidden sm:table-cell">{loan.status === "active" ? <Badge variant="outline" className="border-success/40 bg-success-soft text-success">Ativo</Badge> : <Badge variant="secondary">Quitado</Badge>}</TableCell>
            <TableCell className="px-1 sm:px-2"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setEditing(loan); setFormOpen(true); }}><Pencil className="h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => toggleStatus.mutate(loan)}>{loan.status === "active" ? <><CheckCircle2 className="h-4 w-4" /> Marcar como quitado</> : <><RotateCcw className="h-4 w-4" /> Reativar</>}</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(loan)}><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </section>
    </main>
    <LoanFormDialog open={formOpen} onOpenChange={setFormOpen} loan={editing} onSubmit={save} />
    <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir empréstimo?</AlertDialogTitle><AlertDialogDescription>O registro de {deleting?.person_name} será removido permanentemente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={remove}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="rounded-xl border bg-card p-6 shadow-card"><div className="text-sm text-muted-foreground">{label}</div><div className="tabular mt-3 text-3xl font-semibold">{value}</div><div className="mt-3 text-xs text-muted-foreground">{hint}</div></div>;
}
