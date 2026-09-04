var activeCat = "all";

// Scrolls a filter control in the sticky bar into view and flashes it, so
// a reader can jump from "why is this filtered" straight to the control
// responsible without hunting for a pill that may have folded off-screen
// (see 11-toggle-fold.js) on a narrow, scrolled-down viewport. Shared by
// the empty-state filter list below and the hidden-subcategories notice
// in 06-personal-contacts.js.
function flashControl(el) {
  if (!el) return;
  function onScreen() {
    var cs = window.getComputedStyle(el);
    if (parseFloat(cs.opacity) < 0.5) return false;
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    return r.height > 8 && r.top >= 0 && r.bottom <= vh;
  }
  function flash() {
    el.classList.remove("toggle-flash");
    void el.offsetWidth;
    el.classList.add("toggle-flash");
    clearTimeout(el._flashTimeout);
    el._flashTimeout = setTimeout(function () {
      el.classList.remove("toggle-flash");
    }, 1300);
  }
  if (onScreen()) {
    flash();
    return;
  }
  // Wait for the scroll to actually land before flashing — flashing
  // mid-scroll points at nothing, since the pill isn't where the reader
  // is looking yet. scrollend is the true signal; the timeout is only a
  // backstop for a browser without it.
  var settled = false;
  function onSettled() {
    if (settled) return;
    settled = true;
    window.removeEventListener("scrollend", onSettled);
    clearTimeout(fallback);
    flash();
  }
  window.addEventListener("scrollend", onSettled);
  var fallback = setTimeout(onSettled, 2000);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// A clickable word inside the empty-state message that points back at
// the control responsible — same reasoning as the hidden-subcategories
// notice, but per filter rather than one notice for the whole toggle.
function makeEmptyFilterEl(label, onActivate) {
  var span = document.createElement("span");
  span.className = "empty-filter";
  span.setAttribute("role", "button");
  span.setAttribute("tabindex", "0");
  span.textContent = label;
  span.addEventListener("click", onActivate);
  span.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      onActivate();
    }
  });
  return span;
}

// A term matches only at the start of a word in data-search, so "bar"
// finds "Barber" and "Bar B.Q." but not the "bar" buried in "Gambaryan".
// Anything that is not a letter or digit counts as a word break, which
// covers spaces, punctuation, slashes in URLs, dashes and emoji.
// Pure number terms stay a loose substring match so that searching a
// phone number by its tail ("333022") still finds "+37441333022".
//
// The class has to name Armenian and Cyrillic letters explicitly and not
// just ASCII: build.py folds each card's translated name, tag and address
// into the same data-search, and a class of only [a-z0-9] would find no
// letter before a Cyrillic one, call every position a word start, and quietly
// turn those two scripts back into a loose substring match -- so "том" would
// hit inside "стоматология". These are the lowercase ranges alone, which is
// all that is needed: the blob and the term are both lowercased first.
var WORD_CHAR = /[a-z0-9\u0561-\u0587\u0430-\u044f\u0451]/;

function termMatches(blob, term) {
  if (/^[0-9+]+$/.test(term)) {
    return blob.indexOf(term) !== -1;
  }
  var from = 0;
  var idx = blob.indexOf(term);
  while (idx !== -1) {
    if (idx === 0 || !WORD_CHAR.test(blob.charAt(idx - 1))) {
      return true;
    }
    from = idx + 1;
    idx = blob.indexOf(term, from);
  }
  return false;
}

function applyFilters() {
  var rawQuery = document.getElementById("searchInput").value.trim();
  var q = rawQuery.toLowerCase();
  // every whitespace-separated token must start a word in data-search,
  // so "dentist vardanants" matches a card holding both, in any order
  var terms = q ? q.split(/\s+/) : [];
  var cards = document.querySelectorAll(".card");
  var visibleCount = 0;

  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var matchesCat =
      activeCat === "all" || card.getAttribute("data-cat") === activeCat;
    var searchBlob = card.getAttribute("data-search") || "";
    var matchesSearch = true;
    // Not "t" -- var is function-scoped, so a counter by that name shadows
    // the i18n t() for the whole of applyFilters, and every string this
    // function builds below throws instead.
    for (var ti = 0; ti < terms.length; ti++) {
      if (!termMatches(searchBlob, terms[ti])) {
        matchesSearch = false;
        break;
      }
    }
    var show = matchesCat && matchesSearch;
    // A cross-referenced copy is one entry filed under a second subcategory,
    // not a second entry. The masthead total has always excluded them, so
    // the counter here has to as well, or an unfiltered page reports two
    // more entries than it says it holds. build.py stamps the attribute.
    var isDuplicate = card.getAttribute("data-duplicate") === "true";
    var isFilteredOff =
      card.className.indexOf("personal-off") !== -1 ||
      card.className.indexOf("favorite-off") !== -1 ||
      card.className.indexOf("visited-off") !== -1;
    if (show) {
      card.className = card.className.replace(/\bhidden\b/g, "");
      if (!isFilteredOff && !isDuplicate) {
        visibleCount++;
      }
    } else {
      if (card.className.indexOf("hidden") === -1) {
        card.className = card.className + " hidden";
      }
    }
  }

  var subgroups = document.querySelectorAll(".subgroup");
  for (var j = 0; j < subgroups.length; j++) {
    var sg = subgroups[j];
    var anyVisible =
      sg.querySelectorAll(
        ".card:not(.hidden):not(.personal-off):not(.favorite-off):not(.visited-off)",
      ).length > 0;
    if (anyVisible) {
      sg.className = sg.className.replace(/\bhidden\b/g, "");
    } else if (sg.className.indexOf("hidden") === -1) {
      sg.className = sg.className + " hidden";
    }
  }

  var sections = document.querySelectorAll("section.category");
  for (var k = 0; k < sections.length; k++) {
    var sec = sections[k];
    var anyVis =
      sec.querySelectorAll(
        ".card:not(.hidden):not(.personal-off):not(.favorite-off):not(.visited-off)",
      ).length > 0;
    if (anyVis) {
      sec.className = sec.className.replace(/\bhidden\b/g, "");
    } else if (sec.className.indexOf("hidden") === -1) {
      sec.className = sec.className + " hidden";
    }
  }

  var resultEl = document.getElementById("resultCount");
  // The call site picks the English form and tn() picks the language's own,
  // which is not the same choice: Russian says "21 запись", not "21 записей".
  resultEl.textContent = tn(
    visibleCount === 1 ? "{n} entry" : "{n} entries",
    visibleCount,
  );

  var emptyEl = document.getElementById("emptyState");
  if (visibleCount === 0) {
    var onFilters = [];
    var searchInput = document.getElementById("searchInput");
    if (terms.length) {
      onFilters.push(
        makeEmptyFilterEl(t('search "{q}"').replace("{q}", rawQuery), function () {
          flashControl(searchInput ? searchInput.closest(".search-wrap") : null);
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }),
      );
    }
    if (activeCat !== "all") {
      var chips = document.querySelectorAll(".chip");
      var activeChip = null;
      for (var c = 0; c < chips.length; c++) {
        if (chips[c].getAttribute("data-cat") === activeCat) {
          activeChip = chips[c];
          break;
        }
      }
      onFilters.push(
        makeEmptyFilterEl(
          t('category "{cat}"').replace(
            "{cat}",
            activeChip ? activeChip.textContent.trim() : activeCat,
          ),
          function () {
            flashControl(activeChip);
          },
        ),
      );
    }
    var personalToggle = document.getElementById("personalToggle");
    if (personalToggle && personalToggle.checked) {
      onFilters.push(
        makeEmptyFilterEl(t("personal contacts hidden"), function () {
          flashControl(personalToggle.closest(".personal-toggle-wrap"));
        }),
      );
    }
    var favToggle = document.getElementById("favoritesToggle");
    if (favToggle && favToggle.checked) {
      onFilters.push(
        makeEmptyFilterEl(t("favorites"), function () {
          flashControl(favToggle.closest(".favorites-toggle-wrap"));
        }),
      );
    }
    var visitedToggle = document.getElementById("visitedToggle");
    if (visitedToggle && visitedToggle.checked) {
      onFilters.push(
        makeEmptyFilterEl(t("visited"), function () {
          flashControl(visitedToggle.closest(".visited-toggle-wrap"));
        }),
      );
    }
    emptyEl.textContent = "";
    if (onFilters.length) {
      emptyEl.appendChild(document.createTextNode(t("No entries match with ")));
      for (var f = 0; f < onFilters.length; f++) {
        if (f > 0) {
          var sep = f === onFilters.length - 1 ? t(" and ") : ", ";
          emptyEl.appendChild(document.createTextNode(sep));
        }
        emptyEl.appendChild(onFilters[f]);
      }
      emptyEl.appendChild(document.createTextNode(t(" on.")));
    } else {
      emptyEl.textContent = t("No entries match that search. Try a shorter word.");
    }
    emptyEl.style.display = "block";
  } else {
    emptyEl.style.display = "none";
  }
}

applyFilters();

document
  .getElementById("searchInput")
  .addEventListener("input", applyFilters);

(function () {
  var searchEl = document.getElementById("searchInput");
  var shawarmaActive = false;

  function launchShawarmaConfetti() {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    var container = document.createElement("div");
    container.className = "shawarma-confetti";
    container.setAttribute("aria-hidden", "true");
    document.body.appendChild(container);

    var pieceCount = 28;
    for (var i = 0; i < pieceCount; i++) {
      var piece = document.createElement("span");
      piece.className = "shawarma-confetti-piece";
      piece.textContent = "🌯";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.fontSize = 1 + Math.random() * 1.2 + "rem";
      piece.style.animationDuration = 1.8 + Math.random() * 1.4 + "s";
      piece.style.animationDelay = Math.random() * 0.5 + "s";
      container.appendChild(piece);
    }

    setTimeout(function () {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, 3500);
  }

  searchEl.addEventListener("input", function () {
    var matches =
      searchEl.value.trim().toLowerCase().indexOf("shawarma") !== -1;
    if (matches && !shawarmaActive) {
      shawarmaActive = true;
      launchShawarmaConfetti();
    } else if (!matches) {
      shawarmaActive = false;
    }
  });
})();

// The empty state and the result count are written by applyFilters, so the
// language switch just asks for them again.
document.addEventListener("vanadzor:langchange", applyFilters);

