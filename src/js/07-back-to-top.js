/* Back-to-top button: shown only once the sticky controls bar has run
   out of container and scrolled away. .to-top-sentinel sits on that
   container's bottom edge, so "sentinel is above the viewport" and "bar
   is gone" are the same moment. The button is .js-only and starts
   hidden, so a browser without script simply never gets it. */
(function () {
  var btn = document.querySelector(".to-top");
  var sentinel = document.querySelector(".to-top-sentinel");
  if (!btn || !sentinel) return;

  function show(on) {
    btn.classList[on ? "add" : "remove"]("to-top-shown");
  }

  if (!window.IntersectionObserver) {
    show(true); // no observer: better always available than never
    return;
  }

  new IntersectionObserver(
    function (entries) {
      var e = entries[entries.length - 1];
      show(!e.isIntersecting && e.boundingClientRect.top < 0);
    },
    { threshold: 0 }
  ).observe(sentinel);
})();
