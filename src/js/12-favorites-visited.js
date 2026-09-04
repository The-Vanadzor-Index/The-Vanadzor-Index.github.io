/* "Favorites" and "Visited" — two independent marks a reader can put on
   any entry, kept on this device only (localStorage, with the same
   cookie fallback the personal-contacts toggle uses for a browser that
   withholds one of the two). There is no server and no account, so a
   mark made here never reaches anyone else's copy of the page — see
   the "Favorites" / "Visited" toggles below for how a reader
   narrows the list down to what they've marked.

   Cards carry no ID of their own to key a mark against, so one is built
   from what's already on the card: its category plus its name, lower-
   cased. That is also what lets a mark made from the map's own popup
   card (09-map.js clones a card wholesale into it) land on the same
   entry as the page's own copy without the two ever sharing a DOM
   node — the key is read off content, not identity. */
(function () {
  var FAV_KEY = "vanadzor_favorites";
  var VISITED_KEY = "vanadzor_visited";

  function cardKey(card) {
    var nameEl = card.querySelector(".card-name");
    var name = nameEl ? nameEl.textContent : "";
    var cat = card.getAttribute("data-cat") || "";
    return (cat + "||" + name).toLowerCase().replace(/\s+/g, " ").trim();
  }

  function saveSet(storageKey, set) {
    var keys = [];
    for (var k in set) {
      if (set[k]) keys.push(k);
    }
    var value = JSON.stringify(keys);
    try {
      localStorage.setItem(storageKey, value);
    } catch (e) {}
    try {
      var date = new Date();
      date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
      document.cookie =
        storageKey +
        "=" +
        encodeURIComponent(value) +
        "; expires=" +
        date.toUTCString() +
        "; path=/; SameSite=Lax";
    } catch (e) {}
  }

  function loadSet(storageKey) {
    var raw = null;
    try {
      raw = localStorage.getItem(storageKey);
    } catch (e) {}
    if (raw === null) {
      try {
        var pairs = document.cookie.split(";");
        for (var i = 0; i < pairs.length; i++) {
          var pair = pairs[i].replace(/^\s+/, "");
          if (pair.indexOf(storageKey + "=") === 0) {
            raw = decodeURIComponent(
              pair.substring(storageKey.length + 1),
            );
            break;
          }
        }
      } catch (e) {}
    }
    var set = {};
    if (raw) {
      try {
        var keys = JSON.parse(raw);
        for (var j = 0; j < keys.length; j++) {
          set[keys[j]] = true;
        }
      } catch (e) {}
    }
    return set;
  }

  var isOfflineSnapshot =
    document.documentElement.getAttribute("data-offline-snapshot") === "1";
  var favorites = isOfflineSnapshot ? {} : loadSet(FAV_KEY);
  var visited = isOfflineSnapshot ? {} : loadSet(VISITED_KEY);

  function isFavoriteCard(card) {
    return !!favorites[cardKey(card)];
  }
  function isVisitedCard(card) {
    return !!visited[cardKey(card)];
  }
  // Exposed for 09-map.js, which has no other way to ask what a marker
  // stands for without reaching back into a module that comes after it
  // in the concatenated script.
  window.isFavoriteCard = isFavoriteCard;
  window.isVisitedCard = isVisitedCard;

  function syncMap() {
    if (typeof window.mapSyncFavoriteVisited === "function") {
      window.mapSyncFavoriteVisited();
    }
  }

  // Favorited cards lead their subgroup, in the order they were
  // favorited-into-view (i.e. their existing relative order among
  // themselves), with everything else following in its original order.
  // Grid spans set by masonry.js are per-card, not positional, so
  // reordering here needs no relayout of its own.
  //
  // Not run on every star/unstar — a card jumping to the top of a long
  // subgroup mid-read was more disruptive than useful. Instead this
  // runs on load and again whenever the reader starts a new search, so
  // a freshly favorited entry settles into place the next time the
  // list itself is about to change anyway, rather than out from under
  // whatever the reader is currently looking at.
  function reorderFavorites() {
    var grids = document.querySelectorAll(".card-grid");
    for (var g = 0; g < grids.length; g++) {
      var grid = grids[g];
      var cards = Array.prototype.slice.call(grid.children);
      var favs = cards.filter(isFavoriteCard);
      if (!favs.length) continue;
      var rest = cards.filter(function (c) {
        return !isFavoriteCard(c);
      });
      var ordered = favs.concat(rest);
      for (var i = 0; i < ordered.length; i++) {
        grid.appendChild(ordered[i]);
      }
    }
  }

  // Every card sharing a key gets the same visual state — the page's
  // own copy and, while the map panel holds a cloned card of the same
  // entry, that clone too, so a tap on either reads back on both
  // without either one being told about the other directly.
  function refreshCard(card) {
    var key = cardKey(card);
    var fav = !!favorites[key];
    var vis = !!visited[key];
    var favBtn = card.querySelector(".fav-btn");
    var visitedBtn = card.querySelector(".visited-btn");
    if (favBtn) {
      favBtn.classList.toggle("is-active", fav);
      favBtn.setAttribute("aria-pressed", fav ? "true" : "false");
      favBtn.textContent = fav ? "★" : "☆";
      favBtn.setAttribute(
        "aria-label",
        t(fav ? "Remove from favorites" : "Add to favorites"),
      );
    }
    if (visitedBtn) {
      visitedBtn.classList.toggle("is-active", vis);
      visitedBtn.setAttribute("aria-pressed", vis ? "true" : "false");
      visitedBtn.textContent = vis ? "✓" : "○";
      visitedBtn.setAttribute(
        "aria-label",
        t(vis ? "Mark as not visited" : "Mark as visited"),
      );
    }
  }

  function refreshAllWithKey(key) {
    var cards = document.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) {
      if (cardKey(cards[i]) === key) refreshCard(cards[i]);
    }
  }

  function applyOnlyFilter(only, className, set) {
    var cards = document.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var shouldHide = only && !set[cardKey(card)];
      if (shouldHide) {
        if (card.className.indexOf(className) === -1) {
          card.className = card.className + " " + className;
        }
      } else {
        card.className = card.className
          .replace(new RegExp("\\b" + className + "\\b", "g"), "")
          .replace(/\s+/g, " ")
          .replace(/^\s|\s$/g, "");
      }
    }
  }

  function toggleMark(card, storageKey, set, btn) {
    var key = cardKey(card);
    if (set[key]) {
      delete set[key];
    } else {
      set[key] = true;
    }
    saveSet(storageKey, set);
    refreshAllWithKey(key);
    // Text changed under it (Add to -> Now in) — show it again rather
    // than leave the stale pre-toggle wording up, and on a touch tap
    // there was never a hover to have shown it in the first place.
    // Has to run before the "only" filter below can hide this button —
    // a hidden button's getBoundingClientRect() is all zeros, which
    // sent the tooltip to the top-left corner for a frame.
    if (btn) showTooltip(btn, lastPointerType === "touch");
    // A star or check pressed on a card that a running "only" filter
    // would now exclude has to take itself out of the list immediately,
    // not wait for the toggle pill to be re-clicked.
    if (favToggle && favToggle.checked) {
      applyOnlyFilter(true, "favorite-off", favorites);
    }
    if (visitedToggle && visitedToggle.checked) {
      applyOnlyFilter(true, "visited-off", visited);
    }
    if (typeof applyFilters === "function") applyFilters();
    syncMap();
  }

  // Injected rather than shipped in the card markup — a no-JS visitor
  // never sees these, same reasoning as .badge-individual's guard
  // below, and there is nowhere to persist a mark without JS anyway.
  // The guard also keeps a card cloned into the map's popup (which
  // already carries its own .card-actions, copied along with the rest
  // of the card) from getting a second pair of buttons appended.
  function injectButtons() {
    var cards = document.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (card.querySelector(".card-actions")) continue;
      var actions = document.createElement("div");
      actions.className = "card-actions";

      var favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = "card-action-btn fav-btn";
      actions.appendChild(favBtn);

      var visitedBtn = document.createElement("button");
      visitedBtn.type = "button";
      visitedBtn.className = "card-action-btn visited-btn";
      actions.appendChild(visitedBtn);

      card.appendChild(actions);
      refreshCard(card);
    }
  }

  injectButtons();
  reorderFavorites();

  // One delegated listener catches both buttons everywhere a card can
  // appear — the page's own grid and, while it's open, the map
  // popup's cloned card — rather than binding to each button as it's
  // created, which the popup's clone (built by cloneNode, not by this
  // function) would never pick up.
  document.addEventListener("click", function (e) {
    var target = e.target;
    if (!target || !target.closest) return;
    var btn = target.closest(".fav-btn, .visited-btn");
    if (!btn) return;
    var card = btn.closest(".card");
    if (!card) return;
    e.preventDefault();
    if (btn.classList.contains("fav-btn")) {
      toggleMark(card, FAV_KEY, favorites, btn);
    } else {
      toggleMark(card, VISITED_KEY, visited, btn);
    }
  });

  // Explanation popup, shared across every fav/visited button on the
  // page (and on whichever one the map's popup has cloned) rather than
  // one per button, same reasoning as copy-address.js's toast. Hover
  // and keyboard focus show it and it stays up for as long as that
  // lasts, since a mouse resting on the button can dismiss it by
  // leaving; a tap has no "leaving" to speak of, so that path shows it
  // and times it out instead, matching the copy-toast's own timing.
  var tooltipEl = null;
  var tooltipTimer = null;
  var lastPointerType = "mouse";

  function tooltipText(btn) {
    var active = btn.classList.contains("is-active");
    if (btn.classList.contains("fav-btn")) {
      return active ? t("Now in Favorites") : t("Add to Favorites");
    }
    return active ? t("Now in Visited") : t("Add to Visited");
  }

  var shownTooltipBtn = null;

  function hideTooltip() {
    clearTimeout(tooltipTimer);
    shownTooltipBtn = null;
    if (tooltipEl) tooltipEl.classList.remove("action-tooltip-shown");
  }

  function showTooltip(btn, autoHide) {
    shownTooltipBtn = btn;
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.className = "action-tooltip";
      tooltipEl.setAttribute("role", "status");
      document.body.appendChild(tooltipEl);
    }
    tooltipEl.textContent = tooltipText(btn);
    tooltipEl.classList.remove("action-tooltip-below");
    // Width/height read with the element already in the document but
    // still visibility:hidden — that still lays it out, just doesn't
    // paint it, so this is the real size the shown pill will have.
    var w = tooltipEl.offsetWidth;
    var h = tooltipEl.offsetHeight;
    var rect = btn.getBoundingClientRect();
    var gap = 8;
    var top = rect.top - h - gap;
    if (top < gap) {
      top = rect.bottom + gap;
      tooltipEl.classList.add("action-tooltip-below");
    }
    var left = rect.left + rect.width / 2;
    var minLeft = w / 2 + gap;
    var maxLeft = window.innerWidth - w / 2 - gap;
    left = Math.max(minLeft, Math.min(maxLeft, left));
    tooltipEl.style.left = left + "px";
    tooltipEl.style.top = top + "px";
    tooltipEl.classList.add("action-tooltip-shown");
    clearTimeout(tooltipTimer);
    if (autoHide) {
      tooltipTimer = setTimeout(hideTooltip, 1600);
    }
  }

  // Captured, not delegated normally, so it fires before the click
  // listener above needs to know what pressed the button — pointerdown
  // always precedes click.
  document.addEventListener(
    "pointerdown",
    function (e) {
      var btn =
        e.target && e.target.closest && e.target.closest(".fav-btn, .visited-btn");
      if (btn) lastPointerType = e.pointerType || "mouse";
    },
    true,
  );

  document.addEventListener("pointerover", function (e) {
    if (e.pointerType === "touch") return;
    var btn = e.target.closest && e.target.closest(".fav-btn, .visited-btn");
    if (!btn) return;
    showTooltip(btn, false);
  });
  document.addEventListener("pointerout", function (e) {
    if (e.pointerType === "touch") return;
    var btn = e.target.closest && e.target.closest(".fav-btn, .visited-btn");
    if (!btn) return;
    if (e.relatedTarget && btn.contains(e.relatedTarget)) return;
    hideTooltip();
  });
  document.addEventListener("focusin", function (e) {
    var btn = e.target.closest && e.target.closest(".fav-btn, .visited-btn");
    if (btn) showTooltip(btn, false);
  });
  document.addEventListener("focusout", function (e) {
    var btn = e.target.closest && e.target.closest(".fav-btn, .visited-btn");
    if (btn) hideTooltip();
  });

  var favToggle = document.getElementById("favoritesToggle");
  var visitedToggle = document.getElementById("visitedToggle");

  // Enabling either "only" filter can leave the search bar stuck mid-page
  // in its sticky position; scroll it back to its unstuck, top-of-page
  // spot rather than leave it anchored where the reader happened to be.
  function scrollToRealTop() {
    if ((window.pageYOffset || document.documentElement.scrollTop) <= 0) {
      return;
    }
    if (!window.scrollTo) return;
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      window.scrollTo(0, 0);
    }
  }

  if (favToggle) {
    favToggle.addEventListener("change", function () {
      applyOnlyFilter(favToggle.checked, "favorite-off", favorites);
      var wrap = favToggle.closest(".favorites-toggle-wrap");
      if (wrap) wrap.classList.toggle("active", favToggle.checked);
      if (typeof applyFilters === "function") applyFilters();
      if (favToggle.checked) scrollToRealTop();
    });
  }
  if (visitedToggle) {
    visitedToggle.addEventListener("change", function () {
      applyOnlyFilter(visitedToggle.checked, "visited-off", visited);
      var wrap = visitedToggle.closest(".visited-toggle-wrap");
      if (wrap) wrap.classList.toggle("active", visitedToggle.checked);
      if (typeof applyFilters === "function") applyFilters();
      if (visitedToggle.checked) scrollToRealTop();
    });
  }

  // A newly favorited card moves to the front of its subgroup here
  // rather than at the moment it's starred — see reorderFavorites above.
  var searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", reorderFavorites);
  }

  document.addEventListener("vanadzor:langchange", function () {
    var cards = document.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) refreshCard(cards[i]);
    if (shownTooltipBtn) showTooltip(shownTooltipBtn, false);
  });

})();
