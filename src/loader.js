import { FILES } from "./constants.js";

export function initLoader(onComplete) {
  var urls = Object.keys(FILES).map(function(key) {
    return FILES[key];
  });
  var loadingText = document.getElementById("loading").querySelector("span");
  var completedCount = 0;
  var totalCount = urls.length;

  function onImageDone() {
    completedCount += 1;
    var pct = Math.floor((completedCount / totalCount) * 100);
    loadingText.textContent = pct + "%";
    if (completedCount >= totalCount) {
      document.getElementById("loading").classList.add("hidden");
      onComplete();
    }
  }

  urls.forEach(function(url) {
    var img = new Image();
    img.onload = onImageDone;
    img.onerror = onImageDone;
    img.src = url;
  });
}
