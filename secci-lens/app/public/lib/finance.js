/*
 * SECCI Lens · calcoli deterministici sul credito ai consumatori.
 *
 * Questo modulo è condiviso tra browser e Node (test e server): nessuna
 * dipendenza, nessun accesso al DOM. L'AI non calcola mai numeri: tutto ciò
 * che la persona vede come cifra nasce qui, a partire dai dati del documento.
 *
 * ── TAEG secondo la Direttiva 2008/48/CE, allegato I ──────────────────────
 *
 *   Σ_k C_k · (1 + X)^(−t_k)  =  Σ_l D_l · (1 + X)^(−s_l)
 *
 *   C_k  importi messi a disposizione del consumatore (erogazioni)
 *   D_l  pagamenti del consumatore (rate, spese, imposte)
 *   t, s tempo in anni dalla prima erogazione; mese standard = 1/12 di anno
 *   X    TAEG (si risolve per X; qui con bisezione, robusta e senza derivate)
 *
 * ── Flussi di cassa: quando si paga ogni voce (ipotesi esplicite) ─────────
 *
 *   t = 0          erogazione dell'«Importo totale del credito» (tutto subito).
 *                  Le spese «alla firma» / «all'erogazione» sono un pagamento
 *                  del consumatore a t = 0.
 *   t = k/12       rata k (k = 1…n), la prima un mese dopo l'erogazione.
 *                  Le spese «sulla prima rata» si aggiungono alla rata 1.
 *                  Le spese «per ogni rata» si aggiungono a ciascuna rata.
 *   non indicato   se il documento non dice quando si paga una spesa una
 *                  tantum, la mettiamo a t = 0: è l'ipotesi prudente (dà il
 *                  TAEG più alto) e viene mostrata alla persona come ipotesi.
 */

export const PERIODS_PER_YEAR = 12;

// ── Numeri e formati italiani ───────────────────────────────────────────

export function roundTo(x, decimals = 2) {
  const f = 10 ** decimals;
  return Math.round((x + Math.sign(x) * Number.EPSILON) * f) / f;
}
export const round2 = (x) => roundTo(x, 2);

/**
 * "1.234,56" → 1234.56 · "600" → 600 · "8,90" → 8.9 · "€ 5.000" → 5000.
 * Regola italiana: la virgola è il decimale, il punto separa le migliaia
 * (solo se seguito da gruppi di tre cifre). Restituisce NaN se non è un numero.
 */
export function parseItNumber(str) {
  if (typeof str === "number") return str;
  let s = String(str ?? "").replace(/[€%\s ]|EUR|euro/gi, "").trim();
  if (!s) return NaN;
  let sign = 1;
  if (/^[-−]/.test(s)) { sign = -1; s = s.slice(1); }
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d+(,\d+)?$/.test(s)) s = s.replace(",", ".");
  else if (/^\d+\.\d+$/.test(s)) { /* punto decimale all'inglese: "17.43" */ }
  else return NaN;
  return sign * Number(s);
}

/** Cifre decimali scritte nel testo: "17,4%" → 1, "17,43%" → 2, "600 €" → 0. */
export function decimalsOf(raw) {
  const m = String(raw ?? "").match(/[,.](\d+)\s*(%|€|$)/);
  return m ? m[1].length : 0;
}

export function formatNumber(n, decimals = 2) {
  if (!Number.isFinite(n)) return "—";
  const neg = n < 0;
  const [int, dec] = Math.abs(roundTo(n, decimals)).toFixed(decimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "−" : "") + grouped + (decimals > 0 ? "," + dec : "");
}
export const formatEuro = (n) => formatNumber(n, 2) + " €";
export const formatPercent = (n, decimals = 2) => formatNumber(n, decimals) + "%";

/** "10 mesi" · "48 mesi (4 anni)" · "18 mesi (1 anno e 6 mesi)". */
export function formatMonths(months) {
  if (!Number.isFinite(months)) return "—";
  const m = Math.round(months);
  const base = m === 1 ? "1 mese" : `${m} mesi`;
  if (m < 12) return base;
  const y = Math.floor(m / 12);
  const r = m % 12;
  const years = y === 1 ? "1 anno" : `${y} anni`;
  return `${base} (${years}${r ? ` e ${r === 1 ? "1 mese" : `${r} mesi`}` : ""})`;
}

// ── Risolutore ──────────────────────────────────────────────────────────

/** Valore attuale netto dei flussi al tasso annuo X (decimale). */
export function npv(X, drawdowns, payments) {
  const pv = (flows) => flows.reduce((s, f) => s + f.amount * (1 + X) ** -f.t, 0);
  return pv(payments) - pv(drawdowns);
}

/**
 * Tasso annuo X tale che erogazioni e pagamenti si equivalgono.
 * Bisezione su un intervallo che si allarga finché contiene la radice:
 * converge sempre se esiste una soluzione, senza dipendere da un punto di
 * partenza come Newton. Restituisce NaN se i flussi non hanno soluzione.
 */
export function solveRate(drawdowns, payments) {
  const f = (x) => npv(x, drawdowns, payments);
  if (Math.abs(f(0)) < 1e-9) return 0;
  let lo = -0.99;
  let hi = 1;
  if (!(f(lo) > 0)) return NaN;
  while (f(hi) > 0) {
    hi *= 2;
    if (hi > 1e9) return NaN;
  }
  for (let i = 0; i < 300 && hi - lo > 1e-15; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ── Il credito: flussi, totali, piano ──────────────────────────────────

/**
 * credit = {
 *   creditAmount: 600,
 *   installments: { count: 10, amount: 60 },
 *   fees: [{ kind: "istruttoria", label: "Spese di istruttoria", amount: 20, timing: "first" }],
 * }
 * timing: "start" (alla firma, t = 0) · "first" (con la prima rata) · "each" (con ogni rata)
 */
export function feeTotal(fee, count) {
  return fee.timing === "each" ? fee.amount * count : fee.amount;
}

export function buildCashFlows(credit) {
  const n = credit.installments.count;
  const rata = credit.installments.amount;
  const ppy = credit.installments.periodsPerYear || PERIODS_PER_YEAR;
  const fees = credit.fees || [];
  const drawdowns = [{ t: 0, amount: credit.creditAmount, label: "Ricevi il credito" }];
  const payments = [];

  const start = fees.filter((f) => f.timing === "start" && f.amount > 0);
  if (start.length) {
    payments.push({
      t: 0, k: 0, label: "Alla firma",
      items: start.map((f) => ({ label: f.label, amount: f.amount, kind: f.kind })),
      amount: start.reduce((s, f) => s + f.amount, 0),
    });
  }
  for (let k = 1; k <= n; k++) {
    const items = [{ label: "Rata", amount: rata, kind: "rata" }];
    for (const f of fees) {
      if (f.amount <= 0) continue;
      if (f.timing === "each" || (f.timing === "first" && k === 1)) items.push({ label: f.label, amount: f.amount, kind: f.kind });
    }
    payments.push({ t: k / ppy, k, label: `Mese ${k}`, items, amount: items.reduce((s, i) => s + i.amount, 0) });
  }
  return { drawdowns, payments };
}

export function totalDue(credit) {
  const { payments } = buildCashFlows(credit);
  return round2(payments.reduce((s, p) => s + p.amount, 0));
}

/** TAEG in percento, non arrotondato. */
export function computeTaeg(credit) {
  const { drawdowns, payments } = buildCashFlows(credit);
  return solveRate(drawdowns, payments) * 100;
}

/** Tasso mensile implicito nelle sole rate (senza spese). */
export function impliedMonthlyRate(creditAmount, count, amount) {
  const drawdowns = [{ t: 0, amount: creditAmount }];
  const payments = Array.from({ length: count }, (_, i) => ({ t: i + 1, amount }));
  return solveRate(drawdowns, payments);
}

/** TAN implicito nelle rate: 12 × tasso mensile, in percento. */
export function impliedTan(credit) {
  const { creditAmount, installments } = credit;
  const ppy = installments.periodsPerYear || PERIODS_PER_YEAR;
  return impliedMonthlyRate(creditAmount, installments.count, installments.amount) * ppy * 100;
}

/** Rata costante (ammortamento alla francese). Con TAN 0 è capitale / n. */
export function annuityPayment(principal, tanPercent, count, periodsPerYear = PERIODS_PER_YEAR) {
  const i = tanPercent / 100 / periodsPerYear;
  if (i === 0) return principal / count;
  return (principal * i) / (1 - (1 + i) ** -count);
}

/**
 * Piano delle rate: per ogni mese quanto paghi, divisione tra capitale,
 * interessi e spese, e quanto capitale resta da restituire.
 * Gli interessi usano il tasso implicito nelle rate: così capitale + interessi
 * tornano sempre con le rate scritte nel documento.
 */
export function buildSchedule(credit) {
  const { payments } = buildCashFlows(credit);
  const n = credit.installments.count;
  const rata = credit.installments.amount;
  const i = Math.max(0, impliedMonthlyRate(credit.creditAmount, n, rata) || 0);
  let residual = credit.creditAmount;
  const rows = [];
  for (const p of payments) {
    const fees = p.items.filter((it) => it.kind !== "rata").reduce((s, it) => s + it.amount, 0);
    if (p.k === 0) {
      rows.push({ k: 0, t: 0, label: p.label, rata: 0, interest: 0, principal: 0, fees, total: p.amount, residual, items: p.items });
      continue;
    }
    let interest = residual * i;
    let principal = rata - interest;
    if (p.k === n) { principal = residual; interest = rata - principal; }
    residual = Math.max(0, residual - principal);
    rows.push({
      k: p.k, t: p.t, label: p.label, rata, interest, principal, fees, total: p.amount,
      residual: residual < 0.005 ? 0 : residual, items: p.items,
    });
  }
  return rows;
}

// ── Analisi completa e controllo di coerenza ───────────────────────────

const near = (a, b, tol) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;

/** Tolleranza per il confronto del TAEG: dipende da quante cifre ha il documento. */
export function taegTolerance(decimals) {
  return Math.max(0.011, 0.5 * 10 ** -decimals + 0.001);
}

/**
 * declared = { taeg, taegDecimals, totalDue, tan } (valori scritti nel documento,
 * ognuno facoltativo). Restituisce un controllo per ogni valore presente.
 */
export function checkCoherence(credit, declared = {}) {
  const checks = [];
  const taeg = computeTaeg(credit);
  if (Number.isFinite(declared.taeg)) {
    const d = declared.taegDecimals ?? 2;
    checks.push({
      key: "taeg", computed: roundTo(taeg, 2), declared: declared.taeg, decimals: d,
      match: near(taeg, declared.taeg, taegTolerance(d)),
    });
  }
  if (Number.isFinite(declared.totalDue)) {
    const due = totalDue(credit);
    checks.push({ key: "totalDue", computed: due, declared: declared.totalDue, match: near(due, declared.totalDue, 0.02) });
  }
  if (Number.isFinite(declared.tan)) {
    const tan = impliedTan(credit);
    checks.push({ key: "tan", computed: roundTo(tan, 2), declared: declared.tan, match: near(tan, declared.tan, 0.05) });
  }
  return checks;
}

/** Tutto quello che serve alle schermate, calcolato una volta sola. */
export function analyze(credit, declared = {}) {
  const n = credit.installments.count;
  const ppy = credit.installments.periodsPerYear || PERIODS_PER_YEAR;
  const due = totalDue(credit);
  const taeg = computeTaeg(credit);
  const fees = (credit.fees || []).map((f) => ({ ...f, total: round2(feeTotal(f, n)) }));
  const feesTotal = round2(fees.reduce((s, f) => s + f.total, 0));
  const interestTotal = round2(n * credit.installments.amount - credit.creditAmount);
  const flows = buildCashFlows(credit);
  return {
    creditAmount: credit.creditAmount,
    installments: { count: n, amount: credit.installments.amount, periodsPerYear: ppy },
    durationMonths: credit.durationMonths ?? Math.round((n * 12) / ppy),
    totalDue: due,
    totalCost: round2(due - credit.creditAmount),
    interestTotal,
    fees,
    feesTotal,
    upfront: round2(flows.payments.filter((p) => p.k === 0).reduce((s, p) => s + p.amount, 0)),
    taeg,
    taegRounded: roundTo(taeg, 2),
    impliedTan: impliedTan(credit),
    flows,
    schedule: buildSchedule(credit),
    checks: checkCoherence(credit, declared),
  };
}
