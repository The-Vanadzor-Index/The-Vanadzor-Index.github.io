var activeCat = "all";

// A term matches only at the start of a word in data-search, so "bar"
// finds "Barber" and "Bar B.Q." but not the "bar" buried in "Gambaryan".
// Anything that is not an ASCII letter or digit counts as a word break,
// which covers spaces, punctuation, slashes in URLs, dashes and emoji.
// Pure number terms stay a loose substring match so that searching a
// phone number by its tail ("333022") still finds "+37441333022".
function termMatches(blob, term) {
  if (/^[0-9+]+$/.test(term)) {
    return blob.indexOf(term) !== -1;
  }
  var from = 0;
  var idx = blob.indexOf(term);
  while (idx !== -1) {
    if (idx === 0 || !/[a-z0-9]/.test(blob.charAt(idx - 1))) {
      return true;
    }
    from = idx + 1;
    idx = blob.indexOf(term, from);
  }
  return false;
}

function applyFilters() {
  var q = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
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
    for (var t = 0; t < terms.length; t++) {
      if (!termMatches(searchBlob, terms[t])) {
        matchesSearch = false;
        break;
      }
    }
    var show = matchesCat && matchesSearch;
    var isPersonalHidden = card.className.indexOf("personal-off") !== -1;
    if (show) {
      card.className = card.className.replace(/\bhidden\b/g, "");
      if (!isPersonalHidden) {
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
      sg.querySelectorAll(".card:not(.hidden):not(.personal-off)")
        .length > 0;
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
      sec.querySelectorAll(".card:not(.hidden):not(.personal-off)")
        .length > 0;
    if (anyVis) {
      sec.className = sec.className.replace(/\bhidden\b/g, "");
    } else if (sec.className.indexOf("hidden") === -1) {
      sec.className = sec.className + " hidden";
    }
  }

  var resultEl = document.getElementById("resultCount");
  resultEl.textContent =
    visibleCount + (visibleCount === 1 ? " entry" : " entries");

  var emptyEl = document.getElementById("emptyState");
  emptyEl.style.display = visibleCount === 0 ? "block" : "none";
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
