import { TILEWIDTH, TILEHEIGHT, TILEFLOORHEIGHT } from "./constants.js";

export function initTouchUI(control, touch) {
  if (window.Touch || "ontouchstart" in window) {
    touch.classList.add("show");
  } else {
    control.classList.add("show");
  }
}

export function bindUIControls(options) {
  var title = options.title;
  var splash = options.splash;
  var info = options.info;
  var stage = options.stage;
  var resetButton = options.resetButton;
  var nextButton = options.nextButton;
  var prevButton = options.prevButton;
  var undoButton = options.undoButton;
  var onRun = options.onRun;
  var onMove = options.onMove;
  var onEgg = options.onEgg;

  title.addEventListener("click", onRun, false);
  splash.addEventListener("click", onRun, false);
  stage.addEventListener(
    "click",
    function(ev) {
      onMove(ev);
    },
    false
  );
  info.querySelector("span").addEventListener("click", onEgg, false);
  resetButton.addEventListener(
    "click",
    function() {
      onRun(27);
    },
    false
  );
  nextButton.addEventListener(
    "click",
    function() {
      onRun(78);
    },
    false
  );
  prevButton.addEventListener(
    "click",
    function() {
      onRun(66);
    },
    false
  );
  undoButton.addEventListener(
    "click",
    function() {
      onRun(8);
    },
    false
  );
}

export function bindPanControls(stage, options) {
  var isPanning = false;
  var lastX = 0;
  var lastY = 0;
  var moved = false;
  var canPan = options.canPan;
  var onPan = options.onPan;
  var onPanEnd = options.onPanEnd;

  stage.addEventListener("pointerdown", function(ev) {
    if (!canPan()) {
      return;
    }
    isPanning = true;
    moved = false;
    lastX = ev.clientX;
    lastY = ev.clientY;
    stage.setPointerCapture(ev.pointerId);
  });

  stage.addEventListener("pointermove", function(ev) {
    if (!isPanning) {
      return;
    }
    var dx = ev.clientX - lastX;
    var dy = ev.clientY - lastY;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      moved = true;
      onPan(dx, dy);
    }
    lastX = ev.clientX;
    lastY = ev.clientY;
  });

  stage.addEventListener("pointerup", function(ev) {
    if (!isPanning) {
      return;
    }
    isPanning = false;
    stage.releasePointerCapture(ev.pointerId);
    if (moved) {
      onPanEnd();
    }
  });

  stage.addEventListener("wheel", function(ev) {
    if (!canPan()) {
      return;
    }
    ev.preventDefault();
    onPan(-ev.deltaX, -ev.deltaY);
    onPanEnd();
  }, { passive: false });
}

export function getMoveFromClick(ev, stage, cameraX, cameraY) {
  var rect = stage.getBoundingClientRect();
  var screenX = ev.clientX - rect.left;
  var screenY = ev.clientY - rect.top;
  var worldX = screenX + cameraX;
  // Row spacing uses TILEFLOORHEIGHT, but the sprite is taller.
  // Use half overlap bias to avoid pushing lower tile area to next row.
  var rowPickBiasY = Math.floor((TILEHEIGHT - TILEFLOORHEIGHT) / 2);
  var worldY = screenY + cameraY - rowPickBiasY;
  var clickx = Math.floor(worldX / TILEWIDTH);
  var clicky = Math.floor(worldY / TILEFLOORHEIGHT);
  return { clickx, clicky };
}
