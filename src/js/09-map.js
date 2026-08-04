/* Map previews. Following a map link means leaving the index and then
   finding your way back to the entry you were reading, which is a lot
   to charge for a glance at where a place is. These open a map in a
   panel over the page instead.

   The map is drawn here rather than framed from somewhere else, and
   that is the whole reason the panel can speak for what is on screen.
   A framed map is another origin, sealed behind the same rules that
   keep any other site out: it never says where the reader has looked
   or what they have picked, and there is no asking it. Drawn here,
   every tap is this page's own event. What it costs is the couple of
   hundred lines below, and what it buys back is that the only thing
   fetched from anywhere else is images — tiles, which carry no
   scripts, set no cookies and cannot read this page.

   So a reader can pick a point anywhere on the map and the panel
   follows: the title becomes whatever is there, and both ways out
   lead to that spot rather than to the entry. Clearing the point
   takes the title and both buttons with it, since with nothing picked
   there is nothing for them to describe. The entry's own pin stays
   behind, dimmed, and picks up again on a tap.

   Naming a picked point takes a lookup — a tile is a picture, and the
   labels on it are painted into the pixels rather than sitting on
   anything a click can land on. Nominatim, OpenStreetMap's own
   geocoder, answers that: one request per point picked and none at
   any other time, spaced by the one-a-second its terms ask for. Until
   it answers, and if it never does, the point is named by its
   coordinates — which is all either button needed anyway.

   The two ways out are deliberately unequal. Yandex is the map every
   address here was checked against and by some way the best-surveyed
   one for Vanadzor, so it is the filled button — and because Android
   and iOS both let an app claim its own site's links, that button
   opens the Yandex Maps app itself for anyone who has it, with no way
   for a web page to know either way beforehand. Every other map gets
   a bare pin, which is worth saying before the handoff rather than
   after: that link asks first. Neither can lead anywhere but out, so
   nothing here has to work without JS — without it the card's link
   stays the plain outbound link it has always been.

   Drawing from coordinates also settles which cards get a preview:
   the ones carrying data-geo, which is all but one of the cards with
   a map link. The exception is a Google short link that serves no
   coordinates to a fetch, and it stays outbound. The Yandex /geo/
   link, which the old framed version had to refuse because the widget
   resolved it to the wrong country, previews like any other now. */
(function () {
  // A saved snapshot has no network to fetch tiles from; there the
  // links stay outbound and this feature never turns on.
  if (
    document.documentElement.getAttribute("data-offline-snapshot") === "1"
  )
    return;

  var TILE = 256;
  var TILE_URL = "https://tile.openstreetmap.org/";
  var GEOCODER = "https://nominatim.openstreetmap.org/reverse";
  // Nominatim's terms put an absolute ceiling of one request a second
  // on this kind of use. A reader would have to tap very deliberately
  // to come near it, but the spacing is enforced rather than assumed.
  var GEOCODE_GAP = 1100;
  var MIN_ZOOM = 5;
  var MAX_ZOOM = 19;
  // The block-and-street-name view a reader opening a map is after.
  // Zooming out to the province is a couple of taps away.
  var START_ZOOM = 17;
  // What "all of Vanadzor" means when the map is opened from the
  // plate rather than from an entry: a box around the built-up city,
  // wide enough to hold the valley the town runs along and 176 of the
  // 184 entries that carry coordinates. The zoom is not fixed — it is
  // the deepest one that still fits this box in whatever screen the
  // panel ends up with, so a phone gets the city and a desktop gets
  // the city with room around it.
  var CITY = {
    lat: 40.805,
    lon: 44.5,
    south: 40.78,
    north: 40.83,
    west: 44.44,
    east: 44.56,
  };
  var CITY_MIN_ZOOM = 11;
  // The current level plus the two most recently left. A screenful of
  // decoded tiles is a few megabytes, so this is a balance between
  // never refetching and not holding a phone's memory for a map
  // nobody is looking at any more.
  var LAYER_KEEP = 3;
  // A little wider than the widest marker, so nothing drawn can
  // overlap anything else drawn.
  var CLUSTER_CELL = 52;
  // How wide a marker is drawn, halved, and the same for the larger
  // one the head is describing. Kept beside the stylesheet's sizes,
  // since both the gathering and the setting-out below have to know
  // how much room a marker takes before either draws it.
  var SPOT_R = 12;
  var SPOT_ON_R = 17;
  // The clear air left between two markers set beside each other, so
  // they read as two rather than as one shape with a notch in it.
  var SPREAD_GAP = 5;
  // A ceiling on the passes that push them apart, so no arrangement
  // of coordinates can spin. A screenful settles in two or three.
  var SPREAD_PASSES = 40;
  // Roughly a block's worth of error. Past that the reading says
  // little more than which end of town, and the ring says so.
  var GEO_OPTS = {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 30000,
  };
  var LOADING = "Loading map…";
  var FAILED = "The map didn't load. Use the link above to open it.";
  var FAILED_BARE = "The map didn't load.";
  var WARM_HOSTS = ["https://tile.openstreetmap.org"];
  var warmed = false;
  // Same glyph the copy script looks for, read the same way. Finding
  // the address row by its own mark rather than by the tag that
  // script writes keeps the two features from depending on each
  // other's runtime state.
  var ADDRESS_GLYPH = "⌂";
  var IS_ANDROID = /android/i.test(navigator.userAgent);
  var IS_IOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var IS_TOUCH = IS_ANDROID || IS_IOS || navigator.maxTouchPoints > 0;

  var overlay = null;
  var panelEl = null;
  var titleWrap = null;
  var titleEl = null;
  var subEl = null;
  var actions = null;
  var yaLink = null;
  var outBtn = null;
  var clearBtn = null;
  var closeBtn = null;
  var mapEl = null;
  var wrapEl = null;
  var pinsEl = null;
  var entryPin = null;
  var pickPin = null;
  var zoomInBtn = null;
  var zoomOutBtn = null;
  var locateBtn = null;
  var meDot = null;
  var meHalo = null;
  var spotsEl = null;
  var popupEl = null;
  var popScroll = null;
  var popTail = null;
  var popClose = null;
  var popActions = null;
  var popYa = null;
  var popOut = null;
  // Which of the two "open in different maps" buttons the question is
  // up for — the head's, or the card's.
  var confirmFrom = null;
  var hintEl = null;
  var note = null;
  var askBox = null;
  var goLink = null;
  var cancelBtn = null;
  var lastFocus = null;
  var waitTimer = null;

  // Where the map is looking: a zoom level, and the world pixel at
  // the centre of the view *at that zoom*. Keeping the centre in
  // pixels rather than in degrees is what makes a drag one
  // subtraction — the conversion to and from latitude and longitude
  // only happens at the edges, where something outside asks.
  var zoom = START_ZOOM;
  var cx = 0;
  var cy = 0;
  var vw = 0;
  var vh = 0;
  var layers = {};
  var sweepTimer = null;
  var seenTile = false;

  // The entry the panel was opened from, the point the reader has
  // picked since, and which of the two the head is currently
  // describing — "entry", "pick", or nothing at all.
  var entry = null;
  var pick = null;
  var sel = null;
  var me = null;
  var spots = null;
  var spotZoom = -1;
  var spotOx = 0;
  var spotOy = 0;
  var spotSel = null;
  var clusterPool = [];
  var popSpot = null;
  // The entry whose card stepped aside for the confirm dialog, kept
  // so it can be stood back up if the reader declines.
  var popHeld = null;
  var popW = 0;
  var popH = 0;
  var isFull = false;
  var hintSeen = false;
  var hintTimer = null;
  var growTimer = null;

  /* ---- Web Mercator ------------------------------------------------
     The projection every tile server in this shape agrees on: the
     world is one square TILE pixels across at zoom 0 and twice that
     at each level after, x running with longitude and y with a log of
     the latitude, which is what keeps a small area's shape true. */
  function pow2(z) {
    return Math.pow(2, z);
  }
  function worldSpan(z) {
    return TILE * pow2(z);
  }
  function lonToX(lon, z) {
    return ((lon + 180) / 360) * worldSpan(z);
  }
  function latToY(lat, z) {
    var s = Math.sin((lat * Math.PI) / 180);
    // The projection runs to infinity at the poles; nothing here is
    // anywhere near them, but the clamp keeps a bad coordinate from
    // turning into a NaN that spreads.
    if (s > 0.9999) s = 0.9999;
    if (s < -0.9999) s = -0.9999;
    return (
      (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * worldSpan(z)
    );
  }
  function xToLon(x, z) {
    return (x / worldSpan(z)) * 360 - 180;
  }
  function yToLat(y, z) {
    var n = Math.PI - (2 * Math.PI * y) / worldSpan(z);
    return (
      (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
    );
  }

  /* ---- The view ---------------------------------------------------- */
  function measure() {
    vw = mapEl.clientWidth;
    vh = mapEl.clientHeight;
    // The card is as wide as the map lets it be and as tall as that
    // makes its text, so it is re-measured with the map rather than
    // only when it opens — a card measured in the window and then
    // grown would place its tail along an edge of the wrong length.
    // Here rather than in render() on purpose: this runs when the map
    // changes size, which a pan does not.
    if (popSpot) {
      popW = popupEl.offsetWidth;
      popH = popupEl.offsetHeight;
    }
  }
  function viewLeft() {
    return cx - vw / 2;
  }
  function viewTop() {
    return cy - vh / 2;
  }
  function centreOn(lat, lon) {
    cx = lonToX(lon, zoom);
    cy = latToY(lat, zoom);
  }
  // A position inside the map element, in degrees.
  function pointAt(px, py) {
    return {
      lat: yToLat(viewTop() + py, zoom),
      lon: xToLon(viewLeft() + px, zoom),
    };
  }
  function localPoint(clientX, clientY) {
    var r = mapEl.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }
  // Zoom about a fixed point: the world under (ax, ay) is where it
  // was, and everything else moves around it. Left to default, that
  // point is the middle of the view.
  function zoomTo(next, ax, ay) {
    if (next < MIN_ZOOM) next = MIN_ZOOM;
    if (next > MAX_ZOOM) next = MAX_ZOOM;
    if (next === zoom) return;
    if (ax === undefined) {
      ax = vw / 2;
      ay = vh / 2;
    }
    // Same rule as a pan: a zoom is the reader working the map rather
    // than glancing at it. It runs before the sums below because
    // growing changes the size they are done against.
    grow();
    var s = pow2(next - zoom);
    var wx = viewLeft() + ax;
    var wy = viewTop() + ay;
    cx = wx * s - ax + vw / 2;
    cy = wy * s - ay + vh / 2;
    zoom = next;
    render();
  }

  /* ---- Tiles -------------------------------------------------------
     Each zoom level gets a layer of its own, holding its tiles at
     that level's world coordinates. Only the current level is ever
     filled; the level before it is left underneath, scaled to line
     up, so a zoom shows the old map stretched rather than a hole
     while the new tiles are on their way. Once they have arrived, or
     once it is clear they aren't going to, the old layer goes. */
  function layerFor(z) {
    if (layers[z]) {
      layers[z].used = Date.now();
      // Whichever level is current has to be the one on top. Layers
      // stack in the order they were made, so returning to a level
      // visited earlier would otherwise leave it buried under the
      // coarser one drawn since.
      if (layers[z].el.nextSibling !== spotsEl) {
        wrapEl.insertBefore(layers[z].el, spotsEl);
      }
      return layers[z];
    }
    var el = document.createElement("div");
    el.className = "mapview-layer";
    // Under the entry dots, which are under the pins: the map, then
    // what is on it, then what is picked out on it.
    wrapEl.insertBefore(el, spotsEl);
    // A layer counts from its own corner rather than from the world's.
    // The world at the deepest zoom is 134 million pixels across, and
    // a transform carrying a number that size has no sub-pixel room
    // left in it — tiles land a fraction out and the seams show. Held
    // against a corner set where the view was when the layer was
    // made, the same transform stays in the hundreds.
    var ox = Math.floor(viewLeft() / TILE) * TILE;
    var oy = Math.floor(viewTop() / TILE) * TILE;
    layers[z] = {
      el: el,
      tiles: {},
      pending: 0,
      z: z,
      ox: ox,
      oy: oy,
      used: Date.now(),
    };
    return layers[z];
  }
  function dropLayer(z) {
    var layer = layers[z];
    if (!layer) return;
    if (layer.el.parentNode) layer.el.parentNode.removeChild(layer.el);
    delete layers[z];
  }
  // Levels the reader has been to are kept, not thrown away. Zooming
  // out used to destroy the level being left, so stepping back in
  // rebuilt every tile from scratch: a fresh <img> for each, a fresh
  // request even when the answer was already in the browser's cache,
  // and a fresh fade from nothing — which is the flash. Held onto,
  // the same tiles are simply shown again, instantly and without a
  // single request.
  //
  // The keep is small and by least-recently-used, since a decoded
  // screenful is some megabytes and a reader working a map can walk
  // through a dozen levels.
  function trimLayers() {
    clearTimeout(sweepTimer);
    var others = [];
    for (var z in layers) {
      if (!layers.hasOwnProperty(z)) continue;
      if (Number(z) !== zoom) others.push(layers[z]);
    }
    others.sort(function (a, b) {
      return b.used - a.used;
    });
    for (var i = 0; i < others.length; i++) {
      if (i < LAYER_KEEP - 1) {
        // Kept, but only the part of it near where the reader is
        // now: the rest is a screenful of somewhere they have
        // panned away from.
        pruneLayer(others[i], 1);
      } else {
        dropLayer(others[i].z);
      }
    }
  }
  // Drop tiles further than `margin` tiles outside the current view.
  // A layer holds its tiles at its own level's scale, so the view is
  // converted into that level before being compared.
  function pruneLayer(layer, margin) {
    var k = pow2(layer.z - zoom);
    var x0 = Math.floor((viewLeft() * k) / TILE) - margin;
    var x1 = Math.floor(((viewLeft() + vw) * k) / TILE) + margin;
    var y0 = Math.floor((viewTop() * k) / TILE) - margin;
    var y1 = Math.floor(((viewTop() + vh) * k) / TILE) + margin;
    for (var key in layer.tiles) {
      if (!layer.tiles.hasOwnProperty(key)) continue;
      var at = key.split(":");
      if (
        Number(at[0]) < x0 ||
        Number(at[0]) > x1 ||
        Number(at[1]) < y0 ||
        Number(at[1]) > y1
      ) {
        var img = layer.tiles[key];
        if (img.parentNode) img.parentNode.removeChild(img);
        delete layer.tiles[key];
      }
    }
  }
  function addTile(layer, tx, ty, wrapX) {
    var img = document.createElement("img");
    img.className = "mapview-tile";
    img.alt = "";
    img.draggable = false;
    img.decoding = "async";
    img.style.left = tx * TILE - layer.ox + "px";
    img.style.top = ty * TILE - layer.oy + "px";
    layer.pending++;
    img.onload = function () {
      img.className = "mapview-tile is-on";
      if (!seenTile) {
        seenTile = true;
        clearTimeout(waitTimer);
        note.style.display = "none";
      }
      tileSettled(layer);
    };
    img.onerror = function () {
      tileSettled(layer);
    };
    img.src = TILE_URL + layer.z + "/" + wrapX + "/" + ty + ".png";
    // Already decoded, from the browser's cache. Marked visible
    // before it is put in the document, so there is no transparent
    // first frame for the transition to run from — the fade is for
    // tiles that actually had to travel.
    if (img.complete && img.naturalWidth) img.className += " is-on";
    layer.el.appendChild(img);
    return img;
  }
  function tileSettled(layer) {
    layer.pending--;
    if (layer.z === zoom && layer.pending <= 0) trimLayers();
  }
  function fillTiles() {
    var layer = layerFor(zoom);
    var count = pow2(zoom);
    var left = viewLeft();
    var top = viewTop();
    var x0 = Math.floor(left / TILE);
    var x1 = Math.floor((left + vw) / TILE);
    var y0 = Math.floor(top / TILE);
    var y1 = Math.floor((top + vh) / TILE);
    var tx, ty, key;
    for (ty = y0; ty <= y1; ty++) {
      // Above the north edge or below the south one there is no map,
      // only the background.
      if (ty < 0 || ty >= count) continue;
      for (tx = x0; tx <= x1; tx++) {
        key = tx + ":" + ty;
        if (layer.tiles[key]) continue;
        // Keyed by where it sits, fetched by which tile it is: pan
        // far enough east and the same tile is asked for again at a
        // new position, which is how the world comes round.
        var wrapX = ((tx % count) + count) % count;
        layer.tiles[key] = addTile(layer, tx, ty, wrapX);
      }
    }
    // A row or column of slack either side, so a small pan doesn't
    // throw away tiles it is about to want back.
    pruneLayer(layer, 1);
  }
  // One style write per layer, and nothing inside one ever moves. A
  // layer holds its tiles at its own zoom's scale and from its own
  // corner, so the corner is carried up to the current zoom and slid
  // under the view; at the current zoom that scale is 1 and the whole
  // thing is a translation of a few hundred pixels.
  function positionLayers() {
    var left = viewLeft();
    var top = viewTop();
    for (var z in layers) {
      if (!layers.hasOwnProperty(z)) continue;
      var layer = layers[z];
      var s = pow2(zoom - Number(z));
      layer.el.style.transform =
        "translate(" +
        (layer.ox * s - left) +
        "px," +
        (layer.oy * s - top) +
        "px) scale(" +
        s +
        ")";
    }
  }
  // The pins are placed straight into the view, which is both simpler
  // than a transform and immune to the same rounding: there are a
  // handful of them and this runs on every frame of a pan anyway.
  function placePin(el, at) {
    if (!at) {
      el.style.display = "none";
      return;
    }
    el.style.display = "";
    el.style.left = lonToX(at.lon, zoom) - viewLeft() + "px";
    el.style.top = latToY(at.lat, zoom) - viewTop() + "px";
  }
  // How many metres a pixel covers here, which is what turns the
  // device's stated accuracy into a ring of the right size. It
  // narrows away from the equator by the cosine of the latitude,
  // Mercator having stretched everything else by the same factor.
  function metresPerPixel(lat) {
    return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / pow2(zoom);
  }
  function placeMe() {
    placePin(meDot, me);
    if (!me) {
      meHalo.style.display = "none";
      return;
    }
    // Under about a pin's width the ring says nothing the dot does
    // not already say, and drawn anyway it just fattens the dot.
    var r = me.acc / metresPerPixel(me.lat);
    if (!(r > 10)) {
      meHalo.style.display = "none";
      return;
    }
    meHalo.style.display = "";
    meHalo.style.width = 2 * r + "px";
    meHalo.style.height = 2 * r + "px";
    meHalo.style.left = lonToX(me.lon, zoom) - viewLeft() - r + "px";
    meHalo.style.top = latToY(me.lat, zoom) - viewTop() - r + "px";
  }
  function render() {
    if (!vw || !vh) measure();
    if (!vw || !vh) return;
    fillTiles();
    positionLayers();
    // An entry that is on the map is marked by its own marker; the
    // pin is only for one that isn't — a personal contact, kept off
    // the map but still openable from its own card.
    placePin(entryPin, entry && !entry.el ? entry : null);
    placePin(pickPin, pick);
    placeMe();
    layoutSpots();
    placePopup();
    zoomInBtn.disabled = zoom >= MAX_ZOOM;
    zoomOutBtn.disabled = zoom <= MIN_ZOOM;
    // A backstop for the layer above: if its tiles never settle —
    // half of them 404, the connection dies — the stale layer under
    // it would otherwise stay for the life of the panel.
    clearTimeout(sweepTimer);
    sweepTimer = setTimeout(trimLayers, 1200);
  }
  function resetMap() {
    for (var z in layers) {
      if (layers.hasOwnProperty(z)) dropLayer(z);
    }
    layers = {};
    clearTimeout(sweepTimer);
    wrapEl.style.transform = "";
    wrapEl.style.transformOrigin = "";
    seenTile = false;
  }

  /* ---- What the head says ------------------------------------------ */
  function coordText(lat, lon) {
    return lat.toFixed(5) + ", " + lon.toFixed(5);
  }
  function current() {
    if (sel === "entry") return entry;
    if (sel === "pick") return pick;
    return null;
  }
  // Yandex takes a centre and a pin off the query string, in the
  // longitude-first order every one of its URLs uses.
  function yandexPoint(lat, lon) {
    var pair = lon.toFixed(6) + "," + lat.toFixed(6);
    return (
      "https://yandex.com/maps/?ll=" +
      pair +
      "&z=" +
      START_ZOOM +
      "&pt=" +
      pair +
      ",pm2rdm"
    );
  }
  // Where the *secondary* way out points: some map that isn't Yandex.
  // On a phone that is whichever app the reader already keeps their
  // pins and routes in — geo: is Android's way of saying "the default
  // maps app, whichever it is", and maps.apple.com is the equivalent
  // on iOS, which doesn't register geo: at all. A desktop has no maps
  // app to hand off to, so it gets OpenStreetMap, which takes a
  // marker straight off the URL and asks nobody to sign in.
  //
  // All three are the same bargain, and it is the one the confirm
  // dialog spells out: a point at these coordinates, and nothing else
  // — no hours, no phone number, no listing behind the pin. The forms
  // below are the ones that mark a point rather than search around
  // it: Android needs the q=lat,lon(Label) shape or it goes looking
  // near the pin, and Apple Maps treats q as a label whenever ll is
  // given. Brackets inside a label would close Android's early, so
  // they go encoded.
  function pointTarget(lat, lon, label) {
    var geo = lat.toFixed(6) + "," + lon.toFixed(6);
    var tag = encodeURIComponent(label)
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29");
    if (IS_ANDROID) return "geo:" + geo + "?q=" + geo + "(" + tag + ")";
    if (IS_IOS) return "https://maps.apple.com/?ll=" + geo + "&q=" + tag;
    return (
      "https://www.openstreetmap.org/?mlat=" +
      lat.toFixed(6) +
      "&mlon=" +
      lon.toFixed(6) +
      "#map=" +
      START_ZOOM +
      "/" +
      lat.toFixed(6) +
      "/" +
      lon.toFixed(6)
    );
  }
  function showSelection() {
    var on = current();
    if (entry) {
      entryPin.setAttribute("aria-label", "Show " + entry.name);
    }
    pickPin.setAttribute(
      "aria-label",
      pick ? "Show the picked point" : "Picked point",
    );
    if (!on) {
      titleEl.className = "mapview-title is-off";
      subEl.className = "mapview-sub is-off";
      actions.className = "mapview-actions is-off";
      // The dialog is named by its title, and there isn't one now.
      panelEl.removeAttribute("aria-labelledby");
      panelEl.setAttribute("aria-label", "Map preview");
      closeConfirm();
    } else {
      panelEl.removeAttribute("aria-label");
      panelEl.setAttribute("aria-labelledby", "mapviewTitle");
      var coords = coordText(on.lat, on.lon);
      var name = on.name || coords;
      titleEl.className = "mapview-title";
      subEl.className = "mapview-sub";
      actions.className = "mapview-actions";
      titleEl.textContent = name;
      subEl.textContent = on.addr || (on.name ? coords : "");
      // The entry keeps its own Yandex page — an org listing with
      // hours and a phone number behind it, which no pair of
      // coordinates can reconstruct. A picked point has only the
      // coordinates. The other way out is aimed when it is pressed
      // instead, since either this button or the card's may be the
      // one asking, and they can be pointing at different places.
      yaLink.href = on.href || yandexPoint(on.lat, on.lon);
    }
    entryPin.className =
      "mapview-pin mapview-pin-entry" +
      (sel === "entry" ? "" : " is-off");
    pickPin.className =
      "mapview-pin mapview-pin-pick" + (sel === "pick" ? "" : " is-off");
    clearBtn.className =
      "mapview-clear" +
      (locateBtn ? "" : " is-apart") +
      (on ? "" : " is-off");
    // The gatherings depend on what is selected, so this may rebuild
    // them; layoutSpots decides, and does nothing if nothing changed.
    layoutSpots();
    // The invitation stands or stands down with the selection — unless
    // a message has borrowed the line, which will hand it back here on
    // its own and pick up whatever the selection is by then.
    if (!hintTimer) hintDefault();
  }
  // Reached only when the reader picks the entry themselves — from its
  // pin, or from its dot among the rest of the index. Opening the panel
  // sets the selection directly instead, so the invitation below is
  // still standing for someone who has done nothing yet.
  function selectEntry() {
    sel = "entry";
    hintDone();
    showSelection();
  }
  function selectPoint(lat, lon) {
    pick = { lat: lat, lon: lon, name: "", addr: "" };
    sel = "pick";
    hintDone();
    placePin(pickPin, pick);
    showSelection();
    lookup(pick);
  }
  // Clearing a picked point takes the pin with it; clearing the entry
  // leaves its pin behind, dimmed, since it is the reason the panel
  // is open and the way back to it.
  function clearSelection() {
    closePopup();
    // Taking away what is picked takes the card with it, including
    // one waiting behind the dialog to come back.
    popHeld = null;
    if (sel === "pick") {
      pick = null;
      placePin(pickPin, null);
    }
    sel = null;
    showSelection();
    closeBtn.focus();
  }

  /* ---- The index, on the map ----------------------------------------
     Every entry that knows where it is, drawn as a dot, so the map
     answers "what is around here" and not only "where is this one".
     Tapping one picks it exactly as tapping its pin would.

     Read out of the cards themselves, once, on the first open —
     there is no data file to read instead, and the DOM already holds
     all of it. Three things are deliberately left out:

     - personal contacts, which the reader may have switched off and
       which are somebody's home either way. A map is a poor place to
       publish an address the page itself is hiding.
     - the cross-referenced duplicates, which are one place entered
       twice for findability and would otherwise be one dot drawn
       twice, keyed out here by position and name.
     - the search and category filters, which are not applied: the
       map is a view of the whole index, and quietly hiding most of
       it because of a search box left filled in on the page behind
       would be a surprise rather than a feature.

     Laid out once per zoom and then moved by a single transform, the
     same way the tiles are: a pan must not cost a hundred and
     seventy style writes a frame. */
  function collectSpots() {
    if (spots) return spots;
    spots = [];
    var seen = {};
    var cards = document.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (card.getAttribute("data-personal") === "true") continue;
      var geo = parseGeo(card);
      if (!geo) continue;
      var name = placeName(card);
      var key = card.getAttribute("data-geo") + "|" + name;
      if (seen[key]) continue;
      seen[key] = true;
      var href = null;
      var links = card.querySelectorAll(".card-row a");
      for (var k = 0; k < links.length; k++) {
        if (isMapLink(links[k])) {
          href = links[k].href;
          break;
        }
      }
      var el = document.createElement("div");
      el.className = "mapview-spot";
      var mark = catIcon(card.getAttribute("data-cat"));
      if (mark) el.appendChild(mark);
      // Named for a pointer that hovers, and hidden from screen
      // readers: every one of these is a card in the page behind the
      // panel, reachable there in a way a dot on a map is not, and a
      // hundred and seventy unreadable dots in the tab order would
      // cost far more than they gave.
      el.title = name;
      el.setAttribute("aria-hidden", "true");
      spotsEl.appendChild(el);
      spots.push({
        card: card,
        lat: geo.lat,
        lon: geo.lon,
        name: name,
        label: shortLabel(name),
        addr: cardAddress(card),
        href: href,
        el: el,
      });
    }
    return spots;
  }
  // How wide the disc for a gathering of n is drawn, halved. Kept
  // beside the stylesheet's sizes, since the grouping below has to
  // know how much room each one will take before it draws it.
  function groupRadius(n) {
    if (n === 1) return SPOT_R;
    if (n >= 25) return 22;
    if (n >= 8) return 18;
    return 15;
  }
  // The one the head is describing is drawn larger, so it asks for
  // more room than the rest when the setting-out below shares it.
  function spreadRadius(s, on) {
    return s === on ? SPOT_ON_R : SPOT_R;
  }
  // Markers that would sit on top of each other are gathered into
  // one, and a gathering is drawn at the mean of what it holds rather
  // than at the middle of anything, so a run of places along one
  // street sits on that street.
  //
  // The grid is only a first pass — cheap, one sweep, and it does
  // most of the work. What it cannot do is promise anything about two
  // markers either side of a cell edge, which can be a pixel apart
  // and in different cells. So a second pass merges any two groups
  // still close enough to touch, and repeats until none are. Merging
  // rather than nudging is what keeps a lone marker exactly over the
  // place it stands for: at every zoom that can still be zoomed into,
  // nothing is moved off its own coordinates to make room, it is only
  // ever absorbed into a count. The last zoom is the exception, and
  // the only one — see spreadSpots, which takes over there.
  //
  // Both passes run when the zoom changes, never per frame.
  function groupSpots() {
    var cells = {};
    var groups = [];
    var on = current();
    var i;
    var k;
    var s;
    for (i = 0; i < spots.length; i++) {
      s = spots[i];
      s.wx = lonToX(s.lon, zoom) - spotOx;
      s.wy = latToY(s.lat, zoom) - spotOy;
      // How far the marker has been moved off that point to keep it
      // out of its neighbours' way. Nothing at any zoom but the last.
      s.dx = 0;
      s.dy = 0;
    }
    if (zoom >= MAX_ZOOM) return spreadSpots(on);
    for (i = 0; i < spots.length; i++) {
      s = spots[i];
      // Whatever the head is describing is always its own marker,
      // never a member of a gathering: it is the one thing on the map
      // the reader has asked about.
      if (s === on) continue;
      // Keyed off the world, not off the view. The origin the markers
      // are drawn against moves with the reader; if the cells moved
      // with it too, the grid would fall differently after every pan
      // and groups would come apart and re-form for no reason the
      // reader could see. Against the world, a given zoom always
      // groups the same way, however the map got there.
      var key =
        Math.floor((s.wx + spotOx) / CLUSTER_CELL) +
        ":" +
        Math.floor((s.wy + spotOy) / CLUSTER_CELL);
      if (!cells[key]) {
        cells[key] = { members: [], x: 0, y: 0 };
        groups.push(cells[key]);
      }
      cells[key].members.push(s);
    }
    for (i = 0; i < groups.length; i++) centreGroup(groups[i]);

    // Merge what still collides. Each pass is over a list that only
    // ever gets shorter; a handful of passes settles a screenful, and
    // the cap is there so a pathological arrangement cannot spin.
    for (var pass = 0; pass < 8; pass++) {
      var merged = false;
      for (i = 0; i < groups.length; i++) {
        for (k = i + 1; k < groups.length; k++) {
          var a = groups[i];
          var b = groups[k];
          // A little more than the two radii, so markers are kept
          // visibly apart rather than merely not touching.
          var reach =
            groupRadius(a.members.length) +
            groupRadius(b.members.length) +
            5;
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          if (dx * dx + dy * dy >= reach * reach) continue;
          a.members = a.members.concat(b.members);
          centreGroup(a);
          groups.splice(k, 1);
          k--;
          merged = true;
        }
      }
      if (!merged) break;
    }
    if (on && on.el) groups.push({ members: [on], x: 0, y: 0 });
    return groups;
  }
  // A gathering sits at the mean of its members; a lone marker sits
  // exactly where its entry is.
  function centreGroup(g) {
    var sx = 0;
    var sy = 0;
    for (var i = 0; i < g.members.length; i++) {
      sx += g.members[i].wx;
      sy += g.members[i].wy;
    }
    g.x = sx / g.members.length;
    g.y = sy / g.members.length;
  }
  /* ---- The last zoom, where nothing is gathered ---------------------
     A gathering is an offer to zoom in, and at the deepest level
     there is nowhere left to zoom: a disc reading "2" that no further
     tap will ever open is the one answer this map must not give. A
     reader who has come all the way in has come to tell two
     neighbours apart, so the last level sets every entry out on its
     own — including the pairs recorded at one and the same point,
     which is exactly where the reader who zoomed in was heading.

     This is the single place the rule above is relaxed, and it is
     relaxed by as little as the arithmetic allows: a marker is moved
     only while something is still on top of it, and only far enough
     to be clear of it. At this zoom a pixel is about a quarter of a
     metre, so even the largest of these displacements is a few metres
     — the width of the doorway the entry stands in. Everything with
     room of its own stays exactly on its own coordinates, as it does
     at every other zoom. */
  function spreadSpots(on) {
    var groups = [];
    var i;
    var k;
    var s;
    var t;
    // Entries recorded at one and the same point have no direction to
    // be pushed apart in — the line between them is a point — so they
    // are set out on a ring around what they share first, and the
    // pass below refines from there. The ring is drawn wide enough
    // that its own neighbours already clear each other.
    var same = {};
    for (i = 0; i < spots.length; i++) {
      var at = spots[i].lat + "," + spots[i].lon;
      if (!same[at]) same[at] = [];
      same[at].push(spots[i]);
    }
    for (var key in same) {
      if (!same.hasOwnProperty(key)) continue;
      var set = same[key];
      if (set.length < 2) continue;
      var step = (Math.PI * 2) / set.length;
      var ring = (SPOT_R + SPREAD_GAP / 2) / Math.sin(step / 2);
      for (k = 0; k < set.length; k++) {
        // From the top, clockwise, in the order the index lists them,
        // so the same point always opens out the same way.
        var a = k * step - Math.PI / 2;
        set[k].dx = Math.cos(a) * ring;
        set[k].dy = Math.sin(a) * ring;
      }
    }
    // The one the head is describing never moves: it is the place the
    // reader asked about, and it is the one marker on the map whose
    // coordinates they may be reading off the panel. Its neighbours
    // give way to it instead.
    if (on && on.el) {
      on.dx = 0;
      on.dy = 0;
    }
    // Push apart whatever still overlaps, each pair along the line
    // between them and each taking half the overlap, until a pass
    // finds nothing left to push. Two that a ring above left exactly
    // on top of each other — three coincident points, one of them
    // held still — are parted in an arbitrary direction, since every
    // direction is as good as another.
    for (var pass = 0; pass < SPREAD_PASSES; pass++) {
      var moved = false;
      for (i = 0; i < spots.length; i++) {
        for (k = i + 1; k < spots.length; k++) {
          s = spots[i];
          t = spots[k];
          var reach =
            spreadRadius(s, on) + spreadRadius(t, on) + SPREAD_GAP;
          var dx = t.wx + t.dx - s.wx - s.dx;
          var dy = t.wy + t.dy - s.wy - s.dy;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d >= reach) continue;
          if (d < 0.01) {
            dx = 0;
            dy = -1;
            d = 1;
          }
          var give = s === on ? 0 : t === on ? 1 : 0.5;
          var push = (reach - d) / d;
          s.dx -= dx * push * give;
          s.dy -= dy * push * give;
          t.dx += dx * push * (1 - give);
          t.dy += dy * push * (1 - give);
          moved = true;
        }
      }
      if (!moved) break;
    }
    for (i = 0; i < spots.length; i++) {
      s = spots[i];
      groups.push({ members: [s], x: s.wx + s.dx, y: s.wy + s.dy });
    }
    return groups;
  }
  function clusterEl(n) {
    var el = clusterPool[n];
    if (el) return el;
    el = document.createElement("div");
    el.className = "mapview-cluster";
    el.setAttribute("aria-hidden", "true");
    spotsEl.appendChild(el);
    clusterPool[n] = el;
    return el;
  }
  function layoutSpots() {
    if (!spots || !spots.length) return;
    var on = current();
    // Rebuilt when the zoom changes, and when the selection does —
    // the one thing picked out never joins a gathering, so the
    // gatherings depend on it. A pan changes neither.
    if (spotZoom !== zoom || spotSel !== on) {
      if (spotZoom !== zoom) {
        // A fresh origin, so the transform below stays in the
        // hundreds of pixels rather than the hundred millions — the
        // same reason the tile layers keep their own corner. Only on
        // a zoom: moving it at any other time would repaint every
        // marker for nothing.
        spotOx = Math.floor(viewLeft());
        spotOy = Math.floor(viewTop());
      }
      var groups = groupSpots();
      var i;
      var used = 0;
      for (i = 0; i < spots.length; i++) {
        spots[i].group = null;
      }
      for (i = 0; i < groups.length; i++) {
        var g = groups[i];
        if (g.members.length === 1) {
          var lone = g.members[0];
          // dx and dy are nothing at every zoom but the last, where
          // they are what keeps two doorways apart — see spreadSpots.
          lone.el.style.left = lone.wx + lone.dx + "px";
          lone.el.style.top = lone.wy + lone.dy + "px";
          continue;
        }
        var el = clusterEl(used++);
        var n = g.members.length;
        el.textContent = String(n);
        el.className =
          "mapview-cluster" +
          (n >= 25 ? " is-big" : n >= 8 ? " is-mid" : "");
        el.style.display = "";
        el.style.left = g.x + "px";
        el.style.top = g.y + "px";
        el.title =
          n + (n === 1 ? " entry here" : " entries here — tap to open");
        // What to zoom to when it is tapped, kept on the element so
        // the tap doesn't have to work out which group it was.
        el.__at = g;
        for (var k = 0; k < g.members.length; k++) {
          g.members[k].group = g;
        }
      }
      for (i = used; i < clusterPool.length; i++) {
        clusterPool[i].style.display = "none";
      }
      spotZoom = zoom;
      spotSel = on;
      markSpots();
    }
    spotsEl.style.transform =
      "translate(" +
      (spotOx - viewLeft()) +
      "px," +
      (spotOy - viewTop()) +
      "px)";
  }
  // The dot under whatever the head is describing steps aside for the
  // pin. Only ever run when the selection changes, not per frame.
  // The single place where a marker's visibility is decided: gathered
  // into a cluster, or standing in for something the pin is already
  // marking, or shown.
  function markSpots() {
    if (!spots) return;
    var on = current();
    for (var i = 0; i < spots.length; i++) {
      var s = spots[i];
      var picked = s === on;
      s.el.style.display = !picked && s.group ? "none" : "";
      s.el.className = "mapview-spot" + (picked ? " is-on" : "");
    }
  }
  /* ---- The card, over its marker ------------------------------------
     Tapping a marker stands the entry's own card over it. The card is
     cloned out of the page rather than rebuilt from the few fields
     this script happens to have collected, so everything the index
     knows comes with it — the subcategory tag, every phone number,
     the site, the socials, the notes — already styled by the rules
     the page uses for cards, and still right the day somebody edits
     the entry.

     Two things are taken off the clone. Its map rows go entirely —
     the reader is standing on the map, looking at this entry's own
     marker, so a row offering them a map is the one thing the card
     has nothing left to say with; and the classes that hide or place
     a card in the page's own layout are meaningless here. In their
     place go the head's two ways out, aimed at this entry, so the
     reader never has to travel back up to the head to leave for a
     real map. What is deliberately left on is the address row's
     copy-on-tap, which works in the clone exactly as it does in the
     page. */
  function openPopup(spot) {
    popSpot = spot;
    while (popScroll.firstChild) {
      popScroll.removeChild(popScroll.firstChild);
    }
    var clone = spot.card.cloneNode(true);
    clone.className = "card";
    clone.removeAttribute("style");
    var links = clone.querySelectorAll(".card-row a");
    for (var i = 0; i < links.length; i++) {
      if (!isMapLink(links[i])) continue;
      var row = links[i].closest ? links[i].closest(".card-row") : null;
      // A map row is the glyph and the link and nothing else, so the
      // row goes with the link. If one ever carries something more,
      // only the link is taken and the rest of the row stays.
      if (row && row.querySelectorAll("a").length === 1) {
        row.parentNode.removeChild(row);
      } else {
        links[i].parentNode.removeChild(links[i]);
      }
    }
    popScroll.appendChild(clone);
    popYa.href = spot.href || yandexPoint(spot.lat, spot.lon);
    popScroll.appendChild(popActions);
    popupEl.style.display = "";
    // Measured once, here, rather than on every frame of a pan: the
    // content only changes when this runs.
    popW = popupEl.offsetWidth;
    popH = popupEl.offsetHeight;
    fitPopup();
    placePopup();
  }
  function closePopup() {
    if (!popSpot) return;
    var held = popupEl.contains(document.activeElement);
    popSpot = null;
    popupEl.style.display = "none";
    if (held) mapEl.focus();
  }
  // Stood aside rather than closed: the card is as wide as the
  // confirm dialog and stands wherever its marker stands, so with
  // both up the question is asked over the top of the card that
  // prompted it — and on a phone the card can be most of the map.
  // closeConfirm puts back whatever is held here, however the
  // question was answered.
  function holdPopup() {
    var on = popSpot;
    closePopup();
    popHeld = on;
  }
  var POP_GAP = 20;
  var POP_EDGE = 8;
  // If the card won't fit over its marker, the map moves rather than
  // the card: shoved into a corner it would still be over the marker
  // but no longer pointing at it, and the tail is the whole reason a
  // reader knows which of a hundred markers they are reading. Run
  // once, when the card opens.
  // Where a marker is *drawn*, which at the last zoom is not always
  // quite where its entry is: the card stands over the marker the
  // reader pressed, and its tail has to point at that and not at the
  // coordinate underneath it. Nothing but the entry's own place at
  // every other zoom — see spreadSpots.
  function spotDrawnX(s) {
    return lonToX(s.lon, zoom) + (s.dx || 0);
  }
  function spotDrawnY(s) {
    return latToY(s.lat, zoom) + (s.dy || 0);
  }
  function fitPopup() {
    if (!popSpot) return;
    var y = spotDrawnY(popSpot) - viewTop();
    var need = POP_GAP + popH + POP_EDGE;
    if (y >= need) return;
    // Taller than the map has room for either way round; placePopup
    // will do what it can.
    if (need > vh - POP_EDGE) return;
    cy -= need - y;
    render();
  }
  // How near a corner the tail's point may come, so it always leaves
  // from the flat part of an edge rather than off a rounded end.
  var POP_TAIL = 16;
  // ...except at the top right corner, which the close button hangs
  // off: the two edges meeting there hold the tail further away.
  var POP_TAIL_SHUT = 30;
  // The tail has to reach the marker, and it only protrudes about
  // this far, so an edge nearer the marker than this cannot carry it.
  var POP_REACH = 10;
  function popClamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  // Whether the tail runs across the card's width rather than down
  // its height — which of the two coordinates it slides along.
  function popTailAcross(side) {
    return side === "top" || side === "bottom";
  }
  // How far along its edge the tail's point may sit, as an offset
  // into the card from that edge's start.
  function popTailRange(side) {
    return [
      side === "right" ? POP_TAIL_SHUT : POP_TAIL,
      (popTailAcross(side) ? popW : popH) -
        (side === "top" ? POP_TAIL_SHUT : POP_TAIL),
    ];
  }
  // Which of the card's four edges the tail leaves from, and where
  // the card itself stands. The card is stood clear of the marker on
  // one side of it and never past the edge of the map, which are two
  // demands that fight as soon as the reader pans: the marker walks
  // towards a corner, the card stops at the map's edge, and the two
  // come apart. So the sides are *tried*, in the order a reader would
  // want them — above the marker, below it, then beside it on
  // whichever hand has the room — and the first that can still both
  // stand clear of the marker and put its tail on it wins. Only the
  // side changes; the card is never shoved somewhere it would cover
  // the marker it is describing.
  function popupPlace(x, y) {
    var maxLeft = vw - popW - POP_EDGE;
    var maxTop = vh - popH - POP_EDGE;
    var beside = [
      { side: "right", left: x - POP_GAP - popW, top: y - popH / 2 },
      { side: "left", left: x + POP_GAP, top: y - popH / 2 },
    ];
    // The hand with the room first: a marker in the right half of the
    // map has space for the card on its left.
    if (x <= vw / 2) beside.reverse();
    var cands = [
      { side: "bottom", left: x - popW / 2, top: y - POP_GAP - popH },
      { side: "top", left: x - popW / 2, top: y + POP_GAP },
      beside[0],
      beside[1],
    ];
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i];
      c.left = popClamp(c.left, POP_EDGE, maxLeft);
      c.top = popClamp(c.top, POP_EDGE, maxTop);
      var range = popTailRange(c.side);
      var at = popTailAcross(c.side) ? x - c.left : y - c.top;
      var reaches = at >= range[0] && at <= range[1];
      var clear =
        c.side === "bottom"
          ? c.top + popH <= y - POP_REACH
          : c.side === "top"
            ? c.top >= y + POP_REACH
            : c.side === "right"
              ? c.left + popW <= x - POP_REACH
              : c.left >= x + POP_REACH;
      if (reaches && clear) return c;
    }
    // No side can reach it: the marker has been panned off the map
    // altogether, or the map is smaller than the card. Leave the card
    // where it stands and hand the tail to the edge the marker lies
    // past — clamped to that edge's end, it still says which way to
    // pan back. Compared across the card's own proportions so a long
    // card doesn't call everything a side.
    var c0 = cands[0];
    var dx = x - (c0.left + popW / 2);
    var dy = y - (c0.top + popH / 2);
    c0.side =
      Math.abs(dx) * popH > Math.abs(dy) * popW
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "bottom"
          : "top";
    return c0;
  }
  function placePopup() {
    if (!popSpot) return;
    var x = spotDrawnX(popSpot) - viewLeft();
    var y = spotDrawnY(popSpot) - viewTop();
    var p = popupPlace(x, y);
    popupEl.className = "mapview-pop tail-" + p.side;
    popupEl.style.left = p.left + "px";
    popupEl.style.top = p.top + "px";
    // The tail slides along its edge to stay on the marker, and the
    // offset it isn't using is given back to the stylesheet — left it
    // set, a tail that had been along the top would keep that offset
    // once it moved to a side.
    var range = popTailRange(p.side);
    var across = popTailAcross(p.side);
    // Measured to the tail's point, and set from the corner of its
    // box, which is half its width back.
    var at =
      popClamp(across ? x - p.left : y - p.top, range[0], range[1]) - 6;
    popTail.style.left = across ? at + "px" : "";
    popTail.style.top = across ? "" : at + "px";
  }

  function spotAt(el) {
    if (!spots) return null;
    for (var i = 0; i < spots.length; i++) {
      if (spots[i].el === el) return spots[i];
    }
    return null;
  }

  /* ---- Icons -------------------------------------------------------
     Drawn rather than typed. As characters these were ⌖ and ⊘, which
     no ordinary text font carries — the browser substitutes whatever
     it can find, and what it finds sits at its own height above the
     baseline. Since a flex box centres the line rather than the mark
     inside it, the crosshair rode about two pixels low against the
     plus and minus beside it, by an amount belonging to a font that
     differs on every platform. Drawn here they are centred by
     construction and identical everywhere.

     Stroked in currentColor at the same weight as the arrow in the
     page's back-to-top button, so they read as one family. */
  var SVG_NS = "http://www.w3.org/2000/svg";
  function icon(shapes) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.6");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    // The button's own label is what a screen reader should read;
    // the drawing has nothing to add to it.
    svg.setAttribute("aria-hidden", "true");
    for (var i = 0; i < shapes.length; i++) {
      var s = shapes[i];
      var el = document.createElementNS(
        SVG_NS,
        s.r ? "circle" : "path",
      );
      if (s.r) {
        el.setAttribute("cx", s.cx);
        el.setAttribute("cy", s.cy);
        el.setAttribute("r", s.r);
      } else {
        el.setAttribute("d", s.d);
      }
      svg.appendChild(el);
    }
    return svg;
  }
  var ICON_IN = [{ d: "M12 5.5v13" }, { d: "M5.5 12h13" }];
  var ICON_OUT = [{ d: "M5.5 12h13" }];
  // A ring with four ticks off it, the mark every map uses for "where
  // am I".
  var ICON_LOCATE = [
    { cx: 12, cy: 12, r: 3.4 },
    { d: "M12 2.6v3.2" },
    { d: "M12 18.2v3.2" },
    { d: "M2.6 12h3.2" },
    { d: "M18.2 12h3.2" },
  ];
  // A ring struck through: the point, taken off.
  var ICON_CLEAR = [
    { cx: 12, cy: 12, r: 7.4 },
    { d: "M6.8 17.2 17.2 6.8" },
  ];
  var ICON_CLOSE = [
    { d: "M6.6 6.6 17.4 17.4" },
    { d: "M17.4 6.6 6.6 17.4" },
  ];

  // One mark per category, so a marker says what kind of place it is
  // before anything is tapped. Drawn heavier than the panel's own
  // controls because they are read at 14 pixels rather than 20, and
  // over a map rather than over paper. Keyed by the data-cat the
  // cards and the chip row already share; anything unrecognised gets
  // a plain disc, which is honest about knowing nothing.
  var CAT_ICONS = {
    Medicine: [{ d: "M12 6.6v10.8" }, { d: "M6.6 12h10.8" }],
    "Government Services": [
      { d: "M3.8 9.8 12 5l8.2 4.8" },
      { d: "M4.6 19.4h14.8" },
      { d: "M7.6 10.6v8.2" },
      { d: "M12 10.6v8.2" },
      { d: "M16.4 10.6v8.2" },
    ],
    "Transport & Delivery": [
      { d: "M3.4 15.6h17.2" },
      { d: "M6.2 15.6 7.8 10h8.4l1.6 5.6" },
      { cx: 8.4, cy: 17.4, r: 1.7 },
      { cx: 15.6, cy: 17.4, r: 1.7 },
    ],
    // A spanner: the jaw, then the shaft down to the handle.
    "Services & Tradespeople": [
      {
        d:
          "M14.6 4.6a4.4 4.4 0 0 0-1.2 7.4L5 20.4l-1.4-1.4 8.4-8.4" +
          "a4.4 4.4 0 0 0 7.4-1.2l-3-1-1.4-3z",
      },
    ],
    Food: [
      { d: "M8 4.4v4.4a1.7 1.7 0 0 0 3.4 0V4.4" },
      { d: "M9.7 10.5v9.1" },
      { d: "M16.4 4.4c1.9 2.3 1.9 5.6 0 7.6" },
      { d: "M16.4 12v7.6" },
    ],
    Hotels: [
      { d: "M3.6 18.4V9" },
      { d: "M3.6 13.4h16.8v5" },
      { d: "M7.2 13.4v-2.6h5v2.6" },
    ],
    Leisure: [
      { d: "M12 4.2 8.2 10.4h7.6z" },
      { d: "M12 8.4 6.6 15.8h10.8z" },
      { d: "M12 15.8v3.8" },
    ],
  };
  function catIcon(cat) {
    var shapes = CAT_ICONS[cat];
    if (!shapes) return null;
    var svg = icon(shapes);
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("stroke-width", "2.1");
    return svg;
  }

  /* ---- The chip at the foot of the map ------------------------------
     One line, used for the standing invitation to tap and for
     whatever the locate button has to report back. A message borrows
     it for a few seconds and then hands it back to whichever state
     the invitation was in.

     The invitation is only worth making while nothing is picked. Opened
     from a card the panel arrives with the entry already selected — its
     name in the head, both ways out aimed at it — so a line telling the
     reader to pick something is talking over an answer already given,
     and it was doing exactly that on every first open. It is equally
     spent once the reader picks anything themselves, a marker as much
     as a bare point, and that is what hintSeen remembers: without it
     the line would come back every time a selection was cleared, for a
     reader who has plainly understood it. */
  function hintDefault() {
    hintEl.textContent = IS_TOUCH
      ? "Tap the map to pick a point"
      : "Click the map to pick a point";
    hintEl.className = "mapview-hint" + (hintSeen || sel ? " is-off" : "");
  }
  function hintDone() {
    hintSeen = true;
  }
  function flash(text) {
    clearTimeout(hintTimer);
    hintEl.textContent = text;
    hintEl.className = "mapview-hint";
    hintTimer = setTimeout(function () {
      hintTimer = null;
      hintDefault();
    }, 4500);
  }

  /* ---- Where the reader is -----------------------------------------
     The one thing on this page that asks the browser for something
     about the reader, and it asks only when the button is pressed —
     there is no watch, no reading taken on open, and nothing to
     decline until then. What comes back is drawn on the map and used
     for nothing else: it is not saved, not put in a link, and not
     sent anywhere, least of all to the geocoder, which is only ever
     asked about points the reader picked by hand. */
  function locate() {
    if (!navigator.geolocation) return;
    locateBtn.disabled = true;
    flash("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        locateBtn.disabled = false;
        locateBtn.className = "mapview-locate is-apart is-on";
        me = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          acc: pos.coords.accuracy || 0,
        };
        // Where the reader is is nearly always asked in relation to
        // something: the entry they opened, or the point they picked.
        // So the view is put around both, rather than dropping onto
        // the reader and pushing the other one off the screen. With
        // nothing else on the map, it just closes in — but not so
        // close that a reading good to a hundred metres is drawn as
        // if it named a doorway.
        grow();
        var other = current() || entry;
        if (other) {
          fitBoth(me, other);
        } else {
          if (zoom < 16) zoom = 16;
          centreOn(me.lat, me.lon);
        }
        render();
        flash(
          me.acc
            ? "Your location, to about " + Math.round(me.acc) + " m"
            : "Your location",
        );
      },
      function (err) {
        locateBtn.disabled = false;
        // A refusal is an answer, not a fault, and it is worth saying
        // plainly that the button is what asked.
        flash(
          err && err.code === 1
            ? "Location permission was declined"
            : err && err.code === 3
              ? "Locating took too long"
              : "Your location isn't available",
        );
      },
      GEO_OPTS,
    );
  }

  /* ---- Growing into the screen -------------------------------------
     The small panel is a glance at one address, with the page still
     showing around it. The moment the reader moves the map it has
     stopped being that, so it takes the whole screen. Since the view
     is held as a centre, the centre is what it grows around, and
     whatever was being looked at stays in the middle of it.

     The tiles have to keep up as the box changes size, and there is
     no event for "a transition is part-way through" — so the frames
     of the growth are walked by hand for the length of it. */
  function grow() {
    if (isFull || !overlay) return;
    isFull = true;
    overlay.className = "mapview mapview-shown is-full";
    clearTimeout(growTimer);
    var until = Date.now() + 380;
    (function step() {
      measure();
      render();
      if (Date.now() < until) {
        growTimer = setTimeout(step, 16);
      }
    })();
  }

  /* ---- Naming a picked point --------------------------------------- */
  var geoToken = 0;
  var geoLast = 0;
  var geoTimer = null;
  var geoReq = null;
  function lookup(at) {
    var token = ++geoToken;
    if (geoReq) {
      geoReq.onload = null;
      geoReq.onerror = null;
      geoReq.ontimeout = null;
      geoReq.abort();
      geoReq = null;
    }
    clearTimeout(geoTimer);
    var wait = GEOCODE_GAP - (Date.now() - geoLast);
    if (wait < 0) wait = 0;
    geoTimer = setTimeout(function () {
      askGeocoder(at, token);
    }, wait);
  }
  function askGeocoder(at, token) {
    geoLast = Date.now();
    var req = new XMLHttpRequest();
    geoReq = req;
    req.open(
      "GET",
      GEOCODER +
        "?format=jsonv2&addressdetails=1&zoom=18&accept-language=en" +
        "&lat=" +
        at.lat.toFixed(6) +
        "&lon=" +
        at.lon.toFixed(6),
      true,
    );
    req.timeout = 8000;
    req.onload = function () {
      if (token !== geoToken) return;
      geoReq = null;
      var data = null;
      try {
        data = JSON.parse(req.responseText);
      } catch (err) {
        data = null;
      }
      // Out at sea, or over a blank corner of the map, the geocoder
      // answers with an error rather than a place. The coordinates
      // already on screen are the honest answer there.
      if (!data || data.error) return;
      var read = readPlace(data);
      if (pick !== at) return;
      at.name = read.name;
      at.addr = read.addr;
      if (sel === "pick") showSelection();
    };
    req.onerror = req.ontimeout = function () {
      if (token === geoToken) geoReq = null;
    };
    req.send();
  }
  // What came back, cut down to a line and a half. A building or a
  // business answers with a name; a stretch of road answers with only
  // an address, and then the address is the name.
  function readPlace(data) {
    var at = data.address || {};
    var street = at.road || "";
    if (street && at.house_number) street += " " + at.house_number;
    var town = at.city || at.town || at.village || at.suburb || "";
    var line = [];
    if (street) line.push(street);
    if (town) line.push(town);
    var addr = line.join(", ");
    var name = String(data.name || "").replace(/^\s+|\s+$/g, "");
    if (!name) {
      name = addr;
      addr = "";
    }
    return { name: name, addr: addr };
  }

  /* ---- The card the panel was opened from -------------------------- */
  function parseGeo(card) {
    if (!card) return null;
    var raw = card.getAttribute("data-geo");
    if (!raw) return null;
    var pair = raw.split(",");
    var lat = parseFloat(pair[0]);
    var lon = parseFloat(pair[1]);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    return { lat: lat, lon: lon };
  }
  // The card's own name, so the panel says what is being looked at
  // rather than just showing a map and leaving the reader to place it.
  function placeName(card) {
    var name = card ? card.querySelector(".card-name") : null;
    if (!name) return "Map";
    return name.textContent.replace(/\s+/g, " ").replace(/^\s|\s$/g, "");
  }
  // Around a quarter of the entries are named "Business — what they
  // do", and that tail is this index's own description, not part of
  // the sign over the door. Searching "Red Mobile" finds the shop;
  // searching "Red Mobile — phone, computer, and electronics repair"
  // is asking a maps app to match prose. The panel's title still
  // shows the name in full.
  function shortLabel(name) {
    return name.split("—")[0].replace(/\s+$/, "") || name;
  }
  // The address as the card prints it, glyph dropped and the source's
  // line breaks collapsed.
  function cardAddress(card) {
    if (!card) return "";
    var rows = card.querySelectorAll(".card-row");
    for (var i = 0; i < rows.length; i++) {
      var glyph = rows[i].querySelector(".glyph");
      if (
        !glyph ||
        glyph.textContent.replace(/\s+/g, "") !== ADDRESS_GLYPH
      ) {
        continue;
      }
      var text = "";
      var kids = rows[i].children;
      for (var k = 0; k < kids.length; k++) {
        if (String(kids[k].className).indexOf("glyph") !== -1) continue;
        text += kids[k].textContent;
      }
      return text.replace(/\s+/g, " ").replace(/^\s|\s$/g, "");
    }
    return "";
  }

  /* ---- Gestures ----------------------------------------------------
     One finger pans, two pinch, the wheel steps a level at a time,
     and a tap that went nowhere picks a point. There is deliberately
     no double-tap to zoom: a double tap starts as a single one, and
     the single one already means something here. */
  var pointers = {};
  var drag = null;
  var pinch = null;
  var lastWheel = 0;
  // When the finger comes up, the browser follows the touch with a
  // mouse click for the benefit of pages that only listen for one —
  // and it hit-tests that click where the finger was, at the moment
  // it sends it, which is after this panel has answered the tap. A
  // tap on a marker stands the entry's card over the map with its
  // two ways out along the edge nearest the marker, so the click
  // arrives at a "Open in Yandex Maps" that was not there when the
  // reader pressed: the card opens and the reader is handed to
  // another map they never asked for. The tap is already fully
  // answered from the pointer events, so the echo is swallowed.
  var tapEcho = 0;

  function pointerIds() {
    var out = [];
    for (var id in pointers) {
      if (pointers.hasOwnProperty(id)) out.push(id);
    }
    return out;
  }
  function spread(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function startPinch() {
    var ids = pointerIds();
    var a = pointers[ids[0]];
    var b = pointers[ids[1]];
    var mid = localPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
    pinch = { gap: spread(a, b), x: mid.x, y: mid.y, k: 1, dx: 0, dy: 0 };
    // The gesture is shown by scaling the whole bag of layers about
    // the point between the fingers, which costs one transform a
    // frame. The zoom itself is only settled when the fingers lift,
    // and then it snaps to a level, since there are only tiles at
    // whole levels to snap to.
    wrapEl.style.transformOrigin = pinch.x + "px " + pinch.y + "px";
  }
  function movePinch() {
    if (!pinch) return;
    var ids = pointerIds();
    if (ids.length < 2) return;
    var a = pointers[ids[0]];
    var b = pointers[ids[1]];
    var mid = localPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
    pinch.k = pinch.gap > 0 ? spread(a, b) / pinch.gap : 1;
    pinch.dx = mid.x - pinch.x;
    pinch.dy = mid.y - pinch.y;
    wrapEl.style.transform =
      "translate(" +
      pinch.dx +
      "px," +
      pinch.dy +
      "px) scale(" +
      pinch.k +
      ")";
  }
  function endPinch() {
    var was = pinch;
    pinch = null;
    mapEl.className = "mapview-map";
    wrapEl.style.transform = "";
    wrapEl.style.transformOrigin = "";
    if (!was) return;
    zoomTo(Math.round(zoom + Math.log(was.k) / Math.LN2), was.x, was.y);
    // Whatever the two fingers also carried the map sideways by,
    // applied after the zoom rather than during it.
    cx -= was.dx;
    cy -= was.dy;
    // A pinch that came back to the zoom it started at still moved
    // the map, and zoomTo will not have noticed.
    grow();
    render();
  }

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // The tools sit over the map and would otherwise start a drag
    // that ends as a tap, dropping a pin behind the button the reader
    // was actually pressing. The open card is over the map in the
    // same way: a press on it is a press on the entry — reading it,
    // scrolling it, copying an address out of it — and never a press
    // on the nothing behind it, which would close the very card the
    // reader is holding.
    var hit = e.target && e.target.closest;
    if (hit && e.target.closest(".mapview-tools, .mapview-pop")) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = pointerIds();
    if (ids.length === 1) {
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        x0: e.clientX,
        y0: e.clientY,
        from: localPoint(e.clientX, e.clientY),
        at: Date.now(),
        target: e.target,
        moved: false,
      };
      // Capture is what keeps a drag with the map when the pointer
      // wanders off it. It throws if the pointer is no longer active
      // by the time this runs, and a drag that merely can't be
      // captured is still a drag.
      try {
        mapEl.setPointerCapture(e.pointerId);
      } catch (err) {}
      mapEl.className = "mapview-map";
    } else if (ids.length === 2) {
      drag = null;
      startPinch();
    }
  }
  function onPointerMove(e) {
    if (!pointers[e.pointerId]) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (pinch) {
      movePinch();
      return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    var dx = e.clientX - drag.x;
    var dy = e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (!drag.moved) {
      // Measured from where the press started, not from the last
      // event. A finger or a trackpad reports a drag as a long stream
      // of one- and two-pixel steps, none of which clears a threshold
      // on its own — so a slow drag would cross half the map without
      // ever counting as one, and then be let go as a tap.
      if (
        Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) <=
        4
      ) {
        return;
      }
      drag.moved = true;
      mapEl.className = "mapview-map is-dragging";
      // Moving the map is the moment the glance became a map.
      grow();
      // Including the pixels held back while it was still undecided,
      // so the map catches up with the finger rather than starting
      // from wherever it had got to.
      dx = e.clientX - drag.x0;
      dy = e.clientY - drag.y0;
    }
    // The map follows the finger, so the view goes the other way.
    cx -= dx;
    cy -= dy;
    render();
  }
  function onPointerUp(e) {
    delete pointers[e.pointerId];
    if (pinch) {
      if (pointerIds().length < 2) endPinch();
      return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    var was = drag;
    drag = null;
    mapEl.className = "mapview-map";
    // A press that wandered was a pan, and a press held a long while
    // was probably a long-press for the browser's own menu. Neither
    // is a reader pointing at something.
    if (was.moved || Date.now() - was.at > 700) return;
    // Everything below answers the tap, so the browser's echo of it
    // has nothing left to do and is swallowed on arrival.
    tapEcho = Date.now();
    var hit = was.target && was.target.closest ? was.target : null;
    var onPin = hit ? hit.closest(".mapview-pin") : null;
    if (onPin === entryPin) {
      selectEntry();
      return;
    }
    if (onPin === pickPin) {
      sel = "pick";
      showSelection();
      return;
    }
    // A dot is an entry of the index, and picking one is the same act
    // as picking the pin: the head describes it, and both ways out
    // lead to it — including, since the card knew it, its own listing
    // on Yandex rather than a bare pair of coordinates.
    var onSpot = hit ? spotAt(hit.closest(".mapview-spot")) : null;
    if (onSpot) {
      entry = onSpot;
      selectEntry();
      openPopup(onSpot);
      return;
    }
    // A gathering is not a place, so it cannot be picked — pressing
    // one takes the reader in far enough that it comes apart into the
    // places it was holding, centred where it stood.
    var onCluster = hit ? hit.closest(".mapview-cluster") : null;
    if (onCluster && onCluster.__at) {
      closePopup();
      var gx = onCluster.__at.x + spotOx - viewLeft();
      var gy = onCluster.__at.y + spotOy - viewTop();
      zoomTo(zoom + 2, gx, gy);
      return;
    }
    // With a card standing open, a press on the map is a press on
    // nothing, and puts the card away rather than picking a new
    // point. It takes the entry with it: opening the card is what
    // picked the entry in the first place, so putting the card away
    // is undoing that one act — and an entry left picked with its
    // card gone is a marker still standing large and inked over
    // nothing that says why, with the head describing a place the
    // reader has just dismissed.
    if (popSpot) {
      clearSelection();
      return;
    }
    var at = pointAt(was.from.x, was.from.y);
    selectPoint(at.lat, at.lon);
  }
  function onWheel(e) {
    e.preventDefault();
    var now = Date.now();
    // A trackwheel sends a burst of events for one flick of the
    // wrist, and each one would be a whole level.
    if (now - lastWheel < 140) return;
    lastWheel = now;
    var at = localPoint(e.clientX, e.clientY);
    zoomTo(zoom + (e.deltaY < 0 ? 1 : -1), at.x, at.y);
  }
  // The keyboard's version of the same three gestures. Picking lands
  // in the middle of the view, that being the one place a reader
  // without a pointer can aim at.
  function onMapKey(e) {
    // The pins are buttons inside the map, and their own Enter means
    // something else. Only the map itself answers here.
    if (e.target !== mapEl) return;
    var step = 80;
    var dx = 0;
    var dy = 0;
    if (e.key === "ArrowLeft") dx = -step;
    else if (e.key === "ArrowRight") dx = step;
    else if (e.key === "ArrowUp") dy = -step;
    else if (e.key === "ArrowDown") dy = step;
    else if (e.key === "+" || e.key === "=") zoomTo(zoom + 1);
    else if (e.key === "-" || e.key === "_") zoomTo(zoom - 1);
    else if (e.key === "Enter" || e.key === " ") {
      var at = pointAt(vw / 2, vh / 2);
      selectPoint(at.lat, at.lon);
    } else return;
    if (dx || dy) {
      grow();
      cx += dx;
      cy += dy;
    }
    e.preventDefault();
    render();
  }
  function onResize() {
    if (!overlay || overlay.className.indexOf("mapview-shown") === -1) {
      return;
    }
    measure();
    render();
  }

  /* ---- The panel --------------------------------------------------- */
  function build() {
    overlay = document.createElement("div");
    overlay.className = "mapview";

    panelEl = document.createElement("div");
    panelEl.className = "mapview-panel";
    panelEl.setAttribute("role", "dialog");
    panelEl.setAttribute("aria-modal", "true");
    panelEl.setAttribute("aria-labelledby", "mapviewTitle");

    var head = document.createElement("div");
    head.className = "mapview-head";
    titleWrap = document.createElement("div");
    titleWrap.className = "mapview-titlewrap";
    // The head is the only thing that says what was picked, and a
    // reader who picked it with the keyboard never saw the map move.
    titleWrap.setAttribute("aria-live", "polite");
    titleEl = document.createElement("div");
    titleEl.className = "mapview-title";
    titleEl.id = "mapviewTitle";
    subEl = document.createElement("div");
    subEl.className = "mapview-sub";
    titleWrap.appendChild(titleEl);
    titleWrap.appendChild(subEl);

    actions = document.createElement("div");
    actions.className = "mapview-actions";
    // The recommended way out, and the reason the other one asks
    // first. On a phone this is also the closest thing to opening the
    // Yandex Maps app directly: a page has no way to ask what is
    // installed, but both platforms let an app claim its own site's
    // links, so an https://yandex.com/maps/… address lands in the app
    // when it is there and in the browser when it isn't. No probing,
    // nothing to fail — which is why it is a plain link.
    yaLink = document.createElement("a");
    yaLink.className = "mapview-out mapview-out-primary";
    yaLink.rel = "noopener";
    // Only the desktop links really open a page, and only they get a
    // new tab: a handoff to an app would leave an empty one behind.
    if (!IS_ANDROID && !IS_IOS) yaLink.target = "_blank";
    yaLink.textContent = "Open in Yandex Maps ↗";
    // A button, not a link: it opens the dialog below, and the link
    // it eventually follows lives in there.
    outBtn = document.createElement("button");
    outBtn.className = "mapview-out";
    outBtn.type = "button";
    outBtn.setAttribute("aria-haspopup", "dialog");
    outBtn.setAttribute("aria-expanded", "false");
    outBtn.textContent = "Open in different maps";
    actions.appendChild(yaLink);
    actions.appendChild(outBtn);

    closeBtn = document.createElement("button");
    closeBtn.className = "mapview-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close map preview");
    closeBtn.appendChild(icon(ICON_CLOSE));
    head.appendChild(titleWrap);
    head.appendChild(actions);
    head.appendChild(closeBtn);

    var body = document.createElement("div");
    body.className = "mapview-body";
    mapEl = document.createElement("div");
    mapEl.className = "mapview-map";
    mapEl.tabIndex = 0;
    mapEl.setAttribute("role", "group");
    mapEl.setAttribute(
      "aria-label",
      "Map. Arrow keys pan, plus and minus zoom, Enter picks the point " +
        "at the centre.",
    );
    wrapEl = document.createElement("div");
    wrapEl.className = "mapview-wrap";
    spotsEl = document.createElement("div");
    spotsEl.className = "mapview-spots";
    wrapEl.appendChild(spotsEl);
    pinsEl = document.createElement("div");
    pinsEl.className = "mapview-pins";
    // Buttons rather than plain marks: picking one is the way back to
    // a cleared entry, and a reader on a keyboard needs that as much
    // as anyone. Their aria-labels are set with the selection, since
    // that is when there is something to call them.
    entryPin = document.createElement("button");
    entryPin.type = "button";
    entryPin.className = "mapview-pin mapview-pin-entry";
    pickPin = document.createElement("button");
    pickPin.type = "button";
    pickPin.className = "mapview-pin mapview-pin-pick";
    pickPin.style.display = "none";
    entryPin.addEventListener("click", selectEntry);
    pickPin.addEventListener("click", function () {
      if (!pick) return;
      sel = "pick";
      showSelection();
    });
    pinsEl.appendChild(entryPin);
    pinsEl.appendChild(pickPin);
    wrapEl.appendChild(pinsEl);
    mapEl.appendChild(wrapEl);

    var tools = document.createElement("div");
    tools.className = "mapview-tools";
    zoomInBtn = document.createElement("button");
    zoomInBtn.type = "button";
    zoomInBtn.appendChild(icon(ICON_IN));
    zoomInBtn.setAttribute("aria-label", "Zoom in");
    zoomOutBtn = document.createElement("button");
    zoomOutBtn.type = "button";
    zoomOutBtn.appendChild(icon(ICON_OUT));
    zoomOutBtn.setAttribute("aria-label", "Zoom out");
    tools.appendChild(zoomInBtn);
    tools.appendChild(zoomOutBtn);
    // Only offered where the browser can answer it at all. Over
    // file:// — which is what a saved snapshot would be, if the panel
    // ran there — the API is missing outright rather than refusing,
    // and a button that cannot work should not be drawn.
    if (navigator.geolocation) {
      locateBtn = document.createElement("button");
      locateBtn.type = "button";
      locateBtn.className = "mapview-locate is-apart";
      locateBtn.appendChild(icon(ICON_LOCATE));
      locateBtn.setAttribute("aria-label", "Show my location");
      locateBtn.title = "Show my location";
      tools.appendChild(locateBtn);
    }
    // Sits with the map's own controls rather than with the two ways
    // out, because it acts on the map — and it is only there when
    // there is something on the map to take away.
    clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className =
      "mapview-clear is-off" + (locateBtn ? "" : " is-apart");
    clearBtn.appendChild(icon(ICON_CLEAR));
    clearBtn.setAttribute("aria-label", "Clear the picked point");
    clearBtn.title = "Clear the picked point";
    tools.appendChild(clearBtn);
    mapEl.appendChild(tools);

    popupEl = document.createElement("div");
    popupEl.className = "mapview-pop tail-bottom";
    popupEl.style.display = "none";
    popScroll = document.createElement("div");
    popScroll.className = "mapview-pop-scroll";
    popTail = document.createElement("div");
    popTail.className = "mapview-pop-tail";
    popClose = document.createElement("button");
    popClose.type = "button";
    popClose.className = "mapview-pop-close";
    popClose.setAttribute("aria-label", "Close this entry");
    popClose.appendChild(icon(ICON_CLOSE));
    // The head's pair again, at the card. Built once and put back
    // under each clone rather than cloned with it, so they carry
    // their listeners and nothing has to be rebound per entry. They
    // are aimed at the card's own entry, not at the selection, and
    // say so by name.
    popActions = document.createElement("div");
    popActions.className = "mapview-pop-actions";
    popYa = document.createElement("a");
    popYa.className = "mapview-out mapview-out-primary";
    popYa.rel = "noopener";
    if (!IS_ANDROID && !IS_IOS) popYa.target = "_blank";
    popYa.textContent = "Open in Yandex Maps ↗";
    popOut = document.createElement("button");
    popOut.className = "mapview-out";
    popOut.type = "button";
    popOut.setAttribute("aria-haspopup", "dialog");
    popOut.setAttribute("aria-expanded", "false");
    popOut.textContent = "Open in different maps";
    popActions.appendChild(popYa);
    popActions.appendChild(popOut);
    popupEl.appendChild(popScroll);
    popupEl.appendChild(popTail);
    popupEl.appendChild(popClose);
    mapEl.appendChild(popupEl);

    hintEl = document.createElement("div");
    hintEl.className = "mapview-hint";
    mapEl.appendChild(hintEl);
    hintDefault();

    meHalo = document.createElement("div");
    meHalo.className = "mapview-me-halo";
    meHalo.style.display = "none";
    meDot = document.createElement("div");
    meDot.className = "mapview-me";
    meDot.style.display = "none";
    // Under the pins: a place the reader was looking for should never
    // be covered by the dot saying where they happen to be standing.
    pinsEl.insertBefore(meHalo, entryPin);
    pinsEl.insertBefore(meDot, entryPin);

    note = document.createElement("div");
    note.className = "mapview-note";
    note.textContent = LOADING;
    // The note goes in after the map so it covers it: an empty tile
    // grid reads as a map that arrived blank.
    body.appendChild(mapEl);
    body.appendChild(note);

    // The second dialog. Terse on purpose: it is standing between a
    // reader and a button they already pressed, so it gets one
    // sentence of reason and one of consequence, and then gets out of
    // the way.
    askBox = document.createElement("div");
    askBox.className = "mapview-confirm";
    var box = document.createElement("div");
    box.className = "mapview-confirm-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "mapviewConfirmTitle");
    box.setAttribute("aria-describedby", "mapviewConfirmText");
    var cTitle = document.createElement("div");
    cTitle.className = "mapview-confirm-title";
    cTitle.id = "mapviewConfirmTitle";
    cTitle.textContent = "Use a different map?";
    var cText = document.createElement("div");
    cText.className = "mapview-confirm-text";
    cText.id = "mapviewConfirmText";
    cText.textContent =
      "The map above is enough to show where something is, but Yandex " +
      "Maps is the best-surveyed one for Vanadzor and for Armenia " +
      "generally, and the one this index was checked against — other " +
      "maps often have the place under an old name, in the wrong " +
      "spot, or not at all. Continuing opens a plain point at these " +
      "coordinates, with no listing behind it.";
    var cRow = document.createElement("div");
    cRow.className = "mapview-confirm-row";
    cancelBtn = document.createElement("button");
    cancelBtn.className = "mapview-out";
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    // The real destination sits on an anchor rather than behind a
    // scripted navigation: a link is what hands a geo: or a
    // maps.apple.com address to an app cleanly, and it is what a
    // reader can long-press, copy or open in a new tab.
    goLink = document.createElement("a");
    goLink.className = "mapview-out mapview-out-primary";
    goLink.rel = "noopener";
    if (!IS_ANDROID && !IS_IOS) goLink.target = "_blank";
    goLink.textContent = "Continue ↗";
    cRow.appendChild(cancelBtn);
    cRow.appendChild(goLink);
    box.appendChild(cTitle);
    box.appendChild(cText);
    box.appendChild(cRow);
    askBox.appendChild(box);
    body.appendChild(askBox);

    // OpenStreetMap's licence asks for the credit, and the geocoder
    // is worth naming too: it is the other thing being asked, and it
    // is asked on the reader's behalf.
    var credit = document.createElement("div");
    credit.className = "mapview-credit";
    credit.appendChild(document.createTextNode("Map data © "));
    var osmLink = document.createElement("a");
    osmLink.href = "https://www.openstreetmap.org/copyright";
    osmLink.rel = "noopener";
    osmLink.target = "_blank";
    osmLink.textContent = "OpenStreetMap contributors";
    credit.appendChild(osmLink);
    credit.appendChild(
      document.createTextNode(". Place names from Nominatim."),
    );

    panelEl.appendChild(head);
    panelEl.appendChild(body);
    panelEl.appendChild(credit);
    overlay.appendChild(panelEl);
    document.body.appendChild(overlay);

    closeBtn.addEventListener("click", close);
    // Either way of asking the question clears the card out of the
    // way of the answer — the head's button at the top of the panel
    // and the card's own, at the bottom of the card.
    outBtn.addEventListener("click", function () {
      var on = current();
      if (on) holdPopup();
      openConfirm(outBtn, on);
    });
    popOut.addEventListener("click", function () {
      if (popSpot) holdPopup();
      openConfirm(popOut, popHeld);
    });
    clearBtn.addEventListener("click", clearSelection);
    cancelBtn.addEventListener("click", closeConfirm);
    zoomInBtn.addEventListener("click", function () {
      zoomTo(zoom + 1);
    });
    zoomOutBtn.addEventListener("click", function () {
      zoomTo(zoom - 1);
    });
    if (locateBtn) locateBtn.addEventListener("click", locate);
    popClose.addEventListener("click", closePopup);
    mapEl.addEventListener("pointerdown", onPointerDown);
    mapEl.addEventListener("pointermove", onPointerMove);
    mapEl.addEventListener("pointerup", onPointerUp);
    mapEl.addEventListener("pointercancel", onPointerUp);
    mapEl.addEventListener("wheel", onWheel, { passive: false });
    mapEl.addEventListener("keydown", onMapKey);
    // A drag that ends outside the map still ends the drag; without
    // this the map would keep following the pointer afterwards.
    mapEl.addEventListener("lostpointercapture", onPointerUp);
    // The two halves of swallowing the echo of a tap, both before
    // anything in the panel can act on it. Any press at all — on the
    // card, the tools, the head, the scrim, none of which start a
    // drag — is a new act by the reader, and the click it ends in is
    // theirs to have. The age check is for the tap the browser never
    // echoes, so a guard left standing cannot outlive the gesture
    // that set it.
    overlay.addEventListener(
      "pointerdown",
      function () {
        tapEcho = 0;
      },
      true,
    );
    overlay.addEventListener(
      "click",
      function (e) {
        if (!tapEcho) return;
        var stale = Date.now() - tapEcho > 700;
        tapEcho = 0;
        if (stale) return;
        e.stopPropagation();
        e.preventDefault();
      },
      true,
    );
    window.addEventListener("resize", onResize);
    // Following the link is the reader's answer; the dialog has no
    // reason to still be up behind the app it just handed them to,
    // or when they come back to the tab. The card it stood aside for
    // comes back the same way it does for Cancel — on a phone the
    // other map takes the whole screen and this one is left as it was
    // found, and on a desktop it opened in another tab, so returning
    // to this one should be returning to the entry.
    goLink.addEventListener("click", closeConfirm);
    // Same rule as the scrim outside: a click on the dark part is a
    // click on nothing, and dismisses.
    askBox.addEventListener("click", function (e) {
      if (e.target === askBox) closeConfirm();
    });
    // The scrim is the overlay itself; a click that lands on the panel
    // is a click inside the map and must be left alone.
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    // Tab is kept inside whichever dialog is on top, and while the
    // question is up the panel behind it is out of reach — that is
    // what makes it modal rather than decorative. The stops are
    // gathered fresh each time rather than listed once, since half of
    // them come and go with the selection and the zoom limits.
    overlay.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var stops = tabStops();
      var at = stops.indexOf(document.activeElement);
      if (at === -1) {
        // Focus wandered off — onto something that has since been
        // hidden, say. Pull it back to the top of the live dialog.
        e.preventDefault();
        stops[0].focus();
        return;
      }
      var next = e.shiftKey ? at - 1 : at + 1;
      if (next < 0) next = stops.length - 1;
      if (next >= stops.length) next = 0;
      e.preventDefault();
      stops[next].focus();
    });
  }

  function tabStops() {
    if (confirmOpen()) return [cancelBtn, goLink];
    var stops = [];
    if (sel) {
      stops.push(yaLink);
      stops.push(outBtn);
    }
    stops.push(closeBtn);
    stops.push(mapEl);
    if (popSpot) {
      stops.push(popClose);
      var inPop = popScroll.querySelectorAll("a, button");
      for (var p = 0; p < inPop.length; p++) stops.push(inPop[p]);
    }
    if (!zoomInBtn.disabled) stops.push(zoomInBtn);
    if (!zoomOutBtn.disabled) stops.push(zoomOutBtn);
    if (locateBtn) stops.push(locateBtn);
    if (sel) stops.push(clearBtn);
    // Last, and only when they are on the map: they are the way back
    // to a selection that has been cleared.
    if (entry) stops.push(entryPin);
    if (pick) stops.push(pickPin);
    return stops;
  }

  function confirmOpen() {
    return !!askBox && askBox.className.indexOf("is-open") !== -1;
  }

  // Asked for a particular place — whatever the head has selected
  // when it is the head asking, and the card's own entry when the
  // question comes from the card standing on the map.
  function openConfirm(from, on) {
    if (!askBox || !on) return;
    confirmFrom = from || outBtn;
    goLink.href = pointTarget(
      on.lat,
      on.lon,
      on.label || on.name || coordText(on.lat, on.lon),
    );
    askBox.className = "mapview-confirm is-open";
    confirmFrom.setAttribute("aria-expanded", "true");
    // Cancel takes the focus, not Continue: the dialog exists to make
    // leaving the better map a decision rather than a reflex.
    cancelBtn.focus();
  }

  function closeConfirm() {
    if (!askBox) return;
    var held = askBox.contains(document.activeElement);
    var from = confirmFrom;
    confirmFrom = null;
    askBox.className = "mapview-confirm";
    outBtn.setAttribute("aria-expanded", "false");
    popOut.setAttribute("aria-expanded", "false");
    // However the question was answered — Cancel, Continue, Escape, a
    // press on the scrim — the card that stood aside for it comes
    // back where it was: the reader was reading an entry before the
    // dialog interrupted, and none of those four answers is a reason
    // to take it away from them. Before the focus is handed over,
    // since the button it goes back to lives inside the card.
    if (popHeld) {
      var back = popHeld;
      popHeld = null;
      openPopup(back);
    }
    // display:none takes the focus with it, so hand it back to the
    // button that opened the dialog rather than to the document.
    if (held) {
      if (from === popOut && popSpot) popOut.focus();
      else if (sel) outBtn.focus();
      else closeBtn.focus();
    }
  }

  // The largest zoom that still holds a box inside the map's own
  // width and height — how the city view decides how far out to sit,
  // rather than picking a number that would be wrong on one screen or
  // the other.
  function zoomForBox(box, floor) {
    for (var z = MAX_ZOOM; z > floor; z--) {
      var span = TILE * pow2(z);
      var wide = ((box.east - box.west) / 360) * span;
      var tall = Math.abs(latToY(box.north, z) - latToY(box.south, z));
      if (wide <= vw && tall <= vh) return z;
    }
    return floor;
  }

  // Two points, both on screen with room to spare. The margin is
  // generous on purpose: a pin hangs above what it marks and the
  // accuracy ring spreads around it, so a box drawn tight to the
  // coordinates would clip both.
  function fitBoth(a, b) {
    var box = {
      south: Math.min(a.lat, b.lat),
      north: Math.max(a.lat, b.lat),
      west: Math.min(a.lon, b.lon),
      east: Math.max(a.lon, b.lon),
    };
    var padLat = (box.north - box.south) * 0.35 + 0.0008;
    var padLon = (box.east - box.west) * 0.35 + 0.0008;
    box.south -= padLat;
    box.north += padLat;
    box.west -= padLon;
    box.east += padLon;
    zoom = Math.min(zoomForBox(box, MIN_ZOOM), 17);
    centreOn((box.south + box.north) / 2, (box.west + box.east) / 2);
  }

  // Both ways in. An entry opens a glance at one address, with its
  // pin picked out; the plate opens the city with nothing picked and
  // nothing to describe until the reader picks it.
  function openEntry(link) {
    var card = link.closest ? link.closest(".card") : null;
    if (!parseGeo(card)) return;
    show(link, card);
  }
  function openCity(button) {
    show(button, null);
  }
  // The entry a card's map link refers to, as the marker already
  // standing for it on the map. Following the link should open that
  // marker, not drop a second mark of its own at the same spot.
  function spotForCard(card) {
    if (!spots || !card) return null;
    for (var i = 0; i < spots.length; i++) {
      if (spots[i].card === card) return spots[i];
    }
    return null;
  }
  // Personal contacts are kept off the map, so a card that is one has
  // no marker to open and gets a record — and a pin — of its own.
  function loneEntry(card) {
    var geo = parseGeo(card);
    var name = placeName(card);
    var href = null;
    var links = card.querySelectorAll(".card-row a");
    for (var i = 0; i < links.length; i++) {
      if (isMapLink(links[i])) {
        href = links[i].href;
        break;
      }
    }
    return {
      card: card,
      lat: geo.lat,
      lon: geo.lon,
      name: name,
      label: shortLabel(name),
      addr: cardAddress(card),
      href: href,
      el: null,
    };
  }

  function show(from, card) {
    if (!overlay) build();

    lastFocus = from;
    collectSpots();
    var at = card ? spotForCard(card) || loneEntry(card) : null;
    entry = at;
    pick = null;
    me = null;
    sel = at ? "entry" : null;
    if (locateBtn) {
      locateBtn.className = "mapview-locate is-apart";
      locateBtn.disabled = false;
    }
    resetMap();
    closePopup();
    // Whatever was being read last time is not what is being opened
    // now, so nothing is owed a card back.
    popHeld = null;
    spotZoom = -1;
    spotSel = null;
    placePin(pickPin, null);
    placeMe();
    clearTimeout(hintTimer);
    // Cleared as well as stopped: a pending message left named here
    // would make every later hintDefault think the line was still
    // borrowed, and the invitation would never be drawn again.
    hintTimer = null;
    hintDefault();
    closeConfirm();
    note.style.display = "";
    note.textContent = LOADING;

    // Hand back exactly the width the scrollbar gives up, so the page
    // behind the scrim doesn't jump wider as it locks.
    var gutter = window.innerWidth - document.documentElement.clientWidth;
    if (gutter > 0) {
      document.documentElement.style.paddingRight = gutter + "px";
    }
    document.documentElement.classList.add("mapview-open");
    // The city map is the whole screen from the start; an entry's is
    // a window over the page until the reader moves it.
    isFull = !at;
    overlay.className =
      "mapview mapview-shown is-instant" + (isFull ? " is-full" : "");
    // Measured only now: the panel has to be laid out before it can
    // be asked how big its map is, and neither the first tile nor the
    // city's zoom can be chosen before that is known.
    measure();
    zoom = at ? START_ZOOM : zoomForBox(CITY, CITY_MIN_ZOOM);
    centreOn(at ? at.lat : CITY.lat, at ? at.lon : CITY.lon);
    render();
    showSelection();
    // Opened from a card, the panel opens that card too: the marker
    // is picked out and its own entry stands over it, which is what
    // tapping the marker would have done.
    if (at) openPopup(at);
    // The size is taken; let the panel animate again, so the next
    // pan can grow it.
    if (window.requestAnimationFrame) {
      requestAnimationFrame(function () {
        if (overlay) overlay.classList.remove("is-instant");
      });
    } else {
      overlay.classList.remove("is-instant");
    }
    // Nothing fires when tiles simply never arrive — a dead
    // connection leaves the note reading "loading" forever. Say so
    // instead, and point at the link that still works.
    clearTimeout(waitTimer);
    waitTimer = setTimeout(function () {
      // The second half of that sentence points at a link that is
      // only there when something is picked out.
      note.textContent = sel ? FAILED : FAILED_BARE;
    }, 8000);
    // Focusable on this tick, not after the fade — see the transition
    // on .mapview in the stylesheet.
    closeBtn.focus();
  }

  // The tiles come from somewhere else, so every open starts with DNS
  // and TLS before an image can even be asked for. Hovering, touching
  // or tabbing to a map link is enough intent to open that socket
  // early, and costs nothing for a reader who never opens one. The
  // geocoder is left out: it is only ever reached after a tap inside
  // a panel that is already up, by which time there is no wait worth
  // saving.
  function warmConnections() {
    if (warmed) return;
    warmed = true;
    for (var w = 0; w < WARM_HOSTS.length; w++) {
      var hint = document.createElement("link");
      hint.rel = "preconnect";
      hint.href = WARM_HOSTS[w];
      document.head.appendChild(hint);
    }
  }

  function onIntent(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("a.map-preview") || t.closest(".plate-open")) {
      warmConnections();
    }
  }

  function close() {
    if (!overlay) return;
    clearTimeout(waitTimer);
    clearTimeout(geoTimer);
    geoToken++;
    if (geoReq) {
      geoReq.onload = null;
      geoReq.onerror = null;
      geoReq.ontimeout = null;
      geoReq.abort();
      geoReq = null;
    }
    clearTimeout(hintTimer);
    clearTimeout(growTimer);
    closePopup();
    popHeld = null;
    // Back to a window over the page, whichever way it was opened:
    // the next card to be tapped is a glance again.
    isFull = false;
    overlay.className = "mapview";
    me = null;
    // Reset rather than closeConfirm(): the focus is owed to the card
    // link below, not to a button in a panel that is on its way out.
    if (askBox) {
      askBox.className = "mapview-confirm";
      outBtn.setAttribute("aria-expanded", "false");
    }
    document.documentElement.classList.remove("mapview-open");
    document.documentElement.style.paddingRight = "";
    // Dropping the tiles stops whatever is still in flight and hands
    // back the images; a closed panel has no use for either.
    resetMap();
    pointers = {};
    drag = null;
    pinch = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  // Every map link on a card that knows where it is. The one that
  // doesn't — a Google short link with no coordinates behind it —
  // keeps the plain outbound behaviour, as does every other link in a
  // row: phones, sites, socials.
  function isMapLink(a) {
    return /^https:\/\/(yandex\.com\/maps|maps\.app\.goo\.gl)/.test(
      a.href,
    );
  }
  var links = document.querySelectorAll(".card-row a");
  for (var i = 0; i < links.length; i++) {
    if (!isMapLink(links[i])) continue;
    if (!parseGeo(links[i].closest ? links[i].closest(".card") : null)) {
      continue;
    }
    links[i].className = (links[i].className + " map-preview").replace(
      /^\s+/,
      "",
    );
    links[i].setAttribute("aria-haspopup", "dialog");
  }

  var cityBtn = document.getElementById("cityMapBtn");
  if (cityBtn) {
    cityBtn.addEventListener("click", function () {
      openCity(cityBtn);
    });
  }

  // A pointer covers mouse and touch alike on anything current;
  // touchstart is the older browsers' version of the same signal, and
  // focusin is the keyboard's.
  document.addEventListener("pointerover", onIntent);
  document.addEventListener("touchstart", onIntent);
  document.addEventListener("focusin", onIntent);

  document.addEventListener("click", function (e) {
    var target = e.target;
    if (!target || !target.closest) return;
    var link = target.closest("a.map-preview");
    if (!link) return;
    // A deliberate new tab or window, or a non-primary button, is the
    // reader asking for the real thing. Let the browser have it.
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return;
    e.preventDefault();
    openEntry(link);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !overlay) return;
    if (overlay.className.indexOf("mapview-shown") === -1) return;
    // One dialog at a time: Escape dismisses the question first and
    // the panel behind it only on a second press.
    if (confirmOpen()) {
      closeConfirm();
      return;
    }
    if (popSpot) {
      closePopup();
      return;
    }
    close();
  });
})();
