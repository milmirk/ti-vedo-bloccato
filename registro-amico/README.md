# Registro amico ›

**La palestra del registro elettronico: un registro di prova, un aiuto nella propria lingua che si fa da parte man mano che si impara.**

Hagenthon · Accenture Application Engineering · Tema 03 — Educazione Digitale Inclusiva

---

## Learner profile e barriera

**Fatima, 38 anni.** Madrelingua araba, italiano livello A2. Il figlio Youssef è in prima media (classe 1ª B). La scuola chiede di fare quasi tutto sul registro elettronico, e Fatima si ferma su quattro azioni:

1. **Giustificare un'assenza**: non sa cosa vogliono dire «Giustifica», «Da giustificare», «Ritardo».
2. **Prenotare un colloquio**: «Vedi orari», «Completo», «Libero», e il timore di sbagliare insegnante.
3. **Leggere una comunicazione**: testo burocratico, e la richiesta di una «Presa visione».
4. **Trovare un voto**: materie, medie, «Scritto», «Orale».

Sul registro vero ogni clic arriva alla scuola, e non c'è un posto per provare. Oggi Fatima chiede a Youssef di tradurre, oppure rimanda.

## Cosa fa

Una web app con **un registro scolastico di prova** (inventato, senza nomi o loghi di prodotti reali) e **un aiuto accanto**, che allena la persona sulle quattro azioni.

| | |
|---|---|
| **Registro di prova** | Home, Assenze, Voti, Colloqui, Bacheca, Pagella, con i dati inventati di Youssef. Il registro resta **in italiano**, come quello vero. Niente viene inviato a nessuno. |
| **Aiuto nella propria lingua** | Arabo (`lang="ar"`, `dir="rtl"`), inglese o italiano semplice, da cambiare in qualsiasi momento. Istruzioni, suggerimenti e feedback sono nella lingua scelta; le parole del registro restano **in italiano tra «»** (per esempio «Giustifica»), così la persona le riconosce sul registro vero. |
| **4 esercizi** | Giustificare un'assenza, prenotare un colloquio, leggere una comunicazione e mettere la presa visione, trovare un voto. Ogni esercizio è una macchina a stati con i passi richiesti e i feedback per gli errori tipici. |
| **Percorso adattivo** | **1 Guidato** (istruzione di ogni passo e riquadro viola sul prossimo elemento) → **2 Suggerimento** (nessuna istruzione; un suggerimento solo se la persona si ferma 10 secondi o sbaglia 2 volte sullo stesso passo) → **3 In autonomia** (nessun aiuto, si misura). Si torna al livello 2 con 3 errori o più, o se l'esercizio non viene finito. |
| **Glossario** | 26 parole della scuola (giustificazione, assenza, ritardo, uscita anticipata, colloquio, presa visione, bacheca, pagella, scrutinio, nota disciplinare, compiti, verifica, coordinatore di classe…), in italiano semplice, arabo e inglese. Si tocca la parola sottolineata nel registro. |
| **«Spiegami questa comunicazione»** | Spiegazione semplice di un avviso della bacheca nella lingua scelta, sotto il testo originale che resta visibile. Con la chiave AI la scrive Claude; senza, si usa quella già pronta. |
| **I tuoi progressi** | Per ogni esercizio, la tabella dei tentativi (tempo, errori, suggerimenti, livello, esito), la frase «Ce l'hai fatta senza aiuto» quando lo completa al livello 3, e la verifica delle parole (5 domande) prima e dopo. |

## Provalo in 2 minuti

Serve Node.js 20 o successivo.

```bash
cd registro-amico/app
npm install
npm start
```

Apri:

- **La palestra**: <http://localhost:8805/>. Per ripartire da zero in arabo: <http://localhost:8805/?reset=1&lang=ar>.
- **Presentazione per la commissione**: <http://localhost:8805/presentation/>, oppure apri direttamente `presentation/index.html`. Si naviga con ← →, F mette a schermo intero. I tre deliverable del tema sono in [presentation/deliverables.md](presentation/deliverables.md).

Percorso consigliato: scegli l'arabo, fai le 5 domande, poi ripeti tre volte «Giustificare un'assenza» (livello 1 con un errore, livello 2 fermandoti 10 secondi, livello 3 senza aiuto) e apri «I tuoi progressi».

### Spiegazioni scritte dall'AI (facoltativo)

Senza chiave l'app funziona tutta: ogni comunicazione ha la spiegazione già pronta nelle 3 lingue. Per attivare Claude, imposta la chiave prima di `npm start`:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

In PowerShell: `$env:ANTHROPIC_API_KEY = "sk-ant-..."`. Variabili opzionali: `RA_MODEL` (predefinito `claude-opus-5-5`), `RA_AI=off` (forza le spiegazioni già pronte), `PORT` (predefinito 8805).

```bash
npm test   # 64 test (node:test), nessuna rete esterna
```

## Struttura

```
registro-amico/
├── app/                          soluzione sviluppata
│   ├── server.mjs                server Node (127.0.0.1:8805): statici, /presentation/, /api/health, /api/explain
│   ├── server/agent.mjs          "Spiegami questa comunicazione": Claude + validazione
│   ├── public/
│   │   ├── index.html, style.css, app.js     registro di prova e pannello di aiuto (solo DOM)
│   │   └── lib/                  moduli ES puri, usati da browser, server e test
│   │       ├── data.js           registro inventato, etichette del registro, comunicazioni
│   │       ├── tasks.js          i 4 esercizi come macchine a stati
│   │       ├── coach.js          livelli, rilevamento del blocco, metriche, progressi
│   │       ├── glossary.js       26 parole della scuola in 3 lingue
│   │       ├── i18n.js           testi dell'aiuto in arabo, inglese, italiano semplice
│   │       ├── quiz.js           verifica delle parole prima/dopo
│   │       └── facts.js          controllo di date, orari e numeri
│   └── test/                     64 test (node:test)
├── agents/                       struttura agentica (vedi agents/README.md)
├── presentation/                 presentazione (index.html) e deliverable del tema (deliverables.md)
└── README.md
```

## Struttura agentica

I dettagli sono in [agents/README.md](agents/README.md). In sintesi:

- **Capacità agentica a runtime: il percorso adattivo.** Codice deterministico e testato (`coach.js`): osserva ogni azione sul registro, rileva il blocco (10 secondi ferma, oppure 2 click sbagliati sullo stesso passo), dà un feedback mirato sull'errore e decide il livello del tentativo successivo.
- **Agente AI facoltativo** per «Spiegami questa comunicazione»: `claude-opus-5-5`, effort basso, output JSON vincolato da schema, fallback lato server (`fallbacks: "default"`). Il system prompt è in [agents/prompts/spiega-comunicazione.md](agents/prompts/spiega-comunicazione.md). Ogni risposta passa da `validateExplanation`, altrimenti si usa la spiegazione già pronta.
- **Sviluppo con Claude Code**: istruzioni di progetto ([CLAUDE.md](agents/CLAUDE.md)); 2 subagenti (`translation-fidelity-reviewer`, `learner-path-tester`); 2 comandi (`/demo-check`, `/nuovo-compito`); 1 skill (`istruzioni-multilingue-semplici`); il [workflow](agents/workflow.md), con cosa ha fatto l'AI e dove serve la revisione umana.

## Garanzie

- **Il testo originale resta sempre visibile.** La spiegazione compare sotto la comunicazione, mai al suo posto, con la nota «in caso di dubbio vale l'originale».
- **Niente date o numeri inventati.** Ogni spiegazione, dell'AI o già pronta, viene scartata se contiene una data, un orario, un numero, un mese o un giorno della settimana che non sono nell'originale (anche con cifre arabe ٠١٢…). Anche le parole tra «» devono esistere nella comunicazione o nel registro, e la lingua deve essere quella chiesta.
- **Nessuna consulenza.** L'aiuto spiega il registro e le comunicazioni; non dà consigli legali, sanitari o amministrativi.
- **Il registro non è riscritto.** Resta in italiano: l'aiuto si aggiunge accanto.
- **Linguaggio neutro.** L'app è per qualsiasi genitore: in italiano forme senza genere («Ce l'hai fatta senza aiuto», livello «In autonomia»), in arabo «يُرجى» + nome verbale e forme scritte uguali per madre e padre. Un test controlla che i testi arabi non usino imperativi solo maschili o solo femminili.
- **Privacy e sicurezza.** I progressi restano nel browser (localStorage). Il server ascolta solo su `127.0.0.1`; `/api/explain` accetta solo richieste dalla pagina stessa, in JSON, fino a 64 KB, con un limite al minuto. Il testo da spiegare non arriva dal browser: il server usa le proprie comunicazioni, così la chiave non può servire ad altro. Protezione dai percorsi `../`, intestazioni di sicurezza e CSP.
- **Accessibilità.** `lang` e `dir` per ogni lingua, HTML semantico, tutto da tastiera (Esc chiude il glossario), fuoco visibile, bersagli di almeno 44 px, contrasto AA, suggerimenti annunciati con `aria-live`, `prefers-reduced-motion`, layout per smartphone.

## Limiti

- **I testi in arabo vanno rivisti da una persona madrelingua prima di qualsiasi uso reale.** Sono una bozza in arabo standard moderno; va verificata anche la scelta tra parole del Maghreb e del Medio Oriente.
- Glossario e situazioni vanno verificati con **mediatori culturali** e personale della scuola.
- **Nessuna prova con genitori veri, finora.** Le soglie (10 secondi, 2 errori, 3 errori) sono ipotesi da tarare. I numeri mostrati nella presentazione vengono da un test automatico con orologio finto, non da persone.
- Il registro è simulato: i registri veri cambiano da scuola a scuola, e alcune azioni (per esempio un PIN per giustificare) qui non ci sono.
- La chiamata a Claude è testata con un client simulato; va provata con una chiave vera, in particolare in arabo. Il controllo dei fatti riconosce numeri in cifre, non numeri scritti in lettere.
- I progressi sono legati al browser e al dispositivo.

## Verifica di mercato

Ricerca web del 5 ottobre 2026 (i nomi dei prodotti compaiono solo qui e nella slide di mercato, mai nell'app):

| Cosa esiste | Cosa fa | Perché non copre il bisogno |
|---|---|---|
| TalkingPoints, ParentSquare, Bloomz (USA) | Traducono messaggi e menu tra scuola e famiglia | Non insegnano a usare il registro, e non quello italiano |
| App ClasseViva Famiglia | Registro per le famiglie in italiano, inglese e spagnolo | Niente arabo, nessuna spiegazione delle parole, nessun posto per provare |
| Guide multilingue (per esempio «La scuola in Trentino», 12 lingue), mediatori culturali | Spiegano la scuola italiana alle famiglie | Statiche, o legate a un incontro con una persona |

Non abbiamo trovato **nessuno strumento che faccia allenare su un registro italiano simulato, con un glossario della scuola e un percorso che si adatta** a chi impara.

## Come è stato costruito

La demo è stata costruita da un subagente di Claude Code a partire da una specifica scritta dalla sessione principale di Claude Code del team, riusando le convenzioni della demo [`ti-vedo-bloccato`](../ti-vedo-bloccato/). Verifiche fatte in locale: 64 test, controllo di sintassi di ogni file, server avviato e interrogato, e una prova automatica in un browser senza interfaccia dei 4 esercizi nelle 3 lingue (livelli 1, 2 e 3, suggerimento dopo 10 secondi, ritorno al livello 2, spiegazione, glossario, progressi, verifica delle parole, smartphone). La verifica nel browser da parte del team è indicata in [agents/workflow.md](agents/workflow.md).

## Note

Il registro in `app/public` è **dimostrativo**: scuola, docenti, voti e comunicazioni sono inventati, non usa loghi o nomi di prodotti reali e non invia dati.
