/* On a narrow viewport the toggle-pill group (personal contacts,
   favorites, visited — grouped in .toggle-row-inner so they wrap
   together, never pill-from-pill) drops to its own line below the
   search box (.search-row's flex-wrap, no fixed breakpoint) — see the
   CSS comment on .toggle-pill.toggle-folded. Once the group has a line
   to itself, it also has a line to give back: this folds it away as
   soon as the reader scrolls past the top of the directory and brings
   it back once they scroll back up to it, same sentinel technique as
   07-back-to-top.js.

   The same narrow-viewport trigger also covers a second problem: a
   phone too narrow even for the group alone on its own line. Rather
   than let it wrap pill-by-pill (defeating the grouping above) or
   scroll out of sight, fitToggleRow scales .toggle-row-inner down by
   whatever factor makes it exactly as wide as .toggle-row, its
   (CSS-clamped) container — see the CSS comments on .toggle-row and
   .toggle-row-inner for why that container's width is reliable to
   measure against even though its child is wider. */
(function () {
  var wraps = document.querySelectorAll(".toggle-pill");
  var searchWrap = document.querySelector(".search-wrap");
  var sentinel = document.querySelector(".toggle-top-sentinel");
  var toggleRow = document.querySelector(".toggle-row");
  var toggleRowInner = document.querySelector(".toggle-row-inner");
  if (!wraps.length || !searchWrap || !sentinel || !window.IntersectionObserver) {
    return;
  }

  var atTop = true;

  function update() {
    for (var i = 0; i < wraps.length; i++) {
      wraps[i].classList.toggle(
        "toggle-folded",
        wraps[i]._wrapped && !atTop,
      );
    }
  }

  function checkWrapped() {
    for (var i = 0; i < wraps.length; i++) {
      var wrap = wraps[i];
      var wasFolded = wrap.classList.contains("toggle-folded");
      if (wasFolded) wrap.classList.remove("toggle-folded");
      // On the same line the pills sit close in top offset (align-items:
      // center just staggers them a couple px for their differing
      // heights); wrapped to its own line, a pill's top lands at or past
      // the search box's bottom edge.
      wrap._wrapped =
        wrap.getBoundingClientRect().top >=
        searchWrap.getBoundingClientRect().bottom - 2;
      if (wasFolded) wrap.classList.add("toggle-folded");
    }
    update();
  }

  // offsetWidth/offsetHeight are the element's own layout box, unlike
  // getBoundingClientRect — they ignore the element's own transform (an
  // ancestor's would still count, but neither element here has one from
  // outside this function), so this reads the *pre-scale* size even
  // after a previous call has already scaled .toggle-row-inner down.
  // No reset-then-remeasure step needed.
  function fitToggleRow() {
    if (!toggleRow || !toggleRowInner) return;
    var naturalW = toggleRowInner.offsetWidth;
    var availW = toggleRow.clientWidth;
    if (!naturalW || !availW || naturalW <= availW) {
      toggleRowInner.style.transform = "";
      toggleRow.style.height = "";
      toggleRow.classList.remove("toggle-row-scaled");
      return;
    }
    var naturalH = toggleRowInner.offsetHeight;
    var scale = availW / naturalW;
    toggleRowInner.style.transform = "scale(" + scale + ")";
    toggleRow.style.height = Math.ceil(naturalH * scale) + "px";
    // See the CSS comment on .toggle-row-scaled — centering would still
    // centre the pre-transform width and hang half the overflow off the
    // left, past where overflow:hidden can catch it.
    toggleRow.classList.add("toggle-row-scaled");
  }

  checkWrapped();
  fitToggleRow();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      checkWrapped();
      fitToggleRow();
    }).catch(function () {});
  }

  // rAF-throttled rather than debounced: a debounce only recomputes
  // once the reader stops resizing, which combined with the CSS
  // transition above (transform/height) reads as one long stall
  // followed by a sudden jump. This instead recomputes on every frame
  // a resize is still happening, so the transition has something fresh
  // to ease toward throughout the drag rather than only at the end.
  var resizePending = false;
  window.addEventListener("resize", function () {
    if (resizePending) return;
    resizePending = true;
    requestAnimationFrame(function () {
      resizePending = false;
      checkWrapped();
      fitToggleRow();
    });
  });

  // Hysteresis, not a single line: the sentinel has real height (see its
  // CSS), and only its fully-in (ratio 1) and fully-out (ratio 0) ends
  // flip the state. Scroll positions inside that band change nothing, so
  // the couple of px of elastic overscroll bounce at the very top of the
  // page can't make the toggles flicker in and out.
  new IntersectionObserver(
    function (entries) {
      var ratio = entries[entries.length - 1].intersectionRatio;
      if (ratio >= 1) atTop = true;
      else if (ratio <= 0) atTop = false;
      update();
    },
    { threshold: [0, 1] },
  ).observe(sentinel);
})();
