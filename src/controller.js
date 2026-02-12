import { TILEWIDTH, TILEFLOORHEIGHT } from "./constants.js";

export function createGameActions(options) {
  var dom = options.dom;
  var render = options.render;
  var assets = options.assets;
  var store = options.store;
  var logic = options.logic;
  var pathing = options.pathing;
  var audio = options.audio;
  var input = options.input;
  var directions = options.directions;
  var keys = options.keys;
  var cameraFollowRaf = null;
  var cameraTargetX = 0;
  var cameraTargetY = 0;

  function updateCameraBounds() {
    var viewportWidth = Math.min(assets.map.width, document.documentElement.clientWidth);
    var viewportHeight = Math.min(assets.map.height, document.documentElement.clientHeight);
    store.maxCameraX = Math.max(0, assets.map.width - viewportWidth);
    store.maxCameraY = Math.max(0, assets.map.height - viewportHeight);
  }

  function clampCamera() {
    updateCameraBounds();
    store.cameraX = Math.max(0, Math.min(store.cameraX, store.maxCameraX));
    store.cameraY = Math.max(0, Math.min(store.cameraY, store.maxCameraY));
    cameraTargetX = Math.max(0, Math.min(cameraTargetX, store.maxCameraX));
    cameraTargetY = Math.max(0, Math.min(cameraTargetY, store.maxCameraY));
  }

  function redraw() {
    render.drawStage(
      assets.stage,
      assets.position,
      assets.map,
      store.mapObj,
      store.levelObj,
      store.currentImage,
      assets.images,
      assets.tileMapping,
      assets.playerImages,
      logic.hasItem,
      store
    );
  }

  function stopCameraFollow() {
    if (cameraFollowRaf != null) {
      window.cancelAnimationFrame(cameraFollowRaf);
      cameraFollowRaf = null;
    }
  }

  function animateCameraFollow() {
    clampCamera();
    var dx = cameraTargetX - store.cameraX;
    var dy = cameraTargetY - store.cameraY;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      store.cameraX = cameraTargetX;
      store.cameraY = cameraTargetY;
      redraw();
      stopCameraFollow();
      return;
    }
    store.cameraX += dx * 0.2;
    store.cameraY += dy * 0.2;
    redraw();
    cameraFollowRaf = window.requestAnimationFrame(animateCameraFollow);
  }

  function setCameraTarget(nextX, nextY, smooth) {
    clampCamera();
    cameraTargetX = Math.max(0, Math.min(nextX, store.maxCameraX));
    cameraTargetY = Math.max(0, Math.min(nextY, store.maxCameraY));
    if (!smooth) {
      stopCameraFollow();
      store.cameraX = cameraTargetX;
      store.cameraY = cameraTargetY;
      redraw();
      return;
    }
    if (cameraFollowRaf == null) {
      cameraFollowRaf = window.requestAnimationFrame(animateCameraFollow);
    }
  }

  function panBy(deltaX, deltaY) {
    clampCamera();
    setCameraTarget(store.cameraX - deltaX, store.cameraY - deltaY, false);
  }

  function canPan() {
    clampCamera();
    return store.maxCameraX > 0 || store.maxCameraY > 0;
  }

  function keepPlayerInView(smooth) {
    if (!store.levelObj || !store.levelObj["startState"]) {
      return;
    }
    clampCamera();
    var viewportWidth = Math.min(assets.map.width, document.documentElement.clientWidth);
    var viewportHeight = Math.min(assets.map.height, document.documentElement.clientHeight);
    var player = store.levelObj["startState"]["player"];
    var playerPixelX = player[0] * TILEWIDTH + TILEWIDTH / 2;
    var playerPixelY = player[1] * TILEFLOORHEIGHT + TILEFLOORHEIGHT / 2;
    var marginX = Math.max(40, Math.floor(viewportWidth * 0.25));
    var marginY = Math.max(40, Math.floor(viewportHeight * 0.25));
    var baseCameraX = cameraTargetX;
    var baseCameraY = cameraTargetY;
    var nextCameraX = baseCameraX;
    var nextCameraY = baseCameraY;
    var leftBound = baseCameraX + marginX;
    var rightBound = baseCameraX + viewportWidth - marginX;
    var topBound = baseCameraY + marginY;
    var bottomBound = baseCameraY + viewportHeight - marginY;

    if (playerPixelX < leftBound) {
      nextCameraX = playerPixelX - marginX;
    } else if (playerPixelX > rightBound) {
      nextCameraX = playerPixelX - (viewportWidth - marginX);
    }

    if (playerPixelY < topBound) {
      nextCameraY = playerPixelY - marginY;
    } else if (playerPixelY > bottomBound) {
      nextCameraY = playerPixelY - (viewportHeight - marginY);
    }
    setCameraTarget(nextCameraX, nextCameraY, smooth !== false);
  }

  function run(ev) {
    var key = ev.which ? ev.which : ev;
    store.playerMoveTo = null;
    var gameStateObj = store.levelObj["startState"];

    if (!dom.title.classList.contains("hidden")) {
      audio.playSound("intro");
      document.getElementById("control").classList.add("enable");
      dom.title.classList.add("hidden");
      reset();
      return;
    }

    if (store.levelIsComplete) {
      store.currentLevelIndex += 1;
      if (store.currentLevelIndex >= store.levels.length) {
        store.currentLevelIndex = 0;
      }
      reset();
      dom.splash.classList.add("hidden");
      store.levelIsComplete = false;
      return;
    }

    if (keys.movement.indexOf(ev.which) >= 0) {
      ev.preventDefault();
      if (store.moving) {
        return;
      }
    }

    switch (key) {
      case keys.codes.BACKSPACE:
        if (store.levelObj["steps"].length > 1) {
          store.levelObj["steps"].pop();
          store.levelObj["startState"] = structuredClone(
            store.levelObj["steps"][store.levelObj["steps"].length - 1]
          );
          store.mapNeedsRedraw = true;
        }
        break;
      case keys.codes.ESC:
        reset();
        audio.playSound("select");
        break;
      case keys.codes.LEFT:
        store.playerMoveTo = directions.LEFT;
        store.currentImage = 2;
        break;
      case keys.codes.UP:
        store.playerMoveTo = directions.UP;
        store.currentImage = 1;
        break;
      case keys.codes.RIGHT:
        store.playerMoveTo = directions.RIGHT;
        store.currentImage = 3;
        break;
      case keys.codes.DOWN:
        store.playerMoveTo = directions.DOWN;
        store.currentImage = 0;
        break;
      case keys.codes.B:
        prev();
        audio.playSound("select");
        break;
      case keys.codes.N:
        next();
        audio.playSound("select");
        break;
    }

    if (store.playerMoveTo != null && !store.levelIsComplete) {
      var moved = logic.makeMove(store.mapObj, gameStateObj, store.playerMoveTo, {
        isWall: logic.isWall,
        isBlocked: logic.isBlocked,
        hasItem: logic.hasItem,
        playSound: audio.playSound,
        goals: store.levelObj["goals"]
      });
      if (moved) {
        if (!store.moving) {
          store.levelObj["steps"].push(structuredClone(gameStateObj));
        }
        keepPlayerInView();
        store.mapNeedsRedraw = true;
      }
      if (logic.isLevelFinished(store.levelObj, gameStateObj)) {
        store.levelIsComplete = true;
        dom.splash.classList.remove("hidden");
        audio.playSound("applause");
      }
    }

    if (store.mapNeedsRedraw) {
      redraw();
      store.mapNeedsRedraw = false;
    }
  }

  function reset() {
    store.levelObj = structuredClone(store.levels[store.currentLevelIndex]);
    store.mapObj = store.levelObj["mapObj"];
    store.currentImage = 0;
    store.cameraX = 0;
    store.cameraY = 0;
    cameraTargetX = 0;
    cameraTargetY = 0;
    store.gridCache = null;
    dom.info.querySelector("span").textContent = store.currentLevelIndex;
    render.drawMap(
      assets.map,
      assets.platform,
      store.mapObj,
      assets.tileMapping,
      assets.outsideDecoMapping
    );
    keepPlayerInView(false);
  }

  function prev() {
    store.currentLevelIndex =
      store.currentLevelIndex - 1 < 0
        ? store.levels.length - 1
        : store.currentLevelIndex - 1;
    reset();
  }

  function next() {
    store.currentLevelIndex =
      store.currentLevelIndex + 1 >= store.levels.length
        ? 0
        : store.currentLevelIndex + 1;
    reset();
  }

  function move(ev) {
    if (store.suppressNextClick) {
      store.suppressNextClick = false;
      return;
    }

    var intent = pathing.getClickIntent({
      store: store,
      stage: assets.stage,
      ev: ev,
      getMoveFromClick: input.getMoveFromClick,
      isBlocked: logic.isBlocked,
      keyCodes: keys.codes,
      getPath: function(clickx, clicky, playerx, playery) {
        return pathing.buildPathForTarget({
          store: store,
          logic: logic,
          clickx: clickx,
          clicky: clicky,
          playerx: playerx,
          playery: playery
        });
      }
    });

    if (intent.kind == "direct") {
      run(intent.keyCode);
    } else if (intent.kind == "path") {
      pathing.followPath(intent.path, {
        store: store,
        keyCodes: keys.codes,
        runMoveByKey: run
      });
    }
  }

  function start(options) {
    var bindUIControls = options.bindUIControls;
    var toggleFullscreen = options.toggleFullscreen;
    var animationState = options.animationState;
    var cloudRenderer = options.cloudRenderer;

    dom.title.classList.remove("hidden");
    dom.info.classList.remove("hidden");
    reset();
    document.addEventListener("keydown", run, false);
    bindUIControls({
      title: dom.title,
      splash: dom.splash,
      info: dom.info,
      stage: assets.stage,
      resetButton: dom.resetButton,
      nextButton: dom.nextButton,
      prevButton: dom.prevButton,
      undoButton: dom.undoButton,
      onRun: function(ev) {
        if (!store.moving) {
          run(ev);
        }
      },
      onMove: function(ev) {
        if (!store.moving) {
          move(ev);
        }
      },
      onEgg: function() {
        if (confirm("Open Animation?")) {
          animationState.enabled = true;
          cloudRenderer.drawCloud();
        } else {
          animationState.enabled = false;
        }
      }
    });

    if (
      typeof document.cancelFullScreen != "undefined" ||
      typeof document.mozCancelFullScreen != "undefined" ||
      typeof document.webkitCancelFullScreen != "undefined"
    ) {
      dom.fullscreen.addEventListener("click", toggleFullscreen, false);
      dom.fullscreen.classList.add("show");
    }
  }

  return {
    run: run,
    reset: reset,
    prev: prev,
    next: next,
    move: move,
    panBy: panBy,
    canPan: canPan,
    start: start
  };
}
