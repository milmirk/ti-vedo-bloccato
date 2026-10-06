# Deliverable · Tema 02 Inclusione Finanziaria

Scenario educativo scelto: **gestione del budget personale**, cioè capire quanto resta fino al prossimo stipendio e quanto si può usare oggi. L'app è un coach che aiuta a costruire e capire il budget. Non dà raccomandazioni, non dice cosa comprare e non è consulenza finanziaria.

## 01 · User Difficulty Statement

**Chi:** Marco, 35 anni, con discalculia. Lavora, ha uno stipendio fisso che arriva ogni mese e paga le sue spese da solo. Sa benissimo cosa costa un caffè, una pizza o una spesa al supermercato.

**Quale difficoltà:** le cifre non gli dicono niente. «186,40 €» è una scritta: non sa trasformarla in «ci arrivo al giorno di paga?». Per saperlo dovrebbe dividere per i giorni che mancano e sottrarre ogni spesa. È un conto che gli costa uno sforzo enorme, e di solito non lo fa.

**In quale processo:** la gestione quotidiana dei soldi tra uno stipendio e l'altro.
- Guarda il saldo nell'app della banca: ci sono due saldi diversi (disponibile e contabile) e una lista di movimenti con date, sigle (POS, SDD, ATM) e importi con la virgola e il segno meno.
- Decide se prendere una pizza, un pranzo fuori, fare la spesa, senza sapere che cosa resterà per i giorni dopo.
- A metà mese va in rosso e non capisce perché.

**Perché è rilevante:**
- Gli strumenti che esistono presuppongono che i numeri siano chiari. Le app delle banche mostrano saldo e movimenti. Le app di budget «safe to spend» (SafeToSpend, DaySum) e i salvadanai di Monzo mostrano comunque una cifra.
- L'unica app trovata per adulti con discalculia, Dysia (iOS, in inglese), aiuta alla cassa ma non fa il budget. Solo progetti di studenti (PayAbility, Stanford) affrontano il tema.
- Understood.org nota che poche app si rivolgono ad adulti con difficoltà con i numeri.
- Non abbiamo trovato nulla in italiano, e nulla senza numeri (verifica web del 5 ottobre 2026).

Per Marco il problema non è la volontà: **è la rappresentazione**.

## 02 · Before / After Simplicity Evidence

**La demo:** `cd app && npm install && npm start`, poi <http://localhost:8802/?demo=marco> (l'esempio di Marco, pronto) oppure <http://localhost:8802/> per partire da zero. Gli esempi qui sotto sono i testi reali che l'app produce con i dati dell'esempio: 137,80 € rimasti, giorno di paga sabato 17 ottobre, oggetti caffè (1,20 €), pizza (8 €), pranzo fuori (12 €) e spesa piccola (25 €), con oggi martedì 6 ottobre.

| | Prima: app della banca | Dopo: Bilancio senza numeri |
|---|---|---|
| Quanto c'è | «Saldo disponibile 137,80 €» | «Ti restano: cinque spese piccole, un pranzo fuori e qualche spicciolo», con un barattolo di icone per ogni oggetto |
| Fino a quando | «Prossimo accredito: 17/10» | «Fino a sabato diciassette ottobre · tra undici giorni», con un puntino per ogni giorno |
| Quanto oggi | Nessuna risposta: va calcolato (137,80 ÷ 11, meno quello già speso oggi) | «Oggi puoi usare circa: una pizza e due caffè. Da domani, ogni giorno circa: un pranzo fuori.» |
| Una spesa | Riga «POS 0411 BAR CENTRALE SRL −1,20» | Un tocco su «Un caffè». Il saldo in oggetti si aggiorna subito, e l'avviso «Segnato: un caffè» ha il pulsante «Annulla» |
| Una spesa a parole | Non previsto | «ho fatto la spesa, circa 30 euro» → «Ho capito: una spesa piccola (più cara del solito: circa una spesa piccola e quattro caffè).», con il pulsante «Sì, segna» |
| Ad alta voce | Non previsto | «Leggimelo» legge il riepilogo in italiano |

**Il flusso semplificato:**
1. **Impostazione in tre passi.** Si scrive un solo numero, quanto c'è, con un tastierino grande: sotto compare subito la stessa cifra in oggetti. Poi si sceglie il giorno di paga su un calendario grande, oppure «Il 27 di ogni mese». Infine si scelgono da tre a cinque oggetti, con il prezzo proposto e modificabile.
2. **Schermata principale senza cifre.** Quanto resta, in oggetti, e la parte di oggi.
3. **Una spesa si segna con un tocco**, anche più cose insieme con «Altro», e si annulla con un tocco.

**Evidenza di comprensione:**
- Ogni tanto l'app fa una domanda concreta sulla situazione vera: «Se prima di sabato diciassette ottobre prendi sei spese piccole, bastano i soldi che ti restano?», con le risposte Sì, No e Non so. La risposta giusta la calcola il codice.
- Il riscontro dice prima la risposta e poi il fatto: «Nessun problema. La risposta è no. Non bastano: mancherebbero soldi per circa un pranzo fuori.»
- Se la risposta non torna, la rappresentazione diventa più concreta: tutti gli oggetti → solo i più piccoli → giorno per giorno → solo oggi.
- Il pannello «Come lo capisci meglio» mostra le risposte nel tempo, per rappresentazione, e quale funziona meglio.

Nella presentazione mostriamo un'**esecuzione interna della demo**: risposte scelte da noi per mostrare il meccanismo, verificata dal test «esecuzione interna della demo» in `app/test/adapt.test.mjs`. Il percorso è «Non so», poi una risposta che non torna, poi tre risposte giuste con «Giorno per giorno». Questo non è un risultato con utenti: **la prova con persone con discalculia va ancora fatta**.

## 03 · Risk & Clarity Note

**Cosa è stato semplificato**
- La cifra del saldo diventa una scomposizione negli oggetti scelti dalla persona. È deterministica e greedy, dal più grande al più piccolo: stessa cifra, stessa frase.
- La divisione per i giorni che mancano e la sottrazione delle spese le fa l'app. La parte di oggi si calcola su quello che c'era all'inizio della giornata.
- Le date diventano nomi di giorni («venerdì», «domani») e puntini. Le quantità si scrivono in lettere («cinque spese piccole»).

**Cosa non è stato alterato**
- **La cifra vera.** Tutti gli importi sono in centesimi interi. «Mostra anche gli euro» rivela ogni importo al centesimo, accanto agli oggetti.
- **Il resto.** Quello che non entra in un oggetto non sparisce: è «qualche spicciolo», e in euro si vede esatto.
- **Le spese.** Si registrano al prezzo scelto dalla persona, o all'importo che ha scritto lei.
- **Le decisioni.** L'app non dice cosa comprare né se una spesa va fatta. Mostra i fatti: «Se lo prendi, i giorni dopo avranno un po' meno».

**Come è stata evitata l'ambiguità**
- **«circa» ogni volta che si arrotonda.** La parte di oggi, i giorni uno per uno e i riscontri usano al massimo due tipi di oggetto e lo dicono. Quando resta meno dell'oggetto più piccolo si dice com'è: «meno di un caffè».
- **Frasi che tornano.**
  - Il verbo si accorda con gli oggetti: «ti resta un caffè», «ti restano due pizze».
  - Il primo del mese si dice «primo».
  - Il riscontro dice prima la risposta («la risposta è no») e poi il fatto, così «Esatto» non si confonde con «No».
- **Domande oneste.** La combinazione proposta è vicina alla soglia, così la domanda non è banale, ma mai a meno di un oggetto piccolo (o dell'otto per cento) da essa, così non è un tranello. Mai più di sei pezzi uguali. «Non so» è una risposta legittima e riceve «Nessun problema».
- **Nessun numero nascosto nei testi.** Un test automatico genera più di mille testi in decine di situazioni (cifre, giorni, spese, rappresentazioni, domande, riscontri, storico) e verifica che, con gli euro spenti, nessuno contenga cifre, € o la parola «euro».
- **L'AI non fa conti.** L'interprete facoltativo delle frasi riceve il testo e i nomi degli oggetti, senza prezzi. Restituisce voci strutturate. Il validatore (`validateInterpretation` in `app/server/agent.mjs`) applica tre regole:
  - accetta un importo solo se compare nel testo come numero intero, quindi «3» non vale se il testo dice «30»; altrimenti usa il prezzo noto dell'oggetto;
  - accetta una quantità maggiore di uno solo se è scritta nel testo;
  - accetta una citazione solo se è un pezzo vero della frase.
  Se un controllo fallisce, la risposta viene scartata. Il totale lo calcola il codice.
- **Niente etichette.** L'interfaccia non nomina mai la discalculia. Il linguaggio è neutro rispetto al genere.

**Rischi che restano**
- La scomposizione greedy non è sempre la più intuitiva. Per esempio sedici euro diventano «un pranzo fuori, tre caffè e qualche spicciolo», non «due pizze». Va verificato con le persone quale forma capiscono meglio.
- I prezzi proposti sono indicativi. Se la persona non li cambia, gli oggetti possono non corrispondere ai suoi prezzi reali.
- Le spese si segnano a mano. Una spesa dimenticata rende il quadro meno preciso, anche se la cifra resta coerente con quello che è stato segnato.
- Domande e regole di adattamento sono ipotesi ragionate, non validate con utenti.

## Dove ha contribuito l'AI e dove la revisione umana

| Area | AI | Revisione umana |
|---|---|---|
| Idea e mercato | Ricerca web sulle app esistenti (5 ottobre 2026) | Scelta del tema, della persona e dello scenario. I link vanno riaperti prima della presentazione. |
| Specifica | Scritta dalla sessione principale di Claude Code: persona, funzioni, vincoli del tema, criteri di verifica | Approvata dal team |
| Codice e test | Un subagente di Claude Code ha scritto app, server, interprete AI e test (`node:test`, nessuna rete). Verifica con richieste HTTP e schermate di Chrome senza interfaccia | Lettura del codice e prova nel browser vero, anche con un lettore di schermo |
| Testi | Scritti con la skill `soldi-in-oggetti`, controllati dal test «nessun numero» e rivisti dal subagente `nessun-numero-reviewer` (31 osservazioni, tutte applicate) | Da far leggere a persone con discalculia o a chi lavora sui DSA |
| Domande e adattamento | Generatore con la risposta giusta calcolata dal codice e regole deterministiche, tutte testate | Da validare con esperti e con utenti reali |
| AI a runtime | Solo lettura delle frasi libere, validata. Senza chiave l'app funziona con le regole | Da provare con una chiave vera: oggi è testata con un client simulato |
| Evidenza | Esecuzione interna con risposte scelte da noi | La prova con persone non è stata fatta |

Il dettaglio è in [agents/workflow.md](../agents/workflow.md).
