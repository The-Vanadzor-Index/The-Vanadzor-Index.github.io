(function () {
  var title = document.getElementById("mastheadTitle");
  if (!title) return;

  function updateTitleLayout() {
    title.classList.remove("stack-3");
    var prevWhiteSpace = title.style.whiteSpace;
    title.style.whiteSpace = "nowrap";
    var fits = title.scrollWidth <= title.clientWidth + 1;
    title.style.whiteSpace = prevWhiteSpace;
    if (!fits) {
      title.classList.add("stack-3");
    }
  }

  updateTitleLayout();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateTitleLayout).catch(function () {});
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateTitleLayout, 100);
  });
})();
