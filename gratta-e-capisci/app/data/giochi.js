// Dati dei giochi per "Fortuna in Chiaro".
// Ogni numero proviene da docs/idea/ricerca-azzardo.md (sezione indicata nel campo fonte).
// Nomi generici, nessun marchio commerciale. File .js (non .json) perche' fetch non funziona da file://.
window.GIOCHI = {
  aggiornamento: "2026-10-05",
  giochi: [
    {
      id: "istantanea-5-a",
      tipo: "istantanea",
      nome: "Lotteria istantanea da 5 € (modello A)",
      prezzo: 5,
      emissione: 49920000,
      // unoSu: probabilita' dichiarata nella tabella ufficiale (per verifica); null = non dichiarata
      premi: [
        { premio: 500000, vincenti: 4, unoSu: 12480000 },
        { premio: 25000, vincenti: 8, unoSu: 6240000 },
        { premio: 10000, vincenti: 40, unoSu: 1248000 },
        { premio: 4000, vincenti: 80, unoSu: 624000 },
        { premio: 2000, vincenti: 92, unoSu: 542609 },
        { premio: 1000, vincenti: 2288, unoSu: 21818 },
        { premio: 500, vincenti: 5408, unoSu: 9231 },
        { premio: 400, vincenti: 5408, unoSu: 9231 },
        { premio: 200, vincenti: 15808, unoSu: 3158 },
        { premio: 100, vincenti: 257920, unoSu: 194 },
        { premio: 50, vincenti: 665600, unoSu: 75 },
        { premio: 25, vincenti: 748800, unoSu: 67 },
        { premio: 20, vincenti: 748800, unoSu: 67 },
        { premio: 10, vincenti: 4867200, unoSu: 10 },
        { premio: 5, vincenti: 4576000, unoSu: null, rimborso: true }
      ],
      dichiarati: { payout: 0.712, quotaVincenti: 0.238 },
      fonte: {
        ente: "ADM - Agenzia delle Dogane e dei Monopoli",
        descrizione: "Tabella premi ufficiale di una lotteria istantanea da 5 € (nome commerciale omesso)",
        url: "https://www.adm.gov.it/portale/en/-/nuovo-20x",
        sezione: "ricerca-azzardo.md §1.1",
        affidabilita: "UFF"
      }
    },
    {
      id: "istantanea-5-b",
      tipo: "istantanea",
      nome: "Lotteria istantanea da 5 € (modello B)",
      prezzo: 5,
      emissione: 38400000,
      premi: [
        { premio: 500000, vincenti: 5, unoSu: 7680000 },
        { premio: 100000, vincenti: 5, unoSu: 7680000 },
        { premio: 50000, vincenti: 5, unoSu: 7680000 },
        { premio: 10000, vincenti: 20, unoSu: 1920000 },
        { premio: 5000, vincenti: 40, unoSu: 960000 },
        { premio: 2500, vincenti: 100, unoSu: 384000 },
        { premio: 1000, vincenti: 1500, unoSu: 25600 },
        { premio: 500, vincenti: 9600, unoSu: 4000 },
        { premio: 250, vincenti: 9600, unoSu: 4000 },
        { premio: 100, vincenti: 192000, unoSu: 200 },
        { premio: 50, vincenti: 320000, unoSu: 120 },
        { premio: 30, vincenti: 640000, unoSu: 60 },
        { premio: 15, vincenti: 1344000, unoSu: 28.57 },
        { premio: 10, vincenti: 2816000, unoSu: 13.64 }
      ],
      dichiarati: { payout: 0.601, quotaVincenti: 0.139, vincitaUnoSu: 7.20 },
      fonte: {
        ente: "ADM - Agenzia delle Dogane e dei Monopoli",
        descrizione: "Tabella premi ufficiale di una lotteria istantanea da 5 € (nome commerciale omesso)",
        url: "https://www.adm.gov.it/portale/en/-/numerissimi",
        sezione: "ricerca-azzardo.md §1.2",
        affidabilita: "UFF"
      }
    }
  ],
  // Simulatore dei ritardatari (concetto, non gioco selezionabile): un'estrazione di 5 numeri
  // su 90, come nel Lotto (ricerca-azzardo.md §2).
  estrazioni: { numeri: 90, estratti: 5, sezione: "ricerca-azzardo.md §2" },
  // Scala Italia (BR-14, L2): raccolta e perdita netta (spesa = raccolta - vincite) del gioco nel 2024.
  italia2024: {
    anno: 2024,
    perditaNetta: 21500000000,
    raccolta: 157450000000,
    testo: "Nel 2024 in Italia sono stati giocati 157,45 miliardi di euro e ne sono stati persi 21,5 miliardi",
    fonte: {
      ente: "ADM - Bilancio di esercizio 2024 (ripreso da agipronews.it e gioconews.it)",
      url: "https://www.agipronews.it/adm-bilancio-di-esercizio-2024-dal-settore-giochi-raccolta-superiore-a-157-miliardi-6-5-spesa-a-21-5-miliardi",
      sezione: "ricerca-azzardo.md §4",
      affidabilita: "UFF-sec"
    }
  },
  indipendenza: {
    testo: "Ogni estrazione e' indipendente dalle precedenti: un numero in ritardo non ha piu' probabilita' di uscire.",
    sezione: "ricerca-azzardo.md §2"
  },
  tettoPayoutLotterie: { valore: 0.75, testo: "Tetto medio di legge del payout sulle lotterie istantanee attive", sezione: "ricerca-azzardo.md §3", affidabilita: "UFF-sec" },
  numeroVerde: {
    numero: "800 55 88 22",
    nome: "Telefono Verde Nazionale per le problematiche legate al gioco d'azzardo (ISS)",
    orari: "lunedì-venerdì 10:00-16:00",
    note: "Gratuito e anonimo",
    url: "https://www.iss.it/en/dipendenze/-/asset_publisher/zwfXwoiZC6zu/content/telefono-verde-nazionale-per-le-problematiche-legate-al-gioco-d-azzardo-tvnga-800-55-88-22",
    sezione: "ricerca-azzardo.md §6",
    affidabilita: "UFF"
  },
  // Modalita' demo (BR-10): seme fisso e abitudine della persona Salvatore (10 €/giorno, idea-selezionata.md)
  seme: { demo: 20261005 },
  abitudineDemo: { voci: [{ gioco: "istantanea-5-a", volte: 2, periodo: "giorno" }] },
  personaDemo: { nome: "Salvatore", redditoMese: 1300 }
};
