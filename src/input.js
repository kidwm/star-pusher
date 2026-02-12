import Hammer from "./hammer.js";
import { TILEWIDTH, TILEFLOORHEIGHT, UP, DOWN, LEFT, RIGHT } from "./constants.js";

export function initTouchUI(control, touch) {
  if (window.Touch || "ontouchstart" in window) {
    touch.classList.add("show");
  } else {
    control.classList.add("show");
  }
}

export function initHammer(element, onDirection) {
  var hammer = new Hammer(element);
  document.ontouchmove = function(event) {
    if (event.touches.length == 1) {
      event.preventDefault(); // Disables touch-scrolling AND pinch-to-zoom when called here.
    }
  };
  hammer.onswipe = function(ev) {
    switch (ev.direction) {
      case "left":
        onDirection(LEFT);
        break;
      case "up":
        onDirection(UP);
        break;
      case "right":
        onDirection(RIGHT);
        break;
      case "down":
        onDirection(DOWN);
        break;
    }
  };
  return hammer;
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

export function getMoveFromClick(ev, stage) {
  var clickx = ev.pageX ? Math.floor((ev.pageX - stage.offsetLeft) / TILEWIDTH) : ev.x;
  var clicky = ev.pageY
    ? Math.floor((ev.pageY - stage.offsetTop - 20) / TILEFLOORHEIGHT)
    : ev.y;
  return { clickx, clicky };
}
