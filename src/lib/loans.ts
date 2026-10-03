export type Person = { id: string; user_id: string; name: string; notes: string | null; created_at: string };
export type Payment = { id: string; user_id: string; loan_id: string; amount: number; payment_date: string; notes: string | null; created_at: string };
export type Loan = {
  id: string; user_id: string; person_id: string; loan_date: string;
  principal_amount: number; interest_rate: number; rate_period: "monthly" | "yearly";
  status: "active" | "paid"; notes: string | null; created_at: string;
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (v: number) => brl.format(v);
export const formatDate = (d: string) => { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

export function daysSince(loanDate: string, today = new Date()) {
  const [y = 1970, m = 1, d = 1] = loanDate.split("-").map(Number);
  return Math.max(0, Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(y, m - 1, d)) / 86_400_000));
}
export function monthlyRate(ratePercent: number, period: "monthly" | "yearly") {
  const i = ratePercent / 100; return period === "monthly" ? i : Math.pow(1 + i, 1 / 12) - 1;
}
export function elapsedPeriod(loanDate: string, today = new Date()) {
  const [y = 1970, m = 1, d = 1] = loanDate.split("-").map(Number);
  const ty = today.getFullYear(), tm = today.getMonth() + 1, td = today.getDate();
  let fullMonths = (ty - y) * 12 + (tm - m); if (td < d) fullMonths -= 1;
  if (fullMonths < 0) return { fullMonths: 0, remainingDays: 0 };
  const anchorMonth = m - 1 + fullMonths;
  const anchor = Date.UTC(y, anchorMonth, Math.min(d, new Date(y, anchorMonth + 1, 0).getDate()));
  return { fullMonths, remainingDays: Math.max(0, Math.round((Date.UTC(ty, tm - 1, td) - anchor) / 86_400_000)) };
}
export function computeLoan(loan: Pick<Loan, "loan_date" | "principal_amount" | "interest_rate" | "rate_period">, today = new Date()) {
  const days = daysSince(loan.loan_date, today);
  const { fullMonths, remainingDays } = elapsedPeriod(loan.loan_date, today);
  const principal = Number(loan.principal_amount), rate = monthlyRate(Number(loan.interest_rate), loan.rate_period);
  const compoundedBalance = principal * Math.pow(1 + rate, fullMonths);
  const amount = compoundedBalance * (1 + rate * (remainingDays / 30));
  return { days, fullMonths, remainingDays, amount, interest: amount - principal };
}
export function computeLoanWithPayments(loan: Loan, payments: Payment[], today = new Date()) {
  const calc = computeLoan(loan, today);
  const paid = payments.filter((p) => p.loan_id === loan.id).reduce((sum, p) => sum + Number(p.amount), 0);
  return { ...calc, paid, balance: Math.max(0, calc.amount - paid) };
}
