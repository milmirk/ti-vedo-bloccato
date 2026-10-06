---
name: soldi-in-oggetti
description: Regole per raccontare i soldi con gli oggetti di tutti i giorni invece che con le cifre - scomposizione, parole, domande e riscontri senza numeri e senza consigli. Usala quando scrivi o rivedi testi, domande, riscontri o il prompt dell'interprete di "Bilancio senza numeri".
---

# Raccontare i soldi con gli oggetti

Chi legge sa benissimo cosa costa un caffè, una pizza, una spesa al supermercato. Quello che non riesce a fare è trasformare «137,80 €» e «11 giorni» in una risposta. Il nostro lavoro è fare quella trasformazione al posto suo, e dirla con le sue parole.

## Le regole

1. **Gli oggetti della persona.** Si usano solo gli oggetti che ha scelto, con i prezzi che ha messo lei. Mai oggetti "di esempio" che non compra.
2. **Dal più grande al più piccolo.** La scomposizione è greedy e deterministica: stessa cifra, stessa frase. Quello che avanza si chiama «qualche spicciolo», non sparisce.
3. **Quantità in lettere, giorni per nome.** "cinque spese piccole", "fino a sabato", "tra undici giorni". Niente cifre, €, "euro", percentuali o date in cifre, a meno che la persona non abbia acceso «Mostra anche gli euro».
4. **«circa» quando si arrotonda.** La parte di oggi, i giorni uno per uno e i riscontri usano al massimo due tipi di oggetto: dirlo sempre con "circa". Ma non "circa meno di un caffè": quando resta meno dell'oggetto più piccolo si dice "meno di un caffè".
5. **Frasi che tornano.** Il verbo si accorda con gli oggetti ("ti resta un caffè", "ti restano due pizze"). Il primo del mese è "primo". Il riscontro dice prima la risposta ("la risposta è no") e poi il fatto.
6. **Pochi pezzi alla volta.** In una domanda mai più di sei oggetti uguali. Le icone si raggruppano a cinque.
7. **Fatti, non consigli.** "Se prendi la pizza, fino a sabato restano circa cinque spese piccole." Mai "dovresti", "conviene", "attenzione", "risparmia", "spendi troppo".
8. **Mai colpevolizzare.** Una risposta che non torna riceve "Ecco come stanno le cose", non "Sbagliato". «Non so» è una risposta legittima: "Nessun problema".
9. **Niente etichette.** Non si nomina mai una difficoltà della persona. Si parla dei soldi.
10. **Linguaggio neutro** rispetto al genere: "Ti restano", "Hai usato più soldi di quelli che avevi", non "Sei andato in rosso".
11. **La cifra vera è sempre a un tocco.** Semplificare non vuol dire nascondere: «Mostra anche gli euro» mostra ogni importo al centesimo.

## Esempi

| Situazione | Da evitare | Meglio |
|---|---|---|
| Saldo di 137,80 € con caffè, pizza, pranzo fuori, spesa piccola | "Ti restano 137,80 €" | "Ti restano cinque spese piccole, un pranzo fuori e qualche spicciolo." |
| 12,63 € al giorno | "Budget giornaliero: 12,63 €" | "Oggi puoi usare circa un pranzo fuori." |
| Oggi ha superato la sua parte | "Attenzione! Hai sforato il budget di oggi." | "La parte di oggi è già stata usata. Da domani, ogni giorno circa: un pranzo fuori e un caffè." |
| Soldi finiti prima della paga | "Sei in rosso di 20 €. Dovresti spendere meno." | "Hai usato più soldi di quelli che avevi per questo periodo: mancano circa un pranzo fuori e una pizza." |
| Domanda | "Hai 137,80 € e 11 giorni: puoi spendere 150 €?" | "Se prima di sabato prendi sei spese piccole, bastano i soldi che ti restano?" |
| Riscontro a «Non so» | "Risposta errata." | "Nessun problema. La risposta è no. Non bastano: mancherebbero soldi per circa un pranzo fuori." |
| Resta un solo oggetto | "Ti restano un caffè." | "Ti resta un caffè." |

## Il controllo automatico

`hasNumbers()` in `app/public/lib/words.js` e il test «modalità senza numeri» in `app/test/words.test.mjs` controllano più di mille testi generati in decine di situazioni. Ogni nuovo testo rivolto alla persona va aggiunto lì.
