# Ricerca NEET — dati per l'origination dell'idea

| Campo | Valore |
|---|---|
| Data | 2026-10-05 |
| Owner | Esperto di Innovazione |
| Scopo | Base dati per le idee sul target NEET (`idee-neet.md`) |
| Metodo | Ricerca web. Per i dati Eurostat i valori sono letti **direttamente dall'API ufficiale** (`ec.europa.eu/eurostat/api/dissemination/...`), non da articoli. |

**Legenda affidabilità**
- **[UFF]**: dato ufficiale (Eurostat, ISTAT, ANPAL, Ministero del Lavoro, OCSE, Commissione UE), verificato su fonte primaria o su pagina istituzionale.
- **[UFF-sec]**: dato ufficiale, ma letto tramite fonte secondaria (stampa, testate di settore) perché il PDF originale non era leggibile.
- **[TERZI]**: stima o elaborazione di terze parti (fondazioni, banche, centri studi).
- **[DERIV]**: calcolo nostro su dati ufficiali (formula indicata).
- **[NON VERIF.]**: non verificato online: **non usare come fatto**.

---

## 0. Sintesi: i 7 numeri più forti per il pitch

| # | Numero | Anno | Fonte | Aff. |
|---|---|---|---|---|
| 1 | **13,3%** dei 15–29enni italiani è NEET (circa **1,18 milioni**), contro l'**11,0%** della media UE. L'obiettivo UE 2030 è il **9%**. L'Italia è **4ª** su 27 Paesi UE (dopo Romania 19,2%, Bulgaria 13,8%, Grecia 13,6%). | 2025 | Eurostat `edat_lfse_20`; notizia Eurostat 28/05/2026 | [UFF] |
| 2 | **Il 73% dei NEET italiani vorrebbe lavorare** (9,7 punti su 13,3), contro il 63% nella UE (6,9 su 11,0). **5,0 punti**, cioè circa il **38% dei NEET (circa 440 mila giovani)**, sono **inattivi che vorrebbero lavorare ma non cercano**. | 2025 | Eurostat `edat_lfse_20` (wstatus WANT, UNE) | [UFF] + [DERIV] |
| 3 | **Divario territoriale**: Sicilia **22,8%**, Campania **21,5%**, Calabria **20,9%**, contro Bolzano **5,6%** e Lombardia **8,5%**. | 2025 | Eurostat `edat_lfse_22` | [UFF] |
| 4 | **Giovani nati all'estero: 24,9%** NEET, contro il **12,0%** dei nati in Italia. Tra le **donne nate all'estero** la quota sale al **35,6%** (12,7% per le nate in Italia). | 2025 | Eurostat `edat_lfse_28` | [UFF] |
| 5 | **Competenze digitali**: ha almeno le competenze di base il **68,5%** dei 16–24enni italiani, contro il **74,6%** UE. Tra i **disoccupati** italiani (tutte le età) la quota scende al **47,5%**, contro il **74,2%** degli studenti. | 2025 | Eurostat `isoc_sk_dskl_i21` | [UFF] |
| 6 | **Canali di ricerca**: solo il **29%** dei NEET che cercano lavoro passa dai Centri per l'impiego. Il **72%** passa da amici o ex colleghi, il **64%** dalla famiglia. È "un sistema di conoscenze più che di competenze". | 2025 | Fondazione Gi Group / Osservatorio Giovani Toniolo, Laboratorio Dedalo | [TERZI] |
| 7 | **Imbuto della Garanzia Giovani 2014–2022**: **1.717.038** registrati, **85%** presi in carico, **64,5%** dei presi in carico avviati a una misura (il **56,8%** delle misure sono tirocini extracurriculari), **534 mila** occupati. Quindi circa **31 occupati ogni 100 registrati**. Tra chi **completa** la misura, il tasso di inserimento è del **66,4%**. | fine 2022 | ANPAL, "Garanzia Giovani, un bilancio sull'attuazione 2014–2022" | [UFF-sec] + [DERIV] |

**Numero di contesto sul costo**: Eurofound stima la perdita economica dovuta ai NEET a **153 miliardi di euro l'anno nella UE (1,2% del PIL, dati 2011)**. L'Italia è tra i Paesi con un costo pari o superiore al **2% del PIL** [UFF-sec]. Per l'Italia circolano cifre di **circa 32 miliardi** (dati 2011) e, nel rapporto Intesa Sanpaolo, Cariplo e Tobagi del 2026, di **24 miliardi** [TERZI]. Il PDF Eurofound originale non era leggibile: in un pitch usare **"oltre il 2% del PIL (Eurofound)"**, non una cifra in euro.

**Regola di scala per il pitch** [DERIV]: con 1,18 milioni di NEET al 13,3%, **1 punto di tasso corrisponde a circa 89 mila giovani** (1,18 M / 13,3). Per arrivare al 9% servono circa **380 mila uscite nette** dalla condizione NEET. È lo stesso ordine di grandezza indicato dal rapporto Intesa Sanpaolo 2026.

> **Avvertenza da ripetere nel pitch.** Se un inattivo comincia a cercare lavoro, **non esce dai NEET**: passa da "inattivo" a "disoccupato". Il tasso scende solo quando il giovane entra in **lavoro, istruzione o formazione**. Nella definizione Eurostat conta anche la formazione non formale nelle 4 settimane precedenti all'intervista: la dimensione `training` del dataset è "neither formal nor non-formal education or training". Ogni catena di impatto deve arrivare fino a questo passaggio.

---

## 1. Tasso NEET: Italia, UE, serie storica, classifica, obiettivo 2030

### 1.1 Serie storica Italia, 15–29 anni [UFF]
Fonte: Eurostat `edat_lfse_20`, sesso totale, valori in %.

| 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|---|---|---|---|
| 25,7 | 24,3 | 24,1 | 23,2 | 22,1 | 23,5 | 23,1 | 19,0 | 16,1 | 15,2 | **13,3** |

- Il calo di **12,4 punti** tra il 2015 e il 2025 è **il più forte della UE** (notizia Eurostat del 28/05/2026) [UFF].
- Nota: per il 2024 ISTAT ed Eurostat riportano **15,2%**. Il rapporto Intesa Sanpaolo del 2026 scrive 15,3%: usare 15,2.
- Per il 2020 ISTAT riporta 23,7%, Eurostat 23,5% (serie rivista). Usare la serie Eurostat per coerenza.

### 1.2 Confronto UE [UFF]
- **UE-27**: 11,1% nel 2024, **11,0%** nel 2025. Obiettivo **9% entro il 2030** (Pilastro europeo dei diritti sociali, Piano d'azione).
- **Italia 15–34 anni** (2025): **15,6%**, contro il **12,0%** della UE [UFF, `edat_lfse_20`, age Y15-34].
- **Classifica UE 2025**: Romania 19,2%, Bulgaria 13,8%, Grecia 13,6%, **Italia 13,3% (4ª)**. I valori più bassi sono Paesi Bassi 5,3%, Svezia 5,9%, Slovenia 7,6% (notizia Eurostat). Nel 2024 l'Italia era **2ª** (dopo la Romania) secondo Con i Bambini/Openpolis e Noi Italia ISTAT.
- **OCSE**, Education at a Glance 2026: in Italia è NEET il **16% dei 18–24enni nel 2025** (30% nel 2015), contro una media OCSE del 13% [UFF-sec].

### 1.3 Valori assoluti
- **1,18 milioni** di NEET 15–29 e **1,9 milioni** di NEET 15–34, di cui **59% donne** (Rapporto Dedalo 2025, presentato alla Camera il 9/7/2026, su microdati RCFL ISTAT) [TERZI su dati UFF].
- "Circa 1,2 milioni" nel 2025 (Intesa Sanpaolo, Fondazione Cariplo, Scuola Tobagi, "La condizione NEET", 2/10/2026) [TERZI].

---

## 2. Scomposizione

### 2.1 Per genere [UFF]
| | Italia 2025 | UE 2025 | Italia 2024 (ISTAT) |
|---|---|---|---|
| Donne | **14,9%** | 12,0% | 16,6% |
| Uomini | **11,8%** | 9,9% | 13,8% |

### 2.2 Per area e regione [UFF]
Fonte: Eurostat `edat_lfse_22`, 15–29 anni.

| Area / regione | 2024 | 2025 |
|---|---|---|
| Nord-Ovest | 10,2 | 9,2 |
| Nord-Est | 9,2 | 8,0 |
| Centro | 12,9 | 11,8 |
| Sud | 23,0 | **19,7** |
| Isole | 24,0 | **21,3** |
| Sicilia | 25,7 | **22,8** |
| Campania | 24,9 (ISTAT) | **21,5** |
| Calabria | 26,2 | **20,9** |
| Puglia | 21,4 (ISTAT) | **19,0** |
| Lombardia | n.d. | 8,5 |
| P.A. Trento / Bolzano | 7,3 / 8,0 (ISTAT) | 6,7 / 5,6 |

- ISTAT (Noi Italia 2025, dati 2024): **Centro-Nord 10,7%, Mezzogiorno 23,3%** [UFF].
- Città con i valori più alti (Con i Bambini/Openpolis, **dati 2020**, quindi vecchi): Catania 42,0%, Palermo 39,8%, Napoli 37,3%. Usare solo come colore, non come dato attuale [TERZI su dati UFF].

### 2.3 Per titolo di studio
- Italia 2025, 15–29 anni [UFF, `edat_lfse_21`]: al più licenza media (ISCED 0–2) **12,0%**, diploma (ISCED 3–4) **15,0%**, laurea (ISCED 5–8) **11,1%**. *Attenzione*: nel gruppo ISCED 0–2 ci sono anche i 15–19enni ancora a scuola, che abbassano il valore. Il dato non dice che "chi ha la licenza media è meno a rischio".
- UE 2025: basso titolo 12,8%, medio 11,0%, alto 8,0% [UFF].
- ISTAT: nel Mezzogiorno, a parità di titolo, i NEET sono molti di più. **Oltre la metà dei giovani con basso titolo è NEET al Sud**, contro circa 3 su 10 al Centro-Nord [UFF-sec: Annuario statistico ISTAT 2025, cap. 7, letto tramite sintesi. La fascia d'età esatta va verificata sul PDF].
- Donne 25–34 con basso titolo: NEET al **61,5%** a livello nazionale, oltre il **74%** al Sud (Fondazione Gi Group, 2025) [TERZI].

### 2.4 Per cittadinanza o paese di nascita
- **Nati all'estero 24,9%** contro **nati in Italia 12,0%**. Donne: **35,6%** contro **12,7%** (Italia 2025, `edat_lfse_28`) [UFF].
- ISTAT, per cittadinanza (Annuario 2025): stranieri 23,8%, donne straniere 35,8% contro 16,0% delle italiane [UFF-sec]. Il dato per gli "italiani" (12,2%) letto nella sintesi è poco coerente con il totale: **usare il dato Eurostat per paese di nascita**.
- Numero assoluto di NEET nati all'estero: **[NON VERIF.]**.

### 2.5 Per età
- UE 2025: 15–19 anni **5,3%**, 20–24 anni **12,8%**, 25–29 anni **14,7%** [UFF].
- Italia 2024 (ISTAT): 15–19 anni 6,6% (maschi) e 5,4% (femmine); 20–24 anni 17,8% [UFF-sec].
- Tra i 25–29enni circa **1 su 5** è NEET (Intesa 2026) [TERZI]. Il rischio cresce con l'età, soprattutto per le donne.

---

## 3. Composizione per condizione

### 3.1 Disoccupati e inattivi [UFF]
Fonte: Eurostat `edat_lfse_20`, Italia 2025, 15–29 anni, valori in % della popolazione.

| Condizione | Totale | Donne | Uomini | UE totale |
|---|---|---|---|---|
| NEET totale | 13,3 | 14,9 | 11,8 | 11,0 |
| Disoccupati (cercano) | **4,7** | 4,3 | 5,0 | 4,2 |
| Inattivi (fuori dalle forze di lavoro) | **8,7** | **10,6** | 6,8 | 6,8 |
| Vorrebbero lavorare (che cerchino o no) | **9,7** | 9,5 | 9,9 | 6,9 |
| Non vogliono lavorare | **3,6** | **5,5** | 1,9 | 4,1 |

Derivazioni [DERIV]:
- **Disoccupati**: circa **35%** dei NEET (4,7/13,3), cioè circa 415 mila.
- **Inattivi che vorrebbero lavorare** (WANT − UNE): **5,0 punti**, circa **38% dei NEET**, cioè **circa 440 mila**. È il **segmento più ampio e il più "attivabile"**.
- **Non vogliono o non possono lavorare**: circa **27%** dei NEET, circa 320 mila. Tra le donne è il 37% delle NEET (5,5/14,9), tra gli uomini il 16% (1,9/11,8).
- In Italia la quota di NEET che **vorrebbe lavorare (73%)** è **più alta della media UE (63%)**. Il problema italiano è meno di motivazione e più di **passaggio all'azione e di incontro con i canali**.
- Coerenza con la stampa: Intesa 2026 scrive 35% disoccupati, 33,3% disponibili ma non in cerca, 31,7% né in cerca né disponibili [TERZI]. Le due fonti tornano.

### 3.2 Scoraggiati, durata, motivi
- **1 NEET su 3** non cerca, non è disponibile e si trova in questa condizione da oltre 12 mesi. È il "livello di gravità massimo": 43,1% delle donne contro il 13,2% degli uomini (Rapporto Dedalo 2025) [TERZI].
- **Carichi familiari**: sono il motivo principale dell'inattività per circa il **25% delle giovani NEET** e per il **2% dei ragazzi** [TERZI/UFF-sec, sintesi di fonti ISTAT/Dedalo. Il dato esatto va verificato sul PDF].
- Fondazione Gi Group, 2024 (fascia 15–34): è NEET per motivi di cura il **40,5%** delle donne 25–29 (3% degli uomini) e il **56%** delle donne 30–34 [TERZI].
- **Madri giovani**: il rapporto Dedalo 2025 riporta che il 78,2% delle madri 20–24enni è NEET [TERZI, da usare con cautela].
- Intesa 2026 individua sei profili di NEET: basso titolo e poche risorse familiari; laureati con aspettative alte; chi ha interrotto gli studi; scoraggiati; chi lavora in modo informale o precario; donne fuori dal mercato per cura [TERZI].

---

## 4. Competenze digitali e abbandono precoce

### 4.1 Competenze digitali almeno di base [UFF]
Fonte: Eurostat `isoc_sk_dskl_i21`.

| Gruppo | 2021 | 2023 | 2025 |
|---|---|---|---|
| Italia, 16–24 anni | 60,0% | 59,1% | **68,5%** |
| UE, 16–24 anni | 71,2% | 70,0% | **74,6%** |
| Italia, 16–74 anni | 45,6% | 45,8% | **54,3%** |
| UE, 16–74 anni | 53,9% | 55,6% | **60,4%** |
| Italia, **disoccupati** (16–74) | — | — | **47,5%** |
| Italia, studenti | — | — | **74,2%** |

- Obiettivo Decennio Digitale: **80%** degli adulti con competenze di base entro il 2030 [UFF].
- Quindi **circa 1 giovane italiano su 3 (31,5%) non ha competenze digitali di base**. Tra i disoccupati non le ha più di 1 su 2.
- Competenze digitali **specifiche dei NEET**: **[NON VERIF.]**. Eurostat non pubblica la voce "NEET" in questo dataset. Il proxy disponibile è "disoccupati".

### 4.2 Abbandono precoce (ELET, 18–24 anni)
- Eurostat `edat_lfse_14` [UFF]: Italia 11,5% (2022), 10,5% (2023), 9,8% (2024), **8,2% (2025)**. UE: 9,6%, 9,6%, 9,6%, **9,1%**. Nel 2025 l'Italia è **sotto** la media UE e sotto l'obiettivo UE 2030 (<9%).
- ISTAT 2024 [UFF-sec]: maschi **12,2%**, femmine **7,1%**. Mezzogiorno **12,4%**, Nord 8,4%, Centro 8,0%. **Cittadini stranieri 24,3%**, che sale al **38,9%** per chi è arrivato in Italia tra i 16 e i 24 anni. **Genitori con al più la licenza media: 22,8%** (1,2% se almeno un genitore è laureato).
- Regioni peggiori 2024: **Sicilia 15,2%**, Sardegna 14,5% (Noi Italia) [UFF].
- Education and Training Monitor 2025 (Commissione UE, dati 2024) [UFF]: nati in Italia 8,7%, **nati all'estero 21,3%** (nati fuori UE 23,4%). Divario di competenze di base tra adulti poco e molto qualificati: partecipazione alla formazione **10,3%** contro **60,2%**.

---

## 5. Politiche esistenti e limiti documentati

### 5.1 Garanzia Giovani (dal 2014)
- **Bilancio 2014–2022** (ANPAL) [UFF-sec]: **1.717.038** registrati, **1.398.461 presi in carico (84,7–85%)**, di cui il **79,7%** con indice di profilazione medio-alto o alto. **64,5%** dei presi in carico avviati a una misura. **1.092.243 misure**: tirocini extracurriculari **56,8%**, incentivi all'occupazione 19%, formazione 17,1%. **804.868** hanno concluso un intervento, con tasso di inserimento del **66,4%**, cioè **oltre 534 mila occupati**. Il 77,7% dei contratti è stabile (63,4% a tempo indeterminato, 14,3% apprendistato).
- **Imbuto** [DERIV]: 100 registrati, 85 presi in carico, circa 55 avviati a misura, circa 31 occupati. **Il punto di perdita più ampio è tra la registrazione e l'avvio della misura** (circa 45 su 100).
- **Corte dei conti europea**, Relazione speciale 5/2017 [UFF-sec, numeri riportati dalla stampa]: per l'Italia risultati inferiori agli altri Paesi esaminati, con una quota di giovani coinvolti che trovano lavoro indicata intorno al **31%** (Irlanda 64%, Francia 90%). Critiche: **identificazione debole dei NEET inattivi**, giovani costretti a **registrarsi più volte su banche dati diverse**, eccesso di tirocini. La raccomandazione ricorrente UE è fare **outreach verso i NEET non registrati** ai servizi per l'impiego.
- **Qualità dei tirocini**: diffusione di tirocini extracurriculari "spesso di bassa qualità" (Bollettino ADAPT) [TERZI].
- **Conoscenza del programma**: secondo il Rapporto Giovani dell'Istituto Toniolo, la conoscenza di Garanzia Giovani è scarsa, solo circa metà dei beneficiari la valuta positivamente, e oltre l'80% dei giovani lamenta carenza di orientamento e di servizi (2025) [TERZI, sintesi. Percentuali esatte **[NON VERIF.]**].

### 5.2 Programma GOL (PNRR)
- Al **31/01/2025**: oltre **3,2 milioni** di presi in carico. **Giovani under 30: 29,2%**, donne 55,5%, stranieri 15,3%, disoccupati da oltre 12 mesi 30,7%. Percorsi: reinserimento circa 50%, aggiornamento (upskilling) 24,8%, riqualificazione (reskilling) 20,7%, lavoro e inclusione 3,8%. La quota di presi in carico che avvia una politica sale dal **48,2%** (coorte del 3° trimestre 2022) al **71,8%** (coorte del 4° trimestre 2024). I dati sulle politiche sono "ancora parziali" (Ministero del Lavoro, nota di monitoraggio) [UFF].
- Limite strutturale: GOL prende in carico chi è già registrato come disoccupato. Gli inattivi non in contatto con i servizi restano fuori per definizione [DERIV, logica di programma].

### 5.3 SIISL (Sistema informativo per l'inclusione sociale e lavorativa, gestito da INPS)
- Piattaforma nazionale di incontro tra domanda e offerta. Prima era riservata ai beneficiari di ADI e SFL, dal 24/11/2024 è aperta ai percettori di NASpI e DIS-COLL e nel 2025 ad altri segmenti. Dati riportati dalla stampa nel 2025: **oltre 2 milioni di accessi**, **291.086 CV caricati**, **63.506 corsi** pubblicati, **337.568** beneficiari ADI/SFL con **Patto di attivazione digitale** firmato [UFF-sec. Data esatta della rilevazione **[NON VERIF.]**].
- Per i NEET inattivi non percettori di sostegni, l'accesso e l'uso spontaneo del SIISL **non è misurato**: **[NON VERIF.]**.

### 5.4 Piano "NEET Working" (gennaio 2022, Politiche giovanili e Lavoro)
- Strategia triennale in **tre fasi**: **emersione** (individuare i NEET), **ingaggio** (superare sfiducia e disillusione verso le istituzioni), **attivazione** (CPI, Garanzia Giovani rafforzata, Servizio civile, portale GIOVANI2030, sportelli giovani nei CPI) [UFF-sec].
- Una valutazione pubblica degli esiti del Piano **non è stata trovata**: **[NON VERIF.]**.

### 5.5 Canali effettivi di ricerca del lavoro
- NEET che cercano lavoro (Fondazione Gi Group, Dedalo, novembre 2025) [TERZI]: amici o ex colleghi **72%**, famiglia **64%**, invio di CV e lettura di offerte **60–62%**, **CPI 29%**, concorsi 11%. Con al più la licenza media: amici 80%, famiglia 71%, CPI 27%.
- Su tutta la popolazione in cerca (ISTAT, 2023): parenti e amici **76,6%**, CPI **25,8%** [UFF-sec].

### 5.6 Iniziative private (benchmark)
- **ZeroNeet** (Fondazione Cariplo): oltre 4.500 giovani raggiunti previsti entro il 2028. **Giovani e Lavoro** (Intesa Sanpaolo e Generation Italy): 6.000 giovani formati dal 2019, **80%** di occupazione dichiarata [TERZI].

---

## 6. Costo economico

| Stima | Valore | Anno dei dati | Fonte | Aff. |
|---|---|---|---|---|
| UE, perdita da NEET | **153 mld €**, **1,2% del PIL UE** | 2011 | Eurofound, *NEETs: characteristics, costs and policy responses* (2012) | [UFF-sec] |
| Italia | tra i Paesi con costo **≥ 2% del PIL** (con BG, CY, EL, HU, IE, LV, PL) | 2011 | Eurofound (2012) | [UFF-sec] |
| Italia | circa **32 mld €** (primo Paese per costo assoluto) | 2011 | sintesi giornalistiche di Eurofound 2012 | [UFF-sec, cifra non letta sul PDF] |
| Italia | **26 mld €, 1,7% del PIL** | 2008 | Eurofound, *Young people and NEETs: first findings* (2011) | [UFF-sec] |
| Italia | **24 mld €** di costo sociale | stima 2026 | Intesa Sanpaolo, Cariplo, Tobagi (con metodo Eurofound) | [TERZI] |

Uso consigliato: "**Secondo Eurofound i NEET costano all'Italia oltre il 2% del PIL ogni anno.**"

---

## 7. Sottosegmenti NEET promettenti per l'hackathon

> Le dimensioni sono stime derivate dalla composizione Eurostat 2025 (1 punto ≈ 89 mila giovani 15–29). Un giovane può stare in più segmenti.

| # | Sottosegmento | Dimensione stimata | Barriera principale | Perché uno strumento digitale può aiutare | Aggancio al Tema 03 |
|---|---|---|---|---|---|
| **S1** | **Inattivi che vorrebbero lavorare ma non cercano** ("forze di lavoro potenziali", scoraggiati) | **circa 440 mila** (5,0 punti, 38% dei NEET) [DERIV] | Non fanno il **primo passo formale**: non si registrano, non hanno un CV, temono il processo (servizi poco conosciuti, sfiducia). Garanzia Giovani perde circa 45 registrati su 100 prima della misura. | Un ambiente **senza rischio e senza giudizio** per provare il processo (registrazione, CV, patto di attivazione) e arrivare al primo passo da soli. | **Nuovo utente di un processo digitale**: aggancio diretto |
| **S2** | **Disoccupati che cercano con canali informali e competenze digitali basse** | **circa 415 mila** (4,7 punti, 35%) [DERIV] | Cercano tramite amici e parenti (72%), poco tramite CPI (29%). Tra i disoccupati solo il **47,5%** ha competenze digitali di base. Candidature online, email, allegati e portali sono un ostacolo. | Allenare le **micro-competenze digitali della candidatura** con verifica e feedback sugli errori. | **Bassa alfabetizzazione digitale**: aggancio diretto |
| **S3** | **Giovani nati all'estero, soprattutto donne** | Dimensione assoluta **[NON VERIF.]**. Tasso 24,9% (donne 35,6%) [UFF] | **Lingua** (italiano di livello A2–B1) e gergo di annunci, moduli e servizi. ELET al 21,3% tra i nati all'estero. | Lettura guidata e adattiva di annunci e moduli **reali**, glossario, verifica della comprensione su testi nuovi. | **Difficoltà linguistiche**: aggancio diretto |
| **S4** | **Giovani donne al momento del rientro dopo un periodo di cura** | Tra le NEET, il 37% "non vuole o non può lavorare" (5,5 punti) [DERIV]. 43,1% delle donne al massimo livello di gravità [TERZI] | Strutturale (cura dei figli, servizi) **più** una barriera "soft": **buco nel CV**, sensazione di "non saper fare niente", nessuna esperienza formale. | Non risolve la barriera strutturale. Può però intervenire nel **momento del rientro** (quando il vincolo si allenta), trasformando esperienze informali in competenze dichiarabili. | Aggancio indiretto: **nuovo utente** del processo "CV digitale". Rischio A-02 |
| **S5** | **Abbandoni precoci e basso titolo nel Mezzogiorno** | ELET 18–24: Sud 12,4%, Sicilia 15,2% (2024). Maschi 12,2% [UFF] | Competenze di base (lettura, digitale), sfiducia verso la scuola, nessuna rete formale. | Micro-percorsi brevi, adattivi, che misurano i progressi e danno feedback mirato. | **Bassa alfabetizzazione digitale** o DSA (prevalenza DSA tra gli ELET **[NON VERIF.]**) |

**Il territorio non è un segmento ma un moltiplicatore**: tutte le personas sono ambientate nelle regioni peggiori (Sicilia, Campania, Calabria, Puglia), tranne S3, che è concentrato dove vivono più stranieri (Centro-Nord). Ambientarle lì rende la persona rappresentativa con un numero preciso.

---

## 8. Dati che NON siamo riusciti a verificare (da non usare come fatti)

- Competenze digitali **specifiche dei NEET** (esiste solo il proxy "disoccupati").
- Numero assoluto di NEET nati all'estero o stranieri.
- Quota di NEET che **conosce** Garanzia Giovani e percentuali esatte del Rapporto Giovani Toniolo.
- Quota di NEET inattivi registrati al SIISL o in contatto con un CPI.
- Esiti valutati del Piano NEET Working.
- Cifra in euro del costo NEET per l'Italia sul PDF Eurofound originale (sono disponibili solo sintesi).
- Prevalenza di DSA tra i giovani che abbandonano la scuola.
- Tassi di abbandono dei corsi GOL o Garanzia Giovani da parte dei giovani.
- Dettaglio per fascia d'età del dato ISTAT "oltre la metà dei giovani con basso titolo è NEET al Sud".

Nota tecnica: i PDF ISTAT e INAPP (Report livelli di istruzione 2024, Annuario 2025, INAPP Report 58) **non erano leggibili** dallo strumento di fetch. I loro numeri sono riportati tramite sintesi istituzionali o giornalistiche e marcati [UFF-sec].

---

## 9. Fonti

**Ufficiali (primarie)**
- Eurostat, API `edat_lfse_20` (NEET per condizione, sesso, età): https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/edat_lfse_20
- Eurostat, API `edat_lfse_22` (NEET per regione NUTS2): https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/edat_lfse_22
- Eurostat, API `edat_lfse_21` (NEET per titolo di studio): https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/edat_lfse_21
- Eurostat, API `edat_lfse_28` (NEET per paese di nascita): https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/edat_lfse_28
- Eurostat, API `edat_lfse_14` (abbandono precoce): https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/edat_lfse_14
- Eurostat, API `isoc_sk_dskl_i21` (competenze digitali): https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_sk_dskl_i21
- Eurostat News, "Fewer young people not in work or education in 2025" (28/05/2026): https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20260528-2
- Eurostat, Statistics Explained, NEET: https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Statistics_on_young_people_neither_in_employment_nor_in_education_or_training
- Eurostat News, "75% of young Europeans have at least basic digital skills": https://ec.europa.eu/eurostat/en/web/products-eurostat-news/w/edn-20260715-1
- ISTAT, Noi Italia 2025, Istruzione: https://noi-italia.istat.it/pagina.php?id=3&categoria=5&action=show&L=0
- ISTAT, Report "Livelli di istruzione e ritorni occupazionali, anno 2024" (dicembre 2025): https://www.istat.it/wp-content/uploads/2025/12/Report-Livelli-di-istruzione-e-ritorni-occupazionali-Anno-2024.pdf
- ISTAT, Annuario statistico 2025, cap. 7: https://www.istat.it/storage/ASI/2025/capitoli/C07.pdf
- Commissione UE, Education and Training Monitor 2025, Italia: https://op.europa.eu/webpub/eac/education-and-training-monitor/en/country-reports/italy.html
- Ministero del Lavoro, Monitoraggio GOL al 31/01/2025: https://www.lavoro.gov.it/notizie/pagine/online-i-dati-del-monitoraggio-gol-al-31-gennaio-2025
- ANPAL, "Garanzia Giovani, un bilancio sull'attuazione 2014–2022": https://www.anpal.gov.it/en/-/garanzia-giovani-un-bilancio-sull-attuazione-2014-2022
- Corte dei conti europea, Relazione speciale 3/2015: https://www.eca.europa.eu/Lists/ECADocuments/SR15_03/SR15_03_IT.pdf
- Piano NEET Working (2022): https://www.politichegiovanili.gov.it/media/fodnvowp/piano_neet-2022_rev-gab.pdf
- Eurofound, NEETs (2012): https://assets.eurofound.europa.eu/f/279033/9e48d8f2be/ef1254en.pdf
- OCSE, Education at a Glance 2025, transizione scuola-lavoro: https://www.oecd.org/en/publications/education-at-a-glance-2025_1c0d9c79-en/full-report/transition-from-education-to-work-where-are-today-s-youth_b90719d0.html

**Secondarie e terze parti**
- Il Sole 24 Ore, ISTAT 2024 NEET 15,2%: https://en.ilsole24ore.com/art/istat-school-2024-667percent-and-graduate-below-eu-average-neet-share-152percent-15-and-29-years-old-AHeQLC3C
- Il Sole 24 Ore, "NEET halved… social cost 24 billion" (2026): https://en.ilsole24ore.com/art/the-number-of-neets-has-halved-over-the-last-ten-years-but-there-are-still-12-million-of-them-AJBvBbWB
- Vita.it, rapporto "La condizione NEET" (2/10/2026): https://www.vita.it/neet-i-numeri-si-dimezzano-in-dieci-anni-ma-un-milione-e-200mila-ragazzi-restano-ancora-ai-margini/
- Sky TG24 (4/10/2026): https://tg24.sky.it/economia/2026/10/04/neet-giovani-dati-italia-lavoro
- Eunews (28/05/2026): https://www.eunews.it/en/2026/05/28/number-of-young-people-not-in-work-or-education-drops/
- Con i Bambini, Osservatorio: https://www.conibambini.org/osservatorio/litalia-resta-il-secondo-paese-ue-con-piu-neet/
- Fondazione Gi Group, I NEET in Italia 2025, macro-aree: https://fondazione.gigroup.it/dedalo/numeri-che-parlano/i-neet-in-italia-2025/macro-aree-2025/
- Fondazione Gi Group, I NEET in Italia 2024: https://fondazione.gigroup.it/dedalo/numeri-che-parlano/i-neet-in-italia-2024/
- Scuolalink, canali di ricerca dei NEET (Dedalo): https://www.scuolalink.it/neet-che-cercano-lavoro-1-su-4-e-attivo-ma-come
- Open, Rapporto Dedalo 2025 (10/7/2026): https://www.open.online/2026/07/10/rapporto-dedalo-neet-un-milione-madri-non-lavorano/
- Orizzonte Scuola, abbandono 2024: https://www.orizzontescuola.it/la-dispersione-scolastica-scende-al-98-nel-2024-istat-certifica-il-calo-degli-abbandoni-tra-i-giovani-18-24enni-il-mezzogiorno-registra-il-124-contro-l84-del-nord/
- Il Fatto Quotidiano, Corte dei conti UE su Garanzia Giovani (2017): https://www.ilfattoquotidiano.it/2017/04/05/garanzia-giovani-corte-dei-conti-ue-in-italia-strategia-sbagliata-offerti-soprattutto-tirocini-non-posti-di-lavoro/3499108/
- Bollettino ADAPT, tirocini in Garanzia Giovani: https://www.bollettinoadapt.it/garanzia-giovani-e-tirocini-le-ragioni-della-grande-diffusione-degli-stage-extracurriculari/
- Dottrina Lavoro, ANPAL Garanzia Giovani: https://www.dottrinalavoro.it/notizie-c/anpal-garanzia-giovani-tirocini-extracurriculari-e-incentivi-le-misure-piu-gettonate
- SIISL, dati di utilizzo (FASI): https://fasi.eu/it/articoli/novita/27879-lavoro-piattaforma-siisl.html
- Lenius, costo NEET Eurofound: https://www.lenius.it/giovani-neet/
- EP Think Tank, NEETs (2013): https://epthinktank.eu/2013/12/18/neets-young-people-not-in-employment-education-or-training/
