# SECCI Lens ›

**Capire un finanziamento prima di firmare: legge il modulo SECCI, rifà i conti con i suoi numeri e lo spiega in parole semplici. Senza dirti cosa scegliere.**

Hagenthon · Accenture Application Engineering · Tema 02 — Inclusione Finanziaria

---

## Persona e barriera

**Samira, 41 anni.** Ha poca dimestichezza con i termini finanziari. In un negozio di elettrodomestici le propongono una lavatrice da 600 € **«a tasso zero»**, in 10 rate. Prima di firmare le danno il SECCI, «Informazioni europee di base sul credito ai consumatori». Si ferma in tre punti:

1. Il modulo scrive **TAN 0,00%** e, due righe sotto, **TAEG 14,19%**. Quale conta? Non era a tasso zero?
2. **«Importo totale dovuto dal consumatore: 636,00 €»**. Pensava di pagare 600 €.
3. Istruttoria, imposta di bollo e spese di incasso rata sono in righe diverse: **nessuno le somma**.

Le informazioni ci sono tutte. Il conto finale no: deve farlo lei, in negozio.

## Cosa fa

Una pagina web che usa la persona, da sola. Si incolla il testo del modulo, o si sceglie uno dei tre esempi.

| | |
|---|---|
| **Legge** | Trova le voci standard del SECCI («Importo totale del credito», «Durata del contratto di credito», «Rate ed, eventualmente, loro ordine di imputazione», «Importo totale dovuto dal consumatore», TAN, TAEG, spese). Ogni valore ha accanto **il brano esatto del documento**. Nessuna AI. |
| **Calcola** | TAEG con la formula della direttiva 2008/48/CE, piano delle rate mese per mese, costo del credito = totale dovuto − importo del credito. Nessuna AI. |
| **Controlla** | Rifà TAEG, totale dovuto e TAN dai numeri del documento. Se non coincidono: «Il TAEG calcolato dai dati del documento è 17,19%, il documento dice 6,08%. Puoi chiedere chiarimenti al finanziatore.» |
| **Spiega** | Otto schede: In sintesi (ricevi · restituisci · costo · durata), TAN e TAEG, Le rate, In cose di tutti i giorni (36,00 € = 30 caffè al bar), Controllo dei numeri, Frase per frase (originale accanto alla versione semplice), Confronta due offerte (solo fatti, nessuna classifica), Quiz (4 domande prima e dopo la lettura). |

## Provalo in 2 minuti

Serve Node.js 20 o successivo.

```bash
cd secci-lens/app
npm install
npm start
```

Apri:

- **L'app**: <http://localhost:8801/>. Scegli «Lavatrice tasso zero», poi «Lavatrice in 16 rate» per il controllo dei numeri e il confronto.
- **Presentazione per la commissione**: <http://localhost:8801/presentation/>, oppure apri direttamente `presentation/index.html`. Si naviga con ← →, F mette a schermo intero. I tre deliverable del tema sono in [presentation/deliverables.md](presentation/deliverables.md).

I tre documenti di esempio usano finanziatori e dati di fantasia:

| Esempio | Credito | TAEG scritto | TAEG calcolato | Totale dovuto | Costo del credito |
|---|---|---|---|---|---|
| Lavatrice «tasso zero» · Aurora Credito | 600,00 € in 10 rate, TAN 0,00% | 14,19% | 14,19% | 636,00 € | 36,00 € |
| Prestito personale · Banca Lanterna | 5.000,00 € in 48 rate, TAN 8,90% | 11,28% | 11,28% | 6.145,62 € | 1.145,62 € |
| Lavatrice in 16 rate · Faro Finanziaria | 600,00 € in 16 rate, TAN 5,90% | 6,08% | **17,19%** | 667,44 € | 67,44 € |

Nel terzo esempio il TAEG scritto è quello che si ottiene facendo il conto senza le spese: serve a mostrare il controllo dei numeri.

### Spiegazioni scritte dall'AI (facoltative)

Senza chiave l'app funziona tutta con le regole del programma. Per attivare Claude, imposta la chiave prima di `npm start`:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

In PowerShell: `$env:ANTHROPIC_API_KEY = "sk-ant-..."`. Variabili opzionali: `SECCI_MODEL` (predefinito `claude-opus-5-5`), `SECCI_AI=off` (forza le regole), `PORT` (predefinito 8801).

Con l'AI attiva compaiono due pulsanti:

- **«Trova i dati con l'AI»**, solo se il testo non usa le voci standard: Claude copia i brani con i dati, il programma controlla che ci siano davvero e fa tutti i conti;
- **«Spiegamelo in parole semplici con l'AI»**, nella scheda «Frase per frase».

## Struttura

```
secci-lens/
├── app/                        soluzione sviluppata
│   ├── public/                 l'app (servita su /)
│   │   ├── index.html, style.css, app.js
│   │   └── lib/                moduli ES condivisi tra browser e test
│   │       ├── finance.js      TAEG (direttiva 2008/48/CE), piano, coerenza, formati italiani
│   │       ├── parser.js       lettura a regole del SECCI, verifica delle citazioni AI
│   │       ├── explain.js      frasi semplici, cose di tutti i giorni, confronto, quiz
│   │       ├── guards.js       filtro dei consigli, controllo dei numeri
│   │       └── samples.js      tre SECCI di esempio con i flussi di cassa
│   ├── server.mjs              server locale (127.0.0.1): statici, /api/health, /api/extract, /api/explain
│   ├── server/agent.mjs        Claude + validatori
│   └── test/                   53 test (node:test), nessuna rete esterna
├── agents/                     struttura agentica (vedi agents/README.md)
├── presentation/               presentazione (index.html) e deliverable del tema (deliverables.md)
└── README.md
```

## Struttura agentica

I dettagli sono in [agents/README.md](agents/README.md). In sintesi:

- **Agenti di runtime** (facoltativi): `extract` e `explain`, con `claude-opus-5-5`, effort basso, JSON vincolato da schema e fallback lato server. I system prompt sono in [agents/prompts/](agents/prompts/), letti dal server all'avvio. Ogni risposta passa dai validatori, altrimenti restano le regole.
- **Sviluppo con Claude Code**:
  - le istruzioni di progetto ([CLAUDE.md](agents/CLAUDE.md));
  - 2 subagenti: `numbers-fidelity-reviewer`, `plain-language-reviewer`;
  - 2 comandi: `/demo-check`, `/nuovo-documento`;
  - 1 skill: `spiegare-il-credito`;
  - il [workflow](agents/workflow.md): questa demo è stata costruita da un subagente di Claude Code a partire da una specifica della sessione principale; lì c'è anche cosa resta da rivedere a mano.

## Semplificare senza tradire, senza consigliare

- **Il codice calcola, l'AI spiega, un validatore controlla.** Nessun numero mostrato nasce dall'AI.
  - L'estrazione AI restituisce solo citazioni: `fromAiFields` (in `app/public/lib/parser.js`) le accetta solo se compaiono nel documento e se il valore è dentro la citazione; il numero lo legge il codice.
  - Nelle spiegazioni AI ogni numero deve comparire nel documento o nei calcoli, con le varianti di formato italiane (`checkNumbers` in `guards.js`), e la frase originale deve essere citata parola per parola (`validateExplanation` in `app/server/agent.mjs`).
- **La frase originale è sempre accanto** alla versione semplice, e il documento intero resta consultabile con i dati evidenziati.
- **I numeri del documento non vengono corretti**: le differenze si mostrano, in modo neutro.
- **Nessun consiglio.** `findAdvice` blocca «ti conviene», «ti consiglio», «è meglio», «scegli», «dovresti» e simili: una frase così fa scartare tutta la risposta dell'AI. Il confronto riporta solo fatti («costa 31,44 € in più, dura 6 mesi in più»). I test passano dallo stesso filtro tutti i testi a regole.
- **Privacy e sicurezza.**
  - I calcoli avvengono nel browser. Il testo va al server solo se si chiede l'aiuto dell'AI.
  - La chiave AI resta sul server, che ascolta solo su `127.0.0.1`.
  - Le API accettano solo richieste dalla pagina stessa (controllo dell'origine), corpo massimo 64 KB, al massimo 20 richieste al minuto.
  - Content Security Policy senza script in linea; il testo incollato non viene mai interpretato come HTML.
- **Accessibilità.** `lang="it"`, HTML semantico, schede usabili con le frecce, focus visibile, obiettivi di almeno 44 px, contrasto AA, risultati annunciati con `aria-live`, `prefers-reduced-motion`, layout responsive. Linguaggio neutro e nessuna etichetta sulla persona.

## Limiti

- Legge solo testo incollato: niente PDF o foto.
- Riconosce le etichette standard del SECCI italiano; per testi diversi serve l'AI facoltativa.
- Tasso fisso e rate costanti, prima rata un mese dopo l'erogazione, mese = 1/12 di anno. Niente revolving, tasso variabile o date precise.
- Se il documento non dice quando si paga una spesa, il calcolo la considera alla firma (ipotesi prudente, mostrata nella pagina).
- I documenti di esempio sono di fantasia: vanno confrontati con moduli SECCI veri.
- Il quiz prima e dopo non è stato provato con utenti reali: finora solo dal team.
- La chiamata a Claude è testata con un client simulato. Va provata con una chiave vera prima della demo.
- L'interfaccia è stata verificata con test in Node e con un DOM simulato; va provata nel browser, anche con tastiera e lettore di schermo.

## Verifica di mercato

Ricerca del 5 ottobre 2026:

| Prodotto | Cosa fa | Perché non copre il bisogno |
|---|---|---|
| Calcolatori di rata e TAEG | Calcolano con numeri inseriti a mano | Non leggono il documento e non spiegano nulla |
| Banca d'Italia, «Il credito ai consumatori in parole semplici» | Guida educativa | È statica, uguale per tutti: non parla del tuo modulo |
| Comparatori (Facile.it, Segugio) | Mettono le offerte in classifica | La classifica è proprio il consiglio che il tema vieta |
| Lettori AI di documenti (es. TurnKey Lender) | Leggono documenti di credito | Lavorano per chi presta, non per chi chiede il prestito |

Non abbiamo trovato **nessuno strumento per il consumatore che legga un SECCI italiano e lo spieghi**.

## Note

I documenti di esempio sono **dimostrativi**: finanziatori, negozi, indirizzi e contatti sono di fantasia (domini `.example`). SECCI Lens è uno strumento educativo: non è consulenza finanziaria.
