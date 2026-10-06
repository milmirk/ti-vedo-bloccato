---
description: Aggiunge il supporto a un nuovo formato di email di conferma, con parser deterministico, test e revisione dei testi
argument-hint: <nome del servizio, poi l'email di esempio incollata>
---

Servizio ed email di esempio: $ARGUMENTS

Usa il subagente `provider-parser-builder` per scrivere prima i test e poi il parser. Poi:

1. Verifica che l'email di esempio, se finisce nei test o in `samples.js`, sia anonimizzata e con un nome di servizio inventato.
2. Controlla che la stessa email, prima del nuovo parser, risultasse «incompleta» o «da controllare», e dopo «riconosciuta».
3. Se il formato introduce una frequenza nuova, aggiungi i test di `schedule.test.mjs` per fine mese e anno bisestile.
4. Fai rivedere i nuovi testi (stato della lettura, glossario) al subagente `neutral-language-reviewer`.
5. `cd app && npm test`.

Non cambiare il comportamento dei parser esistenti senza dirlo esplicitamente nel riepilogo.
