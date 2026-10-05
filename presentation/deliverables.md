# Deliverable · Tema 01 Accessibilità Digitale

## 01 · Persona & Barriera

**Chi:** Luca, 29 anni, con ADHD. Sa usare il computer, ma si distrae facilmente e i testi lunghi lo stancano. Se un pulsante non risponde, ci clicca di nuovo e poi lascia perdere.

**Cosa sta provando a fare:** prenotare l'appuntamento per rinnovare la Carta d'Identità Elettronica su Agenda CIE. Il flusso ha 4 passi: comune e motivo, dati del richiedente, data e sede, riepilogo e conferma.

**Dove si ferma, nel momento esatto:**
1. **Passo 2, dati del richiedente.** Cambia scheda per cercare la tessera sanitaria. Quando torna non sa più dove era rimasto.
2. **Passo 2, codice fiscale.** Lo scrive con gli spazi, come è stampato sulla tessera. Il sito risponde solo «Valore non conforme (ERR_CF_016)».
3. **Passo 3, calendario.** Tutti i giorni del mese corrente sono grigi. La freccia per il mese successivo è minuscola e poco visibile.
4. **Passo 4, conferma.** «Conferma prenotazione» è disattivato perché manca la spunta sull'informativa privacy, in fondo a un lungo testo legale. Luca clicca, non succede nulla, abbandona.

**Perché è rilevante:** in ognuno di questi punti il sito non sa che la persona è bloccata, e nessuno interviene. L'alternativa è chiedere aiuto a qualcuno, o andare allo sportello senza appuntamento.

## 02 · Percorso Assistito

**La demo:** `cd app && npm start`.
- **Prima**, senza assistente: <http://localhost:8787/demo/?assistente=0>.
- **Dopo**, con l'assistente: <http://localhost:8787/demo/?assistente=1>.

La pagina è una replica dimostrativa di Agenda CIE, con gli stessi punti di attrito. Su un sito della PA vero lo stesso aiuto arriva dall'estensione Chrome in `app/extension`.

**Prima e dopo, punto per punto** (testi reali mostrati dalla demo):

| Dove si ferma | Prima | Dopo: cosa vede Luca |
|---|---|---|
| Rientro dopo una distrazione (≥ 5 s altrove) | Ricomincia a leggere da capo, o chiude | "Eccoti di nuovo! Eri a «Dati del richiedente». Ora compila «Cognome»." |
| Codice fiscale con spazi (al primo errore) | Riprova uguale, l'errore resta | "Il campo «Codice fiscale» non è ancora giusto. Il codice fiscale ha 16 caratteri, lettere e numeri. Lo trovi sulla tessera sanitaria: copialo senza spazi." |
| Calendario senza posti (al primo clic su un giorno grigio) | Pensa che non ci siano appuntamenti | "Questo giorno non ha posti liberi. Premi «Mese successivo» per vedere altre date." |
| Conferma disattivata (al primo clic) | Clicca, non succede nulla, abbandona | "«Conferma prenotazione» si attiva solo dopo che spunti la casella «Dichiaro di aver preso visione dell'informativa…»." |

**Come arriva l'aiuto:**
- **Subito.** La scheda compare entro circa 0,2 secondi dal blocco: nel browser abbiamo misurato da 70 a 220 millisecondi.
- **Dentro la pagina.** Si inserisce subito dopo il blocco su cui agire: il testo sotto scende, non viene coperto.
- **Un solo suggerimento.** «Mostrami dove» evidenzia l'elemento, lo porta al centro dello schermo e ci sposta il focus. «Perché me lo dici?» mostra cosa abbiamo notato e il testo originale della pagina.
- **Con l'AI quando serve.** Il primo testo viene dalle regole, senza rete. Se Claude risponde entro 6 secondi e Luca non ha ancora agito, il testo viene sostituito da quello dell'AI, dopo i controlli del server.

**Misura:** alla fine di ogni prova la demo mostra tempo, errori, clic a vuoto, passi indietro e suggerimenti, e confronta la prova senza assistente con quella con l'assistente. I numeri vanno raccolti con una persona vera: finora il percorso è stato provato solo da noi.

## 03 · Autonomia & Limiti

**Quanta autonomia guadagna Luca**
- Arriva alla conferma della prenotazione senza chiedere aiuto a nessuno.
- Dopo una distrazione riparte dal punto giusto, invece di ricominciare.
- Capisce perché il sito "non risponde", e cosa fare per sbloccarlo.
- Decide lui quanto spesso essere aiutato: di rado, normale, spesso, oppure una pausa di 10 minuti. "Non ora" rende l'aiuto più discreto, "Mi è servito" più presente.

**Cosa è stato semplificato**
- Il messaggio di errore in codice diventa una frase con l'azione da fare.
- Al posto di dover capire da solo perché un pulsante è disattivato, Luca riceve l'indicazione del campo da completare.
- Ogni suggerimento contiene una sola azione, in al massimo circa 30 parole.

**Cosa non è stato alterato**
- **Il sito.** Testi, regole e moduli restano quelli del servizio: il suggerimento si aggiunge, non sostituisce.
- **I nomi.** Ogni nome tra «» nel testo dell'AI deve esistere nella pagina, altrimenti il suggerimento viene scartato e restano le regole. Lo controlla `validateHint` in `app/server/hint-agent.mjs`. Lo stesso controllo vale per il "perché".
- **Le decisioni.** Il compagno indica dove agire, non compila e non conferma al posto di Luca. Non dà consigli legali o amministrativi.

**Privacy e sicurezza**
- Il valore dei campi non lascia mai la pagina: sappiamo solo se un campo è compilato.
- Email, codice fiscale (anche con omocodia), IBAN e numeri lunghi vengono mascherati nei testi.
- L'estensione è attiva solo sui siti della PA (`*.gov.it`, INPS, pagoPA) e in locale.
- La chiave AI resta sul server. Il server ascolta solo su `127.0.0.1` e accetta al massimo 30 richieste al minuto, solo dalla demo e dall'estensione.

**Limiti che restano**
- Le soglie dei segnali sono ipotesi ragionate, da tarare con persone reali.
- Possono capitare falsi allarmi.
- Funziona solo su Chrome desktop e sui siti in elenco.
- Su pagine con layout insoliti la scheda può non trovare un punto adatto e restare fluttuante in un angolo.
- Etichette e testi della pagina vengono inviati al modello AI. I nomi propri non vengono mascherati.
- Verifiche da completare:
  - la chiamata a Claude è stata provata con un client simulato e con una chiave finta, mai con una chiave vera;
  - il clic su pulsanti disattivati è stato provato con eventi simulati, non con l'estensione installata in Chrome.

## Dove ha contribuito l'AI e dove è servita la revisione umana

| Area | AI | Revisione umana |
|---|---|---|
| Idea | 3 agenti di ricerca in parallelo hanno verificato 21 idee sul mercato | Scelta dell'idea, della persona e del servizio |
| Codice | Scritto con Claude Code, 38 test, verificato nel browser | Lettura del codice, prova dell'estensione in Chrome |
| Revisione | 2 subagenti: 24 osservazioni sui testi, 15 problemi nel codice, tutti corretti | Correzioni approvate e verificate di nuovo |
| Testi | Scritti con la skill `plain-italian-hints` | Riletti pensando a Luca |
| Esperienza d'uso | Scheda dentro la pagina e tempi più rapidi | Richiesta del team dopo la prima prova |
| Soglie | Valori iniziali ragionati | Da tarare con utenti reali |

Il dettaglio è in [agents/workflow.md](../agents/workflow.md).
