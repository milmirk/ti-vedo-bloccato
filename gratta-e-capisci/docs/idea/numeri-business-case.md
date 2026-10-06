# Numeri del business case — "Fortuna in Chiaro"

| Campo | Valore |
|---|---|
| Data | 2026-10-05, 13:07–13:28 |
| Owner | Esperto di Innovazione |
| Scopo | Numeri verificati per `presentation/sezioni/business-case.html` (5-6 slide "numeri") e per chi assembla `presentation/index.html` |
| Base | `docs/idea/idea-selezionata.md`, `docs/idea/ricerca-azzardo.md`, `docs/idea/valore-checkpoint.md` |

**Legenda affidabilità**: **[UFF]** fonte primaria verificata direttamente · **[UFF-sec]** dato ufficiale letto tramite stampa di settore/secondaria · **[TERZI]** stima/calcolo di terze parti · **[DERIV]** calcolo nostro su dati ufficiali · **stima nostra** = ipotesi dichiarata, non misurata · **[NON VERIF.]** non usare come fatto.

---

## Slide 1 — Il problema in Italia

**Messaggio**: il gioco d'azzardo in Italia è un fenomeno di scala nazionale, non un'eccezione individuale.

| Numero | Valore | Anno | Fonte | Aff. |
|---|---|---|---|---|
| Raccolta totale | **157,45 miliardi €** (+6,59% sul 2023) | 2024 | ADM, Bilancio di esercizio 2024 (ripreso da agipronews.it, gioconews.it) | [UFF-sec] |
| Perdita netta (raccolta − vincite) | **21,5 miliardi €** (+4,38%) | 2024 | stessa fonte | [UFF-sec] |
| Giocatori adulti nell'ultimo anno | **18 milioni** | rilevazione ~2017-18, pubbl. 2019 | ISS, Rapporti ISTISAN 19/28 (ripreso da quotidianosanita.it) | [UFF-sec] |
| Giocatori "problematici" | **1,5 milioni** (circa 3% della popolazione adulta) | stessa rilevazione | ISS, Rapporti ISTISAN 19/28 | [UFF-sec] |

Invariato rispetto a `ricerca-azzardo.md` §0 e §4-5: nessuna correzione necessaria.

---

## Slide 2 — Chi paga di più

**Messaggio**: il peso del gioco non è uguale per tutti: pesa di più dove il reddito è più basso, e cresce tra i più giovani.

| Numero | Valore | Anno | Fonte | Aff. |
|---|---|---|---|---|
| Spesa pro capite più alta (canale fisico) | Abruzzo **3.319 €**/anno; Calabria **3.121,85 €**/anno (fascia 18-74) | 2024 | Il Centro (su dati ADM territoriali); PressGiochi | [UFF-sec/TERZI] |
| Spesa pro capite più bassa | Trentino-Alto Adige **845 €**/anno (fisico), contro media Italia **1.563 €** | 2024 | stessa fonte | [UFF-sec/TERZI] |
| Correlazione reddito-perdita | Analisi giornalistica conferma una relazione **inversa** tra reddito medio dichiarato per contribuente e perdita media al gioco per regione (più basso il reddito, più alta la perdita in proporzione) | 2024 | Il Sole 24 Ore — Infodata, "Esiste una correlazione tra il gioco d'azzardo e il reddito?" | [TERZI] — **valori esatti non recuperati** (pagina non raggiungibile nel tempo disponibile, errore server 503): usare solo l'affermazione qualitativa, non cifre specifiche |
| Giovani 14-17 anni, problematici | **68.000 (2018) → 90.000 (2024)** | 2018-2024 | ISS, usciredalgioco.iss.it, monitoraggio popolazione scolastica | [UFF] |
| Giovani 14-17 anni, a rischio | **80.000 (2018) → oltre 136.000 (2024)** | 2018-2024 | stessa fonte | [UFF] |

**Limite dichiarato** (confermato anche in questa verifica): non è stato trovato uno studio ISS che leghi esplicitamente, a livello individuale, prevalenza del gioco problematico a reddito o titolo di studio. Il legame resta **territoriale indiretto** (regioni a spesa pro capite più alta = regioni a reddito medio più basso), non causale individuale.

---

## Slide 3 — Salvatore in numeri

**Messaggio**: dietro ai numeri nazionali c'è una spesa quotidiana reale, quella di Salvatore.

| Numero | Valore | Come si ottiene |
|---|---|---|
| Spesa annua | **3.650 €** | 10 €/giorno × 365 [DERIV] |
| Quota del reddito | **23,4%** | 3.650 € / 15.600 €/anno (1.300 €/mese × 12) [DERIV] |
| Perdita attesa annua | **1.051 € – 1.456 €** (88–121 €/mese) | 3.650 € × (1 − payout); payout 71,2% modello A, 60,1% modello B, tabelle ADM | [UFF + DERIV] |
| Anni attesi per il premio massimo (500.000 €) | **~17.100 anni** (modello A) · **~10.500 anni** (modello B) | 12.480.000 (o 7.680.000) / 730 biglietti l'anno | [UFF + DERIV] |

Valore corretto rispetto a §0 di `ricerca-azzardo.md` (che riportava 1.060–1.460 €, arrotondamento impreciso): nel pitch e nell'app va **1.051–1.456 €**, come già indicato in `valore-checkpoint.md`.

---

## Slide 4 — La verità del biglietto (leve L1 e L3)

**Messaggio**: non tutte le "vincite" sono guadagni, e le probabilità reali si capiscono meglio in cose fisiche.

| Numero | Valore | Fonte | Aff. |
|---|---|---|---|
| Vincite che sono solo il rimborso della giocata (5 €) | **38,5%** di tutte le vincite (4.576.000 su 11.893.456) | ADM, tabella premi lotteria istantanea da 5 €, modello A | [DERIV su dati UFF] |
| Vincite da 5 o 10 € (rimborso o poco più) | **79,4%** di tutte le vincite | stessa tabella | [DERIV su dati UFF] |
| Payout reale (quanto torna per ogni € giocato) | **71,2%** (modello A) · **60,1%** (modello B) | ADM, tabelle premi due lotterie istantanee reali da 5 € | [UFF + DERIV] |
| Scala fisica del premio massimo | **208 stadi da 60.000 posti pieni**, vince una sola persona in tutti | 12.480.000 biglietti / 60.000 posti (modello A) | [DERIV su dati UFF] |

Nota tono: nell'app e nelle slide si useranno nomi generici — "lotteria istantanea da 5 €, modello A/B" — citando ADM come fonte della struttura premi, senza marchi commerciali.

---

## Slide 5 — Il divario di supporto

**Messaggio**: tra chi ha un problema di gioco e chi riceve aiuto c'è una distanza enorme — da qui nasce CR1.

| Numero | Valore | Anno | Fonte | Aff. |
|---|---|---|---|---|
| Giocatori problematici in Italia | **1,5 milioni** | ~2017-18 | ISS, Rapporti ISTISAN 19/28 | [UFF-sec] |
| Persone in carico ai SerD per gioco d'azzardo patologico | **~12.300** (dato storico) · stima più recente **~15.000** | 2015 (relazione ufficiale) / anno non specificato (stima giornalistica) | Relazione annuale al Parlamento sulle tossicodipendenze, Dipartimento Politiche Antidroga (2015); direttore Centro Studi CeDo, ripreso da aboutpharma.com | [UFF-sec] (12.300) · [TERZI] (15.000, dato più recente ma non ufficiale) |
| Numero verde nazionale ISS | **800 55 88 22**, gratuito, anonimo, lun-ven 10:00-16:00 | attivo dal 2017 | ISS, iss.it (TVNGA) | [UFF] |

**Lettura**: anche usando la stima più favorevole (15.000 persone in trattamento), resta **meno dell'1,1%** dei 1,5 milioni di giocatori problematici stimati — un divario che l'app non colma, ma che rende visibile con CR1 ("Vuoi parlarne con qualcuno?"), senza automatismi né diagnosi.

**Numero cercato e non trovato**: contatti/chiamate annui ricevuti dal Telefono Verde Nazionale ISS (800 55 88 22). Non pubblicato in forma di report accessibile nel tempo disponibile → **non usare** questo dato specifico.

---

## Slide 6 — Il valore su scala

**Messaggio**: un simulatore a costo marginale zero può rendere consapevoli perdite che oggi restano invisibili.

| Numero | Valore | Come si ottiene |
|---|---|---|
| Perdita netta nazionale (2024) | **21,5 miliardi €** | ADM, Bilancio 2024 [UFF-sec] |
| Perdita media per giocatore adulto | **~1.190 €/anno** (stima nostra: 21,5 mld / 18 mln; anni e perimetri delle due fonti non coincidono esattamente) | **stima nostra** |
| Ipotesi di impatto | 1% dei giocatori raggiunti (180.000) × 70% che arriva a 3/3 (126.000) × 1.190 € = **~150 milioni €/anno di perdite rese consapevoli** | **stima nostra**, dichiarata come tale: non sono risparmi, lo strumento non dà consigli (T2-V3) |
| Costo per utente a runtime | **zero token** | motore deterministico su dati ufficiali, nessuna chiamata AI in produzione (dichiarato, non da fonte web) |

KPI demo: quiz da 1/3 a 3/3; domanda di trasferimento su biglietto mai visto (no → sì); payout calcolato dall'app verificato contro tabella ADM da test automatici.

---

## Fonti (nuove verifiche di questa sessione)

- ADM, Note informative sulle probabilità di vincita (Lotto) — **verificata direttamente oggi**, conferma ambo 1/400,5 e terno 1/11.748 (il dato passa da [TERZI] a **[UFF]** rispetto a `ricerca-azzardo.md` §2): https://www.adm.gov.it/portale/en/-/lotto_note-note-informative-sulle-probabilita-di-vincita
- Agimeg.it, "ADM: nel 2024, 11,5 miliardi all'Erario dai giochi" (corrobora 11,55 mld già in `ricerca-azzardo.md` §4): https://www.agimeg.it/adm-2024-contributo-erario-settore-giochi-apparecchi-entrate-erariali-bollettino-statistico-trimestrale/
- Jamma.it, "ADM, Libro Blu 2024: dai giochi 11,55 miliardi di entrate erariali": https://www.jamma.it/attualita/adm-libro-blu-2024-dai-giochi-1155-miliardi-di-entrate-erariali-356075
- Il Centro, spesa pro capite Abruzzo 3.319 €: https://www.ilcentro.it/abruzzo/labruzzo-ama-il-gioco-dazzardo-la-spesa-pro-capite-e-di-3319-euro-brg92qrj
- Il Sole 24 Ore — Infodata, "Esiste una correlazione tra il gioco d'azzardo e il reddito?" (pagina irraggiungibile per fetch diretto, usata solo l'affermazione qualitativa dal risultato di ricerca): https://nova.ilsole24ore.com/infodata/esiste-una-correlazione-tra-il-gioco-dazzardo-e-il-reddito/
- ISS, usciredalgioco.iss.it, monitoraggio popolazione scolastica 2024 (confermato invariato): https://usciredalgioco.iss.it/it/news/1043-monitoraggio-della-pratica-del-gioco-dazzardo-nella-popolazione-scolastica-14/
- Relazione annuale al Parlamento sulle tossicodipendenze 2015, Dipartimento Politiche Antidroga (dato SerD ~12.300, ripreso da fonti secondarie nella ricerca di oggi, non raggiunto il PDF originale nel tempo disponibile): citato in aboutpharma.com, "Gioco patologico: in Italia i numeri sono in aumento...": https://www.aboutpharma.com/sanita-e-politica/gioco-patologico-nessuno-sa-quanti-ne-soffrano-in-italia-dove-le-scommesse-sono-la-terza-industria-nazionale-per-fatturato/
- ISS, Telefono Verde Nazionale (TVNGA), invariato: https://www.iss.it/it/dipendenze/-/asset_publisher/zwfXwoiZC6zu/content/telefono-verde-nazionale-per-le-problematiche-legate-al-gioco-d-azzardo-tvnga-800-55-88-22

## Numeri cercati e scartati (non usare)

1. **Contatti/chiamate annui al Telefono Verde ISS**: cercato esplicitamente, nessun report pubblico trovato nel tempo disponibile. Non usare la cifra "divario" con un numero di chiamate specifico — usare invece il confronto 1,5 milioni problematici vs ~12.300-15.000 in carico ai SerD (slide 5).
2. **Costo sociale del gioco d'azzardo in Italia**: trovata una stima ISS del **2017** di **6-7 miliardi €** (ripresa da ilbolive.unipd.it, Osservatorio dell'Università di Padova), e una stima più bassa di **2,7 miliardi €** su dati **2014** (fonte minore, non identificata con precisione). Entrambe sono datate (8-12 anni) e non ricalcolate di recente da ISS: **scartate dal pitch** per non introdurre un numero vecchio accanto a dati 2024. Se richiesto in dibattito, citare solo verbalmente con la cautela sulla data.
3. **Tabella premi completa di un biglietto da 10 €**: non trovata, invariato da `ricerca-azzardo.md` §7.
4. **Nesso causale individuale reddito/istruzione → gioco problematico**: non trovato uno studio ISS che lo quantifichi; resta solo la correlazione territoriale indiretta (slide 2) e l'affermazione qualitativa di Il Sole 24 Ore senza cifre esatte recuperabili oggi.
5. **"170 miliardi" di raccolta (fonte giornalistica locale, Trentotoday)**: discorde rispetto al Bilancio ADM (157,45 mld); non usare, resta scartato come già indicato in `ricerca-azzardo.md` §4.
