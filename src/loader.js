import { PxLoader } from "./pxloader.js";
import { FILES } from "./constants.js";

export function initLoader(onComplete) {
  var loader = new PxLoader();
  Object.keys(FILES).forEach(function(key) {
    loader.addImage(FILES[key]);
  });
  loader.addProgressListener(function(e) {
    if (e.completedCount * 6 < 100) {
      document.getElementById("loading").querySelector("span").textContent =
        e.completedCount * 6 + "%";
    }
  });
  loader.addCompletionListener(function() {
    document.getElementById("loading").classList.add("hidden");
    onComplete();
  });
  loader.start();
  return loader;
}
