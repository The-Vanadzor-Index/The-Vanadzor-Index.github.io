/* Shareable links: a "copy link" button on every card that opens straight
   to that entry, and one by the search box that opens straight to the
   current search/category. Both round-trip through the same URL params
   this file reads on load (?entry=, ?q=, ?cat=), so a saved offline
   snapshot — frozen at save time, per 04-offline-download.js — still
   opens a plain unfiltered page if one of these links is later pasted
   into it; the params only do anything on the live site.

   Cards carry no ID of their own (see 12-favorites-visited.js's cardKey
   for why), so an entry's slug is built the same way — category plus
   name — rather than adding one. Two cards sharing a slug are always
   the same real-world entry: either the intentional cross-referenced
   duplicates the build already excludes from the counts, or the small
   number of genuinely distinct businesses that share a name, which
   .card-actions' fav/visited buttons already treat as one entry too. */
(function () {
  function slugify(s) {
    return (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function entrySlug(card) {
    var nameEl = card.querySelector(".card-name");
    var name = nameEl ? nameEl.textContent : "";
    var cat = card.getAttribute("data-cat") || "";
    return slugify(cat) + "--" + slugify(name);
  }

  function findCardBySlug(slug) {
    var cards = document.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) {
      if (entrySlug(cards[i]) === slug) return cards[i];
    }
    return null;
  }

  function baseUrl() {
    return window.location.href.split("#")[0].split("?")[0];
  }

  function entryUrl(card) {
    return baseUrl() + "?entry=" + encodeURIComponent(entrySlug(card));
  }

  function searchUrl() {
    var params = [];
    var q = searchInputEl ? searchInputEl.value.trim() : "";
    if (q) params.push("q=" + encodeURIComponent(q));
    if (typeof activeCat !== "undefined" && activeCat !== "all") {
      params.push("cat=" + encodeURIComponent(activeCat));
    }
    return baseUrl() + (params.length ? "?" + params.join("&") : "");
  }

  // Same fallback-copy route as 08-copy-address.js — kept as its own
  // small copy here rather than reached for across files, same
  // reasoning as that file gives for not sharing state with anything
  // else on the page.
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    var ok = false;
    try {
      ta.select();
      ta.setSelectionRange(0, text.length);
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  // Same at-button popup 12-favorites-visited.js uses for its fav/visited
  // buttons (same .action-tooltip class, same positioning) — own instance
  // here rather than reached for across files, same reasoning that file
  // gives for not sharing state with anything else on the page. Doubles
  // as the hover hint ("Copy link") and the post-click confirmation
  // ("Link copied"), so the reader never has to look away from the
  // button they just pressed to see whether it worked.
  var tooltipEl = null;
  var tooltipTimer = null;

  function baseTooltipText(btn) {
    return btn === searchShareBtn ? "Copy search link" : "Copy link";
  }

  function hideTooltip() {
    clearTimeout(tooltipTimer);
    if (tooltipEl) tooltipEl.classList.remove("action-tooltip-shown");
  }

  function showTooltip(btn, text, autoHide) {
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.className = "action-tooltip";
      tooltipEl.setAttribute("role", "status");
      document.body.appendChild(tooltipEl);
    }
    tooltipEl.textContent = text;
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

  // Unlike fav/visited, copying isn't a toggle with a lasting state to
  // reflect on the next hover — "Link copied" is a one-off confirmation,
  // so it always times out and hovering the button again afterward goes
  // back to showing the plain hint.
  function copyLink(btn, text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          showTooltip(btn, successMsg, true);
        },
        function () {
          showTooltip(
            btn,
            legacyCopy(text) ? successMsg : "Press and hold to copy",
            true,
          );
        },
      );
      return;
    }
    showTooltip(
      btn,
      legacyCopy(text) ? successMsg : "Press and hold to copy",
      true,
    );
  }

  // Third button alongside fav/visited in the corner .card-actions
  // 12-favorites-visited.js already builds — appended there rather than
  // laid out again from scratch, so it inherits the same circle, the
  // same reserved corner, and the same delegated-click reasoning (the
  // map popup's cloned card picks it up for free). Runs once at load,
  // after that file's own injectButtons — file order (12 before 14)
  // guarantees .card-actions already exists on every card by the time
  // this runs.
  function injectShareButtons() {
    var cards = document.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) {
      var actions = cards[i].querySelector(".card-actions");
      if (!actions || actions.querySelector(".share-btn")) continue;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card-action-btn share-btn";
      btn.setAttribute("aria-label", "Copy link to this entry");
      actions.appendChild(btn);
    }
  }
  injectShareButtons();

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".share-btn");
    if (!btn) return;
    var card = btn.closest(".card");
    if (!card) return;
    e.preventDefault();
    copyLink(btn, entryUrl(card), "Link copied");
  });

  // Search-box button — markup lives in the template (a one-off control,
  // not a per-card repeat), hidden by default; shown only once there is
  // something in the URL worth linking to, so it never offers to copy a
  // link back to the unfiltered page.
  var searchInputEl = document.getElementById("searchInput");
  var searchShareBtn = document.getElementById("searchShareBtn");

  function updateSearchShareVisibility() {
    if (!searchShareBtn) return;
    var hasQuery = !!(searchInputEl && searchInputEl.value.trim());
    var hasCat = typeof activeCat !== "undefined" && activeCat !== "all";
    searchShareBtn.classList.toggle("visible", hasQuery || hasCat);
  }

  if (searchShareBtn) {
    searchShareBtn.addEventListener("click", function () {
      copyLink(searchShareBtn, searchUrl(), "Search link copied");
    });
  }

  // Hover/focus hint, same as 12-favorites-visited.js's fav/visited
  // buttons: a mouse resting on the button can dismiss the tooltip by
  // leaving, so only the click confirmation above needs an auto-hide
  // timer — the hint itself just tracks hover/focus.
  document.addEventListener("pointerover", function (e) {
    if (e.pointerType === "touch") return;
    var btn =
      e.target.closest && e.target.closest(".share-btn, .search-share-btn");
    if (!btn) return;
    showTooltip(btn, baseTooltipText(btn), false);
  });
  document.addEventListener("pointerout", function (e) {
    if (e.pointerType === "touch") return;
    var btn =
      e.target.closest && e.target.closest(".share-btn, .search-share-btn");
    if (!btn) return;
    if (e.relatedTarget && btn.contains(e.relatedTarget)) return;
    hideTooltip();
  });
  document.addEventListener("focusin", function (e) {
    var btn =
      e.target.closest && e.target.closest(".share-btn, .search-share-btn");
    if (btn) showTooltip(btn, baseTooltipText(btn), false);
  });
  document.addEventListener("focusout", function (e) {
    var btn =
      e.target.closest && e.target.closest(".share-btn, .search-share-btn");
    if (btn) hideTooltip();
  });

  // Keeps the address bar itself live, not just the copy-link buttons —
  // so the tab's own URL is always a working deeplink to whatever's on
  // screen, copyable straight from the browser chrome (or bookmarkable,
  // or reloadable) without a click on either button. replaceState, not
  // pushState: a history entry per keystroke would turn Back into
  // useless single-character undo instead of leaving the page. Not
  // called from the initial setup below or from handleDeepLinks — only
  // from real interaction afterward — so a page opened from an ?entry=
  // link keeps that URL in the bar until the reader actually starts
  // typing or picks a category, rather than losing it to a q=/cat=
  // rewrite (both empty) the instant the script runs.
  function syncAddressBar() {
    if (!window.history || typeof window.history.replaceState !== "function") {
      return;
    }
    var params = [];
    var q = searchInputEl ? searchInputEl.value.trim() : "";
    if (q) params.push("q=" + encodeURIComponent(q));
    if (typeof activeCat !== "undefined" && activeCat !== "all") {
      params.push("cat=" + encodeURIComponent(activeCat));
    }
    var url =
      baseUrl() +
      (params.length ? "?" + params.join("&") : "") +
      window.location.hash;
    if (url !== window.location.href) {
      window.history.replaceState(window.history.state, "", url);
    }
  }

  if (searchInputEl) {
    searchInputEl.addEventListener("input", function () {
      updateSearchShareVisibility();
      syncAddressBar();
    });
  }
  var chipRowEl = document.getElementById("chipRow");
  if (chipRowEl) {
    chipRowEl.addEventListener("click", function () {
      updateSearchShareVisibility();
      syncAddressBar();
    });
  }
  updateSearchShareVisibility();

  // ---- Reading the params back on load ----

  function setActiveCatChip(cat) {
    var chips = document.querySelectorAll(".chip");
    var matched = false;
    for (var i = 0; i < chips.length; i++) {
      if (chips[i].getAttribute("data-cat") === cat) matched = true;
    }
    if (!matched) return false;
    for (var j = 0; j < chips.length; j++) {
      chips[j].className = chips[j].className
        .replace(/\bactive\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (chips[j].getAttribute("data-cat") === cat) {
        chips[j].className = (chips[j].className + " active").trim();
      }
    }
    activeCat = cat;
    return true;
  }

  // A linked entry has to actually be on screen once filtering settles
  // — hidden behind whichever toggle would otherwise keep it out, same
  // as the empty-state's per-filter callouts point back at the control
  // responsible rather than leaving the reader stuck on a filter they
  // didn't know was active.
  function revealCard(card) {
    var cat = card.getAttribute("data-cat");
    if (cat && typeof activeCat !== "undefined" && cat !== activeCat) {
      setActiveCatChip(cat);
    }
    var personalToggle = document.getElementById("personalToggle");
    if (
      personalToggle &&
      personalToggle.checked &&
      card.getAttribute("data-personal") === "true"
    ) {
      personalToggle.checked = false;
      personalToggle.dispatchEvent(new Event("change"));
    }
    var favToggle = document.getElementById("favoritesToggle");
    if (
      favToggle &&
      favToggle.checked &&
      typeof window.isFavoriteCard === "function" &&
      !window.isFavoriteCard(card)
    ) {
      favToggle.checked = false;
      favToggle.dispatchEvent(new Event("change"));
    }
    var visitedToggle = document.getElementById("visitedToggle");
    if (
      visitedToggle &&
      visitedToggle.checked &&
      typeof window.isVisitedCard === "function" &&
      !window.isVisitedCard(card)
    ) {
      visitedToggle.checked = false;
      visitedToggle.dispatchEvent(new Event("change"));
    }
    if (typeof applyFilters === "function") applyFilters();
  }

  // In, out, in, out — the ring on its own (one beat) read as a single
  // blip easy to miss if the reader glanced away during the scroll. The
  // timeout below matches the CSS's own animation-duration, 2.8s
  // (.card.entry-flash in index.template.html) plus a small buffer, so
  // it still ends on its own once the (non-repeating) animation is done.
  function flashCard(card) {
    card.classList.remove("entry-flash");
    void card.offsetWidth;
    card.classList.add("entry-flash");
    clearTimeout(card._entryFlashTimeout);
    card._entryFlashTimeout = setTimeout(function () {
      card.classList.remove("entry-flash");
    }, 3000);
  }

  // Landing on an ?entry= link used to scroll and flash in the same
  // tick — the ring lit up while the card was still sliding into view,
  // which read as a glitch rather than a highlight. A short pause first
  // (the page has barely painted at this point) makes the jump itself
  // read as deliberate rather than instant; scrollToWithBarOffset's own
  // completion callback (03-chips.js) is what then times the flash to
  // the moment the eased scroll animation ends — plus a further pause
  // there too, since flashing the instant the scroll stops still read
  // as one continuous motion. The two pauses aren't the same wait
  // twice: the first covers the scroll itself (its length depends on
  // distance, so it's really "however long the scroll takes" plus a
  // little), the second is a fixed beat after the card has visibly
  // stopped moving, so the highlight reads as its own event.
  function scrollThenFlash(card) {
    setTimeout(function () {
      // Masonry (10-masonry.js) only *schedules* its first pack via
      // rAF — on a fresh load that hasn't run yet, so measuring the
      // card now targets the unpacked layout and the page settles
      // scrolled to the wrong spot once packing catches up. Forced
      // here, right before the measurement that depends on it, rather
      // than earlier in handleDeepLinks — the delay above is long
      // enough that something else could have re-triggered a pack by
      // the time this runs.
      if (typeof window.relayoutMasonry === "function") {
        window.relayoutMasonry();
      }
      scrollToWithBarOffset(card, function () {
        setTimeout(function () {
          flashCard(card);
        }, 500);
      });
    }, 400);
  }

  function handleDeepLinks() {
    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) {
      return;
    }
    var entryParam = params.get("entry");
    var qParam = params.get("q");
    var catParam = params.get("cat");

    if (qParam && searchInputEl) {
      searchInputEl.value = qParam;
    }
    if (catParam) {
      setActiveCatChip(catParam);
    }
    if (qParam || catParam) {
      if (typeof applyFilters === "function") applyFilters();
      updateSearchShareVisibility();
    }

    if (entryParam) {
      var card = findCardBySlug(entryParam);
      if (card) {
        revealCard(card);
        scrollThenFlash(card);
      }
    }
  }

  handleDeepLinks();
})();
