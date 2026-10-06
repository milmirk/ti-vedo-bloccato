# Rata o non rata ›

**Tutte le rate, da servizi diversi, in un calendario solo. Per sapere quanto paghi il mese prossimo, senza che nessuno ti dica cosa fare.**

Hagenthon · Accenture Application Engineering · Tema 02 — Inclusione Finanziaria

---

## Persona e difficoltà

**Chiara, 22 anni, primo lavoro part-time.** Compra online e in negozio pagando a rate. Ha **6 acquisti** su 3 servizi "compra ora, paga dopo" e un **finanziamento in negozio** per lo smartphone. Si blocca su una domanda semplice: *quanto pago il mese prossimo?*

1. **Le informazioni sono in 7 email**, ognuna con il suo formato: date in cifre, a parole o ISO; importi con la virgola o con il punto; linguaggio da contratto.
2. **Ogni app mostra solo le sue rate.** Nessuna le somma con quelle degli altri servizi.
3. **Le frequenze sono diverse**: ogni mese, ogni 2 settimane, ogni 30 giorni.
4. **A novembre arrivano 8 rate da 4 servizi.** Per saperlo deve aprire 4 app e sommare a mano.

Nella demo i servizi sono **inventati**: Pago3, Rateo, DividiPay ("compra ora, paga dopo") ed ElettroCasa (finanziamento in negozio). Anche negozi e indirizzi sono di fantasia.

## Cosa fa

Una web app educativa, in italiano, che funziona su telefono e computer.

| | |
|---|---|
| **Legge** | Le email di conferma incollate (o le 7 di esempio). Un parser deterministico per ogni formato noto, regole generiche per gli altri, e un modulo «Aggiungi a mano». **Ogni valore estratto mostra la frase esatta dell'email** da cui viene. |
| **Mette in fila** | Un calendario deterministico: ogni mese (31 gennaio → 28 o 29 febbraio → 31 marzo), ogni 2 settimane, ogni 30 giorni. Importi in centesimi: la somma delle rate è sempre uguale al totale, l'ultima rata porta i centesimi dell'arrotondamento. |
| **Mostra** | «Il mese prossimo paghi» con una cifra sola e l'elenco delle rate; un grafico mese per mese per servizio (SVG accessibile con tabella); i prossimi 30 giorni; il dettaglio di ogni acquisto con le frasi dell'email. |
| **Confronta con ciò che entra** | Chiara scrive quanto le entra (anche diverso mese per mese) e, se vuole, sceglie un avviso: 10, 20, 30% o un'altra soglia. **L'app non suggerisce nessuna soglia.** Frasi neutre: «A novembre le rate sono il 34% di quello che entra. Hai scelto un avviso sopra il 20%.» |
| **E se…?** | Importo, numero di rate e frequenza di un acquisto ipotetico: il calendario lo mostra a righe e indica la differenza mese per mese. Nessun consiglio, nessun "sì" o "no". |
| **Fa capire** | Mini glossario (rata, compra ora paga dopo, piano di pagamento, penale per ritardo) con esempi presi dal suo calendario; le penali solo come sono scritte nelle email. Un quiz di 3 domande sul suo calendario, con le risposte calcolate dai suoi dati e il punteggio del primo e dell'ultimo tentativo. |

## Provalo in 2 minuti

Serve Node.js 20 o successivo.

```bash
cd rata-o-non-rata/app
npm install
npm start
```

Apri:

- **L'app**: <http://localhost:8804/>. Per la demo usa <http://localhost:8804/?oggi=2026-10-06>: le email di esempio sono di settembre e ottobre 2026 e il parametro fissa la data di riferimento.
- **Presentazione per la commissione**: <http://localhost:8804/presentation/>, oppure apri direttamente `presentation/index.html`. Si naviga con ← →, F mette a schermo intero. I tre deliverable del tema sono in [presentation/deliverables.md](presentation/deliverables.md).

Percorso suggerito: «Carica le 7 email di esempio» → quiz a memoria → «Calendario» (245,37 € a novembre) → scrivi 720 € e scegli l'avviso al 20% → «E se…?» con 120 € in 3 rate → rifai il quiz → «Prova un'email in un formato sconosciuto».

I dati restano nel browser (`localStorage`); «Cancella tutti i dati» li toglie.

### Lettura con l'AI (facoltativa)

Senza chiave l'app funziona tutta con i parser deterministici e il modulo a mano. Per leggere con Claude le email in formati sconosciuti, imposta la chiave prima di `npm start`:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

In PowerShell: `$env:ANTHROPIC_API_KEY = "sk-ant-..."`. Variabili opzionali: `RNR_MODEL` (predefinito `claude-opus-5-5`), `RNR_AI=off` (spegne l'AI), `PORT` (predefinito 8804).

Il pulsante «Prova a leggerla con l'AI» compare solo sulle email incomplete. L'AI **copia** i valori come sono scritti, il codice li controlla e calcola il calendario.

### Test

```bash
cd rata-o-non-rata/app
npm test
```

52 test `node:test`, nessuna rete: un parser per ogni formato di esempio, date per ogni frequenza (fine mese, anno bisestile, cambio d'anno), centesimi, aggregazione per mese e servizio, quote e frasi dell'avviso, simulazione, validatore dell'AI, quiz, glossario, controllo anti-consiglio sui testi, server (path traversal, origine, 64 KB, limite al minuto).

## Struttura

```
rata-o-non-rata/
├── app/                         soluzione sviluppata
│   ├── server.mjs               server Node senza framework, solo 127.0.0.1
│   ├── server/agent.mjs         extraction agent (Claude) facoltativo
│   ├── public/
│   │   ├── index.html, style.css, app.js     interfaccia
│   │   └── lib/                 moduli ES condivisi tra browser e test
│   │       ├── parsers.js       un parser per formato + regole generiche, frasi sorgente
│   │       ├── schedule.js      rate datate, centesimi, mesi, servizi
│   │       ├── insights.js      quote sulle entrate, avviso scelto, "E se…?"
│   │       ├── verify.js        validatore dell'AI e controllo anti-consiglio
│   │       ├── quiz.js, glossary.js
│   │       ├── money.js, dates.js
│   │       └── samples.js       le 7 email inventate + una in formato sconosciuto
│   └── test/                    test node:test
├── agents/                      struttura agentica (vedi agents/README.md)
├── presentation/                presentazione (index.html) e deliverable del tema (deliverables.md)
└── README.md
```

## Struttura agentica

I dettagli sono in [agents/README.md](agents/README.md). In sintesi:

- **Agente di runtime**: `extraction agent` con `claude-opus-5-5`, effort basso, output JSON vincolato da schema e fallback lato server. Il system prompt è in [agents/prompts/extract-agent.md](agents/prompts/extract-agent.md). Ogni risposta passa da `verifyExtraction` (`app/public/lib/verify.js`).
- **Sviluppo con Claude Code**:
  - le istruzioni di progetto ([CLAUDE.md](agents/CLAUDE.md));
  - 2 subagenti: `provider-parser-builder`, `neutral-language-reviewer`;
  - 2 comandi: `/demo-check`, `/nuovo-servizio`;
  - 1 skill: `fatti-non-consigli`;
  - il [workflow](agents/workflow.md): la demo è stata costruita da un subagente di Claude Code a partire da una specifica scritta dalla sessione principale, con l'elenco di ciò che va ancora rivisto da una persona.

## Garanzie

- **Fatti, non consigli.** Nessun testo dice cosa comprare o cosa fare. Un test cerca «ti conviene», «ti consiglio», «è meglio», «dovresti» nelle frasi generate, nel quiz, nel glossario e nei testi dell'interfaccia.
- **La soglia è sua.** Di base nessun avviso; l'app non propone valori.
- **Semplificare senza tradire.** Ogni valore è affiancato dalla frase dell'email, ritagliata dal codice. Le penali sono riportate solo come scritte. Se un'email non ne parla, l'app lo dice.
- **L'AI estrae, il codice calcola.** Ogni importo, data e numero proposto dall'AI deve comparire nell'email (con le varianti di scrittura: 64,50 € = EUR 64.50, 3 = tre). Altrimenti viene scartato e la persona vede quale valore e perché. Una risposta con un consiglio viene scartata tutta. Le email lette dall'AI o dalle regole generiche restano «da controllare» finché la persona non le aggiunge.
- **Sicurezza.** La chiave resta sul server, che ascolta solo su `127.0.0.1`. `/api/extract` accetta solo richieste dalla pagina stessa, in JSON, fino a 64 KB e 20 al minuto. Percorsi con `..` vengono rifiutati, una richiesta malformata non fa cadere il server, l'app ha una Content Security Policy senza script inline e inserisce i testi delle email sempre come testo.
- **Accessibilità.** `lang="it"`, HTML semantico, schede da tastiera (frecce, Home, Fine), focus visibile, bersagli da 44 px, contrasti AA, grafico con titolo, descrizione e tabella, annunci `aria-live`, `prefers-reduced-motion`, layout per schermi da 375 px.

## Limiti

- I parser dedicati conoscono solo i 4 formati inventati della demo. Le email reali passano dalle regole generiche, dall'AI o dal modulo a mano.
- Interessi, TAEG e costi extra non vengono calcolati: l'app usa solo il totale scritto nell'email.
- Le rate con "data passata" non sono verificate come pagate: l'app non è collegata ai servizi.
- Nessuna prova con persone reali: tono, glossario e quiz vanno provati con la popolazione target. Il confronto prima/dopo del quiz è uno strumento di misura, non un risultato.
- La chiamata a Claude è testata con un client simulato. Va provata con una chiave vera prima della demo.
- L'interfaccia è stata provata in modo automatico: con un DOM simulato (jsdom) e in Chrome headless (percorso completo, nessun errore in console, nessuno scorrimento orizzontale a 375 px). Manca la prova di una persona, da tastiera e con un lettore di schermo.

## Verifica di mercato

Ricerca web del 5 ottobre 2026:

| Prodotto | Cosa fa | Perché non copre il bisogno |
|---|---|---|
| App di Klarna, Scalapay | Mostrano le rate del proprio servizio | Non vedono le rate degli altri servizi |
| Finny (Stati Uniti) | Raccoglie i piani "compra ora, paga dopo" | Ogni piano va inserito a mano; non è pensato per l'Italia |

Non abbiamo trovato **nulla, in Italia, che metta in un calendario solo Klarna, Scalapay, PayPal in 3 rate e i finanziamenti in negozio**, né che simuli «e se aggiungo questo acquisto?». I nomi reali compaiono solo qui e in una slide: l'app e i dati di esempio usano servizi inventati.

## Note

Rata o non rata è uno **strumento educativo**: mostra fatti presi dalle email della persona e fa somme. Non è consulenza finanziaria e non dà indicazioni su cosa comprare o scegliere.
