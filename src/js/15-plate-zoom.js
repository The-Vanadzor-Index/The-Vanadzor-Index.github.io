/* Zooming the district plate.

   The plate is a drawing about 1090 units wide dropped into a column that is
   350px across on a phone, so at rest a district is a few millimetres of ink
   and its name is unreadable. The CSS gives that a floor with no script at
   all — .plate-view scrolls and the drawing is laid out at 240% of it — and
   this is the rest: the box stops scrolling, and pinch, drag, double-tap and
   the three buttons move the SVG's own viewBox instead.

   The viewBox is the whole reason to do it this way rather than by
   transforming or scaling a picture. Every stroke on the plate is already
   vector-effect: non-scaling-stroke, so a hairline stays a hairline at 6x
   instead of turning into a 6px band, and text stays text. The two things
   that must NOT grow — the district flags and the north arrow — divide
   themselves back down by --mp-zoom, which is written here and read in the
   stylesheet. */
(function () {
  var view = document.getElementById("plateView");
  var svg = document.getElementById("plateSvg");
  var box = document.getElementById("plateZoom");
  var plate = view && view.closest ? view.closest(".map-plate") : null;
  if (!view || !svg || !box || !plate) return;

  var btnOut = document.getElementById("plateZoomOut");
  var btnIn = document.getElementById("plateZoomIn");
  var btnFit = document.getElementById("plateZoomReset");

  // The viewBox the plate is drawn in, and the frame at rest.
  var BASE_X = -46;
  var BASE_Y = -46;
  var BASE_W = 1092;
  var BASE_H = 787;

  var MIN = 1;
  var MAX = 6;
  var STEP = 1.7; // one press of + or one double-tap

  var zoom = 1;
  var cx = BASE_X + BASE_W / 2;
  var cy = BASE_Y + BASE_H / 2;

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /* Centre the frame, then hold it inside the drawing. Once the frame is as
     wide as the drawing there is nothing left to pan to, so the centre is
     pinned rather than clamped to a range that has gone backwards. */
  function settle() {
    var w = BASE_W / zoom;
    var h = BASE_H / zoom;
    cx = w >= BASE_W ? BASE_X + BASE_W / 2 : clamp(cx, BASE_X + w / 2, BASE_X + BASE_W - w / 2);
    cy = h >= BASE_H ? BASE_Y + BASE_H / 2 : clamp(cy, BASE_Y + h / 2, BASE_Y + BASE_H - h / 2);
  }

  function apply() {
    settle();
    var w = BASE_W / zoom;
    var h = BASE_H / zoom;
    svg.setAttribute(
      "viewBox",
      (cx - w / 2).toFixed(2) +
        " " +
        (cy - h / 2).toFixed(2) +
        " " +
        w.toFixed(2) +
        " " +
        h.toFixed(2)
    );
    // What the flags and the north arrow divide themselves down by.
    plate.style.setProperty("--mp-zoom", String(zoom));
    // At rest the box hands one-finger vertical panning back to the page, so
    // a reader scrolling the article past a full-height map is never caught
    // on it. Zoomed in, that finger is needed here instead.
    view.classList.toggle("is-zoomed", zoom > MIN + 0.001);
    if (btnOut) btnOut.disabled = zoom <= MIN + 0.001;
    if (btnIn) btnIn.disabled = zoom >= MAX - 0.001;
    if (btnFit) btnFit.disabled = zoom <= MIN + 0.001;
  }

  // Drawing units per screen pixel, at the current frame.
  function unit() {
    var r = view.getBoundingClientRect();
    return r.width ? BASE_W / zoom / r.width : 0;
  }

  // Where a client point lands in the drawing.
  function at(clientX, clientY) {
    var r = view.getBoundingClientRect();
    var w = BASE_W / zoom;
    var h = BASE_H / zoom;
    return {
      x: cx - w / 2 + (r.width ? ((clientX - r.left) / r.width) * w : 0),
      y: cy - h / 2 + (r.height ? ((clientY - r.top) / r.height) * h : 0)
    };
  }

  /* Zoom so that whatever sits under (clientX, clientY) stays under it. With
     no point given — the buttons — the centre of the frame is held instead. */
  function zoomTo(next, clientX, clientY) {
    next = clamp(next, MIN, MAX);
    if (next === zoom) return;
    if (clientX == null) {
      zoom = next;
      apply();
      return;
    }
    var p = at(clientX, clientY);
    var r = view.getBoundingClientRect();
    var fx = r.width ? (clientX - r.left) / r.width : 0.5;
    var fy = r.height ? (clientY - r.top) / r.height : 0.5;
    zoom = next;
    var w = BASE_W / zoom;
    var h = BASE_H / zoom;
    cx = p.x - (fx - 0.5) * w;
    cy = p.y - (fy - 0.5) * h;
    apply();
  }

  // ---- pointers ---------------------------------------------------------
  // One live map of everything touching the box. One entry pans (but only
  // once there is something to pan), two pinch; the pinch reads both the
  // distance between them and where their midpoint went, so a two-finger
  // gesture zooms and drags at once the way a map is expected to.
  var down = {};
  var count = 0;
  var pinchDist = 0;
  var pinchMid = null;
  var last = null;
  var moved = false;

  function pair() {
    var out = [];
    for (var id in down) {
      if (Object.prototype.hasOwnProperty.call(down, id)) out.push(down[id]);
    }
    return out;
  }

  function spread(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  view.addEventListener("pointerdown", function (e) {
    // Leave the buttons alone — they are inside the box.
    if (e.target.closest && e.target.closest(".plate-zoom")) return;
    down[e.pointerId] = { x: e.clientX, y: e.clientY };
    count++;
    moved = false;
    if (count === 1) {
      last = { x: e.clientX, y: e.clientY };
    } else if (count === 2) {
      var p = pair();
      pinchDist = spread(p[0], p[1]);
      pinchMid = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
    }
    // Only take the pointer once the gesture is actually ours, or a single
    // finger at rest would stop being the page's to scroll with.
    if (count > 1 || zoom > MIN + 0.001) {
      if (view.setPointerCapture) {
        try {
          view.setPointerCapture(e.pointerId);
        } catch (err) {
          /* a pointer that has already gone */
        }
      }
      view.classList.add("is-dragging");
    }
  });

  view.addEventListener("pointermove", function (e) {
    if (!down[e.pointerId]) return;
    down[e.pointerId] = { x: e.clientX, y: e.clientY };

    if (count >= 2) {
      var p = pair();
      var dist = spread(p[0], p[1]);
      var mid = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
      if (pinchDist > 0 && dist > 0) {
        // Zoom about the midpoint, then carry the midpoint's own travel, so
        // the map follows two fingers that pinch and slide together.
        var before = at(mid.x, mid.y);
        zoom = clamp(zoom * (dist / pinchDist), MIN, MAX);
        settle();
        var after = at(mid.x, mid.y);
        cx += before.x - after.x;
        cy += before.y - after.y;
        if (pinchMid) {
          var u = unit();
          cx -= (mid.x - pinchMid.x) * u;
          cy -= (mid.y - pinchMid.y) * u;
        }
        apply();
      }
      pinchDist = dist;
      pinchMid = mid;
      moved = true;
      e.preventDefault();
      return;
    }

    if (count === 1 && zoom > MIN + 0.001 && last) {
      var u2 = unit();
      cx -= (e.clientX - last.x) * u2;
      cy -= (e.clientY - last.y) * u2;
      last = { x: e.clientX, y: e.clientY };
      moved = true;
      apply();
      e.preventDefault();
    }
  });

  function lift(e) {
    if (!down[e.pointerId]) return;
    delete down[e.pointerId];
    count = Math.max(0, count - 1);
    if (count < 2) {
      pinchDist = 0;
      pinchMid = null;
    }
    if (count === 1) {
      var p = pair();
      last = { x: p[0].x, y: p[0].y };
    }
    if (count === 0) {
      last = null;
      view.classList.remove("is-dragging");
    }
  }
  view.addEventListener("pointerup", lift);
  view.addEventListener("pointercancel", lift);

  /* A trackpad pinch arrives as a wheel with ctrlKey set. A plain wheel is
     the page's — hijacking it would trap a scroll over a tall figure exactly
     the way a one-finger drag would. */
  view.addEventListener(
    "wheel",
    function (e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomTo(zoom * Math.exp(-e.deltaY / 180), e.clientX, e.clientY);
    },
    { passive: false }
  );

  // Double-tap and double-click step in, and step back out from the top so
  // the gesture always has somewhere to go.
  view.addEventListener("dblclick", function (e) {
    if (e.target.closest && e.target.closest(".plate-zoom")) return;
    if (zoom >= MAX - 0.001) {
      zoom = MIN;
      apply();
    } else {
      zoomTo(zoom * STEP, e.clientX, e.clientY);
    }
  });

  if (btnIn) {
    btnIn.addEventListener("click", function () {
      zoomTo(zoom * STEP);
    });
  }
  if (btnOut) {
    btnOut.addEventListener("click", function () {
      zoomTo(zoom / STEP);
    });
  }
  if (btnFit) {
    btnFit.addEventListener("click", function () {
      zoom = MIN;
      apply();
    });
  }

  /* Tabbing through the districts has to keep working when the frame no
     longer holds all of them: .focus() on a district off the left of a
     zoomed frame would reveal a flag nobody can see. Bring whatever takes
     focus into the frame, and only if it is not already there, so tabbing
     across one screenful does not jerk about. */
  svg.addEventListener("focusin", function (e) {
    var g = e.target.closest ? e.target.closest(".mp-dist") : null;
    if (!g || zoom <= MIN + 0.001) return;
    var b;
    try {
      b = g.getBBox();
    } catch (err) {
      return;
    }
    var w = BASE_W / zoom;
    var h = BASE_H / zoom;
    var mx = b.x + b.width / 2;
    var my = b.y + b.height / 2;
    var pad = 0.18; // keep it off the very edge of the frame
    if (
      mx < cx - w * (0.5 - pad) ||
      mx > cx + w * (0.5 - pad) ||
      my < cy - h * (0.5 - pad) ||
      my > cy + h * (0.5 - pad)
    ) {
      cx = mx;
      cy = my;
      apply();
    }
  });

  apply();
})();
