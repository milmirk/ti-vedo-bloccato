# Bilancio senza numeri ›

**Il budget per chi fa fatica con i numeri: i soldi che restano fino allo stipendio, mostrati come le cose che compri. E un coach che controlla se è chiaro, e cambia modo quando non lo è.**

Hagenthon · Accenture Application Engineering · Tema 02 — Inclusione Finanziaria

---

## Persona e barriera

**Marco, 35 anni, con discalculia.** Lavora, ha uno stipendio e paga le sue cose da solo. A metà mese va in rosso, e non capisce perché.

- **Il saldo non gli dice niente.** «186,40 €» è una scritta: non sa trasformarla in «ci arrivo al giorno di paga?».
- **Il conto che serve è proprio quello difficile.** Bisogna dividere per i giorni che mancano e togliere ogni spesa. Di solito non lo fa.
- **I movimenti sono un muro**: date, sigle (POS, SDD, ATM), importi con la virgola e il segno meno.
- **Le app di budget mostrano altri numeri**: grafici, percentuali, «quanto puoi spendere oggi».
- Però sa benissimo **cosa costa un caffè, una pizza, una spesa al supermercato**.

## Cosa fa

Una web app per il telefono, in italiano, che si usa con il pollice.

| | |
|---|---|
| **Imposta in tre passi** | L'unico numero da scrivere è quanto c'è fino al prossimo stipendio, con un tastierino grande. Sotto compare subito la stessa cifra fatta di oggetti. Poi il giorno di paga, su un calendario grande o con «Il 27 di ogni mese». Infine da tre a cinque oggetti suoi, scelti da una griglia con icone: caffè, pizza, pranzo fuori, spesa piccola, pieno di benzina, biglietto del bus… Il prezzo è proposto e si può cambiare. |
| **Mostra senza numeri** | «Fino a sabato diciassette ottobre · tra undici giorni», con un puntino per ogni giorno. «Ti restano: cinque spese piccole, un pranzo fuori e qualche spicciolo», disegnati come barattoli di icone. «Oggi puoi usare circa: una pizza e due caffè.» Con «Mostra anche gli euro» compaiono le cifre esatte, per chi le vuole. |
| **Segna con un tocco** | «Ho preso: un caffè» toglie un caffè. «Altro» permette più cose insieme, oppure una frase: «ho fatto la spesa, circa 30 euro». Ogni spesa si annulla con un tocco. Tutto resta nel telefono (`localStorage`). |
| **Controlla se è chiaro** | Ogni tanto chiede una cosa concreta sulla situazione vera: «Se prima di sabato prendi sei spese piccole, bastano i soldi che ti restano?» (Sì / No / Non so). La risposta giusta la calcola il codice. Il riscontro è un fatto: «La risposta è no. Non bastano: mancherebbero soldi per circa un pranzo fuori.» |
| **Si adatta** | Se la risposta non torna, o è «Non so», cambia il modo di mostrare i soldi: tutti gli oggetti → solo i più piccoli → giorno per giorno → solo oggi. Il cambio resta registrato. Il pannello «Come lo capisci meglio» mostra le risposte nel tempo e quale modo funziona meglio per lui. |
| **Legge ad alta voce** | «Leggimelo» legge il riepilogo con la voce italiana del dispositivo. Se il browser non ha la sintesi vocale, lo dice e basta. |

## Provalo in 2 minuti

Serve Node.js 20 o successivo.

```bash
cd bilancio-senza-numeri/app
npm install
npm start
```

Apri:

- **L'app**: <http://localhost:8802/>. Si parte dall'impostazione, oppure si sceglie «Prova con l'esempio di Marco».
- **L'esempio di Marco, pronto**: <http://localhost:8802/?demo=marco>. Il giorno di paga cade sempre tra undici giorni e la prima domanda compare subito. Aggiungendo `&oggi=2026-10-06` si fissa la data e si vedono esattamente i testi della presentazione.
- **Presentazione per la commissione**: <http://localhost:8802/presentation/>, oppure apri direttamente `presentation/index.html`. Si naviga con ← →, F mette a schermo intero. I tre deliverable del tema sono in [presentation/deliverables.md](presentation/deliverables.md).

Test: `npm test` (70 test, `node:test`, nessuna rete).

### Frasi libere con l'AI (facoltativo)

Senza chiave l'app funziona tutta: i pulsanti e l'interprete a regole capiscono frasi semplici come «un caffè», «2 pizze», «spesa 30», «due caffè e un panino». Per le frasi più libere si può attivare Claude impostando la chiave prima di `npm start`:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

In PowerShell: `$env:ANTHROPIC_API_KEY = "sk-ant-..."`. Variabili opzionali:

- `BSN_MODEL`: il modello, predefinito `claude-opus-5-5`;
- `BSN_AI=off`: forza le regole anche con la chiave;
- `PORT`: la porta, predefinita 8802.

## Struttura

```
bilancio-senza-numeri/
├── app/                        soluzione sviluppata
│   ├── public/
│   │   ├── index.html          interfaccia (mobile, accessibile)
│   │   ├── style.css
│   │   ├── app.js              solo DOM ed eventi
│   │   └── lib/                tutta la logica, moduli ES condivisi con i test
│   │       ├── units.js        oggetti e scomposizione greedy
│   │       ├── dates.js        giorni fino alla paga, fine mese, cambio d'anno
│   │       ├── budget.js       stato, spese, annulla, parte di oggi
│   │       ├── words.js        numeri in lettere, frasi senza cifre
│   │       ├── view.js         cosa mostra la schermata
│   │       ├── questions.js    domande di comprensione
│   │       ├── adapt.js        regole di adattamento ed evidenza
│   │       ├── parser.js       frasi semplici, senza AI
│   │       └── demo.js         l'esempio di Marco
│   ├── server.mjs              server locale (127.0.0.1), /api/health, POST /api/interpreta
│   ├── server/agent.mjs        interprete delle frasi con Claude + validatore
│   └── test/                   70 test (node:test), nessuna rete
├── agents/                     struttura agentica (vedi agents/README.md)
├── presentation/               presentazione (index.html) e deliverable del tema (deliverables.md)
└── README.md
```

## Struttura agentica

I dettagli sono in [agents/README.md](agents/README.md). In sintesi:

- **Il ciclo che si adatta** (mostra → chiede → valuta → adatta) è codice deterministico in `app/public/lib/`. Le regole sono scritte in testa ad `adapt.js` e tutte testate. Nessuna AI decide come mostrare i soldi.
- **L'interprete delle frasi** usa `claude-opus-5-5` con effort basso, output JSON vincolato da schema e fallback lato server. Il system prompt è in [agents/prompts/interpreta-spesa.md](agents/prompts/interpreta-spesa.md). Ogni risposta passa dal validatore.
- **Sviluppo con Claude Code**:
  - le istruzioni di progetto ([CLAUDE.md](agents/CLAUDE.md));
  - 2 subagenti: `nessun-numero-reviewer` e `domande-designer`;
  - 2 comandi: `/demo-check` e `/nuova-domanda`;
  - 1 skill: `soldi-in-oggetti`;
  - il [workflow](agents/workflow.md), con cosa ha fatto l'AI e dove serve la revisione umana.

## Garanzie

- **Nessun consiglio finanziario.** L'app non dice cosa comprare né se una spesa va fatta. Mostra fatti neutri: «Se lo prendi, i giorni dopo avranno un po' meno». Mai «dovresti», «attenzione», «risparmia».
- **L'AI non fa mai conti.** Il modello non riceve i prezzi. Un importo è accettato solo se compare nel testo della persona, come numero intero: «3» non vale se il testo dice «30». Altrimenti si usa il prezzo noto dell'oggetto, oppure la risposta viene scartata. Il totale lo calcola il codice, in centesimi interi.
- **Senza numeri per davvero.** Un test genera più di mille testi in decine di situazioni e verifica che, con gli euro spenti, nessuno contenga cifre, € o «euro».
- **La cifra vera è sempre a un tocco.** «Mostra anche gli euro» mostra ogni importo al centesimo, e il resto («qualche spicciolo») non sparisce.
- **Niente etichette.** L'interfaccia non nomina mai la discalculia. Il linguaggio è neutro rispetto al genere.
- **Accessibilità.**
  - `lang="it"` e HTML semantico.
  - Focus sempre visibile; tutto si usa da tastiera, anche il tastierino.
  - Bersagli di almeno 44 px, contrasto AA.
  - Icone sempre accompagnate da un testo.
  - `aria-live` per gli aggiornamenti, `prefers-reduced-motion` rispettato.
- **Privacy e sicurezza.**
  - I dati restano nel browser.
  - Il server ascolta solo su `127.0.0.1`.
  - `/api/interpreta` accetta solo richieste dalla pagina stessa, al massimo 30 al minuto, con corpi fino a 64 KB.
  - Il server blocca i percorsi che escono dalla cartella e ha una Content Security Policy.
  - Una richiesta malformata non fa mai cadere il server.

## Limiti

- **Mai provato con persone con discalculia.** L'evidenza nella presentazione è un'esecuzione interna, con risposte scelte da noi.
- La scomposizione greedy non è sempre la più intuitiva: sedici euro diventano «un pranzo fuori, tre caffè e qualche spicciolo», non «due pizze».
- I prezzi proposti sono indicativi finché la persona non li cambia.
- Le spese si segnano a mano: non c'è collegamento con la banca, e le spese fisse (affitto, bollette) non sono separate.
- Domande e regole di adattamento sono ipotesi ragionate, da validare con esperti e utenti.
- La voce dipende dal dispositivo: non tutti hanno una voce italiana installata.
- La chiamata a Claude è testata con un client simulato, mai con una chiave vera.
- L'interfaccia è stata verificata con schermate di Chrome senza interfaccia e con i test. Va provata nel browser vero, anche con un lettore di schermo (NVDA, VoiceOver).

## Revisione

A fine sviluppo il subagente **`nessun-numero-reviewer`** ha riletto in sola lettura tutti i testi: interfaccia, frasi generate in molte situazioni, domande, riscontri e prompt. Ha trovato 31 osservazioni, tutte applicate e coperte dai test dove possibile. Le principali:

- **Una cifra sfuggita**: il badge «Data di prova: martedì 6 ottobre». Ora è in lettere, e «primo» al posto di «uno» per il primo del mese.
- **Accordi**: «Ti resta un caffè» al posto di «Ti restano un caffè», e niente più «circa meno di un caffè».
- **Domande e riscontri più chiari**: «Se oggi prendi due pizze, resti dentro quello che puoi usare oggi?». Il riscontro dice prima la risposta: «Esatto, la risposta è no. Non bastano: …».
- **Domande non banali**: la combinazione deve stare tra 0,6 e 1,6 volte la soglia.
- **Interprete delle frasi**:
  - «due caffè e un panino, 8 euro» è un totale;
  - «mi hanno ridato 5 euro» non è una spesa;
  - «un paio» vale due.

Il dettaglio è in [agents/workflow.md](agents/workflow.md#revisione).

## Verifica di mercato

Ricerca web del 5 ottobre 2026:

| Prodotto | Cosa fa | Perché non copre il bisogno |
|---|---|---|
| Dysia (iOS, in inglese) | Aiuta alla cassa gli adulti con discalculia | Non fa il budget |
| SafeToSpend, DaySum | «Quanto puoi spendere oggi» | Resta una cifra |
| Monzo Pots | Salvadanai per obiettivi | Numerici |
| PayAbility, progetto di Stanford | Prototipi di studenti sul tema | Non sono prodotti |

Understood.org nota che poche app si rivolgono ad adulti con difficoltà con i numeri. **Non abbiamo trovato nulla in italiano, e nulla senza numeri.**

## Note

L'app della banca nella presentazione è **dimostrativa**: dati inventati, nessun marchio reale. L'esempio di Marco usa dati inventati.
