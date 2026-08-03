function scrollToWithBarOffset(el) {
  if (!el) return;
  var bar = document.querySelector(".controls");
  var barHeight = bar ? bar.getBoundingClientRect().height : 90;
  var rect = el.getBoundingClientRect();
  var targetY =
    rect.top +
    (window.pageYOffset || document.documentElement.scrollTop) -
    barHeight -
    20;
  if (targetY < 0) targetY = 0;
  if (window.scrollTo) {
    try {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    } catch (err) {
      window.scrollTo(0, targetY);
    }
  }
}

document
  .getElementById("chipRow")
  .addEventListener("click", function (e) {
    var chip = e.target.closest ? e.target.closest(".chip") : null;
    if (!chip) {
      var el = e.target;
      while (el && el.className && el.className.indexOf("chip") === -1) {
        el = el.parentElement;
      }
      chip = el;
    }
    if (!chip) return;

    if (e.preventDefault) e.preventDefault();

    var chips = document.querySelectorAll(".chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].className = chips[i].className.replace(/\bactive\b/g, "");
    }
    chip.className = chip.className + " active";

    activeCat = chip.getAttribute("data-cat");
    applyFilters();

    if (activeCat !== "all") {
      var target = document.querySelector(
        'section.category[data-cat="' + activeCat + '"]',
      );
      scrollToWithBarOffset(target);
    } else {
      var topEl = document.getElementById("top");
      scrollToWithBarOffset(topEl);
    }
  });

(function () {
  var row = document.getElementById("chipRow");
  var wrap = document.querySelector(".chip-scroll-wrap");
  var leftBtn = document.querySelector(".chip-arrow-left");
  var rightBtn = document.querySelector(".chip-arrow-right");
  if (!row || !wrap || !leftBtn || !rightBtn) return;

  function updateArrows() {
    var maxScroll = row.scrollWidth - row.clientWidth;
    var atStart = row.scrollLeft <= 2;
    var atEnd = maxScroll <= 2 || row.scrollLeft >= maxScroll - 2;

    if (atStart) {
      leftBtn.className = "chip-arrow chip-arrow-left disabled";
    } else {
      leftBtn.className = "chip-arrow chip-arrow-left";
    }
    if (atEnd) {
      rightBtn.className = "chip-arrow chip-arrow-right disabled";
    } else {
      rightBtn.className = "chip-arrow chip-arrow-right";
    }

    var leftStop = atStart ? "black 0" : "transparent 0, black 64px";
    var rightStop = atEnd
      ? "black 100%"
      : "black calc(100% - 64px), transparent 100%";
    var mask =
      "linear-gradient(to right, " + leftStop + ", " + rightStop + ")";
    row.style.maskImage = mask;
    row.style.webkitMaskImage = mask;
  }

  function scrollByAmount(delta) {
    if (row.scrollBy) {
      try {
        row.scrollBy({ left: delta, behavior: "smooth" });
      } catch (err) {
        row.scrollLeft += delta;
      }
    } else {
      row.scrollLeft += delta;
    }
  }

  leftBtn.addEventListener("click", function () {
    scrollByAmount(-160);
  });
  rightBtn.addEventListener("click", function () {
    scrollByAmount(160);
  });
  row.addEventListener("scroll", updateArrows);
  window.addEventListener("resize", updateArrows);
  updateArrows();

  // Vertical mouse-wheel scrolls the strip horizontally.
  // Bound to the full-height wrapper so hovering anywhere in the bar's
  // vertical band over this horizontal segment redirects the wheel,
  // not just when hovering exactly over a chip pill.
  wrap.addEventListener(
    "wheel",
    function (e) {
      var maxScroll = row.scrollWidth - row.clientWidth;
      if (maxScroll <= 0) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      var atStart = row.scrollLeft <= 0 && e.deltaY < 0;
      var atEnd = row.scrollLeft >= maxScroll && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      row.scrollLeft += e.deltaY;
    },
    { passive: false },
  );

  // Click-and-drag panning with the mouse, same full-height hit area.
  var isDown = false;
  var dragged = false;
  var startX = 0;
  var startScrollLeft = 0;

  wrap.addEventListener("mousedown", function (e) {
    isDown = true;
    dragged = false;
    startX = e.pageX;
    startScrollLeft = row.scrollLeft;
    wrap.className = wrap.className + " dragging";
  });

  window.addEventListener("mousemove", function (e) {
    if (!isDown) return;
    var dx = e.pageX - startX;
    if (Math.abs(dx) > 3) {
      dragged = true;
    }
    row.scrollLeft = startScrollLeft - dx;
  });

  function endDrag() {
    if (isDown) {
      isDown = false;
      wrap.className = wrap.className.replace(/\bdragging\b/g, "");
    }
  }
  window.addEventListener("mouseup", endDrag);
  wrap.addEventListener("mouseleave", endDrag);
  row.addEventListener("dragstart", function (e) {
    e.preventDefault();
  });

  if (wrap) {
    wrap.addEventListener(
      "click",
      function (e) {
        if (dragged) {
          e.preventDefault();
          e.stopPropagation();
          dragged = false;
        }
      },
      true,
    );
  }
})();
