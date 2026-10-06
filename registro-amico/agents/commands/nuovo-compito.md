---
description: Aggiunge un nuovo esercizio alla palestra, con passi, testi in 3 lingue, feedback sugli errori e test
argument-hint: <azione da imparare sul registro, es. "scaricare la pagella">
---

Azione da imparare: $ARGUMENTS

1. **Il registro.** Se servono nuove schermate o dati, aggiungili in `app/public/lib/data.js` (dati inventati, etichette nuove in `L`) e il rendering in `app/public/app.js`. Ogni elemento cliccabile del percorso ha un `data-act="azione:valore"`. Le azioni che inviano o confermano qualcosa vanno in `GUARDED` (`tasks.js`).
2. **I passi.** Aggiungi il compito in `TASKS` (`app/public/lib/tasks.js`): `id`, `key`, i passi con `expect` e `target`, gli `errors` per gli sbagli tipici, `early` per le azioni fatte troppo presto.
3. **Prima i test** in `app/test/tasks.test.mjs`: il percorso giusto, almeno due errori tipici con il loro feedback, il ritorno a un passo già fatto (neutro).
4. **I testi** in `app/public/lib/i18n.js` con la skill `istruzioni-multilingue-semplici`: titolo, consegna, istruzione e suggerimento per ogni passo, feedback per ogni errore, testo finale. Sempre in `it`, `ar`, `en`, con le parole del registro tra «» in italiano.
5. **Le parole nuove** del registro nel glossario (`glossary.js`), con le tre lingue.
6. Fai rivedere i testi dal subagente `translation-fidelity-reviewer` e segna i testi arabi come **da rivedere da una persona madrelingua**.
7. `cd app && npm test`: i test di allineamento delle lingue e dei «» devono passare.
8. Prova il nuovo esercizio ai livelli 1, 2 e 3 con il subagente `learner-path-tester`.

Non cambiare le regole di livello (`nextLevel`) o le soglie del blocco senza dirlo esplicitamente nel riepilogo.
