# Hagenthon · Le demo ›

Hackathon **Agentic Coding** di Accenture Application Engineering. Ogni cartella è una demo completa, con la struttura di consegna richiesta dalla sfida:

```
<demo>/
├── app/            soluzione sviluppata
├── agents/         struttura agentica: agenti, istruzioni, comandi, prompt, skill, workflow
├── presentation/   presentazione HTML per la commissione + deliverable del tema
└── README.md
```

## Le demo

| Demo | Tema | Per chi | Cosa fa | Porta |
|---|---|---|---|---|
| [**Ti vedo bloccato**](ti-vedo-bloccato/) | 01 · Accessibilità digitale | Luca, 29 anni, ADHD | Estensione Chrome che si accorge quando ti blocchi su un sito della PA e ti dà un solo suggerimento, subito, dentro la pagina | 8787 |
| [**SECCI Lens**](secci-lens/) | 02 · Inclusione finanziaria | Samira, 41 anni | Legge il modulo SECCI di un finanziamento: TAN, TAEG, quanto restituisci, il costo in cose di tutti i giorni, confronto neutro tra due offerte | 8801 |
| [**Bilancio senza numeri**](bilancio-senza-numeri/) | 02 · Inclusione finanziaria | Marco, 35 anni, discalculia | Budget fino al prossimo stipendio mostrato con oggetti concreti ("ti restano 3 caffè e una pizza"), che si adatta a come lo capisci | 8802 |
| [**Gratta e Capisci**](gratta-e-capisci/) · *Fortuna in Chiaro* | 02 · Inclusione finanziaria | Salvatore, circa 10 € al giorno di gioco | Un anno di gioco in 10 secondi con le probabilità ufficiali ADM, valore atteso, quiz prima e dopo, «Pausa e Conto». App dei colleghi, con il nuovo aspetto grafico | 8803 |
| [**Rata o non rata**](rata-o-non-rata/) | 02 · Inclusione finanziaria | Chiara, 22 anni | Tutte le rate "compra ora, paga dopo" in un calendario solo, con soglia scelta da lei e simulazione "e se aggiungo questo acquisto?" | 8804 |
| [**Registro amico**](registro-amico/) | 03 · Educazione digitale inclusiva | Fatima, 38 anni, madrelingua araba | Palestra di un registro elettronico simulato, con aiuto in arabo, inglese o italiano semplice che cala man mano che impara | 8805 |

## Avviare una demo

Serve Node.js 20 o successivo.

```bash
cd <demo>/app
npm install
npm start
```

Fa eccezione **Gratta e Capisci**: è un'app statica e basta aprire `gratta-e-capisci/app/index.html`. Per provarla con i dati della demo usa `index.html?demo=1`.

Ogni demo funziona anche **senza AI**: la logica che calcola, controlla e guida è codice deterministico e testato. Nelle demo che usano Claude, impostando la variabile `ANTHROPIC_API_KEY` si attivano anche le spiegazioni scritte dal modello, che passano sempre da un controllo nel codice prima di arrivare alla persona. Gratta e Capisci non usa AI mentre è in funzione.

## Principi comuni

- **Il codice calcola, l'AI spiega, un validatore controlla.** Nessun numero, nome o data scritto dall'AI arriva alla persona se non compare nei dati di partenza.
- **Semplificare senza tradire.** Il testo originale resta sempre consultabile accanto alla versione semplice.
- **Nessuna consulenza.** Le demo finanziarie non dicono mai cosa scegliere o comprare.
- **Accessibili.** Tastiera, screen reader, contrasto, testi brevi, linguaggio neutro e senza etichette sulla persona.
- **Sicure.** La chiave AI resta sul server, che ascolta solo su `127.0.0.1`.
