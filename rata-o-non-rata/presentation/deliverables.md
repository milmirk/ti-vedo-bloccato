# Deliverable · Tema 02 Inclusione Finanziaria

Scenario educativo scelto: **gestione del budget personale con gli acquisti a rate** ("compra ora, paga dopo" e finanziamenti in negozio). La capability software è un lettore di email deterministico più un calendario che somma tutte le rate, con quote sulle entrate, simulazione e quiz.

## 01 · User Difficulty Statement

**Chi:** Chiara, 22 anni, primo lavoro part-time. Compra online e in negozio pagando a rate. Sa usare le app, ma ha poca esperienza di finanza personale: "piano di pagamento" e "penale per ritardo" li legge, non sempre li riconosce.

**In quale processo:** tiene il conto di quanto pagherà nelle prossime settimane. Ha **6 acquisti a rate su 3 servizi** "compra ora, paga dopo" (nella demo: Pago3, Rateo, DividiPay, inventati) e un **finanziamento in negozio** per lo smartphone (ElettroCasa, inventato).

**Dove si blocca, nel momento esatto:**
1. **Le informazioni sono in 7 email**, ognuna con il suo formato: date in cifre (28/09/2026), a parole (24 settembre 2026) o ISO (2026-10-04); importi con la virgola (89,90 €) o con il punto (EUR 64.50); linguaggio da contratto ("Scadenza della prima rata", "Importo totale dovuto").
2. **Ogni app mostra solo le sue rate.** Nessuna le somma con quelle degli altri servizi.
3. **Le frequenze non sono uguali**: ogni mese, ogni 2 settimane, ogni 30 giorni. "Ogni 30 giorni" non cade lo stesso giorno di ogni mese, e un'ultima rata può differire di qualche centesimo.
4. **A novembre** arrivano 8 rate da 4 servizi, compresa la prima del finanziamento. Chiara non sa quanto pagherà il mese prossimo, né che parte di quello che le entra va in rate.

**Perché è rilevante:** le rate sono piccole una per una e quindi facili da sottovalutare; il problema è sapere quante arrivano insieme. Per farlo oggi deve aprire 4 app, ritrovare le date e sommare a mano. Dalla verifica di mercato (5 ottobre 2026): le app dei servizi (per esempio Klarna, Scalapay) mostrano solo le proprie rate; Finny (Stati Uniti) le aggrega ma vanno inserite a mano; in Italia non abbiamo trovato nulla che metta insieme servizi diversi e finanziamenti in negozio, né che simuli "e se aggiungo questo acquisto".

## 02 · Before / After Simplicity Evidence

**La demo:** `cd rata-o-non-rata/app && npm install && npm start`, poi <http://localhost:8804/?oggi=2026-10-06> → «Carica le 7 email di esempio».

**Prima e dopo, sui dati di esempio** (testi e numeri reali mostrati dall'app):

| Domanda di Chiara | Prima | Dopo |
|---|---|---|
| Quanto pago il mese prossimo? | 4 app, 8 date da ritrovare, una somma a mano | «Il mese prossimo paghi **245,37 €**» · novembre 2026 · 8 rate · 4 servizi, con l'elenco delle rate |
| Quando pago, nelle prossime settimane? | Una data per app | «Prossimi 30 giorni»: dal 6 ottobre al 5 novembre, 235,45 € in 9 rate, giorno per giorno |
| Che parte di quello che entra va in rate? | Non lo sa | Scrive 720 € e sceglie un avviso al 20%: «A novembre le rate sono il 34% di quello che entra. Hai scelto un avviso sopra il 20%.» |
| E se compro un cappotto a 120 € in 3 rate? | Non può saperlo prima | «A novembre le rate sarebbero 285,37 € invece di 245,37 € (+40,00 €). Sarebbero il 40% di quello che entra. Hai scelto un avviso sopra il 20%.» |
| Cosa dice l'email, esattamente? | Testi lunghi e formati diversi | Ogni valore accanto alla sua frase: Totale 89,90 € ← «Importo totale: 89,90 €» |
| Cos'è una penale per ritardo? | Una parola | Definizione breve, poi le frasi delle sue email: «In caso di ritardo applichiamo una penale di € 5,00 per ogni rata non pagata.» (Rateo) |

**Una schermata resa più chiara.** Il calendario mese per mese (grafico a colonne impilate, un colore per servizio, con legenda a parole e tabella): ottobre 205,45 €, **novembre 245,37 €**, dicembre 123,90 €, gennaio 2027 108,90 €, poi 69,90 € al mese fino ad agosto 2027.

**Come si misura la comprensione.** Nella sezione «Impara» c'è un quiz di 3 domande sul suo calendario, con le risposte calcolate dai suoi dati:
1. «In quale mese paghi di più di rate?» (novembre 2026)
2. «Quante rate paghi a dicembre?» (3)
3. «Quanto paghi in tutto nei prossimi 30 giorni, sommando tutti i servizi?» (235,45 €; tra le opzioni c'è 129,98 €, la cifra che vedrebbe nella sola app di Rateo)

Il primo tentativo si fa a memoria, prima di guardare il calendario; il secondo dopo. L'app mostra i due punteggi uno accanto all'altro. **Non abbiamo ancora dati da persone reali:** il confronto è uno strumento di misura pronto per una prova con utenti, non un risultato.

## 03 · Risk & Clarity Note

**Cosa è stato semplificato**
- 7 email in 4 formati diventano un solo calendario, una cifra per il mese prossimo e una colonna per mese.
- Date e importi scritti in modi diversi diventano un formato solo (28 novembre 2026, 29,96 €).
- Frequenze diverse diventano date precise: ogni 30 giorni dal 4 ottobre → 3 novembre, 3 dicembre, 2 gennaio; il giorno 30 a febbraio → 28 febbraio.
- Quattro parole chiave (rata, compra ora paga dopo, piano di pagamento, penale per ritardo) hanno una definizione breve e un esempio preso dal suo calendario.

**Cosa non è stato alterato**
- **I valori.** Ogni importo, data e numero di rate viene dall'email, e l'app mostra la frase esatta da cui viene. Il codice ritaglia la frase dall'email: non la riscrive.
- **Le somme.** Le rate sono calcolate in centesimi interi e la loro somma è sempre uguale al totale scritto nell'email: l'ultima rata porta i centesimi dell'arrotondamento (89,90 € in 3 rate da 29,97 € → l'ultima è 29,96 €, come nell'email).
- **Le condizioni.** Le penali si riportano solo copiando la frase dell'email. Se le email di un servizio non ne parlano, l'app lo dice («Nelle email di DividiPay che hai caricato non si parla di penali.») invece di inventare una regola.
- **Le decisioni.** L'app non dice se un acquisto va fatto, non suggerisce soglie e non giudica i mesi. Il numero che entra e l'eventuale avviso li sceglie Chiara; di base non c'è nessun avviso.

**Come è stata evitata l'ambiguità**
- **Frasi neutre e verificabili**: un fatto con il suo numero, più la scelta fatta dalla persona («Hai scelto un avviso sopra il 20%»). Un test automatico controlla che le frasi generate, il quiz, il glossario e i testi dell'interfaccia non contengano «ti conviene», «ti consiglio», «è meglio», «dovresti».
- **Percentuali oneste**: se l'arrotondamento farebbe sembrare un valore uguale alla soglia, si mostra un decimale (20,3%, non 20%).
- **L'AI estrae, non calcola.** Per le email in formati sconosciuti l'AI (facoltativa) copia i valori come sono scritti. Un validatore controlla che ogni importo, data e numero compaia nell'email: se l'AI propone «98,90 €» e nell'email c'è scritto 75,00 euro, il valore viene scartato e Chiara vede quale e perché. Una risposta con un consiglio viene scartata tutta. Le email lette con regole generiche o con l'AI restano «da controllare» finché Chiara non le aggiunge.
- **Simulazione al condizionale** («sarebbero»), a righe nel grafico e mai salvata tra gli acquisti.
- **Accessibilità**: il grafico ha titolo, descrizione e una tabella con tutti i numeri; gli aggiornamenti sono annunciati (`aria-live`); tutto si usa da tastiera.

**Limiti che restano**
- I parser dedicati conoscono solo 4 formati inventati; le email reali passano dalle regole generiche, dall'AI o dal modulo a mano.
- Interessi, TAEG e costi extra non vengono calcolati: l'app usa solo il totale scritto nell'email.
- Le rate con "data passata" non sono verificate come pagate: l'app non è collegata ai servizi.
- Nessuna prova con persone reali: tono, glossario e quiz vanno provati con la popolazione target.
- La chiamata a Claude è stata provata solo con un client simulato.

## Dove ha contribuito l'AI e dove la revisione umana

| Area | AI | Revisione umana |
|---|---|---|
| Idea e mercato | Ricerche web della sessione principale di Claude Code (5 ottobre 2026) | Scelta del tema, della persona e del problema |
| Specifica | Scritta dalla sessione principale | Approvata dal team |
| Codice | Scritto da un subagente Claude Code, con 52 test `node:test` e prove automatiche dell'interfaccia (DOM simulato e Chrome headless) | Lettura del codice e prova nel browser |
| Email di esempio | 7 email inventate in 4 formati | Controllo che non ricordino marchi o contratti reali |
| Testi | Skill `fatti-non-consigli` e test sulle parole vietate | Lettura pensando a Chiara, poi prova con utenti |
| AI a runtime | Estrae i valori dalle email sconosciute | Validatore automatico; prova con una chiave vera ancora da fare |

Il dettaglio è in [agents/workflow.md](../agents/workflow.md).
