# Reference — valori estratti da `00_input/template-accenture.pptx`

Estrazione: copia del .pptx come .zip, `Expand-Archive`, lettura mirata via grep (nessun dump integrale dell'XML).

## Palette colori
Fonte: `ppt/theme/theme1.xml` → `a:clrScheme` (ordine: dk1, lt1, dk2, lt2, accent1-6, hlink, folHlink)

| Ruolo PPTX | Hex       | Uso consigliato |
|---|---|---|
| dk1 (testo scuro) | `#000000` | testo principale su sfondo chiaro |
| lt1 (chiaro) | `#FFFFFF` | sfondo, testo su sfondo scuro/viola |
| dk2 | `#96968C` | testo secondario, grigio neutro |
| lt2 | `#E6E6DC` | sfondo alternativo, card chiare, divider |
| accent1 | `#A100FF` | **viola Accenture** — colore iconico, uso parsimonioso (accenti, segno ">", CTA, titoli di sezione) |
| accent2 | `#7500C0` | viola scuro — hover/stati, sfondi scuri con testo bianco |
| accent3 | `#460073` | viola molto scuro — sfondi copertina/chiusura |
| accent4 | `#B455AA` | viola-rosa — accenti secondari, grafici |
| accent5 | `#BE82FF` | viola chiaro — accenti su sfondo scuro |
| accent6 | `#DCAFFF` | viola pastello — superfici chiare, badge |
| hlink | `#A100FF` | link |
| folHlink | `#7500C0` | link visitati |

## Tipografia
Fonte: `ppt/theme/theme1.xml` → `a:fontScheme` → `majorFont`/`minorFont`, entrambi `latin typeface="Graphik"`.

CSS: `font-family: "Graphik", Arial, Helvetica, sans-serif;` (Graphik è a licenza: non ridistribuito, fallback di sistema).

## Formato slide
Fonte: `ppt/presentation.xml` → `p:sldSz cx="12192000" cy="6858000"` (EMU) = 13.333in × 7.5in = **16:9**, equivalente a 1280×720 px (scala 96 EMU/px... in realtà 914400 EMU/in → 1280×720 px a 96dpi).

## Layout
Fonte: `ppt/slideLayouts/slideLayout*.xml` (48 layout nello starter pack, es. `slideLayout1.xml` → name="Salutation-GTS centered", placeholder "Title 1", "GTS_WH").
Pattern osservato: titoli in alto/sinistra, molto spazio bianco, uso del viola solo su elementi chiave (titoli di sezione, numeri, accenti grafici), sfondi prevalentemente bianchi o grigio chiarissimo (`#E6E6DC`), slide scure (accent2/accent3) riservate a copertina e chiusura.

## Logo
Non estratto come immagine (asset binario escluso dal repo). Ricostruito in CSS come wordmark testuale: `accenture` in Graphik/Arial semibold + segno `>` in `#A100FF`, come da identità visiva pubblica del brand.
