---
description: Aggiunge un nuovo segnale di blocco al detector, con test, regola di fallback e prompt aggiornato
argument-hint: <comportamento da riconoscere>
---

Comportamento da riconoscere: $ARGUMENTS

Usa il subagente `struggle-signal-designer` per progettare il segnale e scrivere prima i test. Poi:

1. Implementa il segnale in `app/extension/content/detector.js` e l'evento corrispondente in `companion.js`.
2. Aggiungi la regola in `fallback-hints.js`, con un test in `app/test/hint-agent.test.mjs` che verifichi anche `validateHint`.
3. Aggiungi la riga di spiegazione del segnale in `agents/prompts/hint-agent.md`.
4. Fai rivedere i nuovi testi dal subagente `hint-copy-reviewer`.
5. `cd app && npm test`.

Non cambiare le soglie dei segnali esistenti senza dirlo esplicitamente nel riepilogo.
