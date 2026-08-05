(function () {
  var cards = document.querySelectorAll('[data-personal="true"]');
  for (var i = 0; i < cards.length; i++) {
    var c = cards[i];
    if (c.querySelector(".badge-individual")) continue;
    var badge = document.createElement("span");
    badge.className = "badge-individual";
    badge.textContent = "Individual";
    var tag = c.querySelector(".card-tag");
    var anchor = tag || c.querySelector(".card-name");
    if (anchor && anchor.parentNode === c) {
      anchor.insertAdjacentElement("afterend", badge);
    } else {
      c.appendChild(badge);
    }
  }
})();

(function () {
  var toggle = document.getElementById("personalToggle");
  if (!toggle) return;

  var wrap = toggle.closest(".personal-toggle-wrap");
  var STORAGE_KEY = "vanadzor_hide_personal";

  function savePreference(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
    try {
      var date = new Date();
      date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
      document.cookie =
        STORAGE_KEY +
        "=" +
        value +
        "; expires=" +
        date.toUTCString() +
        "; path=/; SameSite=Lax";
    } catch (e) {}
  }

  function loadPreference() {
    try {
      var ls = localStorage.getItem(STORAGE_KEY);
      if (ls !== null) {
        return ls;
      }
    } catch (e) {}
    try {
      var pairs = document.cookie.split(";");
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].replace(/^\s+/, "");
        if (pair.indexOf(STORAGE_KEY + "=") === 0) {
          return decodeURIComponent(
            pair.substring(STORAGE_KEY.length + 1),
          );
        }
      }
    } catch (e) {}
    return null;
  }

  function updateHiddenSubcatsNotice(hide) {
    var notice = document.getElementById("hiddenSubcatsNotice");
    if (!notice) return;
    var names = [];
    if (hide) {
      var subgroups = document.querySelectorAll(".subgroup");
      for (var i = 0; i < subgroups.length; i++) {
        var sg = subgroups[i];
        var cards = sg.querySelectorAll(".card");
        if (cards.length === 0) continue;
        var allPersonal = true;
        for (var j = 0; j < cards.length; j++) {
          if (cards[j].getAttribute("data-personal") !== "true") {
            allPersonal = false;
            break;
          }
        }
        if (allPersonal) {
          names.push(sg.getAttribute("data-sub"));
        }
      }
    }
    if (names.length === 0) {
      notice.className = "js-only hidden-subcats-notice";
      notice.textContent = "";
    } else {
      notice.className = "js-only hidden-subcats-notice visible";
      notice.textContent =
        "Fully hidden subcategories: " + names.join(", ");
    }
  }

  function applyPersonalVisibility(hide) {
    var cards = document.querySelectorAll('[data-personal="true"]');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (hide) {
        if (c.className.indexOf("personal-off") === -1) {
          c.className = c.className + " personal-off";
        }
      } else {
        c.className = c.className.replace(/\bpersonal-off\b/g, "");
      }
    }
    if (wrap) {
      if (hide) {
        if (wrap.className.indexOf("active") === -1) {
          wrap.className = wrap.className + " active";
        }
      } else {
        wrap.className = wrap.className.replace(/\bactive\b/g, "");
      }
    }
    if (typeof applyFilters === "function") {
      applyFilters();
    }
    updateHiddenSubcatsNotice(hide);
  }

  var saved = loadPreference();
  var isOfflineSnapshot =
    document.documentElement.getAttribute("data-offline-snapshot") ===
    "1";
  var hideByDefault = isOfflineSnapshot
    ? false
    : saved === null
      ? false
      : saved === "1";
  toggle.checked = hideByDefault;
  applyPersonalVisibility(hideByDefault);

  toggle.addEventListener("change", function () {
    var hide = toggle.checked;
    applyPersonalVisibility(hide);
    savePreference(hide ? "1" : "0");
  });

  // The notice names subcategories the toggle just erased; tapping it
  // points back at the control responsible rather than leaving the
  // reader to go hunting for a pill that may have folded off-screen
  // (see 11-toggle-fold.js) on a narrow, scrolled-down viewport.
  var notice = document.getElementById("hiddenSubcatsNotice");
  if (notice && wrap) {
    notice.setAttribute("role", "button");
    notice.setAttribute("tabindex", "0");
    notice.title = "Show the toggle that's hiding these";

    // Checked directly rather than inferred from .toggle-folded: past
    // the foot of the directory (About section, footer) the bar isn't
    // sticky any more and scrolls away with everything else, on any
    // viewport width, folded or not. The opacity check is what catches
    // the fold itself — folded still leaves a couple of border pixels
    // in the box (max-height zeroes out but border-width doesn't), so
    // geometry alone reads a folded pill as "on screen".
    function toggleOnScreen() {
      var cs = window.getComputedStyle(wrap);
      if (parseFloat(cs.opacity) < 0.5) return false;
      var r = wrap.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      return r.height > 8 && r.top >= 0 && r.bottom <= vh;
    }

    var flashTimer;
    function flash() {
      wrap.classList.remove("toggle-flash");
      void wrap.offsetWidth;
      wrap.classList.add("toggle-flash");
      clearTimeout(flashTimer);
      flashTimer = setTimeout(function () {
        wrap.classList.remove("toggle-flash");
      }, 1300);
    }

    function highlightToggle() {
      if (toggleOnScreen()) {
        flash();
        return;
      }
      // Wait for the scroll to actually land before flashing — flashing
      // mid-scroll points at nothing, since the pill isn't where the
      // reader is looking yet. scrollend is the true signal; the
      // timeout is only a backstop for a browser without it.
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

    notice.addEventListener("click", highlightToggle);
    notice.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        highlightToggle();
      }
    });
  }
})();
