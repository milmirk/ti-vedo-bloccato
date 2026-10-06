/*
 * Ti vedo bloccato — suggerimenti a regole (senza AI).
 *
 * Usati quando l'agente AI non è raggiungibile o la sua risposta non supera i
 * controlli. Lavorano solo sul contesto (context.js): niente rete, risposta
 * immediata, sempre un'azione sola. Testi rivisti con la skill
 * agents/skills/plain-italian-hints.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TVB = Object.assign(root.TVB || {}, api);
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Spiegazioni di formato universali, solo per i campi più comuni.
  const FORMATS = [
    [/codice fiscale/i, "il codice fiscale ha 16 caratteri, lettere e numeri. Lo trovi sulla tessera sanitaria: copialo senza spazi."],
    [/conferma.*e-?mail|ripeti.*e-?mail/i, "riscrivi qui la stessa email del campo sopra, identica."],
    [/e-?mail|posta elettronica/i, "scrivi l'email nella forma nome@esempio.it, senza spazi."],
    [/tessera sanitaria/i, "trovi il numero sul retro della tessera sanitaria."],
    [/\bcap\b|codice di avviamento/i, "il CAP ha 5 cifre."],
    [/\bdata di nascita\b/i, "scrivi la data come giorno/mese/anno, per esempio 05/10/1996."],
  ];

  function formatHint(label) {
    const hit = FORMATS.find(([re]) => re.test(label || ""));
    return hit ? hit[1] : "";
  }

  function capital(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Nomi lunghi (es. l'informativa privacy) accorciati alle prime parole.
  function q(text) {
    const words = String(text || "").split(/\s+/);
    return "«" + (words.length > 8 ? words.slice(0, 6).join(" ") + "…" : text) + "»";
  }

  // L'azione giusta per il tipo di elemento, all'imperativo ("spunta") o al
  // presente ("dopo che spunti").
  const ACTIONS = {
    casella: ["spunta la casella", "spunti la casella"],
    opzione: ["scegli una risposta in", "scegli una risposta in"],
    menu: ["scegli una voce in", "scegli una voce in"],
    campo: ["compila", "compili"],
  };
  function act(item, present) {
    const pair = ACTIONS[item.kind] || ACTIONS.campo;
    return pair[present ? 1 : 0] + " " + q(item.label);
  }

  function firstEnabledAction(ctx, pattern, exclude) {
    return (ctx.candidates || []).find(
      (c) => (c.kind === "pulsante" || c.kind === "link") && !c.disabled
        && (!pattern || pattern.test(c.label)) && !(exclude && exclude.test(c.label))
    );
  }

  const GO = /avanti|continua|conferma|prosegui|invia/i;

  function where(ctx) {
    const name = ctx.page.step || ctx.page.heading;
    return name ? "Eri a " + q(name) + ". " : "";
  }

  function remaining(missing) {
    return missing.length > 1 ? " Mancano ancora " + missing.length + " campi obbligatori." : "";
  }

  function clicked(ctx) {
    return (ctx.signal.detail.count || 1) > 1 ? "Hai cliccato più volte" : "Hai cliccato";
  }

  function result(hint, target, why, quote) {
    return {
      hint,
      target_ref: target ? target.ref : "",
      why,
      original_quote: quote || "",
      source: "regole",
    };
  }

  // Nessun campo obbligatorio vuoto: indico il pulsante per andare avanti, se c'è.
  function readyOrWait(ctx, why) {
    const go = firstEnabledAction(ctx, GO);
    if (go) return result("I campi obbligatori sono compilati: premi " + q(go.label) + ".", go, why, go.label);
    return result("Prenditi il tuo tempo. Quando vuoi, scorri la pagina per riprendere.", null, why, "");
  }

  function fallbackHint(ctx) {
    const type = ctx.signal.type;
    const t = ctx.target;
    const missing = ctx.missing || [];
    const next = missing[0];

    if (type === "dead_click" && t) {
      if (/disponib/i.test(t.label)) {
        const more = firstEnabledAction(ctx, /success|prossim|›/i, /^avanti$/i);
        if (more) {
          return result(
            "Questo giorno non ha posti liberi. Premi " + q(more.label) + " per vedere altre date.",
            more, clicked(ctx) + " su un giorno senza disponibilità.", t.label
          );
        }
      }
      if (next) {
        return result(
          q(t.label) + " si attiva solo dopo che " + act(next, true) + ".",
          next, clicked(ctx) + " " + q(t.label) + ", ma è ancora disattivato." + remaining(missing), t.label
        );
      }
      return result(
        q(t.label) + " non è ancora attivo. Cerca più in alto una scelta non ancora fatta.",
        null, clicked(ctx) + " su qualcosa che non è attivo.", t.label
      );
    }

    if (type === "field_error" && t) {
      const message = ctx.signal.detail.message || t.error || "";
      const fmt = formatHint(t.label);
      let hint = "Il campo " + q(t.label) + " non è ancora giusto. ";
      if (fmt) hint += capital(fmt);
      else if (message && message.length <= 80) hint += "La pagina dice: \"" + message + "\". Correggi il campo e riprova.";
      else hint += "Rileggi la nota vicino al campo e correggi.";
      const count = ctx.signal.detail.count || 1;
      const why = count > 1 ? "Lo stesso campo ha dato errore più volte." : "Il campo ha dato un errore.";
      return result(hint, t, why, message || t.label);
    }

    if (type === "field_hesitation" && t) {
      const fmt = formatHint(t.label);
      return result(
        fmt ? "Per " + q(t.label) + ": " + fmt : "Guarda se vicino a " + q(t.label) + " c'è una nota: spesso dice cosa scrivere.",
        t, "Hai aperto più volte questo campo senza scrivere.", t.label
      );
    }

    if (type === "return_after_away") {
      const why = "Hai riaperto la pagina dopo un po' di tempo.";
      if (next) {
        return result(
          "Eccoti di nuovo! " + where(ctx) + "Ora " + act(next) + ".",
          next, why + remaining(missing), next.label
        );
      }
      const ready = readyOrWait(ctx, why);
      ready.hint = "Eccoti di nuovo! " + where(ctx) + ready.hint;
      return ready;
    }

    if (type === "back_forth") {
      const why = "Hai cambiato pagina più volte, avanti e indietro.";
      if (next) return result("Resta su questa pagina e " + act(next) + ".", next, why + remaining(missing), next.label);
      return readyOrWait(ctx, why);
    }

    if (type === "rage_click" && t) {
      return result(
        "Aspetta qualche secondo: la pagina potrebbe essere ancora al lavoro dopo il clic su " + q(t.label) + ".",
        t, "Hai cliccato molte volte di seguito sullo stesso punto.", t.label
      );
    }

    // idle e casi senza bersaglio
    const why = "Non è successo nulla per un po', con il modulo a metà.";
    if (next) {
      const step = ctx.page.step || ctx.page.heading;
      return result(
        (step ? "Sei a " + q(step) + ". Ora " : "Ora ") + act(next) + ".",
        next, why + remaining(missing), next.label
      );
    }
    return readyOrWait(ctx, "Non è successo nulla per un po'.");
  }

  return { fallbackHint, formatHint };
});
