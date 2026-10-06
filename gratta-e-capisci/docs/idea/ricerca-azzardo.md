# Ricerca gioco d'azzardo — dati per il simulatore educativo (persona Salvatore)

| Campo | Valore |
|---|---|
| Data | 2026-10-05 |
| Owner | Esperto di Innovazione |
| Scopo | Dati verificati per `02_idea/idea-selezionata.md` e per il simulatore "un anno in 10 secondi" (Tema 02) |
| Vincolo | T2-V3: nessun consiglio nell'app, solo numeri e significati. Biglietti SENZA marchi commerciali, struttura premi ufficiale citata come fonte |

**Legenda affidabilità**: **[UFF]** fonte primaria (ADM, ISS) verificata direttamente · **[UFF-sec]** dato ufficiale letto tramite stampa di settore perché il sito/PDF originale non era leggibile · **[TERZI]** stima/calcolo di terze parti · **[DERIV]** calcolo nostro su dati ufficiali · **[NON VERIF.]** non verificato: non usare come fatto.

---

## 0. I 5 numeri più forti per il pitch

| # | Numero | Anno | Fonte | Aff. |
|---|---|---|---|---|
| 1 | Un gratta e vinci da 5 € ufficiale ("Nuovo 20X", ADM) **paga in media 71,2 centesimi per ogni euro giocato** — il **28,8%** resta strutturalmente perso. La probabilità di vincere il **premio massimo (500.000 €) è 1 su 12.480.000**: quasi **40 volte meno probabile** di essere colpiti da un fulmine in un anno in Italia (ordine di grandezza 1/300.000-1/1.000.000, dato noto ma da verificare separatamente se usato). | 2024 (regolamento vigente) | ADM, pagina ufficiale gioco "Nuovo 20X" | [UFF] |
| 2 | Nel 2024 gli italiani hanno **giocato 157,45 miliardi di euro** (+6,59% sul 2023) e ne hanno **persi netti 21,5 miliardi** (+4,38%): oltre **360 € l'anno per ogni residente**, neonati inclusi. | 2024 | ADM, Bilancio di esercizio 2024 (ripreso da agipronews.it e gioconews.it) | [UFF-sec] |
| 3 | **18 milioni** di adulti italiani hanno giocato d'azzardo almeno una volta nell'ultimo anno; **1,5 milioni (circa il 3% della popolazione adulta)** sono giocatori "problematici" e altri **1,4 milioni** a rischio moderato. | studio ISS (dati raccolti ~2017-18, pubblicazione Rapporti ISTISAN 19/28) | ISS, "Gioco d'azzardo nella popolazione adulta" | [UFF-sec] |
| 4 | Sul **Lotto**, fare **ambo** su una ruota ha probabilità **1 su 400,5** ma paga **250 volte** la posta (ritorno teorico **62,4%**); il **terno** ha probabilità **1 su 11.748** e paga **4.500 volte** (ritorno teorico **38,3%**): lo Stato trattiene strutturalmente circa il **40%** delle giocate. Ogni estrazione è **indipendente dalle precedenti**: non esistono numeri "ritardatari" con più probabilità di uscire. | calcolo su regolamento vigente | 123lotto.it / proiezionidiborsa.it (matematica combinatoria standard, verificabile) | [TERZI] |
| 5 | Il **Telefono Verde Nazionale ISS per il gioco d'azzardo** è **800 55 88 22**, gratuito e anonimo, attivo **dal lunedì al venerdì dalle 10:00 alle 16:00**. | verificato oggi sul sito ufficiale | ISS, iss.it (TVNGA) | [UFF] |

**Per Salvatore**: 10 €/giorno × 365 = **3.650 €/anno**, cioè **circa il 23% del suo reddito annuo** (1.300 €/mese × 12 = 15.600 €). Con un payout medio del 60-71% (vedi tabelle sotto), la perdita attesa su quella spesa è tra **1.060 € e 1.460 € l'anno** [DERIV, calcolo nostro, vedi §1].

---

## 1. Dati per il simulatore: tabelle premi/probabilità ufficiali (pronte per JSON)

Fonte primaria: **adm.gov.it**, pagine ufficiali di gioco pubblico (Agenzia delle Dogane e dei Monopoli, l'ente regolatore). Ho estratto le tabelle complete di **due lotterie istantanee reali da 5 €** (non sono riuscito a raggiungere un biglietto da 10 € con tabella completa nel tempo disponibile — vedi nota in fondo alla sezione). Nell'app questi dati vanno usati con nomi generici ("lotteria istantanea da 5 €, modello A/B") citando ADM come fonte della struttura premi, **non** il marchio commerciale.

### 1.1 Lotteria istantanea da 5 € — modello A ("Nuovo 20X") [UFF]
Lotto di emissione: 49.920.000 biglietti. Prezzo: 5 €. Premio massimo: 500.000 €.

| Premio (€) | Biglietti vincenti | Probabilità |
|---|---|---|
| 500.000 | 4 | 1 su 12.480.000 |
| 25.000 | 8 | 1 su 6.240.000 |
| 10.000 | 40 | 1 su 1.248.000 |
| 4.000 | 80 | 1 su 624.000 |
| 2.000 | 92 | 1 su 542.609 |
| 1.000 | 2.288 | 1 su 21.818 |
| 500 | 5.408 | 1 su 9.231 |
| 400 | 5.408 | 1 su 9.231 |
| 200 | 15.808 | 1 su 3.158 |
| 100 | 257.920 | 1 su 194 |
| 50 | 665.600 | 1 su 75 |
| 25 | 748.800 | 1 su 67 |
| 20 | 748.800 | 1 su 67 |
| 10 | 4.867.200 | 1 su 10 |
| 5 (rimborso) | 4.576.000 | — |

- **Totale biglietti vincenti (qualunque premio, incluso il rimborso)**: 11.893.456 su 49.920.000 → **23,8%**.
- **Probabilità di vincere più del costo del biglietto (≥10 €)**: circa **1 su 6,82** (dato dichiarato dall'operatore) [DERIV coerente con tabella].
- **Payout complessivo** [DERIV, calcolo nostro]: somma(premio × vincenti) / (biglietti × prezzo) = 177.740.800 € / 249.600.000 € = **71,2%**.

### 1.2 Lotteria istantanea da 5 € — modello B ("Numerissimi") [UFF]
Lotto di emissione: 38.400.000 biglietti. Prezzo: 5 €. Premio massimo: 500.000 €.

| Premio (€) | Biglietti vincenti | Probabilità |
|---|---|---|
| 500.000 | 5 | 1 su 7.680.000 |
| 100.000 | 5 | 1 su 7.680.000 |
| 50.000 | 5 | 1 su 7.680.000 |
| 10.000 | 20 | 1 su 1.920.000 |
| 5.000 | 40 | 1 su 960.000 |
| 2.500 | 100 | 1 su 384.000 |
| 1.000 | 1.500 | 1 su 25.600 |
| 500 | 9.600 | 1 su 4.000 |
| 250 | 9.600 | 1 su 4.000 |
| 100 | 192.000 | 1 su 200 |
| 50 | 320.000 | 1 su 120 |
| 30 | 640.000 | 1 su 60 |
| 15 | 1.344.000 | 1 su 28,57 |
| 10 | 2.816.000 | 1 su 13,64 |

- **Totale biglietti vincenti**: 5.332.875 su 38.400.000 → **13,9%** (1 su 7,20, come dichiarato ufficialmente — i due numeri tornano, verifica incrociata superata).
- **Payout complessivo** [DERIV]: 115.320.000 € / 192.000.000 € = **60,1%**.

**Nota per il simulatore**: i due payout reali (60,1% e 71,2%) confermano che il **75% è un tetto medio regolamentare su tutte le lotterie attive**, non il payout di ogni singolo biglietto (ADM, determinazione sul pay-out, gennaio 2026, tetto massimo di legge 75%, singoli giochi fino al 77,5% [UFF-sec]). Per il "modello standard" del simulatore si può usare **~65% come payout medio prudenziale** tra i due esempi reali, oppure includere entrambi i modelli come scelta dell'utente ("lotteria A" / "lotteria B").

**Limite dichiarato**: non ho trovato nel tempo disponibile una tabella completa ufficiale per un biglietto da **10 €** (la pagina ADM richiede navigazione per singolo gioco attivo, non sempre accessibile in fetch). La struttura e il metodo di calcolo sono identici: se serve un secondo taglio per la demo, consiglio di cercare "adm.gov.it" + nome di un gioco attivo da 10 € (es. "Il Miliardario", "Turista per Sempre") il giorno dello sviluppo, oppure usare il modello A/B scalato (dichiarandolo come stima, non dato ufficiale).

---

## 2. Lotto: probabilità, quote pagate, indipendenza delle estrazioni

- **Ambo** su una ruota: probabilità **1/400,5**; **quota pagata: 250 volte** la posta → **ritorno teorico 62,4%** [TERZI, calcolo matematico standard].
- **Terno** su una ruota: probabilità **1/11.748**; **quota pagata: 4.500 volte** → **ritorno teorico 38,3%** [TERZI].
- Margine del banco: lo Stato trattiene strutturalmente **circa il 40%** della raccolta sul Lotto [TERZI, stesso calcolo].
- **Indipendenza delle estrazioni / fallacia del numero ritardatario**: ogni estrazione del Lotto è un evento indipendente dalle precedenti; un numero "ritardatario" non ha probabilità maggiore di uscire alla prossima estrazione (principio statistico standard, probabilità condizionata = probabilità marginale per eventi indipendenti). Fonte divulgativa che lo richiama esplicitamente per il Lotto italiano: giocoresponsabile.info, "Probabilità di vincere al Lotto" [TERZI]. **Raccomandazione**: nell'app presentare questo come principio matematico (indipendenza statistica), non attribuirlo a uno studio specifico.
- Non sono riuscito a verificare nel tempo disponibile una fonte ADM primaria con le stesse cifre esatte (1/400,5 e 1/11.748): la pagina ufficiale esiste (`adm.gov.it/.../lotto_note-note-informative-sulle-probabilita-di-vincita`) ma non è stata controllata riga per riga. **Prima di pubblicare il numero nell'app, verificare su quella pagina.**

---

## 3. Payout medio delle lotterie istantanee e del gioco in generale (ADM)

- **Tetto regolamentare di legge: payout medio ≤ 75%** su tutte le lotterie istantanee attive, con singoli giochi fino al **77,5%**; calcolo e monitoraggio mensile da parte di ADM (determinazione direttoriale, gennaio 2026) [UFF-sec, jamma.it/agimeg.it che riportano l'atto ADM].
- Verifica diretta sui due esempi reali (§1): payout **60,1%** e **71,2%** — entrambi coerenti col tetto medio del 75% [UFF, calcolo nostro].
- Non ho trovato nel tempo disponibile un "payout medio di settore" aggregato pubblicato nel Libro Blu 2024 come singola cifra: il Libro Blu riporta piuttosto raccolta ed entrate erariali per comparto (vedi §4). **[NON VERIF.]** come cifra aggregata unica.

---

## 4. Raccolta e spesa (perdita netta) del gioco in Italia

- **Raccolta totale 2024: 157,45 miliardi di euro** (+6,59% sul 2023) [UFF-sec, ADM Bilancio di esercizio 2024, ripreso da agipronews.it e gioconews.it].
- **Spesa netta (raccolta − vincite restituite) 2024: 21,5 miliardi di euro** (+4,38%) [UFF-sec, stessa fonte].
- **Libro Blu ADM 2024** (comparto fisico + online): le lotterie crescono del **4,50%**; insieme a scommesse, Lotto e Bingo rappresentano il **47,32%** della raccolta fisica; nel comparto "giochi numerici e lotterie" le lotterie istantanee pesano il **51,39%** del gettito; entrate erariali complessive dal gioco **11,55 miliardi di euro** [UFF-sec, jamma.it che riporta i dati ADM].
- **Spesa pro capite per regione, 2024** [UFF-sec/TERZI, fonti stampa su dati ADM territoriali]: Campania, Abruzzo, Molise, Calabria e Sicilia **sopra i 3.000 €/anno per residente**; Abruzzo **3.319 €**; Calabria **3.121,85 €** (fascia 18-74 anni); Trentino-Alto Adige in fondo alla classifica con **845 €** sul canale fisico (contro una media italiana di **1.563 €** sul fisico). Catania, Palermo e Napoli in testa tra le grandi città con **4.500-4.800 €** pro capite comprendendo online e fisico.
- Esistono cifre giornalistiche discordanti (es. "oltre 170 miliardi di raccolta" in un articolo locale): usare **157,45 mld raccolta / 21,5 mld spesa netta 2024** come numeri di riferimento perché derivano dal Bilancio ADM, la fonte più autorevole reperita.

---

## 5. Prevalenza: giocatori e giocatori problematici in Italia

- **Adulti**: **18 milioni** di italiani hanno giocato almeno una volta nell'ultimo anno; di questi oltre **13 milioni** giocano in modo "sociale", **2 milioni** a basso rischio, **1,4 milioni** a rischio moderato, **1,5 milioni (circa il 3% della popolazione adulta)** sono giocatori "problematici" (disturbo da gioco d'azzardo) [UFF-sec, ISS — Rapporti ISTISAN 19/28, ripreso da quotidianosanita.it e aboutpharma.com].
- **Studenti 14-17 anni, dati 2024** [UFF, usciredalgioco.iss.it, monitoraggio ufficiale ISS]: prevalenza di chi ha giocato sceso dal **29% (2018) al 25% circa (2024)**, ma i giocatori **problematici sono saliti da 68.000 a 90.000** e quelli **a rischio da 80.000 a oltre 136.000**. Tra i maschi minorenni la problematicità arriva al **6%** e il rischio al **10%**.
- **Relazione con reddito/istruzione**: non ho trovato nel tempo disponibile uno studio ISS che leghi esplicitamente prevalenza del gioco problematico a reddito o titolo di studio individuale. Il legame indiretto più solido è **territoriale**: le regioni con spesa pro capite più alta (Campania, Calabria, Sicilia, Abruzzo — §4) sono anche tra quelle con reddito medio più basso e maggiore disoccupazione (dato di contesto, non uno studio causale specifico) [DERIV, incrocio di fonti diverse: da usare con cautela nel pitch].

---

## 6. Numero verde nazionale (ISS, TVNGA)

- **800 55 88 22** — Telefono Verde Nazionale per le problematiche legate al gioco d'azzardo (TVNGA), gestito dal Centro Nazionale Dipendenze e Doping dell'ISS.
- **Gratuito, anonimo**, servizio di counselling telefonico con psicologi; orari **lunedì-venerdì 10:00-16:00**.
- Si rivolge sia a chi ha un problema di gioco sia a familiari/amici.
- Verificato oggi direttamente su **iss.it** (pagina ufficiale TVNGA) [UFF].

---

## 7. Dati NON verificati (da non usare come fatti)

- Tabella premi completa di un biglietto da **10 €** (non raggiunta nel tempo disponibile).
- Fonte ADM primaria con le cifre esatte di ambo (1/400,5) e terno (1/11.748) del Lotto: il calcolo è matematicamente standard ma non è stato riscontrato riga per riga sulla pagina ufficiale ADM.
- Un "payout medio di settore" aggregato in un'unica cifra per tutte le lotterie istantanee nel Libro Blu 2024 (il documento riporta raccolta ed entrate erariali, non un payout medio esplicito come singolo numero).
- Nesso causale diretto reddito/istruzione → rischio di gioco problematico a livello individuale (solo correlazione territoriale indiretta).
- Anno esatto di raccolta dati dello studio ISS sugli adulti (Rapporti ISTISAN 19/28): la pubblicazione è del 2019 ma la rilevazione sul campo risale probabilmente al 2017-2018; non confermato riga per riga.

---

## 8. Fonti

**Ufficiali (primarie)**
- ADM, "Nuovo 20X" (lotteria istantanea, tabella premi): https://www.adm.gov.it/portale/en/-/nuovo-20x
- ADM, "Numerissimi" (lotteria istantanea, tabella premi): https://www.adm.gov.it/portale/en/-/numerissimi
- ADM, Note informative sulle probabilità di vincita (lotterie istantanee): https://www.adm.gov.it/portale/en/monopoli/giochi/lotterie/lotterie_istantanee/lot_ist_note
- ADM, Note informative sulle probabilità di vincita (Lotto): https://www.adm.gov.it/portale/en/-/lotto_note-note-informative-sulle-probabilita-di-vincita (non verificata riga per riga, vedi §7)
- ISS, Telefono Verde Nazionale gioco d'azzardo (TVNGA): https://www.iss.it/en/dipendenze/-/asset_publisher/zwfXwoiZC6zu/content/telefono-verde-nazionale-per-le-problematiche-legate-al-gioco-d-azzardo-tvnga-800-55-88-22
- ISS, usciredalgioco.iss.it, monitoraggio gioco d'azzardo popolazione scolastica 2024: https://usciredalgioco.iss.it/it/news/1043-monitoraggio-della-pratica-del-gioco-dazzardo-nella-popolazione-scolastica-14/
- ISS, Rapporti ISTISAN 19/28, "Gioco d'azzardo nella popolazione adulta": https://publ.iss.it/ITA/Items/GetPDF?uuid=5961887c-aa59-4cfd-b90e-a8d10d977b76

**Secondarie e terze parti**
- Agipronews, "ADM, Bilancio di esercizio 2024: raccolta 157,45 mld, spesa 21,5 mld": https://www.agipronews.it/adm-bilancio-di-esercizio-2024-dal-settore-giochi-raccolta-superiore-a-157-miliardi-6-5-spesa-a-21-5-miliardi
- Gioconews, "ADM: Bilancio d'esercizio 2024, raccolta dai giochi a 157,45 miliardi": https://www.gioconews.it/news/attualita/adm--bilancio-d-esercizio-2024-raccolta-dai-giochi-a-15745-miliardi-.aspx
- Jamma.it, "ADM, Libro Blu 2024: gli apparecchi generano oltre la metà del gettito": https://www.jamma.it/mercato/adm-libro-blu-2024-gli-apparecchi-generano-oltre-la-meta-del-gettito-del-gioco-pubblico-seguono-lotto-e-lotterie-356088
- Jamma.it, "ADM, Libro Blu 2024: dai giochi 11,55 miliardi di entrate erariali": https://www.jamma.it/attualita/adm-libro-blu-2024-dai-giochi-1155-miliardi-di-entrate-erariali-356075
- Jamma.it, "Lotterie istantanee, ADM fissa le nuove regole sul pay-out: tetto medio al 75%": https://www.jamma.it/attualita/lotterie-istantanee-adm-fissa-le-nuove-regole-sul-pay-out-calcolo-mensile-e-tetto-medio-al-75-345231
- Agimeg.it, "Gratta e Vinci: ADM vara nuove regole sul Payout" (gennaio 2026): https://www.agimeg.it/adm-determinazione-payout-gratta-e-vinci-gennaio-2026/
- Quotidianosanita.it, "Gioco d'azzardo. Indagine Iss: 18 mln gli italiani coinvolti": https://www.quotidianosanita.it/scienza-e-farmaci/gioco-d-azzardo-indagine-iss-mln-gli-italiani-coinvolti-di-questi-milioni-sono-problematici/
- AboutPharma, "Disturbo da gioco d'azzardo (Dga): per un milione e mezzo di italiani è problematico": https://www.aboutpharma.com/sanita-e-politica/disturbo-da-gioco-dazzardo-dga-per-un-milione-e-mezzo-di-italiani-e-problematico/
- 123lotto.it, "Probabilità di Vincita al Lotto: Analisi Matematica e Statistica": https://123lotto.it/news/probabilita-di-vincita-al-lotto-analisi-matematica-e-statistica
- Proiezionidiborsa.it, "Molti non conoscono le reali probabilità di fare ambo o terno": https://www.proiezionidiborsa.it/molti-non-conoscono-le-reali-probabilita-di-fare-ambo-o-terno-e-vincere-al-lotto/
- Giocoresponsabile.info, "Probabilità di vincere al Lotto: estratto, ambo, terno": https://giocoresponsabile.info/probabilita-lotto/
- PressGiochi, "Il gioco in Italia: quanto spendono gli italiani regione per regione": https://www.pressgiochi.it/il-gioco-in-italia-quanto-spendono-gli-italiani-regione-per-regione/136184
- Il Centro, "L'Abruzzo ama il gioco d'azzardo: la spesa pro capite è di 3.319 euro": https://www.ilcentro.it/abruzzo/labruzzo-ama-il-gioco-dazzardo-la-spesa-pro-capite-e-di-3319-euro-brg92qrj
- Trentotoday, "Gioco d'azzardo, in Italia si spendono 170 miliardi, ma il Trentino resiste": https://www.trentotoday.it/economia/gioco-d-azzardo-ludopatia-classifica-italia-trentino.html

**Nota metodologica**: www.grattaevinci.com (sito non ufficiale) è bloccato dal filtro di sicurezza aziendale Accenture/Forcepoint ("Malicious Web Sites") e non è stato possibile consultarlo via fetch diretto; i dati citati da quel dominio nei risultati di ricerca non sono stati usati nel documento, sostituiti con le tabelle ufficiali ADM (§1).
