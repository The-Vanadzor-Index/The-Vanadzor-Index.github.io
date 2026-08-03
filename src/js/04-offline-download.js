(function () {
  var downloadBtn = document.getElementById("downloadBtn");
  if (!downloadBtn) return;

  downloadBtn.addEventListener("click", function () {
    try {
      var clone = document.documentElement.cloneNode(true);

      // Reset the html class so the saved copy behaves like a fresh load,
      // not a snapshot of whatever state this session happened to be in.
      clone.className = "no-js";

      // Mark this as an offline snapshot so the init script always shows
      // personal contacts on load, regardless of the live page's toggle
      // state or any saved preference in storage.
      clone.setAttribute("data-offline-snapshot", "1");

      // Show personal-contact cards in the static markup too, as a
      // fallback for the (unlikely) case JS doesn't run in the saved copy.
      var clonePersonalCards = clone.querySelectorAll(
        '[data-personal="true"]',
      );
      for (var p = 0; p < clonePersonalCards.length; p++) {
        clonePersonalCards[p].className = clonePersonalCards[p].className
          .replace(/\bpersonal-off\b/g, "")
          .replace(/\s+/g, " ")
          .replace(/^\s|\s$/g, "");
      }
      var clonePersonalToggle = clone.querySelector("#personalToggle");
      if (clonePersonalToggle) {
        clonePersonalToggle.removeAttribute("checked");
      }

      // Clear any search text so the saved copy starts unfiltered.
      var cloneSearch = clone.querySelector("#searchInput");
      if (cloneSearch) {
        cloneSearch.setAttribute("value", "");
        cloneSearch.value = "";
      }

      // Remove any 'hidden' classes left over from filtering.
      var hiddenEls = clone.querySelectorAll(
        ".card, .subgroup, section.category",
      );
      for (var i = 0; i < hiddenEls.length; i++) {
        hiddenEls[i].className = hiddenEls[i].className
          .replace(/\bhidden\b/g, "")
          .replace(/\s+/g, " ")
          .replace(/^\s|\s$/g, "");
      }

      // Reset chip active state back to just "All".
      var cloneChips = clone.querySelectorAll(".chip");
      for (var j = 0; j < cloneChips.length; j++) {
        cloneChips[j].className = cloneChips[j].className
          .replace(/\bactive\b/g, "")
          .replace(/\s+/g, " ")
          .replace(/^\s|\s$/g, "");
      }
      var cloneAll = clone.querySelector('a[data-cat="all"]');
      if (cloneAll) {
        cloneAll.className = cloneAll.className + " active";
      }

      // The snapshot opens at the top, where the sticky bar is still
      // pinned, so the back-to-top button starts hidden again.
      var cloneToTop = clone.querySelector(".to-top");
      if (cloneToTop) {
        cloneToTop.className = cloneToTop.className
          .replace(/\bto-top-shown\b/g, "")
          .replace(/\s+/g, " ")
          .replace(/^\s|\s$/g, "");
      }

      // The copy toast is injected at runtime and may be mid-fade when
      // the snapshot is taken. The saved copy makes its own on demand.
      var cloneToast = clone.querySelector(".copy-toast");
      if (cloneToast) {
        cloneToast.parentNode.removeChild(cloneToast);
      }

      // The theme label may be mid-flash from a just-clicked toggle; the
      // saved copy should open with it tucked away as usual.
      var cloneThemeStatus = clone.querySelector("#themeStatus");
      if (cloneThemeStatus) {
        cloneThemeStatus.className = "theme-status";
      }

      // Same for the address rows' .addr-copy tag: it carries a pointer
      // cursor and a hover highlight, which would promise a copy the
      // saved copy can't deliver if it is ever opened without JS. The
      // script re-tags them on load whenever JS does run.
      var cloneAddrRows = clone.querySelectorAll(".addr-copy");
      for (var q = 0; q < cloneAddrRows.length; q++) {
        cloneAddrRows[q].className = cloneAddrRows[q].className
          .replace(/\baddr-copy\b/g, "")
          .replace(/\s+/g, " ")
          .replace(/^\s|\s$/g, "");
      }

      // The map preview panel is built at runtime and is switched off
      // in a snapshot anyway, since a saved copy has no network to
      // fetch tiles from. Take the panel out, hand the map links back
      // their plain outbound behaviour, and drop the scrollbar gutter
      // the panel sets on <html> while it is open.
      var cloneMapView = clone.querySelector(".mapview");
      if (cloneMapView) {
        cloneMapView.parentNode.removeChild(cloneMapView);
      }
      // The plate's way into that panel goes with it. It is js-only,
      // so it survives the class check above, but in a snapshot the
      // panel never builds and the button would sit there dead.
      var cloneCityBtn = clone.querySelector(".plate-open");
      if (cloneCityBtn) {
        cloneCityBtn.parentNode.removeChild(cloneCityBtn);
      }
      var cloneMapLinks = clone.querySelectorAll("a.map-preview");
      for (var r = 0; r < cloneMapLinks.length; r++) {
        cloneMapLinks[r].className = cloneMapLinks[r].className
          .replace(/\bmap-preview\b/g, "")
          .replace(/\s+/g, " ")
          .replace(/^\s|\s$/g, "");
        if (!cloneMapLinks[r].className) {
          cloneMapLinks[r].removeAttribute("class");
        }
        cloneMapLinks[r].removeAttribute("aria-haspopup");
      }
      clone.style.paddingRight = "";
      if (!clone.getAttribute("style")) {
        clone.removeAttribute("style");
      }
      // The preconnect hints the panel injects when a reader reaches
      // for a map link would have a saved copy dialling the tile
      // server the moment it is opened, for a preview it doesn't
      // offer. The markup ships none of its own, so all can go.
      var cloneHints = clone.querySelectorAll('link[rel="preconnect"]');
      for (var w = 0; w < cloneHints.length; w++) {
        cloneHints[w].parentNode.removeChild(cloneHints[w]);
      }

      // The .ico and PNG icons are separate files on the site, and a
      // saved copy has none of them beside it — those links would
      // resolve against the downloads folder and find nothing. The
      // inline SVG icon carries no such dependency and is left alone,
      // so the snapshot keeps its icon and asks for nothing.
      var cloneIcons = clone.querySelectorAll("link[data-site-icon]");
      for (var x = 0; x < cloneIcons.length; x++) {
        cloneIcons[x].parentNode.removeChild(cloneIcons[x]);
      }

      // Reset the arrow buttons to their initial disabled/enabled state.
      var cloneLeftArrow = clone.querySelector(".chip-arrow-left");
      var cloneRightArrow = clone.querySelector(".chip-arrow-right");
      if (cloneLeftArrow) {
        cloneLeftArrow.className =
          "chip-arrow chip-arrow-left disabled js-only";
      }
      if (cloneRightArrow) {
        cloneRightArrow.className = "chip-arrow chip-arrow-right js-only";
      }

      // Strip the dynamic inline mask-image/display styles the script applies at runtime.
      var cloneRow = clone.querySelector("#chipRow");
      if (cloneRow) {
        cloneRow.removeAttribute("style");
      }
      var cloneEmpty = clone.querySelector("#emptyState");
      if (cloneEmpty) {
        cloneEmpty.removeAttribute("style");
      }
      var cloneWrap = clone.querySelector(".chip-scroll-wrap");
      if (cloneWrap) {
        cloneWrap.className = cloneWrap.className
          .replace(/\bdragging\b/g, "")
          .replace(/\s+/g, " ")
          .replace(/^\s|\s$/g, "");
      }

      // Drop the masonry row spans. They were measured against this
      // window's width, and the saved copy recomputes its own on load —
      // shipping them would only mis-place cards until it does.
      var cloneGrids = clone.querySelectorAll(".card-grid");
      for (var m = 0; m < cloneGrids.length; m++) {
        cloneGrids[m].className = cloneGrids[m].className
          .replace(/\bmasonry\b/g, "")
          .replace(/\s+/g, " ")
          .replace(/^\s|\s$/g, "");
      }
      var cloneCards = clone.querySelectorAll(".card");
      for (var n = 0; n < cloneCards.length; n++) {
        cloneCards[n].removeAttribute("style");
      }

      // Swap the download button out for a static notice, since this saved
      // copy is a snapshot and can't offer a fresh download of itself.
      var cloneDownloadBtn = clone.querySelector("#downloadBtn");
      if (cloneDownloadBtn) {
        var offlineNotice = clone.ownerDocument.createElement("div");
        offlineNotice.className = "offline-notice";
        offlineNotice.appendChild(
          clone.ownerDocument.createTextNode(
            "This is a downloaded offline copy — it does not include any updates or revisions made to the index since it was saved.",
          ),
        );
        offlineNotice.appendChild(
          clone.ownerDocument.createElement("br"),
        );
        var onlineLink = clone.ownerDocument.createElement("a");
        onlineLink.href = "https://the-vanadzor-index.github.io/";
        onlineLink.rel = "noopener";
        onlineLink.target = "_blank";
        onlineLink.textContent = "Open the current version online";
        offlineNotice.appendChild(onlineLink);
        cloneDownloadBtn.parentNode.replaceChild(
          offlineNotice,
          cloneDownloadBtn,
        );
      }

      var htmlContent = "<!DOCTYPE html>\n" + clone.outerHTML;
      var blob = new Blob([htmlContent], { type: "text/html" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "The_Vanadzor_Index-v" + VANADZOR_VERSION + ".html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (err) {
      alert(
        'Download failed. You can use your browser\'s "Save Page As" option instead.',
      );
    }
  });
})();
