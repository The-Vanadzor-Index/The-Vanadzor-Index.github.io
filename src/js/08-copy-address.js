/* Tap-to-copy on address rows. An address is the one field on a card
   that can't be acted on the way a phone number or a map link can — it
   has to be carried into a maps app or a message — and on a phone that
   means fighting the text-selection handles. Tapping the row copies it.

   Rows are found by their ⌂ glyph rather than by something written into
   the markup, so a new card needs no attribute to opt in. Each match is
   then tagged .addr-copy, which is what carries the hover affordance in
   the stylesheet — writing the tag from here rather than into the HTML
   keeps the cursor and the highlight honest, since they can only show
   up once the script that makes them mean something has run. Without
   JS the addresses stay what they always were, plain selectable text. */
(function () {
  var ADDRESS_GLYPH = "⌂";
  var toast = null;
  var toastTimer = null;

  function showToast(msg) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "copy-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("copy-toast-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("copy-toast-shown");
    }, 1600);
  }

  // Everything in the row except the glyph, whitespace collapsed — the
  // address spans are indented across lines in the source.
  function addressText(row) {
    var out = "";
    var kids = row.children;
    for (var i = 0; i < kids.length; i++) {
      if (String(kids[i].className).indexOf("glyph") !== -1) continue;
      out += kids[i].textContent;
    }
    return out.replace(/\s+/g, " ").replace(/^\s|\s$/g, "");
  }

  // Offline snapshots open from file://, where Safari in particular
  // withholds the async clipboard, so keep the old textarea route as a
  // fallback rather than leaving the saved copy without the feature.
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

  function report(ok) {
    showToast(ok ? "Address copied" : "Press and hold to copy");
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          report(true);
        },
        function () {
          report(legacyCopy(text));
        },
      );
      return;
    }
    report(legacyCopy(text));
  }

  var rows = document.querySelectorAll(".card-row");
  for (var i = 0; i < rows.length; i++) {
    var glyph = rows[i].querySelector(".glyph");
    if (glyph && glyph.textContent.replace(/\s+/g, "") === ADDRESS_GLYPH) {
      rows[i].classList.add("addr-copy");
    }
  }

  document.addEventListener("click", function (e) {
    var target = e.target;
    if (!target || !target.closest) return;
    var row = target.closest(".addr-copy");
    if (!row) return;
    // A row could grow a link later; leave anything clickable alone.
    if (target.closest("a, button")) return;
    // Selecting the address by hand ends in a click too. Copying then
    // would fight the user for the clipboard they were already after.
    var sel = window.getSelection();
    if (sel && String(sel)) return;
    var text = addressText(row);
    if (!text) return;
    copy(text);
  });
})();
