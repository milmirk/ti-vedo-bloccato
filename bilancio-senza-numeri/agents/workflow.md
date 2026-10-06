# Workflow: come è stato costruito "Bilancio senza numeri"

Strumento: **Claude Code** (modello Claude Opus 5.5).

Il lavoro si è diviso in due livelli:

- **La sessione principale di Claude Code**, guidata dal team, ha scelto il tema, la persona e la verifica di mercato. Ha poi scritto una specifica dettagliata: persona, funzioni, vincoli del tema, struttura delle cartelle, regole di sicurezza, criteri di verifica.
- **Un subagente di Claude Code** ha costruito tutta la demo a partire da quella specifica, in un'unica esecuzione autonoma: app, server, interprete AI, test, struttura agentica, presentazione e documenti. Come riferimento per struttura, qualità e tono ha usato la demo già finita del repository, `ti-vedo-bloccato/`.

Le fasi qui sotto sono quelle seguite davvero.

## Le fasi

| # | Fase | Chi | Cosa ne è uscito |
|---|---|---|---|
| 1 | **Idea, persona, mercato** | Sessione principale + team | Tema 02, Marco con discalculia, verifica web del 5 ottobre 2026: nessuna app in italiano, nessuna senza numeri. |
| 2 | **Specifica** | Sessione principale | Requisiti per i tre passi dell'impostazione, la schermata senza numeri, le spese con un tocco, le domande di comprensione e l'adattamento. Poi la voce, l'AI facoltativa con validatore, la sicurezza del server, almeno 20 test e i deliverable. |
| 3 | **Lettura del riferimento** | Subagente | Schema del server sicuro e chiamata a Claude ripresi da `ti-vedo-bloccato`. Il motore delle slide è stato copiato identico. |
| 4 | **Logica pura** | Subagente | I moduli in `app/public/lib/`: scomposizione greedy in centesimi, date in UTC (fine mese, cambio d'anno, ora legale), stato e annulla, numeri in lettere, domande, regole di adattamento, interprete a regole. |
| 5 | **Test** | Subagente | `node:test`, nessuna rete. Le risposte giuste delle domande sono ricalcolate da zero in centinaia di situazioni. Il test «modalità senza numeri» controlla più di mille testi. Il server è provato su una porta casuale. Quattro attese sbagliate nei test sono state corrette dopo la prima esecuzione (per esempio: sedici euro, in modo greedy, sono un pranzo e tre caffè, non due pizze). |
| 6 | **Interfaccia** | Subagente | `index.html`, `style.css` e `app.js`: mobile, contrasti AA, focus visibile, tastiera, `aria-live`, voce. |
| 7 | **Interprete AI e server** | Subagente | `server/agent.mjs`: stessa chiamata del riferimento (structured output, effort basso, fallback lato server), prompt in `prompts/interpreta-spesa.md`. Il validatore accetta un importo solo se è un numero intero del testo. `server.mjs`: `127.0.0.1`, stessa origine, 64 KB, limite al minuto, CSP, percorsi bloccati. |
| 8 | **Verifica** | Subagente | `npm test`, `node --check` su ogni file, richieste HTTP al server sulla porta 8802. Schermate di Chrome senza interfaccia: app, impostazione, «Non so» che cambia la rappresentazione, giorno per giorno, «Altro» con una frase, euro, tutte le 15 slide a 1920×1080. Per le schermate è servita una pagina di prova temporanea, poi cancellata. |
| 9 | **Correzioni dalla verifica** | Subagente | La domanda ora sta sotto i dati a cui si riferisce. Il focus viene restituito ai pulsanti ricostruiti. La frase di una spesa con importo scritto è ora tra parentesi. I nodi della slide di architettura sono stati accorciati, perché uscivano dallo spazio. |
| 10 | **Revisione dei testi** | Subagente `nessun-numero-reviewer`, in sola lettura | Vedi [Revisione](#revisione) sotto. |

## Dove ha contribuito l'AI e dove serve la revisione umana

| Parte | AI | Revisione umana |
|---|---|---|
| Ricerca di mercato | Ricerche web, confronto con i prodotti esistenti | Il team ha scelto l'idea. I link vanno riaperti prima della presentazione. |
| Specifica | Scritta dalla sessione principale | Approvata dal team |
| Codice | Scritto dal subagente, test inclusi | Lettura del codice. Prova nel browser vero: il subagente ha visto l'app solo in schermate di Chrome senza interfaccia. |
| Testi | Scritti con la skill `soldi-in-oggetti`, controllati dal test «nessun numero», rivisti da `nessun-numero-reviewer` | **Da far leggere** a persone con discalculia, o a chi lavora sui DSA |
| Domande e adattamento | Generatore e regole deterministiche, tutti testati | **Da validare**: sono ipotesi ragionate, non misure. Non sappiamo ancora quale rappresentazione capiscano meglio le persone reali. |
| Prezzi degli oggetti | Valori indicativi | Ognuno mette i suoi. Vanno ricontrollati per la città della demo. |
| Interprete AI a runtime | Claude legge la frase | Non serve rivedere ogni risposta: il validatore scarta importi e quantità che non compaiono nel testo. |
| Evidenza di comprensione | Esecuzione interna con risposte scelte da noi (test «esecuzione interna della demo») | **La prova con persone non è stata fatta.** |

## Cosa resta da verificare a mano

- Il percorso completo nel browser vero, su un telefono, e con un lettore di schermo (NVDA o VoiceOver).
- «Leggimelo» con la voce italiana dei dispositivi della demo. La dettatura a voce, se il browser la offre, non è stata provata.
- La chiamata a Claude con una chiave vera. Oggi è provata solo con un client simulato.
- Una prova con persone con discalculia, per scegliere la forma della scomposizione e tarare le domande.

## Revisione

A fine sviluppo il subagente `nessun-numero-reviewer` è stato lanciato in sola lettura. Ha letto tutti i testi e ha stampato con Node quelli generati in molte situazioni: soldi finiti, solo spiccioli, paga domani, paga il primo del mese, periodo finito. Ha trovato **31 osservazioni**, tutte applicate.

- **Numeri.** Il badge «Data di prova: martedì 6 ottobre» mostrava una cifra in ogni demo: ora è in lettere, con un test. Il primo del mese ora si dice «primo», non «uno».
- **Italiano.**
  - Il verbo ora si accorda: «Ti resta un caffè», «manca circa un caffè», «resterebbero ancora circa tre caffè», «Non ti resta niente».
  - Sparito «circa meno di un caffè».
  - Nelle righe giorno per giorno c'è «circa».
  - Corretti gli accordi in «Ne hai scelto uno» e nei contatori di «Altro» («una pizza»).
  - L'app non parla più di sé al maschile.
- **Domande più chiare.**
  - «Se prima di sabato prendi sei spese piccole, bastano i soldi che ti restano?» al posto di «vuoi prendere».
  - «Se oggi prendi due pizze, resti dentro quello che puoi usare oggi?» al posto di «Rientra…».
  - Il riscontro dice prima la risposta e poi il fatto («Esatto, la risposta è no. Non bastano…»), così «Esatto. No…» non si legge come un errore.
  - Le combinazioni troppo lontane dalla soglia (domande banali) sono escluse: la finestra è passata da 0,4–1,8 a 0,6–1,6 volte la soglia.
- **Niente giudizi, niente etichette.**
  - La croce «✗» per una risposta che non tornava è diventata «→».
  - La descrizione della pagina non dice più «per chi fa fatica con i numeri».
  - I nomi delle rappresentazioni dicono cosa mostrano: «con tutti i tuoi oggetti», «con gli oggetti più piccoli».
- **Interprete delle frasi**, sia il prompt sia le regole:
  - un totale per più cose («due caffè e un panino, 8 euro») ora resta un totale, invece di finire tutto sul panino;
  - i soldi ricevuti («mi hanno ridato 5 euro») non sono spese;
  - «un paio» vale due e il validatore lo accetta.

Categorie trovate pulite: nessun consiglio o tono moralista, icone sempre con testo e `aria-hidden`, linguaggio neutro, nessuna menzione della discalculia nell'interfaccia, nessuna cifra nei testi generati con gli euro spenti.

Resta aperto un punto segnalato dal revisore: i testi scritti direttamente in `app.js` (annunci, avvisi) non passano dal test automatico «nessun numero». Sono stati controllati a mano.

## Come rilanciare il ciclo

```text
/nuova-domanda "capisce che una spesa grande oggi riduce i giorni dopo"   → nuovo tipo di domanda, con test
/demo-check                                                                → verifica completa prima della demo
```

Dopo ogni modifica ai testi: subagente `nessun-numero-reviewer`.
