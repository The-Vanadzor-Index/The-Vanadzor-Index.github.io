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
      ? true
      : saved === "1";
  toggle.checked = hideByDefault;
  applyPersonalVisibility(hideByDefault);

  toggle.addEventListener("change", function () {
    var hide = toggle.checked;
    applyPersonalVisibility(hide);
    savePreference(hide ? "1" : "0");
  });
})();
