export function createGameActions(options) {
  var dom = options.dom;
  var render = options.render;
  var assets = options.assets;
  var data = options.data;
  var state = options.state;
  var logic = options.logic;
  var pathing = options.pathing;
  var audio = options.audio;
  var input = options.input;
  var directions = options.directions;

  function redraw() {
    render.drawStage(
      assets.stage,
      assets.position,
      assets.map,
      state.mapObj,
      state.levelObj,
      state.currentImage,
      assets.images,
      assets.tileMapping,
      assets.playerImages,
      logic.hasItem
    );
  }

  function run(ev) {
    var key = ev.which ? ev.which : ev;
    state.playerMoveTo = null;
    var gameStateObj = state.levelObj["startState"];

    if (!dom.title.classList.contains("hidden")) {
      audio.playSound("intro");
      document.getElementById("control").classList.add("enable");
      dom.title.classList.add("hidden");
      reset();
      return;
    }

    if (state.levelIsComplete) {
      state.currentLevelIndex += 1;
      if (state.currentLevelIndex >= data.levels.length) {
        state.currentLevelIndex = 0;
      }
      reset();
      dom.splash.classList.add("hidden");
      state.levelIsComplete = false;
      return;
    }

    if ([8, 27, 37, 38, 39, 40, 66, 78].indexOf(ev.which) >= 0) {
      ev.preventDefault();
      if (state.moving) {
        return;
      }
    }

    switch (key) {
      case 8:
        if (state.levelObj["steps"].length > 1) {
          state.levelObj["steps"].pop();
          state.levelObj["startState"] = structuredClone(
            state.levelObj["steps"][state.levelObj["steps"].length - 1]
          );
          state.mapNeedsRedraw = true;
        }
        break;
      case 27:
        reset();
        audio.playSound("select");
        break;
      case 37:
        state.playerMoveTo = directions.LEFT;
        state.currentImage = 2;
        break;
      case 38:
        state.playerMoveTo = directions.UP;
        state.currentImage = 1;
        break;
      case 39:
        state.playerMoveTo = directions.RIGHT;
        state.currentImage = 3;
        break;
      case 40:
        state.playerMoveTo = directions.DOWN;
        state.currentImage = 0;
        break;
      case 66:
        prev();
        audio.playSound("select");
        break;
      case 78:
        next();
        audio.playSound("select");
        break;
    }

    if (state.playerMoveTo != null && !state.levelIsComplete) {
      var moved = logic.makeMove(state.mapObj, gameStateObj, state.playerMoveTo, {
        isWall: logic.isWall,
        isBlocked: logic.isBlocked,
        hasItem: logic.hasItem,
        playSound: audio.playSound,
        goals: state.levelObj["goals"]
      });
      if (moved) {
        if (!state.moving) {
          state.levelObj["steps"].push(structuredClone(gameStateObj));
        }
        state.mapNeedsRedraw = true;
      }
      if (logic.isLevelFinished(state.levelObj, gameStateObj)) {
        state.levelIsComplete = true;
        dom.splash.classList.remove("hidden");
        audio.playSound("applause");
      }
    }

    if (state.mapNeedsRedraw) {
      redraw();
      state.mapNeedsRedraw = false;
    }
  }

  function reset() {
    state.levelObj = structuredClone(data.levels[state.currentLevelIndex]);
    state.mapObj = state.levelObj["mapObj"];
    state.currentImage = 0;
    dom.info.querySelector("span").textContent = state.currentLevelIndex;
    render.drawMap(
      assets.map,
      assets.platform,
      state.mapObj,
      assets.tileMapping,
      assets.outsideDecoMapping
    );
    redraw();
  }

  function prev() {
    state.currentLevelIndex =
      state.currentLevelIndex - 1 < 0
        ? data.levels.length - 1
        : state.currentLevelIndex - 1;
    reset();
  }

  function next() {
    state.currentLevelIndex =
      state.currentLevelIndex + 1 >= data.levels.length
        ? 0
        : state.currentLevelIndex + 1;
    reset();
  }

  function move(ev) {
    var coords = input.getMoveFromClick(ev, assets.stage);
    var clickx = coords.clickx;
    var clicky = coords.clicky;
    var playerx = state.levelObj["startState"]["player"][0];
    var playery = state.levelObj["startState"]["player"][1];

    if (clickx == playerx - 1 && clicky == playery) {
      run(37);
    } else if (clickx == playerx && clicky == playery - 1) {
      run(38);
    } else if (clickx == playerx + 1 && clicky == playery) {
      run(39);
    } else if (clickx == playerx && clicky == playery + 1) {
      run(40);
    } else if (
      logic.isBlocked(state.mapObj, state.levelObj["startState"], clickx, clicky) ||
      state.mapObj[clickx][clicky] == " "
    ) {
      return;
    } else {
      var graph = new pathing.Graph(
        logic.makeGrid(state.mapObj, state.levelObj, function(mapObjLocal, s, x, y) {
          return logic.isBlocked(mapObjLocal, s, x, y);
        })
      );
      var start = graph.nodes[playerx][playery];
      var end = graph.nodes[clickx][clicky];
      var result = pathing.astar.search(graph.nodes, start, end);
      if (result.length > 0) {
        state.moving = true;
        result.forEach(function(element, index, array) {
          if (index == array.length - 1) {
            setTimeout(function() {
              state.moving = false;
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
        if (!state.moving) {
          run(ev);
        }
      },
      onMove: function(ev) {
        if (!state.moving) {
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
    start: start
  };
}
