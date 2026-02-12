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

  function panBy(deltaX, deltaY) {
    clampCamera();
    store.cameraX = Math.max(0, Math.min(store.cameraX - deltaX, store.maxCameraX));
    store.cameraY = Math.max(0, Math.min(store.cameraY - deltaY, store.maxCameraY));
    redraw();
  }

  function canPan() {
    clampCamera();
    return store.maxCameraX > 0 || store.maxCameraY > 0;
  }

  function keepPlayerInView() {
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
    var leftBound = store.cameraX + marginX;
    var rightBound = store.cameraX + viewportWidth - marginX;
    var topBound = store.cameraY + marginY;
    var bottomBound = store.cameraY + viewportHeight - marginY;

    if (playerPixelX < leftBound) {
      store.cameraX = playerPixelX - marginX;
    } else if (playerPixelX > rightBound) {
      store.cameraX = playerPixelX - (viewportWidth - marginX);
    }

    if (playerPixelY < topBound) {
      store.cameraY = playerPixelY - marginY;
    } else if (playerPixelY > bottomBound) {
      store.cameraY = playerPixelY - (viewportHeight - marginY);
    }

    clampCamera();
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
    store.gridCache = null;
    dom.info.querySelector("span").textContent = store.currentLevelIndex;
    render.drawMap(
      assets.map,
      assets.platform,
      store.mapObj,
      assets.tileMapping,
      assets.outsideDecoMapping
    );
    keepPlayerInView();
    redraw();
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

    var coords = input.getMoveFromClick(ev, assets.stage, store.cameraX, store.cameraY);
    var clickx = coords.clickx;
    var clicky = coords.clicky;
    var playerx = store.levelObj["startState"]["player"][0];
    var playery = store.levelObj["startState"]["player"][1];

    if (clickx == playerx - 1 && clicky == playery) {
      run(keys.codes.LEFT);
    } else if (clickx == playerx && clicky == playery - 1) {
      run(keys.codes.UP);
    } else if (clickx == playerx + 1 && clicky == playery) {
      run(keys.codes.RIGHT);
    } else if (clickx == playerx && clicky == playery + 1) {
      run(keys.codes.DOWN);
    } else if (
      logic.isBlocked(store.mapObj, store.levelObj["startState"], clickx, clicky) ||
      store.mapObj[clickx][clicky] == " "
    ) {
      return;
    } else {
      var starsKey = store.levelObj["startState"]["stars"]
        .map(function(star) {
          return star[0] + "," + star[1];
        })
        .sort()
        .join("|");
      var cacheKey = store.currentLevelIndex + ":" + starsKey;
      if (!store.gridCache || store.gridCache.key !== cacheKey) {
        var grid = logic.makeGrid(store.mapObj, store.levelObj, function(mapObjLocal, s, x, y) {
          return logic.isBlocked(mapObjLocal, s, x, y);
        });
        store.gridCache = {
          key: cacheKey,
          graph: new pathing.Graph(grid)
        };
      }
      var graph = store.gridCache.graph;
      var start = graph.nodes[playerx][playery];
      var end = graph.nodes[clickx][clicky];
      var result = pathing.astar.search(graph.nodes, start, end);
      if (result.length > 0) {
        store.moving = true;
        result.forEach(function(element, index, array) {
          if (index == array.length - 1) {
            setTimeout(function() {
              store.moving = false;
              move(element);
            }, 100 * index);
          } else {
            setTimeout(move, 100 * index, element);
          }
        });
      }
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
