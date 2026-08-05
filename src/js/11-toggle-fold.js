/* On a narrow viewport the "Hide individuals" toggle drops to its own line
   below the search box (.search-row's flex-wrap, no fixed breakpoint) —
   see the CSS comment on .personal-toggle-wrap.toggle-folded. Once it has
   a line to itself, it also has a line to give back: this folds it away
   as soon as the reader scrolls past the top of the directory and brings
   it back once they scroll back up to it, same sentinel technique as
   07-back-to-top.js. Wrapped state is measured, not assumed, since it
   depends on content width rather than viewport width. */
(function () {
  var wrap = document.querySelector(".personal-toggle-wrap");
  var searchWrap = document.querySelector(".search-wrap");
  var sentinel = document.querySelector(".toggle-top-sentinel");
  if (!wrap || !searchWrap || !sentinel || !window.IntersectionObserver) {
    return;
  }

  var atTop = true;
  var wrapped = false;

  function update() {
    wrap.classList.toggle("toggle-folded", wrapped && !atTop);
  }

  function checkWrapped() {
    var wasFolded = wrap.classList.contains("toggle-folded");
    if (wasFolded) wrap.classList.remove("toggle-folded");
    // On the same line the two sit close in top offset (align-items:center
    // just staggers them a couple px for their differing heights); wrapped
    // to its own line, the toggle's top lands at or past the search box's
    // bottom edge.
    wrapped =
      wrap.getBoundingClientRect().top >=
      searchWrap.getBoundingClientRect().bottom - 2;
    if (wasFolded) wrap.classList.add("toggle-folded");
    update();
  }

  checkWrapped();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(checkWrapped).catch(function () {});
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(checkWrapped, 100);
  });

  // Hysteresis, not a single line: the sentinel has real height (see its
  // CSS), and only its fully-in (ratio 1) and fully-out (ratio 0) ends
  // flip the state. Scroll positions inside that band change nothing, so
  // the couple of px of elastic overscroll bounce at the very top of the
  // page can't make the toggle flicker in and out.
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
