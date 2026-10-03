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

/** Closed calendar months plus the remaining days after the last monthly anniversary. */
export function elapsedPeriod(loanDate: string, today = new Date()) {
  const [y = 1970, m = 1, d = 1] = loanDate.split("-").map(Number);
  const ty = today.getFullYear(), tm = today.getMonth() + 1, td = today.getDate();
  let fullMonths = (ty - y) * 12 + (tm - m);
  if (td < d) fullMonths -= 1;
  if (fullMonths < 0) return { fullMonths: 0, remainingDays: 0 };

  const anchorMonth = m - 1 + fullMonths;
  const anchorDim = new Date(y, anchorMonth + 1, 0).getDate();
  const anchor = Date.UTC(y, anchorMonth, Math.min(d, anchorDim));
  const now = Date.UTC(ty, tm - 1, td);
  const remainingDays = Math.max(0, Math.round((now - anchor) / 86_400_000));

  return { fullMonths, remainingDays };
}

/** Closed months + open-month days represented with the 30-day linear convention. */
export function monthsElapsed(loanDate: string, today = new Date()) {
  const { fullMonths, remainingDays } = elapsedPeriod(loanDate, today);
  return fullMonths + remainingDays / 30;
}

export function formatElapsedPeriod(loanDate: string, today = new Date()) {
  const { fullMonths, remainingDays } = elapsedPeriod(loanDate, today);
  const monthLabel = fullMonths === 1 ? "mês" : "meses";
  const dayLabel = remainingDays === 1 ? "dia" : "dias";
  return `${fullMonths} ${monthLabel} ${remainingDays} ${dayLabel}`;
}

export function computeLoan(loan: Pick<Loan, "loan_date" | "principal_amount" | "interest_rate" | "rate_period">, today = new Date()) {
  const days = daysSince(loan.loan_date, today);
  const { fullMonths, remainingDays } = elapsedPeriod(loan.loan_date, today);
  const months = fullMonths + remainingDays / 30;
  const principal = Number(loan.principal_amount);
  const rate = monthlyRate(Number(loan.interest_rate), loan.rate_period);

  // Compound interest for every closed month. For the open month, apply the
  // 30-day linear convention to the balance after the closed-month compounding.
  const compoundedBalance = principal * Math.pow(1 + rate, fullMonths);
  const amount = compoundedBalance * (1 + rate * (remainingDays / 30));

  return { days, months, fullMonths, remainingDays, amount, interest: amount - principal };
}
