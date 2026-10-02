export type Loan = {
  id: string;
  user_id: string;
  person_name: string;
  loan_date: string;
  principal_amount: number;
  interest_rate: number;
  rate_period: "monthly" | "yearly";
  status: "active" | "paid";
  notes: string | null;
  created_at: string;
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (v: number) => brl.format(v);
export const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

export function daysSince(loanDate: string, today = new Date()) {
  const [y = 1970, m = 1, d = 1] = loanDate.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((now - start) / 86_400_000));
}

export function dailyRate(ratePercent: number, period: "monthly" | "yearly") {
  const i = ratePercent / 100;
  return Math.pow(1 + i, 1 / (period === "monthly" ? 30 : 365)) - 1;
}

export function computeLoan(loan: Pick<Loan, "loan_date" | "principal_amount" | "interest_rate" | "rate_period">, today = new Date()) {
  const days = daysSince(loan.loan_date, today);
  const principal = Number(loan.principal_amount);
  const amount = principal * Math.pow(1 + dailyRate(Number(loan.interest_rate), loan.rate_period), days);
  return { days, amount, interest: amount - principal };
}
