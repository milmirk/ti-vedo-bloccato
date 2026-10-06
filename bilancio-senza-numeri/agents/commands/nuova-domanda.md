---
description: Aggiunge un nuovo tipo di domanda di comprensione, con risposta calcolata dal codice, test e revisione dei testi
argument-hint: <che cosa deve verificare la domanda>
---

Aspetto da verificare: $ARGUMENTS

Usa il subagente `domande-designer` per progettare la domanda e scrivere prima i test. Poi:

1. Implementa il nuovo tipo in `app/public/lib/questions.js` (`build()` e `KINDS_BY_REP`).
2. Aggiungi i testi della domanda e del riscontro al test «modalità senza numeri» in `app/test/words.test.mjs`.
3. Se la domanda serve a una rappresentazione nuova o cambia quando si fa, aggiorna `app/public/lib/adapt.js` e il commento in testa al file.
4. Fai rivedere i nuovi testi dal subagente `nessun-numero-reviewer`.
5. `cd app && npm test`.

Non cambiare le regole di adattamento esistenti senza dirlo esplicitamente nel riepilogo: la presentazione mostra un'esecuzione interna che dipende da quelle regole (test «esecuzione interna della demo» in `app/test/adapt.test.mjs`).
