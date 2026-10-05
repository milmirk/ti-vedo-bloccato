# Struttura agentica

La struttura ha due livelli:

1. **L'agente che aiuta la persona** (runtime): vive nell'estensione e nel server, e decide quando e come intervenire.
2. **Gli agenti che hanno costruito il prodotto** (sviluppo): le istruzioni, i subagenti, i comandi e la skill usati con Claude Code durante l'hackathon.

```
agents/
├── README.md                     questa mappa
├── CLAUDE.md                     istruzioni di progetto per Claude Code
├── workflow.md                   come abbiamo lavorato: fasi, contributo AI, revisione umana
├── prompts/
│   └── hint-agent.md             system prompt dell'agente di runtime (letto dal server)
├── subagents/
│   ├── struggle-signal-designer.md   progetta e testa nuovi segnali di blocco
│   ├── hint-copy-reviewer.md         rivede i testi: italiano semplice, fedeltà alla pagina
│   └── a11y-persona-tester.md        percorre la demo "da Luca" e cerca dove si blocca ancora
├── commands/
│   ├── demo-check.md             /demo-check: test + server + percorso completo nel browser
│   ├── new-signal.md             /new-signal: aggiunge un segnale di blocco con i suoi test
│   └── review-hints.md           /review-hints: revisione di prompt e suggerimenti a regole
└── skills/
    └── plain-italian-hints/
        └── SKILL.md              regole per scrivere un suggerimento (usate da prompt e regole)
```

## 1. L'agente di runtime

Ciclo **percepisce → capisce → aiuta → impara**, distribuito tra estensione e server:

| Fase | Dove | Cosa fa |
|---|---|---|
| Percepisce | `app/extension/content/detector.js` | Trasforma click, errori, cambi di passo e assenze in 7 segnali di blocco, con soglie per sensibilità (con «normale» interviene al primo segnale chiaro) e una pausa minima tra un suggerimento e l'altro. |
| Capisce | `app/extension/content/context.js` | Legge il contesto del punto di blocco: passo, campo, errore mostrato, campi obbligatori vuoti, pulsanti. Non legge mai i valori; maschera email, codice fiscale e numeri. |
| Aiuta | `companion.js`, `app/server/hint-agent.mjs` + `prompts/hint-agent.md` | La scheda compare subito, dentro la pagina, con il suggerimento a regole. Claude scrive **un** suggerimento in JSON vincolato da schema. Il server lo valida: ogni nome tra «» deve esistere nella pagina, la citazione deve essere testuale, il bersaglio deve essere un elemento reale. Se un controllo fallisce, si usano le regole (`fallback-hints.js`). |
| Impara | `detector.js` (`feedback`) | "Non ora" alza la soglia di quel segnale (×1,5, fino a ×3); "Mi è servito" la riabbassa. |

Modello: `claude-opus-5-5` con effort `low` (risposte brevi, latenza bassa) e fallback lato server `fallbacks: "default"`. Si può cambiare con `TVB_MODEL`.

## 2. La struttura di sviluppo (Claude Code)

I file sono nel formato di Claude Code. Per usarli in una sessione, copiali nella cartella `.claude/` alla radice del repository:

```bash
mkdir -p .claude/agents .claude/commands .claude/skills
cp agents/subagents/*.md .claude/agents/
cp agents/commands/*.md .claude/commands/
cp -r agents/skills/* .claude/skills/
cp agents/CLAUDE.md ./CLAUDE.md
```

Quando usarli è descritto in [workflow.md](workflow.md).
