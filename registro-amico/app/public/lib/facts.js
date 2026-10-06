/*
 * Registro amico — controllo dei fatti di una spiegazione.
 *
 * «Semplificare senza tradire»: una spiegazione (scritta dall'AI o già
 * pronta) non può contenere date, orari, numeri, mesi o giorni della
 * settimana che non sono nella comunicazione originale.
 *
 * Funziona in italiano, inglese e arabo:
 *  - cifre arabo-indiane (٠١٢…) e persiane (۰۱۲…) diventano 0-9;
 *  - "8.00", "8:00" e "8,00" sono lo stesso orario;
 *  - i mesi in lettere contano solo vicino a un numero ("20 ottobre",
 *    "October 20", "20 أكتوبر"): così "may" in "Lessons may…" non è maggio;
 *  - giorno + mese devono essere la stessa coppia dell'originale
 *    ("21 ottobre" al posto di "20 ottobre" viene scartato);
 *  - un giorno della settimana davanti a una data deve essere quello giusto.
 *
 * Modulo puro (nessun DOM): lo usano il server e i test.
 */

const MONTHS = [
  ["gennaio", "january", "jan", "يناير", "جانفي", "كانون الثاني"],
  ["febbraio", "february", "feb", "فبراير", "فيفري", "شباط"],
  ["marzo", "march", "mar", "مارس", "آذار"],
  ["aprile", "april", "apr", "أبريل", "إبريل", "أفريل", "نيسان"],
  ["maggio", "may", "مايو", "ماي", "أيار"],
  ["giugno", "june", "jun", "يونيو", "يونيه", "جوان", "حزيران"],
  ["luglio", "july", "jul", "يوليو", "يوليوز", "جويلية", "تموز"],
  ["agosto", "august", "aug", "أغسطس", "غشت", "أوت", "آب"],
  ["settembre", "september", "sep", "sept", "سبتمبر", "شتنبر", "أيلول"],
  ["ottobre", "october", "oct", "أكتوبر", "تشرين الأول"],
  ["novembre", "november", "nov", "نوفمبر", "نونبر", "تشرين الثاني"],
  ["dicembre", "december", "dec", "ديسمبر", "دجنبر", "كانون الأول"],
];

const WEEKDAYS = [
  ["domenica", "sunday", "الأحد"],
  ["lunedì", "lunedi", "monday", "الاثنين", "الإثنين"],
  ["martedì", "martedi", "tuesday", "الثلاثاء"],
  ["mercoledì", "mercoledi", "wednesday", "الأربعاء"],
  ["giovedì", "giovedi", "thursday", "الخميس"],
  ["venerdì", "venerdi", "friday", "الجمعة"],
  ["sabato", "saturday", "السبت"],
];

// Normalizzazione comune a testo e nomi: minuscole, cifre 0-9, arabo senza
// segni vocalici e con alif uniformata (أ إ آ → ا).
export function normalizeText(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ",") // separatore decimale arabo
    .replace(/٬/g, "") // separatore delle migliaia arabo
    .replace(/[ً-ٰٟـ]/g, "") // harakat e tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/[   ]/g, " ");
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function indexOfNames(groups) {
  const map = new Map();
  groups.forEach((names, i) => names.forEach((n) => map.set(normalizeText(n), i)));
  return map;
}

function wordRe(map) {
  const alts = [...map.keys()].sort((a, b) => b.length - a.length).map(escapeRe).join("|");
  // Prefisso arabo facoltativo attaccato alla parola (و، ب، ل، ف).
  return new RegExp(`(?<![\\p{L}\\p{M}])[وبلف]?(${alts})(?![\\p{L}\\p{M}])`, "gu");
}

const MONTH_INDEX = indexOfNames(MONTHS);
const WEEKDAY_INDEX = indexOfNames(WEEKDAYS);
const MONTH_RE = wordRe(MONTH_INDEX);
const WEEKDAY_RE = wordRe(WEEKDAY_INDEX);

const num = (s) => String(Number(s));
const normYear = (y) => (y.length === 2 ? `20${y}` : num(y));

export function extractFacts(text) {
  let s = normalizeText(text);
  const numbers = new Set();
  const pairs = new Set(); // orari o decimali, "h:mm"
  const months = new Set(); // 1-12
  const weekdays = new Set(); // 0-6
  const dayMonths = new Set(); // "20-10"
  const weekdayDays = new Set(); // "2@20": martedì 20
  const dates = []; // date numeriche { day, month, year }

  // Mesi in lettere vicino a un numero.
  for (const m of s.matchAll(MONTH_RE)) {
    const month = MONTH_INDEX.get(m[1]) + 1;
    const before = s.slice(0, m.index).match(/(\d{1,4})[\s,]*$/);
    const after = s.slice(m.index + m[0].length).match(/^[\s,]*(\d{1,4})/);
    if (!before && !after) continue;
    months.add(month);
    const day = before && +before[1] >= 1 && +before[1] <= 31 ? before[1]
      : after && +after[1] >= 1 && +after[1] <= 31 ? after[1] : null;
    if (day) dayMonths.add(`${num(day)}-${month}`);
  }

  // Giorni della settimana (e il numero subito dopo, se c'è).
  for (const m of s.matchAll(WEEKDAY_RE)) {
    const wd = WEEKDAY_INDEX.get(m[1]);
    weekdays.add(wd);
    const after = s.slice(m.index + m[0].length).match(/^[\s,]*(\d{1,2})(?!\d)/);
    if (after) weekdayDays.add(`${wd}@${num(after[1])}`);
  }

  // Date numeriche: 20/10/2026, 20-10, 20/10/26.
  s = s.replace(/(?<!\d)(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?(?!\d)/g, (all, d, mo, y) => {
    if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return all;
    dates.push({ day: num(d), month: +mo, year: y ? normYear(y) : null });
    months.add(+mo);
    dayMonths.add(`${num(d)}-${+mo}`);
    return " ";
  });

  // Orari e decimali: 8.00, 8:00, 12,50.
  s = s.replace(/(?<!\d)(\d{1,2})[:.,](\d{2})(?!\d)/g, (all, a, b) => {
    pairs.add(`${num(a)}:${b}`);
    return " ";
  });

  for (const m of s.matchAll(/\d+/g)) numbers.add(num(m[0]));

  return { numbers, pairs, months, weekdays, dayMonths, weekdayDays, dates };
}

/*
 * Elenco dei fatti di `candidate` che NON sono nell'originale.
 * Lista vuota = la spiegazione non inventa date, orari o numeri.
 */
export function unsupportedFacts(candidate, original) {
  const E = extractFacts(candidate);
  const O = extractFacts(original);

  const allNumbers = new Set(O.numbers);
  for (const p of O.pairs) {
    const [a, b] = p.split(":");
    allNumbers.add(a);
    allNumbers.add(num(b));
  }
  for (const d of O.dates) {
    allNumbers.add(d.day);
    if (d.year) allNumbers.add(d.year);
  }
  for (const dm of O.dayMonths) allNumbers.add(dm.split("-")[0]);

  const problems = [];
  for (const n of E.numbers) if (!allNumbers.has(n)) problems.push(`numero ${n}`);
  for (const p of E.pairs) if (!O.pairs.has(p)) problems.push(`orario ${p}`);
  for (const d of E.dates) {
    if (!O.dayMonths.has(`${d.day}-${d.month}`) || (d.year && !allNumbers.has(d.year))) {
      problems.push(`data ${d.day}/${d.month}${d.year ? "/" + d.year : ""}`);
    }
  }
  for (const m of E.months) if (!O.months.has(m)) problems.push(`mese ${m}`);
  for (const dm of E.dayMonths) if (!O.dayMonths.has(dm)) problems.push(`data ${dm.replace("-", "/")}`);
  for (const w of E.weekdays) if (!O.weekdays.has(w)) problems.push(`giorno della settimana ${w}`);
  // "mercoledì 20" quando l'originale dice "martedì 20": scartato.
  for (const wd of E.weekdayDays) {
    const day = wd.split("@")[1];
    const sameDay = [...O.weekdayDays].filter((x) => x.endsWith(`@${day}`));
    if (sameDay.length && !sameDay.includes(wd)) problems.push(`giorno della settimana per il ${day}`);
  }
  return [...new Set(problems)];
}
