(function () {
  var toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  function getStoredMode() {
    try {
      var v = localStorage.getItem("vanadzor-theme");
      if (v === "light" || v === "dark" || v === "system") return v;
    } catch (e) {}
    return "system";
  }

  function systemPrefersDark() {
    return !!(
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  function effectiveTheme(mode) {
    if (mode === "light" || mode === "dark") return mode;
    return systemPrefersDark() ? "dark" : "light";
  }

  function applyMode(mode) {
    if (mode === "light" || mode === "dark") {
      document.documentElement.setAttribute("data-theme", mode);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  var currentMode = getStoredMode();

  var iconEl = document.getElementById("themeIcon");
  var MOON_SVG =
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"></path>';
  var SUN_SVG =
    '<circle cx="12" cy="12" r="5" fill="currentColor"></circle>' +
    '<g stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
    '<line x1="12" y1="1" x2="12" y2="3"></line>' +
    '<line x1="12" y1="21" x2="12" y2="23"></line>' +
    '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>' +
    '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>' +
    '<line x1="1" y1="12" x2="3" y2="12"></line>' +
    '<line x1="21" y1="12" x2="23" y2="12"></line>' +
    '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>' +
    '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' +
    "</g>";
  var SYSTEM_SVG =
    '<path d="M12 2a10 10 0 000 20V2z" fill="currentColor"></path>' +
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"></circle>';

  function cycleOrder() {
    return systemPrefersDark()
      ? ["system", "light", "dark"]
      : ["system", "dark", "light"];
  }

  function nextMode() {
    var order = cycleOrder();
    var i = order.indexOf(currentMode);
    if (i === -1) i = 0;
    return order[(i + 1) % order.length];
  }

  var LABELS = {
    system: "Switch to system theme",
    light: "Switch to light mode",
    dark: "Switch to dark mode",
  };

  function currentLabel() {
    return LABELS[nextMode()];
  }

  // Names the mode the toggle is in right now, as opposed to the
  // aria-label, which names the mode the next click would move to.
  function statusText() {
    if (currentMode === "light") return "Light mode";
    if (currentMode === "dark") return "Dark mode";
    return "System theme · " + effectiveTheme("system");
  }

  var statusEl = document.getElementById("themeStatus");
  var statusTimer = null;

  function updateIcon() {
    if (iconEl) {
      iconEl.innerHTML =
        currentMode === "system"
          ? SYSTEM_SVG
          : effectiveTheme(currentMode) === "dark"
            ? MOON_SVG
            : SUN_SVG;
    }
    toggle.setAttribute("aria-label", currentLabel());
    if (statusEl) statusEl.textContent = statusText();
  }

  // Hovering reveals the label on its own (CSS); this is for the click,
  // which needs to report the mode it just landed on — including on
  // touch, where there is no hover to lean on. Long enough to read,
  // then it clears itself; a mouse still resting on the button keeps
  // the label up on hover after the timer has run out.
  function flashStatus() {
    if (!statusEl) return;
    statusEl.classList.add("theme-status-shown");
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(function () {
      statusEl.classList.remove("theme-status-shown");
      statusTimer = null;
    }, 3000);
  }

  toggle.addEventListener("click", function () {
    currentMode = nextMode();
    applyMode(currentMode);
    try {
      localStorage.setItem("vanadzor-theme", currentMode);
    } catch (e) {}
    updateIcon();
    flashStatus();
  });

  applyMode(currentMode);
  updateIcon();

  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () {
      if (currentMode === "system") {
        updateIcon();
      }
    };
    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
    } else if (mq.addListener) {
      mq.addListener(onChange);
    }
  }
})();
