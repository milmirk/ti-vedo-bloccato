# Ti vedo bloccato ›

**Un compagno che si accorge quando ti fermi su un servizio online e ti dà un solo suggerimento, nel punto giusto.**

Hagenthon · Accenture Application Engineering · Tema 01 — Accessibilità Digitale

---

## Persona e barriera

**Luca, 29 anni, ADHD.** Deve prenotare il rinnovo della Carta d'Identità Elettronica su Agenda CIE. Sa usare il computer, ma si ferma in quattro punti precisi:

1. **Si distrae**, cambia scheda e quando torna non sa più dove era.
2. **Errore criptico**: scrive il codice fiscale con gli spazi e il sito risponde solo «Valore non conforme (ERR_CF_016)».
3. **Calendario vuoto**: tutti i giorni del mese sono grigi e la freccia per il mese dopo è minuscola.
4. **Pulsante morto**: «Conferma prenotazione» non risponde perché manca la spunta sull'informativa, in fondo a un lungo testo legale.

Oggi, a uno di questi punti, chiude la scheda e rimanda.

## Cosa fa

Un'estensione Chrome che **installa la persona**, non il sito. È attiva sui siti della pubblica amministrazione (`*.gov.it`, INPS, pagoPA) e non su banca o webmail. L'elenco dei siti si può modificare:

| | |
|---|---|
| **Percepisce** | 7 segnali di blocco: inattività, rientro dopo una distrazione, click su elementi disattivati, raffiche di click, errori su un campo, avanti e indietro tra i passi, esitazione su un campo. |
| **Capisce** | Legge il punto in cui la persona è ferma: passo, campo, errore mostrato, campi obbligatori vuoti. **Non legge mai i valori** che la persona scrive. |
| **Aiuta** | La scheda compare **subito**, entro circa due decimi di secondo, **dentro la pagina** subito dopo il blocco su cui agire: il testo sotto scende, non viene coperto. Mostra **un** suggerimento. Se Claude risponde entro pochi secondi e la persona non ha ancora agito, il testo viene aggiornato. «Mostrami dove» evidenzia l'elemento e ci porta il focus. |
| **Impara** | "Non ora" alza la soglia di quel segnale, "Mi è servito" la riabbassa. La persona sceglie quanto spesso intervenire o mette in pausa per 10 minuti. Con «normale» interviene al primo click su un pulsante disattivato o al primo errore; con «di rado» aspetta che si ripetano. |

## Provalo in 2 minuti

Serve Node.js 20 o successivo.

```bash
cd ti-vedo-bloccato/app
npm install
npm start
```

Apri:

- **Prima** (senza assistente): <http://localhost:8787/demo/?assistente=0>
- **Dopo** (con assistente): <http://localhost:8787/demo/?assistente=1>
- **Presentazione per la commissione**: <http://localhost:8787/presentation/>, oppure apri direttamente `presentation/index.html`. Si naviga con ← →, F mette a schermo intero. I tre deliverable del tema sono in [presentation/deliverables.md](presentation/deliverables.md).

Alla fine di ogni prova la pagina mostra le metriche (tempo, errori, click a vuoto, passi indietro, suggerimenti) e confronta le due modalità.

### Suggerimenti scritti dall'AI

Senza chiave il prototipo usa i suggerimenti a regole. Per attivare Claude, imposta la chiave prima di `npm start`:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

In PowerShell: `$env:ANTHROPIC_API_KEY = "sk-ant-..."`. Variabili opzionali: `TVB_MODEL` (predefinito `claude-opus-5-5`), `TVB_AI=off` (forza le regole), `PORT` (predefinito 8787).

### Come estensione Chrome, sui siti veri

1. Apri `chrome://extensions` e attiva **Modalità sviluppatore**.
2. **Carica estensione non pacchettizzata** e scegli la cartella `app/extension`.
3. Tieni acceso `npm start` per i suggerimenti AI. Senza server l'estensione usa le regole.
4. Per aggiungere un sito, aggiungilo a `content_scripts.matches` in `app/extension/manifest.json` e ricarica l'estensione.
5. Facoltativo: imposta `TVB_EXTENSION_ID`. Così il server accetta solo la tua estensione (l'ID è in `chrome://extensions`).

## Struttura del repository

```
/
├── app/                      soluzione sviluppata
│   ├── extension/            estensione Chrome (Manifest V3)
│   │   ├── content/
│   │   │   ├── detector.js        motore dei segnali di blocco (logica pura, testata)
│   │   │   ├── context.js         lettura della pagina, privacy by design
│   │   │   ├── fallback-hints.js  suggerimenti a regole, senza AI
│   │   │   └── companion.js       osservazione del DOM e interfaccia (Shadow DOM)
│   │   ├── background.js     inoltro al server
│   │   └── popup.html/js     impostazioni
│   ├── server/
│   │   ├── server.mjs        demo, presentazione, POST /api/hint
│   │   └── hint-agent.mjs    Claude + controlli di fedeltà
│   ├── demo-site/            replica dimostrativa di Agenda CIE
│   └── test/                 38 test (node:test), nessuna rete
├── agents/                   struttura agentica (vedi agents/README.md)
├── presentation/             presentazione per la commissione (index.html) e deliverable del tema (deliverables.md)
└── README.md
```

## Struttura agentica

I dettagli sono in [agents/README.md](agents/README.md). In sintesi:

- **Agente di runtime**: `hint agent` con `claude-opus-5-5`, effort basso e output JSON vincolato da schema. Il system prompt è in [agents/prompts/hint-agent.md](agents/prompts/hint-agent.md). C'è un fallback lato server verso un altro modello in caso di rifiuto. Ogni risposta passa dai controlli di fedeltà, altrimenti si usano le regole.
- **Sviluppo con Claude Code**:
  - le istruzioni di progetto ([CLAUDE.md](agents/CLAUDE.md));
  - 3 subagenti: `struggle-signal-designer`, `hint-copy-reviewer`, `a11y-persona-tester`;
  - 3 comandi: `/demo-check`, `/new-signal`, `/review-hints`;
  - 1 skill: `plain-italian-hints`;
  - il [workflow](agents/workflow.md), con cosa ha fatto l'AI e dove è servita la revisione umana.

## Semplificare senza tradire

- **Il sito non viene riscritto.** Il suggerimento si aggiunge alla pagina. In "Perché me lo dici?" la persona trova il motivo dell'intervento e il testo originale citato.
- **Ogni nome tra «» nel suggerimento AI deve esistere nella pagina**, altrimenti il suggerimento viene scartato (`validateHint` in `app/server/hint-agent.mjs`).
- **Citazioni e bersagli verificati.** La citazione deve comparire testualmente nella pagina. Il bersaglio deve essere uno degli elementi reali.
- **Privacy.**
  - Nessun valore dei campi lascia la pagina. Non usiamo i messaggi di errore del browser, che possono citare ciò che hai scritto, e non leggiamo il testo delle aree modificabili.
  - Email, codice fiscale (anche con omocodia), IBAN e numeri lunghi vengono mascherati prima di tagliare i testi.
- **Sicurezza.**
  - La chiave AI resta sul server, che ascolta solo su `127.0.0.1`.
  - `/api/hint` accetta solo la demo e l'estensione, con un limite di 30 richieste al minuto.

## Autonomia e limiti

**Cosa guadagna Luca.** Completa la prenotazione senza chiedere aiuto, riparte dal punto giusto dopo una distrazione e capisce perché il sito "non risponde".

**Limiti.**

- Le soglie dei segnali sono ipotesi ragionate, da tarare con utenti reali.
- Ci possono essere falsi allarmi, per esempio con chi legge a lungo senza muovere nulla.
- Funziona solo su Chrome desktop e sui siti in elenco. Contenuti in canvas o iframe esterni non vengono letti.
- Etichette e testi della pagina vengono inviati al modello AI, e i nomi propri non vengono mascherati.
- Il testo dell'AI arriva in qualche secondo. Se nel frattempo la persona ha già agito, resta il suggerimento a regole.
- Su siti con layout molto particolari la scheda potrebbe non trovare un punto adatto nella pagina. In quel caso resta fluttuante in un angolo.
- La chiamata a Claude è testata con un client simulato e con una chiave finta, che viene rifiutata. Va provata con una chiave vera prima della demo.
- Il rilevamento dei click su pulsanti disattivati è verificato con eventi simulati. Va provato con l'estensione installata in Chrome.

## Verifica di mercato

L'idea nasce da una ricerca su 21 idee per i tre temi della sfida (5 ottobre 2026, ricerche web in italiano, inglese e tedesco):

| Prodotto | Cosa fa | Perché non copre il bisogno |
|---|---|---|
| WalkMe, Whatfix, Pendo | Guide dentro i software | Li installa l'azienda o il sito |
| Microsoft Clarity, Dynatrace | Rilevano i "rage click" | Servono come statistiche per il sito |
| Gemini Live, Copilot Vision | Aiutano sullo schermo | Intervengono solo se interpellati |

Esistono solo prototipi di ricerca o da hackathon (Lenz, FocusUp). Non abbiamo trovato **nessun prodotto commerciale installato dalla persona che si accorga da solo del blocco**.

## Revisione

A fine sviluppo sono stati lanciati due subagenti in sola lettura. Le correzioni sono state applicate dopo, con i test aggiornati.

- **`hint-copy-reviewer`** (testi). Ha trovato 24 problemi.
  - Il titolo della scheda era al maschile («Ti vedo un po' bloccato»): ora è «Ti do una mano?».
  - Alcune frasi a regole non indicavano un'azione o affermavano cose non verificabili: ora usano un verbo per tipo di elemento (compila, scegli, spunta).
  - Alcune istruzioni del prompt invitavano a indovinare la causa del blocco.
  - Mancava la regola di non nominare diagnosi della persona.
  - Il popup usava gergo tecnico.
- **Revisione del codice** (bug, privacy, sicurezza). Ha trovato 15 problemi, tutti corretti:
  - **Sicurezza.**
    - Il server ascoltava su tutta la rete: ora solo su `127.0.0.1`, con origine obbligatoria e limite al minuto.
    - Un indirizzo malformato o un corpo `null` facevano cadere il server: ora ricevono una risposta 400.
  - **Privacy.**
    - Il messaggio di errore nativo del browser poteva contenere il valore scritto.
    - Paragrafi e aree modificabili potevano diventare il "bersaglio".
    - Il percorso URL finiva nel contesto.
    - Il taglio dei testi avveniva prima del mascheramento.
    - L'estensione girava su tutti i siti.
  - **Falsi allarmi.**
    - I click nei campi di testo contavano come "raffica".
    - L'inattività scattava subito dopo il primo click.
    - Il focus restituito al rientro nella scheda contava come esitazione.
    - Le ancore "#" interne venivano scambiate per cambi di passo.
  - **Correttezza.**
    - Un suggerimento arrivato in ritardo poteva comparire sul passo sbagliato.
    - Una scheda ignorata bloccava i successivi: ora si chiude da sola dopo un minuto.
    - Gli errori inviati da tastiera non venivano contati.
    - I radio prendevano il nome della prima opzione.
    - Il calendario nascondeva gli orari e «Avanti».
    - Il campo `why` non veniva controllato.
- **Prova finale.** Dopo le correzioni, il percorso con i quattro punti di blocco è stato rifatto nel browser: quattro suggerimenti corretti in sequenza, nessun errore in console.

## Note

La replica di Agenda CIE in `app/demo-site` è **dimostrativa**: non è il sito ufficiale, non usa loghi istituzionali e non invia dati.
