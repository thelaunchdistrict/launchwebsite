import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRoi, emi, irr, loanBalance, ROI_DEFAULTS } from './finance.ts';

const near = (a: number, b: number, tol: number) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

test('emi matches the standard amortisation formula', () => {
  // ₹50 L at 8.5% for 20 years ≈ ₹43,391
  near(emi(5_000_000, 8.5, 20), 43391, 2);
  assert.equal(emi(0, 8.5, 20), 0);
});

test('loan balance falls to zero at tenure end', () => {
  near(loanBalance(5_000_000, 8.5, 20, 240), 0, 1);
  near(loanBalance(5_000_000, 8.5, 20, 0), 5_000_000, 1);
});

test('irr of a simple doubling over 12 months is 100%', () => {
  const flows = new Array(13).fill(0);
  flows[0] = -100;
  flows[12] = 200;
  near(irr(flows)!, 1, 1e-4);
  assert.equal(irr([100, 100]), null);
});

test('all-cash, no rent, no costs: IRR equals appreciation', () => {
  const r = computeRoi({ ...ROI_DEFAULTS, buyCostsPct: 0, exitCostsPct: 0, rentalYieldPct: 0, loanPct: 0, appreciationPct: 10, holdYears: 5 });
  near(r.irr!, 0.10, 1e-4);
  near(r.multiple, 1.1 ** 5, 1e-6);
});

test('leverage raises IRR when appreciation exceeds borrowing cost', () => {
  const base = { ...ROI_DEFAULTS, rentalYieldPct: 0, appreciationPct: 12, loanRatePct: 8 };
  const cash = computeRoi({ ...base, loanPct: 0 });
  const geared = computeRoi({ ...base, loanPct: 60 });
  assert.ok(geared.irr! > cash.irr!);
});

test('rent only starts after possession', () => {
  const r = computeRoi({ ...ROI_DEFAULTS, holdYears: 3, rentStartsYears: 4 });
  assert.equal(r.rentNet, 0);
});
