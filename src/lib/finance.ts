// Investment maths for the ROI calculator. Monthly cash-flow model; pure functions, no deps.

export interface RoiInput {
  price: number; // ₹ entry (agreement) price
  buyCostsPct: number; // stamp duty + registration + misc, % of price
  holdYears: number;
  appreciationPct: number; // assumed annual capital appreciation, %
  rentalYieldPct: number; // gross annual rent as % of current value
  rentStartsYears: number; // years until possession / rent starts
  rentCostsPct: number; // vacancy + maintenance + tax on rent, % of gross rent
  loanPct: number; // % of price financed (0 = all cash)
  loanRatePct: number; // annual interest rate
  loanYears: number; // tenure
  exitCostsPct: number; // brokerage + legal on sale, % of sale price
}

export interface RoiResult {
  months: number;
  equityAtEntry: number;
  totalEmiPaid: number;
  interestPaid: number;
  totalCashIn: number; // everything the investor paid out of pocket
  rentNet: number;
  salePrice: number;
  exitCosts: number;
  loanOutstanding: number;
  netSaleProceeds: number;
  profit: number;
  multiple: number; // total cash back / total cash in
  irr: number | null; // annualised, from monthly cash flows
  emi: number;
  /** Year-end snapshots for charting. */
  path: { year: number; value: number; loan: number; equity: number; cumulativeRent: number }[];
  flows: number[]; // monthly, index 0 = today (negative = outflow)
}

export function emi(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = Math.round(years * 12);
  if (r === 0) return principal / n;
  return (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);
}

export function loanBalance(principal: number, annualRatePct: number, years: number, monthsPaid: number): number {
  if (principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = Math.round(years * 12);
  const k = Math.min(monthsPaid, n);
  if (r === 0) return Math.max(0, principal - (principal / n) * k);
  const e = emi(principal, annualRatePct, years);
  return Math.max(0, principal * (1 + r) ** k - (e * ((1 + r) ** k - 1)) / r);
}

/** Net present value at a monthly rate. */
export function npv(rate: number, flows: number[]): number {
  let v = 0;
  for (let t = 0; t < flows.length; t++) v += flows[t] / (1 + rate) ** t;
  return v;
}

/** Monthly IRR by bisection, returned annualised ((1+m)^12 − 1). Null if no sign change. */
export function irr(flows: number[]): number | null {
  const hasNeg = flows.some((f) => f < 0);
  const hasPos = flows.some((f) => f > 0);
  if (!hasNeg || !hasPos) return null;
  let lo = -0.99, hi = 1;
  let fLo = npv(lo, flows), fHi = npv(hi, flows);
  if (fLo * fHi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, flows);
    if (Math.abs(fMid) < 1e-6) { lo = hi = mid; break; }
    if (fLo * fMid < 0) { hi = mid; fHi = fMid; } else { lo = mid; fLo = fMid; }
  }
  const m = (lo + hi) / 2;
  return (1 + m) ** 12 - 1;
}

export function computeRoi(i: RoiInput): RoiResult {
  const months = Math.max(1, Math.round(i.holdYears * 12));
  const g = i.appreciationPct / 100;
  const loan = (i.price * Math.min(100, Math.max(0, i.loanPct))) / 100;
  const monthlyEmi = emi(loan, i.loanRatePct, i.loanYears);
  const loanMonths = Math.round(i.loanYears * 12);
  const buyCosts = (i.price * i.buyCostsPct) / 100;
  const equityAtEntry = i.price - loan + buyCosts;
  const rentStart = Math.round(i.rentStartsYears * 12);
  const valueAt = (m: number) => i.price * (1 + g) ** (m / 12);

  const flows: number[] = new Array(months + 1).fill(0);
  flows[0] = -equityAtEntry;
  let totalEmi = 0;
  let rentNet = 0;
  const path: RoiResult['path'] = [{ year: 0, value: i.price, loan, equity: i.price - loan, cumulativeRent: 0 }];

  for (let m = 1; m <= months; m++) {
    if (loan > 0 && m <= loanMonths) { flows[m] -= monthlyEmi; totalEmi += monthlyEmi; }
    if (m > rentStart) {
      const rent = (valueAt(m) * (i.rentalYieldPct / 100)) / 12 * (1 - i.rentCostsPct / 100);
      flows[m] += rent;
      rentNet += rent;
    }
    if (m % 12 === 0 || m === months) {
      const bal = loanBalance(loan, i.loanRatePct, i.loanYears, m);
      path.push({ year: +(m / 12).toFixed(2), value: valueAt(m), loan: bal, equity: valueAt(m) - bal, cumulativeRent: rentNet });
    }
  }

  const salePrice = valueAt(months);
  const exitCosts = (salePrice * i.exitCostsPct) / 100;
  const loanOutstanding = loanBalance(loan, i.loanRatePct, i.loanYears, months);
  const netSaleProceeds = salePrice - exitCosts - loanOutstanding;
  flows[months] += netSaleProceeds;

  const principalPaid = loan - loanOutstanding;
  const interestPaid = totalEmi - principalPaid;
  const totalCashIn = equityAtEntry + totalEmi;
  const totalBack = netSaleProceeds + rentNet;
  return {
    months,
    equityAtEntry,
    totalEmiPaid: totalEmi,
    interestPaid,
    totalCashIn,
    rentNet,
    salePrice,
    exitCosts,
    loanOutstanding,
    netSaleProceeds,
    profit: totalBack - totalCashIn,
    multiple: totalCashIn > 0 ? totalBack / totalCashIn : 0,
    irr: irr(flows),
    emi: monthlyEmi,
    path,
    flows,
  };
}

export const ROI_DEFAULTS: RoiInput = {
  price: 30000000,
  buyCostsPct: 7,
  holdYears: 5,
  appreciationPct: 8,
  rentalYieldPct: 3,
  rentStartsYears: 4,
  rentCostsPct: 15,
  loanPct: 0,
  loanRatePct: 8.75,
  loanYears: 20,
  exitCostsPct: 2,
};
