---
name: presentazioni-accenture
description: Crea presentazioni HTML (deck, slide, pitch) in stile/brand Accenture — da usare quando l'utente chiede una presentazione, delle slide, un deck o una demo "in stile Accenture" o "con il brand Accenture", specialmente per deliverable `presentation/index.html` in repository GitHub. Fornisce palette, font e un template HTML autoconsistente da duplicare.
---

# Presentazioni Accenture (HTML)

Genera presentazioni **HTML standalone** (nessuna dipendenza esterna, funzionano offline da `file://`) conformi al brand Accenture, estratto da `00_input/template-accenture.pptx`. Valori completi con provenienza XML in `reference.md`.

## Come usare il template
1. Copia `assets/template.html` nella destinazione finale (es. `presentation/index.html`).
2. Individua i blocchi `<!-- SLIDE: ... -->...<!-- /SLIDE -->`: ogni tipo di slide è pronto, duplicalo e modifica solo testo/numeri/contenuti.
3. Elimina i tipi di slide non usati, riordina i rimanenti, aggiorna il contatore slide se necessario (il JS lo calcola automaticamente da `.slide`).
4. Per una demo dal vivo: usa lo slot "demo/screenshot" con `<img>` o `<iframe>` verso l'app/repo.
5. Apri il file in un browser per navigare (frecce, spazio, PgUp/PgDn, click) e verifica con la checklist sotto.

## Palette (uso parsimonioso del viola)
- Viola brand `#A100FF` — SOLO per accenti: titoli di sezione, numeri KPI, segno ">", piccoli dettagli grafici, CTA. Non riempire intere slide di viola tranne copertina/chiusura.
- Viola scuro `#7500C0`, viola molto scuro `#460073` — sfondi scuri (copertina, divisori, chiusura) con testo bianco.
- Viola chiaro `#BE82FF`, pastello `#DCAFFF` — badge/superfici leggere, accenti su sfondo scuro.
- Viola-rosa `#B455AA` — accento secondario (grafici, dettagli).
- Bianco `#FFFFFF` e nero `#000000` — testo e sfondi principali (la maggioranza delle slide è chiara/neutra).
- Grigio `#96968C` e grigio chiaro/crema `#E6E6DC` — testo secondario, sfondi alternativi, divider.

## Tipografia
`font-family: "Graphik", Arial, Helvetica, sans-serif;` (Graphik è a licenza Accenture: mai incorporarlo/scaricarlo, usare solo il fallback di sistema). Gerarchia: titoli bold 36-56px, sottotitoli 20-28px regular/medium, corpo 16-20px, non scendere sotto 14px.

## Regole di layout
- Formato **16:9** fisso (1280×720 px logici, scalato responsivamente all'interno della finestra/stampa).
- Margini generosi: almeno 64px ai lati e 48px sopra/sotto su sfondo pieno; non riempire gli angoli.
- **Un solo messaggio per slide**: un titolo chiaro, pochi bullet (max 5-6), niente muri di testo.
- Gerarchia visiva netta: titolo > sottotitolo > corpo; usa dimensione/peso, non solo colore.
- Footer costante con wordmark `accenture>` e numero di pagina in basso a destra o sinistra.
- Spazio bianco abbondante: il brand Accenture è pulito e minimale, non decorativo.

## Cosa evitare
- Sfondi interamente viola su più slide consecutive (stanca e non è lo stile del template).
- Gradient vistosi, ombre pesanti, bordi arrotondati eccessivi, emoji nelle slide.
- Font diversi da Graphik/Arial/Helvetica; dimensioni testo incoerenti tra slide dello stesso tipo.
- Più di un messaggio/argomento per slide; bullet con frasi lunghe (preferire frammenti).
- Immagini o font del template originale copiati nel repo (sono binari del pacchetto Accenture, non ridistribuibili): usare screenshot propri del progetto o placeholder, e il wordmark testuale per il logo.

## Checklist finale di conformità al brand
- [ ] Tutte le slide sono 16:9 e si vedono intere senza scroll orizzontale
- [ ] Il viola `#A100FF` è usato con parsimonia (accenti, non sfondi ripetuti)
- [ ] Font dichiarato `"Graphik", Arial, Helvetica, sans-serif` ovunque
- [ ] Ogni slide ha un solo messaggio/titolo chiaro
- [ ] Footer con wordmark `accenture>` e numero di pagina presente su ogni slide
- [ ] Navigazione (frecce/spazio/PgUp/PgDn/click) e contatore slide funzionanti
- [ ] Nessun asset esterno (font, immagini, script, CDN): il file è autoconsistente e apribile da `file://`
- [ ] Modalità stampa/PDF: una slide per pagina, senza elementi di navigazione nell'output
- [ ] Nessun file binario del template originale copiato nel repository
