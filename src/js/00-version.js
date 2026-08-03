var VANADZOR_VERSION = "1.2.0";

(function () {
  var versionEl = document.getElementById("versionTag");
  if (versionEl) {
    versionEl.textContent = "v" + VANADZOR_VERSION;
  }
})();
