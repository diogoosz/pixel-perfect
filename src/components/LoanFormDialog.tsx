import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Loan } from "@/lib/loans";

const schema = z.object({
  person_name: z.string().trim().min(1, "Informe o nome").max(120),
  loan_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida").refine((d) => new Date(d) <= new Date(), "Data não pode ser futura"),
  principal_amount: z.coerce.number({ invalid_type_error: "Valor inválido" }).positive("Deve ser maior que zero").max(1e11),
  interest_rate: z.coerce.number({ invalid_type_error: "Taxa inválida" }).min(0, "Não pode ser negativa").max(1000),
  rate_period: z.enum(["monthly", "yearly"]),
  notes: z.string().max(1000).optional(),
});
export type LoanFormValues = z.infer<typeof schema>;

const empty = (): LoanFormValues => ({
  person_name: "",
  loan_date: new Date().toISOString().slice(0, 10),
  principal_amount: 0,
  interest_rate: 0,
  rate_period: "monthly",
  notes: "",
});

export function LoanFormDialog({ open, onOpenChange, loan, onSubmit }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  loan?: Loan | null;
  onSubmit: (v: LoanFormValues) => Promise<void>;
}) {
  const form = useForm<LoanFormValues>({ resolver: zodResolver(schema), defaultValues: empty() });

  useEffect(() => {
    if (open) form.reset(loan ? {
      person_name: loan.person_name, loan_date: loan.loan_date,
      principal_amount: Number(loan.principal_amount), interest_rate: Number(loan.interest_rate),
      rate_period: loan.rate_period, notes: loan.notes ?? "",
    } : empty());
  }, [open, loan, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-display text-2xl">{loan ? "Editar empréstimo" : "Novo empréstimo"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="person_name" render={({ field }) => (
              <FormItem><FormLabel>Nome da pessoa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="loan_date" render={({ field }) => (
                <FormItem><FormLabel>Data do empréstimo</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="principal_amount" render={({ field }) => (
                <FormItem><FormLabel>Valor (R$)</FormLabel><FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="interest_rate" render={({ field }) => (
                <FormItem><FormLabel>Taxa de juros (%)</FormLabel><FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="rate_period" render={({ field }) => (
                <FormItem><FormLabel>Período</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="monthly">Ao mês</SelectItem><SelectItem value="yearly">Ao ano</SelectItem></SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>{loan ? "Salvar" : "Adicionar"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
