// Language. English is the source: it is what src/ is written in, what the
// page ships as markup, and therefore what a reader with JavaScript off gets.
// The other four ride along in data-t-<lang> attributes that build.py puts
// beside the English text, and everything below is the swap.
//
// This file is deliberately first in the block -- "00-i18n" sorts before
// "00-version" -- because t() has to exist before 09-map.js and the rest are
// evaluated, the same way filename order already decides that 02-filtering.js
// defines the applyFilters() 03-chips.js calls. The generated I18N table is
// prepended ahead of even this one.
//
// The English original is not written into the document a second time; the
// first swap of an element reads it off the element and remembers it here.
// That keeps roughly 90KB of duplicated English out of the page, at the cost
// of one Map -- which is also why nothing may rewrite a marked element's text
// behind i18n's back.

var LANG_NAMES = {
  en: "English",
  hy: "Հայերեն",
  ru: "Русский",
  fr: "Français",
  es: "Español",
};
// What the picker prints on each pill: short enough for five of them to sit in
// a row on a 320px screen, and each written in its own language.
var LANG_SHORT = { en: "EN", hy: "ՀԱՅ", ru: "РУС", fr: "FR", es: "ES" };

var VANADZOR_LANG = "en";

// Element -> { text, html, "aria-label", placeholder, title } as the page was
// built, filled in lazily the first time each field is translated away.
var i18nOriginals = new Map();

// The five fields a marked element can carry, as
// [attribute prefix, how to read and write it].
var I18N_FIELDS = [
  ["t", "text"],
  ["th", "html"],
  ["ta", "aria-label"],
  ["tp", "placeholder"],
  ["tt", "title"],
];

function i18nRead(el, kind) {
  if (kind === "text") return el.textContent;
  if (kind === "html") return el.innerHTML;
  return el.getAttribute(kind);
}

function i18nWrite(el, kind, value) {
  if (kind === "text") {
    el.textContent = value;
  } else if (kind === "html") {
    el.innerHTML = value;
  } else if (value === null) {
    el.removeAttribute(kind);
  } else {
    el.setAttribute(kind, value);
  }
}

// Which plural form a count takes. Russian has three and picks by the last
// digit -- which is why "391 записей" is wrong and "391 запись" is right --
// while the other four here split at one. A value with no "|" in it has only
// one form and is returned whole, which is what Armenian wants: it does not
// inflect a noun after a numeral at all.
function pluralForm(lang, n) {
  if (lang === "ru") {
    var last = n % 10;
    var tens = n % 100;
    if (last === 1 && tens !== 11) return 0;
    if (last >= 2 && last <= 4 && (tens < 12 || tens > 14)) return 1;
    return 2;
  }
  return n === 1 ? 0 : 1;
}

// A runtime string carrying a count: picks the plural form and fills in {n}.
function tn(english, n) {
  var forms = t(english).split("|");
  return forms[Math.min(pluralForm(VANADZOR_LANG, n), forms.length - 1)].replace(
    "{n}",
    n,
  );
}

// A runtime string, for the text JavaScript builds rather than the text the
// build put in the page -- the map panel's chrome, the offline notice, the
// install hint. The English string is the key, so a call site reads as the
// sentence it produces and an untranslated one degrades to exactly that.
function t(english) {
  if (VANADZOR_LANG === "en") return english;
  var table = I18N[VANADZOR_LANG];
  var hit = table && table.js && table.js[english];
  return hit === undefined ? english : hit;
}

// Hand a clone the originals its source remembers.
//
// The English text is not in the document twice, so switching *back* to English
// works by restoring what an element said the first time it was translated. A
// node cloned while the page is in Armenian says Armenian at that moment, so
// left alone it would remember Armenian as its original and never be able to
// come back. The map popup's card is exactly that clone. The two trees have the
// same shape -- one is a copy of the other -- so the remembered values can be
// walked straight across, and must be, before anything edits the copy.
function i18nAdoptClone(source, clone) {
  for (var f = 0; f < I18N_FIELDS.length; f++) {
    var sel = "[data-" + I18N_FIELDS[f][0] + "]";
    var from = source.querySelectorAll(sel);
    var to = clone.querySelectorAll(sel);
    if (from.length !== to.length) continue;
    for (var i = 0; i < from.length; i++) {
      var seen = i18nOriginals.get(from[i]);
      if (!seen) continue;
      var target = i18nOriginals.get(to[i]) || {};
      for (var key in seen) {
        if (!(key in target)) target[key] = seen[key];
      }
      i18nOriginals.set(to[i], target);
    }
  }
}

// A category name, for the one place JavaScript has to print one: the map
// popup's head strip. Everywhere else a category is written into the page and
// carries its own attributes.
function tcat(name) {
  if (VANADZOR_LANG === "en") return name;
  var table = I18N[VANADZOR_LANG];
  var hit = table && table.cat && table.cat[name];
  return hit === undefined ? name : hit;
}

// The reader's stored choice, or their browser's, or English. Kept in both
// localStorage and a cookie for the same reason the personal-contacts toggle
// is: one of the two survives most ways a browser can be locked down.
function storedLang() {
  try {
    var saved = localStorage.getItem("vanadzor-lang");
    if (saved && (saved === "en" || I18N[saved])) return saved;
  } catch (e) {}
  var m = document.cookie.match(/(?:^|;\s*)vanadzor_lang=([a-z]{2})/);
  if (m && (m[1] === "en" || I18N[m[1]])) return m[1];
  return null;
}

function preferredLang() {
  var saved = storedLang();
  if (saved) return saved;
  var offline = document.documentElement.getAttribute("data-offline-lang");
  if (offline) return offline;
  var wanted = navigator.languages || [navigator.language || ""];
  for (var i = 0; i < wanted.length; i++) {
    var code = String(wanted[i]).toLowerCase().slice(0, 2);
    if (code === "en" || I18N[code]) return code;
  }
  return "en";
}

function rememberLang(lang) {
  try {
    localStorage.setItem("vanadzor-lang", lang);
  } catch (e) {}
  var year = new Date();
  year.setFullYear(year.getFullYear() + 1);
  document.cookie =
    "vanadzor_lang=" + lang + "; expires=" + year.toUTCString() + "; path=/; SameSite=Lax";
}

// Swap every marked element in one pass. Missing translations fall back to the
// English original rather than to the previous language, so a half-translated
// table can never leave Armenian text on a French page.
function applyLang(lang, quiet) {
  if (lang !== "en" && !I18N[lang]) lang = "en";
  VANADZOR_LANG = lang;

  for (var f = 0; f < I18N_FIELDS.length; f++) {
    var prefix = I18N_FIELDS[f][0];
    var kind = I18N_FIELDS[f][1];
    var marked = document.querySelectorAll("[data-" + prefix + "]");
    for (var i = 0; i < marked.length; i++) {
      var el = marked[i];
      var seen = i18nOriginals.get(el);
      if (!seen) {
        seen = {};
        i18nOriginals.set(el, seen);
      }
      if (!(kind in seen)) seen[kind] = i18nRead(el, kind);
      var next = lang === "en" ? null : el.getAttribute("data-" + prefix + "-" + lang);
      i18nWrite(el, kind, next === null ? seen[kind] : next);
    }
  }

  var doc = (I18N[lang] && I18N[lang].doc) || {};
  document.documentElement.setAttribute("lang", lang);
  if (doc.title) document.title = doc.title;
  var meta = document.querySelector('meta[name="description"]');
  if (meta && doc.description) meta.setAttribute("content", doc.description);

  var pills = document.querySelectorAll("#langPicker .lang-pill");
  for (var p = 0; p < pills.length; p++) {
    var on = pills[p].getAttribute("data-lang") === lang;
    pills[p].classList.toggle("active", on);
    pills[p].setAttribute("aria-checked", on ? "true" : "false");
    pills[p].setAttribute("tabindex", on ? "0" : "-1");
  }

  if (!quiet) {
    document.dispatchEvent(
      new CustomEvent("vanadzor:langchange", { detail: { lang: lang } })
    );
  }
}

(function () {
  VANADZOR_LANG = preferredLang();

  var picker = document.getElementById("langPicker");
  if (picker) {
    // The pills are built here rather than written into the template because
    // the set of languages is the generated I18N table's to decide, and a pill
    // for a language with no table behind it would be a dead control.
    var codes = ["en"].concat(I18N_LANGS);
    for (var i = 0; i < codes.length; i++) {
      var code = codes[i];
      var pill = document.createElement("button");
      pill.type = "button";
      pill.className = "lang-pill";
      pill.setAttribute("data-lang", code);
      pill.setAttribute("role", "radio");
      pill.setAttribute("lang", code);
      pill.setAttribute("aria-label", LANG_NAMES[code] || code);
      pill.textContent = LANG_SHORT[code] || code.toUpperCase();
      picker.appendChild(pill);
    }

    picker.addEventListener("click", function (e) {
      var pill = e.target.closest(".lang-pill");
      if (!pill) return;
      var lang = pill.getAttribute("data-lang");
      if (lang === VANADZOR_LANG) return;
      rememberLang(lang);
      applyLang(lang);
    });

    // Arrow keys move within the group, which is what a radio group owes a
    // keyboard: one tab stop in, then left/right to choose.
    picker.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var pills = Array.prototype.slice.call(picker.querySelectorAll(".lang-pill"));
      var at = pills.indexOf(document.activeElement);
      if (at === -1) return;
      e.preventDefault();
      var next = pills[(at + (e.key === "ArrowRight" ? 1 : pills.length - 1)) % pills.length];
      next.focus();
      rememberLang(next.getAttribute("data-lang"));
      applyLang(next.getAttribute("data-lang"));
    });
  }

  // Quiet on the first pass: nothing has subscribed yet, and the modules that
  // care read VANADZOR_LANG when they build their own chrome anyway.
  applyLang(VANADZOR_LANG, true);
})();
