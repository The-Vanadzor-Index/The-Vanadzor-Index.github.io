/* Masonry packing. CSS Grid stretches every card in a row to the tallest
   one, which leaves short entries looking padded out next to a card with
   notes and four phone numbers. The base grid already turns that off
   (.card-grid { align-items: start }), but that only trades stretching
   for dead space under the short cards, since a row can't start until
   the previous one ends.

   The fix: give the grid a 1px row ruler and let each card span as many
   of those rows as it is tall (plus the gap). Grid auto-placement then
   drops each card into the first free slot scanning left to right, so a
   tall card no longer holds up its neighbours and two short cards can
   sit beside one long one. Document order is preserved.

   Requires ResizeObserver — without it the grid stays top-aligned but
   unpacked, which is also exactly what a browser with no JS at all
   gets. Nothing here is load-bearing for reading the directory. */
(function () {
  var grids = document.querySelectorAll(".card-grid");
  if (!grids.length || !window.ResizeObserver) return;

  var pending = false;

  function relayout() {
    pending = false;
    for (var g = 0; g < grids.length; g++) {
      var grid = grids[g];
      var cards = grid.children;
      if (!cards.length) continue;

      // Gap is only zeroed on the row axis in masonry mode, so the
      // column gap still reports the spacing cards should keep.
      var gap = parseFloat(getComputedStyle(grid).columnGap) || 0;

      // Measure everything before writing anything, so the loop doesn't
      // invalidate layout on each card and force a reflow per card.
      var spans = [];
      for (var i = 0; i < cards.length; i++) {
        var h = cards[i].getBoundingClientRect().height;
        // A hidden card measures 0 and is out of flow; drop its span so
        // it doesn't come back with a stale one when it reappears.
        spans.push(h ? "span " + Math.ceil(h + gap) : "");
      }
      for (var j = 0; j < cards.length; j++) {
        cards[j].style.gridRowEnd = spans[j];
      }
      grid.classList.add("masonry");
    }
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(relayout);
  }

  // One observer over every card covers all of it: viewport resizes
  // (cards get narrower and reflow), filtering and the personal-contacts
  // toggle (cards drop to zero height), and text reflow after fonts
  // settle. A card's own height never depends on the span it is given
  // — align-items: start keeps it at content height — so writing spans
  // can't feed back into another resize.
  var ro = new ResizeObserver(schedule);
  var cards = document.querySelectorAll(".card");
  for (var c = 0; c < cards.length; c++) {
    ro.observe(cards[c]);
  }

  window.addEventListener("resize", schedule);
  schedule();
})();
