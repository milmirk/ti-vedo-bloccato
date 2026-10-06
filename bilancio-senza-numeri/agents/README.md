# Struttura agentica

La struttura ha due livelli:

1. **Ciò che si adatta alla persona** (runtime): il ciclo domanda → risposta → cambio di rappresentazione, che è codice deterministico, e l'interprete facoltativo delle frasi, che usa Claude.
2. **Gli agenti che hanno costruito il prodotto** (sviluppo): le istruzioni, i subagenti, i comandi e la skill usati con Claude Code durante l'hackathon.

```
agents/
├── README.md                     questa mappa
├── CLAUDE.md                     istruzioni di progetto per Claude Code
├── workflow.md                   come è stato costruito: fasi, contributo AI, revisione umana
├── prompts/
│   └── interpreta-spesa.md       system prompt dell'interprete delle frasi (letto dal server)
├── subagents/
│   ├── nessun-numero-reviewer.md rivede i testi: niente cifre, niente consigli, niente etichette
│   └── domande-designer.md       progetta e testa nuovi tipi di domanda di comprensione
├── commands/
│   ├── demo-check.md             /demo-check: test + server + percorso completo
│   └── nuova-domanda.md          /nuova-domanda: aggiunge un tipo di domanda con i suoi test
└── skills/
    └── soldi-in-oggetti/
        └── SKILL.md              regole per raccontare i soldi con gli oggetti (testi, domande, prompt)
```

## 1. Il runtime

Ciclo **mostra → chiede → valuta → adatta**. Tutto tranne la lettura delle frasi è codice in `app/public/lib/`, lo stesso che gira nei test.

| Fase | Dove | Cosa fa |
|---|---|---|
| Mostra | `units.js`, `budget.js`, `view.js`, `words.js` | Scompone i soldi che restano negli oggetti scelti (greedy, dal più grande, resto come «qualche spicciolo»), calcola i giorni fino alla paga e la parte di oggi. Con gli euro spenti nessun testo contiene cifre. |
| Chiede | `questions.js` | Ogni tanto fa una domanda concreta sulla situazione vera: «Se prima di sabato prendi sei spese piccole, bastano i soldi che ti restano?». La risposta giusta la calcola il codice. Le combinazioni sono vicine alla soglia, ma mai a pochi centesimi. |
| Valuta | `questions.js` (`evaluateAnswer`, `feedbackText`) | Giusta, sbagliata o «Non so». Il riscontro dice prima la risposta e poi un fatto, mai un giudizio: «La risposta è no. Non bastano: mancherebbero soldi per circa un pranzo fuori.» |
| Adatta | `adapt.js` | Risposta sbagliata o «Non so» → un gradino più concreto: tutti gli oggetti → solo i più piccoli → giorno per giorno → solo oggi. Dopo tre giuste di fila un errore isolato è tollerato. Ogni cambio resta registrato e il pannello «Come lo capisci meglio» mostra quale modo funziona. |
| Legge le frasi (facoltativo) | `app/server/agent.mjs` + `prompts/interpreta-spesa.md` | «ho fatto la spesa, circa 30 euro» → voci in JSON vincolato da schema. Il modello non riceve prezzi e non fa conti. Il validatore accetta un importo solo se compare nel testo, altrimenti usa il prezzo noto dell'oggetto o scarta la risposta. |

Modello: `claude-opus-5-5` con effort `low` e fallback lato server (`fallbacks: "default"`). Si cambia con `BSN_MODEL`, si spegne con `BSN_AI=off`. Senza chiave l'app usa l'interprete a regole (`app/public/lib/parser.js`) e i pulsanti: funziona tutta.

## 2. La struttura di sviluppo (Claude Code)

I file sono nel formato di Claude Code. Per usarli in una sessione, copiali nella cartella `.claude/` alla radice della demo:

```bash
cd bilancio-senza-numeri
mkdir -p .claude/agents .claude/commands .claude/skills
cp agents/subagents/*.md .claude/agents/
cp agents/commands/*.md .claude/commands/
cp -r agents/skills/* .claude/skills/
cp agents/CLAUDE.md ./CLAUDE.md
```

Quando usarli è descritto in [workflow.md](workflow.md).
