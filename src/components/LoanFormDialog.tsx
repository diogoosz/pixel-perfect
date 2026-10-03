import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Loan, Person } from "@/lib/loans";

const schema = z.object({
  loan_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida").refine((d) => new Date(`${d}T23:59:59`) <= new Date(), "Data não pode ser futura"),
  principal_amount: z.coerce.number().positive("Deve ser maior que zero").max(1e11),
  interest_rate: z.coerce.number().min(0, "Não pode ser negativa").max(1000),
  rate_period: z.enum(["monthly", "yearly"]),
  notes: z.string().max(1000).optional(),
});
export type LoanFormValues = z.infer<typeof schema>;
const empty = (): LoanFormValues => ({ loan_date: new Date().toISOString().slice(0, 10), principal_amount: 0, interest_rate: 0, rate_period: "monthly", notes: "" });

export function LoanFormDialog({ open, onOpenChange, loan, personName, people, personId, onPersonChange, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; loan?: Loan | null; personName?: string; people?: Person[]; personId?: string; onPersonChange?: (id: string) => void; onSubmit: (v: LoanFormValues) => Promise<void> }) {
  const form = useForm<LoanFormValues>({ resolver: zodResolver(schema), defaultValues: empty() });
  useEffect(() => { if (open) form.reset(loan ? { loan_date: loan.loan_date, principal_amount: Number(loan.principal_amount), interest_rate: Number(loan.interest_rate), rate_period: loan.rate_period, notes: loan.notes ?? "" } : empty()); }, [open, loan, form]);
  const selectingPerson = !loan && people && onPersonChange;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle className="font-display text-2xl">{loan ? "Editar empréstimo" : "Novo empréstimo"}</DialogTitle></DialogHeader><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    {selectingPerson ? <div className="space-y-2"><Label>Pessoa</Label><Select value={personId} onValueChange={onPersonChange}><SelectTrigger><SelectValue placeholder="Selecione a pessoa" /></SelectTrigger><SelectContent>{people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div> : personName ? <div className="rounded-lg bg-muted px-3 py-2 text-sm"><span className="text-muted-foreground">Pessoa: </span><span className="font-medium">{personName}</span></div> : null}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField control={form.control} name="loan_date" render={({ field }) => <FormItem><FormLabel>Data do empréstimo</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="principal_amount" render={({ field }) => <FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="interest_rate" render={({ field }) => <FormItem><FormLabel>Taxa de juros (%)</FormLabel><FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="rate_period" render={({ field }) => <FormItem><FormLabel>Período</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Ao mês</SelectItem><SelectItem value="yearly">Ao ano</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
    </div>
    <FormField control={form.control} name="notes" render={({ field }) => <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>} />
    <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={form.formState.isSubmitting}>{loan ? "Salvar" : "Adicionar"}</Button></DialogFooter>
  </form></Form></DialogContent></Dialog>;
}
