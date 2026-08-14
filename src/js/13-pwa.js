if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}

/* Install banner, mobile and desktop alike: surfaced after three
   minutes on the page, or immediately on a second visit (whichever
   comes first), so a reader sees it once they've shown some intent
   to stay rather than on the very first paint. Skipped in an offline
   snapshot (no manifest for it to react to — see
   04-offline-download.js) and once the page is already running
   installed.

   What the banner offers depends on what the browser itself offers —
   there's no point repeating a prompt the browser already shows on
   its own, and no point promising one it can't give:
   - Chromium (Android or desktop Chrome/Edge/Brave/Opera) fires
     `beforeinstallprompt`; the banner's own "Install" button just
     replays that same native prompt, since the browser's address-bar
     install icon is easy to miss and this is more likely to be seen.
   - Safari, mobile or desktop, never fires that event — installing
     is a menu action only the reader can reach, so the banner
     switches to written instructions instead of a button.
   - Anything else (Firefox desktop, browsers with no install path at
     all) gets no banner: there is nothing here for it to offer. */
(function () {
  if (document.documentElement.getAttribute("data-offline-snapshot") === "1") {
    return;
  }

  var isStandalone =
    (window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    navigator.standalone === true;
  if (isStandalone) return;

  var notice = document.getElementById("pwaInstallNotice");
  if (!notice) return;

  var UA = navigator.userAgent;
  var IS_IOS =
    /iphone|ipad|ipod/i.test(UA) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var IS_SAFARI =
    /safari/i.test(UA) && !/chrome|chromium|crios|edg|opr|android/i.test(UA);
  var IS_MAC_SAFARI = IS_SAFARI && !IS_IOS && /macintosh/i.test(UA);

  var DISMISS_KEY = "vanadzor_pwa_notice_dismissed";
  var VISITS_KEY = "vanadzor_pwa_visits";

  try {
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
  } catch (e) {}

  var visits = 1;
  try {
    visits = (parseInt(localStorage.getItem(VISITS_KEY), 10) || 0) + 1;
    localStorage.setItem(VISITS_KEY, String(visits));
  } catch (e) {}

  var deferredPrompt = null;
  var readyToShow = false;
  var timer = null;
  var shown = false;

  function dismiss() {
    if (timer) clearTimeout(timer);
    notice.classList.remove("visible");
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch (e) {}
  }

  function render(kind) {
    var text = document.createElement("div");
    text.className = "pwa-install-notice-text";
    text.textContent =
      kind === "ios"
        ? 'Add The Vanadzor Index to your Home Screen for quick, offline-friendly access: tap the Share icon, then "Add to Home Screen."'
        : kind === "mac-safari"
          ? 'Add The Vanadzor Index to your Dock for quick, offline-friendly access: open the Share menu (or File → Add to Dock) and choose "Add to Dock."'
          : "Install The Vanadzor Index as an app for quick, offline-friendly access.";

    var actions = document.createElement("div");
    actions.className = "pwa-install-notice-actions";

    if (kind === "prompt") {
      var installBtn = document.createElement("button");
      installBtn.type = "button";
      installBtn.className = "pwa-install-notice-install";
      installBtn.textContent = "Install";
      installBtn.addEventListener("click", function () {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(function () {
            deferredPrompt = null;
          });
        }
        dismiss();
      });
      actions.appendChild(installBtn);
    }

    var dismissBtn = document.createElement("button");
    dismissBtn.type = "button";
    dismissBtn.className = "pwa-install-notice-dismiss";
    dismissBtn.textContent = kind === "prompt" ? "Not now" : "Got it";
    dismissBtn.addEventListener("click", dismiss);
    actions.appendChild(dismissBtn);

    notice.appendChild(text);
    notice.appendChild(actions);
  }

  // Re-run whenever either input changes: the visit/timer gate (below)
  // and a late-arriving beforeinstallprompt can each land first.
  function maybeShow() {
    if (shown || !readyToShow) return;
    var kind = deferredPrompt
      ? "prompt"
      : IS_IOS
        ? "ios"
        : IS_MAC_SAFARI
          ? "mac-safari"
          : null;
    if (!kind) return;
    shown = true;
    render(kind);
    notice.classList.add("visible");
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    maybeShow();
  });
  window.addEventListener("appinstalled", dismiss);

  if (visits >= 2) {
    readyToShow = true;
    maybeShow();
  } else {
    timer = setTimeout(function () {
      readyToShow = true;
      maybeShow();
    }, 3 * 60 * 1000);
  }
})();
