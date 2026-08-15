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

  // Below the wrap point, .toggle-row is no longer sized by its own
  // content: fitToggleRow (below) gives it an explicit pixel height so
  // .toggle-row-inner has something stable to scale against. That height
  // used to stay fixed at the pills' *open* size forever, so folding the
  // pills away (max-height:0 on each, see .toggle-pill.toggle-folded)
  // left .toggle-row still standing that tall and the search bar no
  // shorter for it. applyRowHeight is what keeps the two in sync: it
  // collapses .toggle-row to 0 right along with the pills and restores
  // the stored open height when they return, riding the same height
  // transition .toggle-row already declares in CSS. Below the wrap point
  // (unscaled), .toggle-row was never given an explicit height at all —
  // its auto height already tracks the folded pills on its own.
  function applyRowHeight() {
    if (!toggleRow) return;
    if (toggleRow._openHeight == null) {
      toggleRow.style.height = "";
      return;
    }
    var folded = wraps.length > 0 && wraps[0]._wrapped && !atTop;
    toggleRow.style.height = folded ? "0px" : toggleRow._openHeight + "px";
  }

  function update() {
    for (var i = 0; i < wraps.length; i++) {
      wraps[i].classList.toggle(
        "toggle-folded",
        wraps[i]._wrapped && !atTop,
      );
    }
    applyRowHeight();
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
  // No reset-then-remeasure step needed for the scale itself — but
  // .toggle-folded is a real layout change (max-height/padding collapse
  // to 0, not a transform), so measuring while folded — e.g. a resize
  // that lands while the reader has scrolled away from the top — would
  // read the collapsed size as "natural" and store a near-zero
  // _openHeight. That height then survives the fold: the pills return to
  // full size on scroll-back, but sit inside a row still pinned to
  // ~0px tall, so overflow:hidden on .toggle-row clips them on every
  // side. Same strip-measure-restore as checkWrapped, for the same
  // reason.
  function fitToggleRow() {
    if (!toggleRow || !toggleRowInner) return;
    // Unlike checkWrapped's own strip-measure-restore (position only, and
    // unaffected by the pills' own height), a size read here would
    // otherwise animate: .toggle-pill's *base* rule carries the same
    // transition list as .toggle-folded, so simply removing the class
    // starts a transition back toward full size rather than jumping
    // there, and offsetHeight is forced mid-transition — read at ~0, one
    // paint frame in. transition:none is what makes the swap instant
    // instead of the first frame of an animation.
    var folded = [];
    for (var i = 0; i < wraps.length; i++) {
      if (wraps[i].classList.contains("toggle-folded")) {
        folded.push(wraps[i]);
        wraps[i].style.transition = "none";
        wraps[i].classList.remove("toggle-folded");
      }
    }
    var naturalW = toggleRowInner.offsetWidth;
    var availW = toggleRow.clientWidth;
    var naturalH = toggleRowInner.offsetHeight;
    for (var j = 0; j < folded.length; j++) {
      folded[j].classList.add("toggle-folded");
      folded[j].style.transition = "";
    }
    if (!naturalW || !availW || naturalW <= availW) {
      toggleRowInner.style.transform = "";
      toggleRow._openHeight = null;
      toggleRow.classList.remove("toggle-row-scaled");
      applyRowHeight();
      return;
    }
    var scale = availW / naturalW;
    toggleRowInner.style.transform = "scale(" + scale + ")";
    toggleRow._openHeight = Math.ceil(naturalH * scale);
    // See the CSS comment on .toggle-row-scaled — centering would still
    // centre the pre-transform width and hang half the overflow off the
    // left, past where overflow:hidden can catch it.
    toggleRow.classList.add("toggle-row-scaled");
    applyRowHeight();
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
