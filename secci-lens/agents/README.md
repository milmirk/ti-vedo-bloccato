# Struttura agentica

La struttura ha due livelli:

1. **Gli agenti che aiutano la persona** (runtime): vivono nel server, sono facoltativi e scrivono solo testo controllato dal codice.
2. **Gli agenti che hanno costruito il prodotto** (sviluppo): le istruzioni, i subagenti, i comandi e la skill usati con Claude Code durante l'hackathon.

```
agents/
├── README.md                          questa mappa
├── CLAUDE.md                          istruzioni di progetto per Claude Code
├── workflow.md                        come è stata costruita la demo: fasi, contributo AI, revisione umana
├── prompts/
│   ├── extract-agent.md               system prompt: cita i dati di un testo non standard (letto dal server)
│   └── explain-agent.md               system prompt: «Spiegamelo in parole semplici» (letto dal server)
├── subagents/
│   ├── numbers-fidelity-reviewer.md   ricontrolla calcoli, esempi e validatori: nessun numero inventato
│   └── plain-language-reviewer.md     rivede i testi per la persona: italiano semplice, nessun consiglio
├── commands/
│   ├── demo-check.md                  /demo-check: test, server, percorso completo della demo
│   └── nuovo-documento.md             /nuovo-documento: aggiunge un SECCI di esempio con flussi e test
└── skills/
    └── spiegare-il-credito/
        └── SKILL.md                   regole per spiegare un credito senza consigliare (usate da prompt e regole)
```

## 1. Gli agenti di runtime

Il principio è uno: **il codice calcola, l'AI spiega, un validatore controlla.** L'app funziona tutta senza AI; l'AI aggiunge solo due cose.

| Fase | Dove | Cosa fa |
|---|---|---|
| Legge | `app/public/lib/parser.js` | Trova le etichette standard del SECCI («Importo totale del credito», «Rate ed, eventualmente, loro ordine di imputazione», «Tasso annuo effettivo globale (TAEG)», le spese…) e restituisce ogni valore con il brano esatto del documento. Nessuna AI. |
| Legge (testi non standard) | `app/server/agent.mjs` → `extract` + `prompts/extract-agent.md` | Solo se le regole non trovano importo e rate. Claude **copia** brani e valori dal testo, in JSON vincolato da schema. `fromAiFields` controlla che ogni citazione compaia nel documento e ogni valore dentro la sua citazione; i numeri li interpreta il codice. Le regole hanno sempre la precedenza. |
| Calcola | `app/public/lib/finance.js` | TAEG con la formula della direttiva 2008/48/CE (bisezione), piano delle rate, costo del credito, controllo di coerenza con TAEG, totale e TAN scritti nel documento. Nessuna AI. |
| Spiega | `app/public/lib/explain.js` | Frasi semplici a regole accanto al brano originale, costo in cose di tutti i giorni, confronto neutro tra due offerte, micro-quiz. Nessuna AI. |
| Spiega (facoltativo) | `agent.mjs` → `explain` + `prompts/explain-agent.md` | «Spiegamelo in parole semplici»: Claude riscrive frasi del documento. `validateExplanation` tiene solo le frasi con citazione verbatim e numeri presenti nel documento o nei calcoli; una frase con un consiglio («ti conviene», «è meglio», «scegli», «dovresti»…) fa scartare tutta la risposta. |

Modello: `claude-opus-5-5` con effort `low`, structured outputs (`output_config.format`) e fallback lato server (`fallbacks: "default"`). Si può cambiare con `SECCI_MODEL`; `SECCI_AI=off` forza le sole regole.

## 2. La struttura di sviluppo (Claude Code)

I file sono nel formato di Claude Code (frontmatter YAML). Per usarli in una sessione, copiali nella cartella `.claude/` alla radice del repository:

```bash
mkdir -p .claude/agents .claude/commands .claude/skills
cp secci-lens/agents/subagents/*.md .claude/agents/
cp secci-lens/agents/commands/*.md .claude/commands/
cp -r secci-lens/agents/skills/* .claude/skills/
cp secci-lens/agents/CLAUDE.md ./CLAUDE.md
```

Quando usarli è descritto in [workflow.md](workflow.md).
