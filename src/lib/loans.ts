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

export function monthlyRate(ratePercent: number, period: "monthly" | "yearly") {
  const i = ratePercent / 100;
  return period === "monthly" ? i : Math.pow(1 + i, 1 / 12) - 1;
}

/** Closed calendar months since loan date + days in the open month as a fraction of 30. */
export function monthsElapsed(loanDate: string, today = new Date()) {
  const [y = 1970, m = 1, d = 1] = loanDate.split("-").map(Number);
  const ty = today.getFullYear(), tm = today.getMonth() + 1, td = today.getDate();
  let full = (ty - y) * 12 + (tm - m);
  if (td < d) full -= 1;
  if (full < 0) return 0;
  // anniversary day in the last closed month's next month (clamped to that month's length)
  const anchorMonth = m - 1 + full;
  const anchorDim = new Date(y, anchorMonth + 1, 0).getDate();
  const start = Date.UTC(y, anchorMonth, Math.min(d, anchorDim));
  const now = Date.UTC(ty, tm - 1, td);
  const days = Math.max(0, Math.round((now - start) / 86_400_000));
  // open month fraction always over 30 days (ex.: 01/01 -> 02/10 = 9 meses + 1/30)
  return full + Math.min(days, 30) / 30;
}

export function computeLoan(loan: Pick<Loan, "loan_date" | "principal_amount" | "interest_rate" | "rate_period">, today = new Date()) {
  const days = daysSince(loan.loan_date, today);
  const months = monthsElapsed(loan.loan_date, today);
  const principal = Number(loan.principal_amount);
  const amount = principal * Math.pow(1 + monthlyRate(Number(loan.interest_rate), loan.rate_period), months);
  return { days, months, amount, interest: amount - principal };
}
