/*
 * Mini glossario. Ogni voce ha una definizione breve e un esempio preso dal
 * calendario della persona. La penale per ritardo è descritta SOLO con le
 * frasi scritte nelle sue email: niente regole generali inventate.
 */
import { buildSchedule, frequencyLabel } from "./schedule.js";
import { formatEuro } from "./money.js";
import { withArticle } from "./dates.js";

export function buildGlossary(purchases, today) {
  const refYear = Number(today.slice(0, 4));
  const next = purchases.flatMap(buildSchedule).filter((it) => it.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1))[0];
  const providers = [...new Set(purchases.map((p) => p.provider))];
  const bnpl = [...new Set(purchases.filter((p) => p.kind !== "finanziamento").map((p) => p.provider))];
  const longest = [...purchases].sort((a, b) => b.count - a.count)[0];
  const longestSchedule = longest ? buildSchedule(longest) : [];

  const fees = providers.map((prov) => {
    const quotes = [...new Set(purchases.filter((p) => p.provider === prov && p.lateFee).map((p) => p.lateFee))];
    return { provider: prov, quotes };
  });

  return [
    {
      id: "rata",
      term: "Rata",
      definition: "Una parte del prezzo, da pagare in una data stabilita.",
      example: next
        ? `La tua prossima rata: ${formatEuro(next.amount)} per ${next.merchant} (${next.provider}), ${withArticle(next.date, refYear)}.`
        : "Quando carichi un acquisto a rate, qui vedi la tua prossima rata.",
    },
    {
      id: "bnpl",
      term: "Compra ora, paga dopo",
      definition: "Un modo di pagare offerto da alcuni servizi al momento dell'acquisto: ricevi subito quello che compri e il prezzo viene diviso in più rate. Ogni servizio ha le sue regole, scritte nelle sue email e nelle sue condizioni.",
      example: bnpl.length
        ? `Tu lo usi con ${bnpl.length === 1 ? "un servizio" : `${bnpl.length} servizi`}: ${bnpl.join(", ")}. Ognuno mostra solo le proprie rate.`
        : "Nei tuoi acquisti non c'è ancora un servizio di questo tipo.",
    },
    {
      id: "piano",
      term: "Piano di pagamento",
      definition: "L'elenco delle rate di un acquisto: quante sono, quanto vale ciascuna e in quali date.",
      example: longest && longestSchedule.length
        ? `Il piano di ${longest.merchant} (${longest.provider}) ha ${longest.count} rate, ${frequencyLabel(longest.frequency)}, ${withArticle(longestSchedule[0].date, null, "dal")} ${withArticle(longestSchedule[longestSchedule.length - 1].date, null, "al")}.`
        : "Quando carichi un acquisto a rate, qui vedi il suo piano.",
    },
    {
      id: "penale",
      term: "Penale per ritardo",
      definition: "Una somma in più che un servizio può chiedere se una rata non viene pagata alla data prevista. Qui riportiamo solo quello che c'è scritto nelle tue email.",
      fees,
      example: fees.length ? "" : "Quando carichi le email, qui trovi le frasi sulle penali, così come sono scritte.",
    },
  ];
}
