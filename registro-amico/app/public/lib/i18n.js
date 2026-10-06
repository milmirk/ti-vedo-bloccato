/*
 * Registro amico — testi dell'aiuto in 3 lingue.
 *
 * Una voce per chiave, con le tre lingue una sotto l'altra: così chi rivede
 * la traduzione confronta le frasi direttamente.
 *
 * Regole (verificate dai test in app/test/i18n.test.mjs):
 *  - ogni chiave esiste in it, ar, en e non è vuota;
 *  - le parole del registro sono citate tra «» IN ITALIANO in tutte le lingue
 *    (la persona impara a riconoscerle) e sono le stesse nelle tre versioni;
 *  - ogni parola tra «» esiste davvero nel registro (data.js, L);
 *  - gli stessi segnaposto {n} in tutte le lingue.
 *
 * Arabo: frasi brevi, arabo standard moderno. Per rivolgerci a madri e padri
 * usiamo forme neutre: «يُرجى» + nome verbale, frasi descrittive, e forme
 * che si scrivono uguali al maschile e al femminile (يمكنك، نجحت).
 * L'ARABO VA RIVISTO DA UNA PERSONA MADRELINGUA prima di un uso reale.
 */

export const LANGS = ["ar", "en", "it"];

export const LANG_META = {
  ar: { name: "العربية", dir: "rtl", it: "Arabo" },
  en: { name: "English", dir: "ltr", it: "Inglese" },
  it: { name: "Italiano semplice", dir: "ltr", it: "Italiano semplice" },
};

export const STRINGS = {
  // --- interfaccia generale -------------------------------------------------
  "app.tagline": {
    it: "La palestra del registro elettronico",
    ar: "مكان للتدرّب على السجلّ الإلكتروني للمدرسة",
    en: "Practice space for the school e-register",
  },
  "lang.label": { it: "Lingua dell'aiuto", ar: "لغة المساعدة", en: "Help language" },
  "lang.pick": {
    it: "In che lingua vuoi l'aiuto?",
    ar: "بأيّ لغة تكون المساعدة؟",
    en: "Which language would you like for help?",
  },
  "nav.views": { it: "Sezioni", ar: "الأقسام", en: "Sections" },
  "nav.practice": { it: "Palestra", ar: "التدرّب", en: "Practice" },
  "nav.progress": { it: "I tuoi progressi", ar: "تقدّمك", en: "Your progress" },
  "coach.title": { it: "Il tuo aiuto", ar: "المساعدة", en: "Your helper" },
  "coach.collapse": { it: "Riduci l'aiuto", ar: "تصغير المساعدة", en: "Minimise help" },
  "coach.expand": { it: "Mostra l'aiuto", ar: "إظهار المساعدة", en: "Show help" },

  "welcome.title": {
    it: "Ciao! Qui puoi provare il registro elettronico senza paura di sbagliare.",
    ar: "مرحبًا! هنا يمكنك التدرّب على السجلّ الإلكتروني للمدرسة دون خوف من الخطأ.",
    en: "Hello! Here you can practise the school e-register without being afraid of mistakes.",
  },
  "welcome.body": {
    it: "È un registro di prova: i dati sono inventati e niente arriva alla scuola. Il registro resta in italiano, come quello vero. L'aiuto è nella tua lingua.",
    ar: "هذا سجلّ للتدرّب فقط: البيانات غير حقيقية ولا يصل أيّ شيء إلى المدرسة. يبقى السجلّ باللغة الإيطالية مثل السجلّ الحقيقي، والمساعدة بلغتك.",
    en: "This is a practice register: the data are invented and nothing is sent to the school. The register stays in Italian, like the real one. The help is in your language.",
  },
  "welcome.quiz": {
    it: "Prima di iniziare: 5 domande brevi sulle parole della scuola.",
    ar: "قبل البدء: 5 أسئلة قصيرة عن كلمات المدرسة.",
    en: "Before you start: 5 short questions about school words.",
  },
  "btn.startQuiz": { it: "Rispondi alle domande", ar: "بدء الأسئلة", en: "Answer the questions" },
  "btn.skipQuiz": { it: "Salta per ora", ar: "التخطّي الآن", en: "Skip for now" },

  // --- elenco esercizi --------------------------------------------------------
  "tasks.title": { it: "Esercizi", ar: "التمارين", en: "Exercises" },
  "tasks.intro": {
    it: "Ogni esercizio ha 3 livelli. Ogni volta che ci riesci, l'aiuto diminuisce un po'.",
    ar: "لكلّ تمرين 3 مستويات. بعد كلّ نجاح تقلّ المساعدة قليلًا.",
    en: "Each exercise has 3 levels. Each time you succeed, there is a little less help.",
  },
  "tasks.attempts": { it: "Tentativi: {n}", ar: "المحاولات: {n}", en: "Attempts: {n}" },
  "tasks.mastered": { it: "Fatto senza aiuto", ar: "تمّ بدون مساعدة", en: "Done on your own" },
  "free.note": {
    it: "Puoi anche esplorare il registro liberamente. Tocca una parola sottolineata per sapere cosa vuol dire.",
    ar: "يمكنك أيضًا تصفّح السجلّ بحرّية. عند الضغط على كلمة مسطّرة يظهر معناها.",
    en: "You can also explore the register freely. Tap an underlined word to see what it means.",
  },

  // --- livelli ----------------------------------------------------------------
  "level.1": { it: "Livello 1 · Guidato", ar: "المستوى 1 · مع الإرشاد", en: "Level 1 · Guided" },
  "level.2": { it: "Livello 2 · Suggerimento", ar: "المستوى 2 · تلميح عند الحاجة", en: "Level 2 · Hint" },
  "level.3": { it: "Livello 3 · In autonomia", ar: "المستوى 3 · بدون مساعدة", en: "Level 3 · On your own" },
  "level.1.desc": {
    it: "Ti dico ogni passo e ti mostro dove premere.",
    ar: "أشرح كلّ خطوة وأُظهر مكان الضغط.",
    en: "I tell you each step and show you where to press.",
  },
  "level.2.desc": {
    it: "Non ti dico i passi. Se ti fermi, ti do un suggerimento.",
    ar: "لا أشرح الخطوات. عند التوقّف أعطيك تلميحًا.",
    en: "I don't tell you the steps. If you stop, I give you a hint.",
  },
  "level.3.desc": {
    it: "Nessun aiuto. Conto solo il tempo e gli errori.",
    ar: "بدون أيّ مساعدة. أحسب الوقت والأخطاء فقط.",
    en: "No help. I only count the time and the mistakes.",
  },

  // --- esercizio in corso -----------------------------------------------------
  "btn.start": { it: "Inizia", ar: "البدء", en: "Start" },
  "btn.retry": { it: "Riprova", ar: "إعادة المحاولة", en: "Try again" },
  "btn.others": { it: "Altri esercizi", ar: "تمارين أخرى", en: "Other exercises" },
  "btn.help": { it: "Chiedo aiuto", ar: "أحتاج إلى مساعدة", en: "I need help" },
  "btn.stop": { it: "Esci dall'esercizio", ar: "الخروج من التمرين", en: "Leave the exercise" },
  "btn.showMe": { it: "Mostrami dove", ar: "إظهار المكان", en: "Show me where" },
  "task.goal": { it: "Cosa devi fare", ar: "المطلوب", en: "What to do" },
  "step.count": { it: "Passo {n} di {total}", ar: "الخطوة {n} من {total}", en: "Step {n} of {total}" },
  "hint.title": { it: "Suggerimento", ar: "تلميح", en: "Hint" },
  "feedback.title": { it: "Attenzione", ar: "انتباه", en: "Careful" },
  "hint.waiting": { it: "Se ti fermi, ti aiuto.", ar: "عند التوقّف، أساعدك.", en: "If you stop, I'll help." },
  "solo.status": {
    it: "Prova senza aiuto. Buona fortuna!",
    ar: "محاولة بدون مساعدة. بالتوفيق!",
    en: "Try without help. Good luck!",
  },
  "help.level3": {
    it: "Se chiedi aiuto, l'esercizio si ferma e riparte con i suggerimenti.",
    ar: "عند طلب المساعدة يتوقّف التمرين ويبدأ من جديد مع التلميحات.",
    en: "If you ask for help, the exercise stops and starts again with hints.",
  },
  "here.badge": { it: "Qui", ar: "هنا", en: "Here" },
  "hint.showWhere": {
    it: "Ti mostro dove: guarda il riquadro viola.",
    ar: "مكان الضغط محدّد الآن بإطار بنفسجي.",
    en: "I'm showing you where: look at the purple frame.",
  },
  "wrong.generic": {
    it: "Non è il passo giusto per questo esercizio.",
    ar: "هذه ليست الخطوة المطلوبة في هذا التمرين.",
    en: "That is not the right step for this exercise.",
  },
  "wrong.blocked": {
    it: "Questo non completa l'esercizio. Niente è stato inviato.",
    ar: "هذا لا يُكمل التمرين. لم يُرسَل أيّ شيء.",
    en: "This does not complete the exercise. Nothing was sent.",
  },
  "wrong.nav": {
    it: "Questa pagina non serve per questo esercizio.",
    ar: "هذه الصفحة غير مطلوبة في هذا التمرين.",
    en: "This page is not needed for this exercise.",
  },
  "wrong.answer": { it: "Non è la risposta giusta.", ar: "هذه ليست الإجابة الصحيحة.", en: "That is not the right answer." },

  // --- fine esercizio ---------------------------------------------------------
  "done.title": { it: "Fatto!", ar: "أحسنت!", en: "Done!" },
  "done.solo": { it: "Ce l'hai fatta senza aiuto!", ar: "لقد نجحت بدون مساعدة!", en: "You did it on your own!" },
  "done.metrics": {
    it: "Tempo: {time} · Errori: {errors} · Suggerimenti: {hints}",
    ar: "الوقت: {time} · الأخطاء: {errors} · التلميحات: {hints}",
    en: "Time: {time} · Mistakes: {errors} · Hints: {hints}",
  },
  "done.next": { it: "Prossima volta: {level}", ar: "في المرة القادمة: {level}", en: "Next time: {level}" },
  "done.stopped": {
    it: "Va bene, l'esercizio è fermo. Puoi riprovare quando vuoi.",
    ar: "لا بأس، تمّ إيقاف التمرين. يمكنك إعادة المحاولة في أيّ وقت.",
    en: "That's fine, the exercise has stopped. You can try again any time.",
  },
  "time.min": { it: "{m} min {s} s", ar: "{m} د {s} ث", en: "{m} min {s} s" },
  "time.sec": { it: "{s} s", ar: "{s} ث", en: "{s} s" },

  // --- progressi ----------------------------------------------------------------
  "progress.title": { it: "I tuoi progressi", ar: "تقدّمك", en: "Your progress" },
  "progress.intro": {
    it: "Qui vedi ogni tentativo: quanto tempo, quanti errori, quanti suggerimenti.",
    ar: "هنا تظهر كلّ محاولة: الوقت وعدد الأخطاء وعدد التلميحات.",
    en: "Here you can see every attempt: time, mistakes and hints.",
  },
  "progress.col.n": { it: "Tentativo", ar: "المحاولة", en: "Attempt" },
  "progress.col.level": { it: "Livello", ar: "المستوى", en: "Level" },
  "progress.col.time": { it: "Tempo", ar: "الوقت", en: "Time" },
  "progress.col.errors": { it: "Errori", ar: "الأخطاء", en: "Mistakes" },
  "progress.col.hints": { it: "Suggerimenti", ar: "التلميحات", en: "Hints" },
  "progress.col.result": { it: "Esito", ar: "النتيجة", en: "Result" },
  "progress.ok": { it: "Completato", ar: "مكتمل", en: "Completed" },
  "progress.ko": { it: "Non completato", ar: "غير مكتمل", en: "Not completed" },
  "progress.guided": { it: "guida completa", ar: "إرشاد كامل", en: "full guidance" },
  "progress.none": { it: "Nessun tentativo ancora.", ar: "لا توجد محاولات بعد.", en: "No attempts yet." },
  "progress.mastered": {
    it: "Ce l'hai fatta senza aiuto: livello 3 completato.",
    ar: "لقد نجحت بدون مساعدة: المستوى 3 مكتمل.",
    en: "You did it on your own: level 3 completed.",
  },
  "progress.next": { it: "Prossimo tentativo: {level}", ar: "المحاولة القادمة: {level}", en: "Next attempt: {level}" },
  "progress.errorsTrend": {
    it: "Errori: {first} al primo tentativo, {last} all'ultimo.",
    ar: "الأخطاء: {first} في المحاولة الأولى، و{last} في المحاولة الأخيرة.",
    en: "Mistakes: {first} on the first attempt, {last} on the last one.",
  },
  "progress.quiz.title": {
    it: "Le parole della scuola: prima e dopo",
    ar: "كلمات المدرسة: قبل وبعد",
    en: "School words: before and after",
  },
  "progress.quiz.pre": {
    it: "Prima degli esercizi: {score} su {total}",
    ar: "قبل التمارين: {score} من {total}",
    en: "Before the exercises: {score} out of {total}",
  },
  "progress.quiz.post": {
    it: "Dopo gli esercizi: {score} su {total}",
    ar: "بعد التمارين: {score} من {total}",
    en: "After the exercises: {score} out of {total}",
  },
  "progress.quiz.missing": { it: "Non ancora fatto", ar: "لم يتمّ بعد", en: "Not done yet" },
  "progress.quiz.delta": {
    it: "Risposte giuste in più: {n}",
    ar: "إجابات صحيحة إضافية: {n}",
    en: "More correct answers: {n}",
  },
  "btn.quizPre": { it: "Fai le 5 domande", ar: "الإجابة عن الأسئلة الخمسة", en: "Do the 5 questions" },
  "btn.quizPost": { it: "Rifai le 5 domande", ar: "إعادة الأسئلة الخمسة", en: "Redo the 5 questions" },
  "btn.reset": { it: "Azzera i progressi", ar: "مسح التقدّم", en: "Clear progress" },
  "reset.confirm": { it: "Cancellare tutti i tentativi?", ar: "حذف كلّ المحاولات؟", en: "Delete all attempts?" },
  "progress.local": {
    it: "Questi dati restano solo su questo dispositivo.",
    ar: "تبقى هذه البيانات على هذا الجهاز فقط.",
    en: "These data stay only on this device.",
  },

  // --- quiz -------------------------------------------------------------------
  "quiz.title": { it: "5 domande sulle parole della scuola", ar: "5 أسئلة عن كلمات المدرسة", en: "5 questions about school words" },
  "quiz.intro": {
    it: "Scegli il significato giusto. Non è un esame: serve a vedere cosa impari.",
    ar: "يُرجى اختيار المعنى الصحيح. هذا ليس امتحانًا، بل طريقة لقياس التعلّم.",
    en: "Choose the right meaning. It is not an exam: it shows what you learn.",
  },
  "quiz.question": { it: "Che cosa vuol dire «{term}»?", ar: "ما معنى «{term}»؟", en: "What does «{term}» mean?" },
  "quiz.count": { it: "Domanda {n} di {total}", ar: "السؤال {n} من {total}", en: "Question {n} of {total}" },
  "quiz.result": {
    it: "Risposte giuste: {score} su {total}.",
    ar: "الإجابات الصحيحة: {score} من {total}.",
    en: "Correct answers: {score} out of {total}.",
  },
  "quiz.review": { it: "Ecco i significati giusti:", ar: "هذه هي المعاني الصحيحة:", en: "Here are the right meanings:" },
  "btn.continue": { it: "Continua", ar: "متابعة", en: "Continue" },
  "btn.next": { it: "Avanti", ar: "التالي", en: "Next" },

  // --- glossario --------------------------------------------------------------
  "glossary.title": { it: "Parole della scuola", ar: "كلمات المدرسة", en: "School words" },
  "glossary.intro": {
    it: "Tocca una parola sottolineata nel registro per vedere cosa vuol dire.",
    ar: "عند الضغط على كلمة مسطّرة في السجلّ يظهر معناها هنا.",
    en: "Tap an underlined word in the register to see what it means.",
  },
  "glossary.simpleIt": { it: "In italiano semplice", ar: "بالإيطالية المبسّطة", en: "In simple Italian" },
  "glossary.other": { it: "Altre lingue", ar: "لغات أخرى", en: "Other languages" },
  "glossary.close": { it: "Chiudi", ar: "إغلاق", en: "Close" },

  // --- spiegazione delle comunicazioni ------------------------------------------
  "explain.button": { it: "Spiegami questa comunicazione", ar: "شرح هذا الإعلان", en: "Explain this notice" },
  "explain.loading": { it: "Preparo la spiegazione…", ar: "جارٍ تحضير الشرح…", en: "Preparing the explanation…" },
  "explain.title": { it: "La comunicazione in parole semplici", ar: "الإعلان بكلمات بسيطة", en: "The notice in simple words" },
  "explain.todo": { it: "Cosa fare", ar: "ما المطلوب", en: "What to do" },
  "explain.words": { it: "Parole importanti (in italiano)", ar: "كلمات مهمّة (بالإيطالية)", en: "Important words (in Italian)" },
  "explain.source.ready": { it: "Spiegazione preparata in anticipo.", ar: "شرح مُعَدّ مسبقًا.", en: "Explanation prepared in advance." },
  "explain.source.ai": {
    it: "Spiegazione scritta dall'AI. Date, orari e numeri sono stati controllati: sono uguali all'originale.",
    ar: "شرح كتبه الذكاء الاصطناعي. تمّ التحقّق من التواريخ والأوقات والأرقام: هي نفسها في النص الأصلي.",
    en: "Explanation written by AI. Dates, times and numbers were checked: they match the original.",
  },
  "explain.original": {
    it: "Il testo originale resta qui sopra: in caso di dubbio vale quello.",
    ar: "النص الأصلي يبقى في الأعلى، وهو المرجع عند الشكّ.",
    en: "The original text stays above: if in doubt, the original counts.",
  },
  "explain.disclaimer": {
    it: "È un aiuto per capire, non un consiglio legale o amministrativo. Per i dubbi, chiedi alla scuola.",
    ar: "هذه مساعدة على الفهم، وليست استشارة قانونية أو إدارية. عند الشكّ يمكن سؤال المدرسة.",
    en: "This helps you understand; it is not legal or administrative advice. If in doubt, ask the school.",
  },

  // --- T1 · Giustificare un'assenza ---------------------------------------------
  "t1.title": { it: "Giustificare un'assenza", ar: "تبرير غياب", en: "Justify an absence" },
  "t1.goal": {
    it: "Youssef è rimasto a casa giovedì 01/10/2026 perché aveva la febbre. Giustifica questa assenza.",
    ar: "بقي يوسف في البيت يوم الخميس 01/10/2026 لأنه كان مصابًا بالحمّى. المطلوب: تبرير هذا الغياب.",
    en: "Youssef stayed at home on Thursday 01/10/2026 because he had a fever. Justify this absence.",
  },
  "t1.apri-assenze": {
    it: "Premi «Assenze» nel menu del registro.",
    ar: "يُرجى الضغط على «Assenze» في قائمة السجلّ.",
    en: "Press «Assenze» in the register menu.",
  },
  "t1.apri-assenze.hint": {
    it: "Le assenze sono nel menu in alto, alla voce «Assenze».",
    ar: "الغيابات موجودة في قائمة السجلّ في الأعلى، تحت كلمة «Assenze».",
    en: "Absences are in the menu at the top, under «Assenze».",
  },
  "t1.scegli-assenza": {
    it: "Nella tabella, premi «Apri» sulla riga «Assenza» del 01/10/2026.",
    ar: "في الجدول، يُرجى الضغط على «Apri» في سطر «Assenza» بتاريخ 01/10/2026.",
    en: "In the table, press «Apri» on the «Assenza» row dated 01/10/2026.",
  },
  "t1.scegli-assenza.hint": {
    it: "Cerca la data 01/10/2026. «Assenza» vuol dire che Youssef non era a scuola.",
    ar: "التاريخ المطلوب هو 01/10/2026. كلمة «Assenza» تعني أن يوسف لم يكن في المدرسة.",
    en: "Look for the date 01/10/2026. «Assenza» means Youssef was not at school.",
  },
  "t1.e.ritardo": {
    it: "Questo è un «Ritardo»: Youssef è entrato tardi. Serve l'«Assenza» del 01/10/2026.",
    ar: "هذا «Ritardo»، أي تأخّر: دخل يوسف إلى المدرسة متأخرًا. المطلوب هو «Assenza» بتاريخ 01/10/2026.",
    en: "This is a «Ritardo»: Youssef arrived late. You need the «Assenza» of 01/10/2026.",
  },
  "t1.e.giustificata": {
    it: "Questa è già «Giustificata»: non serve fare niente. Serve l'«Assenza» «Da giustificare».",
    ar: "هذه «Giustificata»، أي مبرَّرة من قبل. المطلوب هو «Assenza» بحالة «Da giustificare».",
    en: "This one is already «Giustificata» (justified). You need the «Assenza» marked «Da giustificare».",
  },
  "t1.e.wrongEvent": {
    it: "Questo non è l'evento giusto. Serve l'«Assenza» del 01/10/2026.",
    ar: "هذا ليس الحدث المطلوب. المطلوب هو «Assenza» بتاريخ 01/10/2026.",
    en: "This is not the right event. You need the «Assenza» of 01/10/2026.",
  },
  "t1.premi-giustifica": {
    it: "Ora premi «Giustifica».",
    ar: "يُرجى الضغط على «Giustifica».",
    en: "Now press «Giustifica».",
  },
  "t1.premi-giustifica.hint": {
    it: "Sotto la tabella ci sono i dettagli dell'assenza. Il pulsante è «Giustifica».",
    ar: "تحت الجدول تظهر تفاصيل الغياب، وفيها زرّ «Giustifica».",
    en: "Below the table you can see the absence details. The button is «Giustifica».",
  },
  "t1.scegli-motivo": {
    it: "Scegli il motivo «Motivi di salute»: Youssef aveva la febbre.",
    ar: "يُرجى اختيار السبب «Motivi di salute»، أي أسباب صحية: كان يوسف مصابًا بالحمّى.",
    en: "Choose the reason «Motivi di salute» (health reasons): Youssef had a fever.",
  },
  "t1.scegli-motivo.hint": {
    it: "«Motivi di salute» vuol dire che lo studente era malato, per esempio con la febbre.",
    ar: "«Motivi di salute» تعني أسبابًا صحية، مثل الحمّى.",
    en: "«Motivi di salute» means health reasons, like a fever.",
  },
  "t1.e.famiglia": {
    it: "«Motivi di famiglia» vuol dire una ragione della famiglia. La febbre è un motivo di salute.",
    ar: "«Motivi di famiglia» تعني أسبابًا عائلية. الحمّى سبب صحي.",
    en: "«Motivi di famiglia» means family reasons. A fever is a health reason.",
  },
  "t1.e.altro": {
    it: "«Altro motivo» serve quando nessun motivo dell'elenco va bene. La febbre è un motivo di salute.",
    ar: "«Altro motivo» يُستعمل عندما لا يناسب أيّ سبب في القائمة. الحمّى سبب صحي.",
    en: "«Altro motivo» is for when no reason in the list fits. A fever is a health reason.",
  },
  "t1.e.checkReason": {
    it: "Prima scegli il motivo giusto: Youssef aveva la febbre.",
    ar: "أوّلًا يجب اختيار السبب الصحيح: كان يوسف مصابًا بالحمّى.",
    en: "First choose the right reason: Youssef had a fever.",
  },
  "t1.conferma": {
    it: "Premi «Conferma giustificazione».",
    ar: "يُرجى الضغط على «Conferma giustificazione».",
    en: "Press «Conferma giustificazione».",
  },
  "t1.conferma.hint": {
    it: "Il pulsante «Conferma giustificazione» manda la giustificazione alla scuola.",
    ar: "زرّ «Conferma giustificazione» يرسل التبرير إلى المدرسة.",
    en: "The «Conferma giustificazione» button sends the justification to the school.",
  },
  "t1.done": {
    it: "L'assenza è giustificata. Nel registro ora c'è scritto «Giustificata».",
    ar: "تمّ تبرير الغياب. في السجلّ مكتوب الآن «Giustificata».",
    en: "The absence is justified. The register now says «Giustificata».",
  },

  // --- T2 · Prenotare un colloquio ---------------------------------------------
  "t2.title": { it: "Prenotare un colloquio", ar: "حجز لقاء مع أستاذ", en: "Book a teacher meeting" },
  "t2.goal": {
    it: "Vuoi parlare con l'insegnante di «Matematica» di Youssef. Prenota un colloquio in un orario libero.",
    ar: "المطلوب: حجز لقاء مع أستاذ «Matematica» (الرياضيات) في موعد متاح.",
    en: "You want to talk to Youssef's «Matematica» (maths) teacher. Book a meeting at a free time.",
  },
  "t2.apri-colloqui": {
    it: "Premi «Colloqui» nel menu del registro.",
    ar: "يُرجى الضغط على «Colloqui» في قائمة السجلّ.",
    en: "Press «Colloqui» in the register menu.",
  },
  "t2.apri-colloqui.hint": {
    it: "«Colloqui» sono gli incontri con gli insegnanti. Sono nel menu in alto.",
    ar: "«Colloqui» هي اللقاءات مع الأساتذة، وهي في قائمة السجلّ في الأعلى.",
    en: "«Colloqui» are meetings with teachers. They are in the menu at the top.",
  },
  "t2.scegli-docente": {
    it: "Trova il docente di «Matematica» e premi «Vedi orari».",
    ar: "يُرجى البحث عن أستاذ «Matematica» ثم الضغط على «Vedi orari».",
    en: "Find the «Matematica» teacher and press «Vedi orari».",
  },
  "t2.scegli-docente.hint": {
    it: "Guarda la colonna «Materie»: cerca «Matematica».",
    ar: "في عمود «Materie» توجد كلمة «Matematica».",
    en: "Look at the «Materie» column: find «Matematica».",
  },
  "t2.e.otherTeacher": {
    it: "Questo docente non insegna «Matematica». Guarda la colonna «Materie».",
    ar: "هذا الأستاذ لا يدرّس «Matematica». المعلومة في عمود «Materie».",
    en: "This teacher does not teach «Matematica». Check the «Materie» column.",
  },
  "t2.scegli-orario": {
    it: "Scegli un orario con scritto «Libero».",
    ar: "يُرجى اختيار موعد مكتوب عليه «Libero»، أي متاح.",
    en: "Choose a time marked «Libero» (free).",
  },
  "t2.scegli-orario.hint": {
    it: "Gli orari «Completo» sono già presi. Gli orari «Libero» si possono scegliere.",
    ar: "المواعيد المكتوب عليها «Completo» محجوزة. المواعيد المكتوب عليها «Libero» متاحة.",
    en: "Times marked «Completo» are already taken. Times marked «Libero» can be chosen.",
  },
  "t2.e.full": {
    it: "Questo orario è «Completo»: lo ha già preso un altro genitore. Scegli un orario «Libero».",
    ar: "هذا الموعد «Completo»، أي محجوز لوليّ أمر آخر. المواعيد «Libero» متاحة.",
    en: "This time is «Completo»: another parent has already booked it. Choose a «Libero» time.",
  },
  "t2.e.wrongTeacherSlot": {
    it: "Questo orario è di un altro docente. Serve il docente di «Matematica».",
    ar: "هذا الموعد لأستاذ آخر. المطلوب أستاذ «Matematica».",
    en: "This time belongs to another teacher. You need the «Matematica» teacher.",
  },
  "t2.e.checkBooking": {
    it: "Controlla: serve il docente di «Matematica» e un orario «Libero».",
    ar: "للتأكّد: المطلوب أستاذ «Matematica» وموعد «Libero».",
    en: "Check: you need the «Matematica» teacher and a «Libero» time.",
  },
  "t2.conferma": {
    it: "Controlla il riepilogo e premi «Conferma prenotazione».",
    ar: "يُرجى مراجعة الملخّص ثم الضغط على «Conferma prenotazione».",
    en: "Check the summary and press «Conferma prenotazione».",
  },
  "t2.conferma.hint": {
    it: "Sotto gli orari c'è il riepilogo. Il pulsante per finire è «Conferma prenotazione».",
    ar: "تحت المواعيد يوجد ملخّص الحجز، وزرّ الإنهاء هو «Conferma prenotazione».",
    en: "Below the times there is a summary. The button to finish is «Conferma prenotazione».",
  },
  "t2.done": {
    it: "Il colloquio è prenotato. Lo trovi in «I miei colloqui».",
    ar: "تمّ حجز اللقاء، وهو موجود في «I miei colloqui».",
    en: "The meeting is booked. You can find it in «I miei colloqui».",
  },

  // --- T3 · Leggere una comunicazione e mettere la presa visione ------------------
  "t3.title": { it: "Leggere una comunicazione", ar: "قراءة إعلان من المدرسة", en: "Read a school notice" },
  "t3.goal": {
    it: "La scuola ha scritto una comunicazione sull'uscita al museo. Aprila, leggila e premi «Presa visione».",
    ar: "كتبت المدرسة إعلانًا عن الرحلة إلى المتحف. المطلوب: فتح الإعلان وقراءته ثم الضغط على «Presa visione».",
    en: "The school has written a notice about the museum trip. Open it, read it and press «Presa visione».",
  },
  "t3.apri-bacheca": {
    it: "Premi «Bacheca» nel menu del registro.",
    ar: "يُرجى الضغط على «Bacheca» في قائمة السجلّ.",
    en: "Press «Bacheca» in the register menu.",
  },
  "t3.apri-bacheca.hint": {
    it: "Le comunicazioni della scuola sono nella «Bacheca».",
    ar: "إعلانات المدرسة موجودة في «Bacheca»، أي لوحة الإعلانات.",
    en: "School notices are in the «Bacheca» (noticeboard).",
  },
  "t3.apri-comunicazione": {
    it: "Premi «Leggi» sulla riga «Uscita didattica».",
    ar: "يُرجى الضغط على «Leggi» في سطر «Uscita didattica»، أي الرحلة المدرسية.",
    en: "Press «Leggi» on the «Uscita didattica» (school trip) row.",
  },
  "t3.apri-comunicazione.hint": {
    it: "«Uscita didattica» vuol dire gita con la classe. Accanto c'è scritto «Presa visione richiesta».",
    ar: "«Uscita didattica» تعني رحلة مدرسية مع الصفّ. بجانبها مكتوب «Presa visione richiesta».",
    en: "«Uscita didattica» means a school trip. Next to it you can read «Presa visione richiesta».",
  },
  "t3.e.otherNotice": {
    it: "Questa comunicazione parla d'altro. Serve quella sull'«Uscita didattica».",
    ar: "هذا الإعلان عن موضوع آخر. المطلوب إعلان «Uscita didattica».",
    en: "This notice is about something else. You need the «Uscita didattica» one.",
  },
  "t3.presa-visione": {
    it: "Leggi il testo. Poi premi «Presa visione» sotto il testo.",
    ar: "بعد قراءة النص، يُرجى الضغط على «Presa visione» تحت النص.",
    en: "Read the text. Then press «Presa visione» below the text.",
  },
  "t3.presa-visione.hint": {
    it: "«Presa visione» dice alla scuola che hai letto. Il pulsante è sotto il testo.",
    ar: "زرّ «Presa visione» يُبلغ المدرسة بأن الإعلان قد قُرئ، وهو تحت النص.",
    en: "«Presa visione» tells the school you have read it. The button is below the text.",
  },
  "t3.done": {
    it: "La scuola ora sa che hai letto: nel registro c'è «Presa visione effettuata».",
    ar: "المدرسة تعرف الآن أن الإعلان قد قُرئ: في السجلّ مكتوب «Presa visione effettuata».",
    en: "The school now knows you have read it: the register says «Presa visione effettuata».",
  },

  // --- T4 · Trovare un voto -----------------------------------------------------
  "t4.title": { it: "Trovare un voto", ar: "البحث عن علامة", en: "Find a mark" },
  "t4.goal": {
    it: "Che voto ha preso Youssef in «Matematica» il 03/10/2026? Trova il voto nel registro e scegli la risposta qui sotto.",
    ar: "ما العلامة التي حصل عليها يوسف في «Matematica» يوم 03/10/2026؟ المطلوب: إيجاد العلامة في السجلّ ثم اختيار الإجابة في الأسفل.",
    en: "What mark did Youssef get in «Matematica» on 03/10/2026? Find it in the register and choose the answer below.",
  },
  "t4.apri-voti": {
    it: "Premi «Voti» nel menu del registro.",
    ar: "يُرجى الضغط على «Voti» في قائمة السجلّ.",
    en: "Press «Voti» in the register menu.",
  },
  "t4.apri-voti.hint": {
    it: "I voti sono nel menu in alto, alla voce «Voti».",
    ar: "العلامات موجودة في قائمة السجلّ في الأعلى، تحت كلمة «Voti».",
    en: "Marks are in the menu at the top, under «Voti».",
  },
  "t4.apri-materia": {
    it: "Sulla riga «Matematica» premi «Vedi voti».",
    ar: "يُرجى الضغط على «Vedi voti» في سطر «Matematica».",
    en: "On the «Matematica» row, press «Vedi voti».",
  },
  "t4.apri-materia.hint": {
    it: "Ogni materia ha la sua riga. Cerca «Matematica».",
    ar: "لكلّ مادة سطر خاص بها. المطلوب سطر «Matematica».",
    en: "Each subject has its own row. Look for «Matematica».",
  },
  "t4.e.otherSubject": {
    it: "Questa non è «Matematica». Premi «Tutte le materie» e cerca «Matematica».",
    ar: "هذه ليست «Matematica». يمكن الضغط على «Tutte le materie» ثم البحث عن «Matematica».",
    en: "This is not «Matematica». Press «Tutte le materie» and look for «Matematica».",
  },
  "t4.rispondi": {
    it: "Guarda la riga del 03/10/2026 e scegli qui il voto.",
    ar: "يُرجى النظر إلى سطر 03/10/2026 ثم اختيار العلامة هنا.",
    en: "Look at the row dated 03/10/2026 and choose the mark here.",
  },
  "t4.rispondi.hint": {
    it: "Nella colonna «Data» cerca 03/10/2026. Il voto è nella colonna «Voto».",
    ar: "في عمود «Data» يوجد التاريخ 03/10/2026، والعلامة في عمود «Voto».",
    en: "In the «Data» column find 03/10/2026. The mark is in the «Voto» column.",
  },
  "t4.e.wrongAnswer": {
    it: "Non è il voto del 03/10/2026. Guarda di nuovo la riga con quella data.",
    ar: "هذه ليست علامة يوم 03/10/2026. المطلوب النظر مرّة أخرى إلى سطر هذا التاريخ.",
    en: "That is not the mark from 03/10/2026. Look again at the row with that date.",
  },
  "t4.e.early": {
    it: "Prima trova il voto nella pagina «Voti».",
    ar: "أوّلًا: البحث عن العلامة في صفحة «Voti».",
    en: "First find the mark on the «Voti» page.",
  },
  "t4.question": {
    it: "Il voto di «Matematica» del 03/10/2026 è:",
    ar: "علامة «Matematica» يوم 03/10/2026 هي:",
    en: "The «Matematica» mark on 03/10/2026 is:",
  },
  "t4.done": {
    it: "Giusto: 7. I voti di Youssef sono sempre in «Voti».",
    ar: "صحيح: 7. علامات يوسف موجودة دائمًا في «Voti».",
    en: "Correct: 7. Youssef's marks are always in «Voti».",
  },
};

export function t(lang, key, vars = {}) {
  const entry = STRINGS[key];
  if (!entry) return key;
  const s = entry[lang] ?? entry.it;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function quotesOf(s) {
  return [...String(s).matchAll(/«([^»]+)»/g)].map((m) => m[1]);
}

export function placeholdersOf(s) {
  return [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}
