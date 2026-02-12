import astar from "./astar.js";
import { Graph } from "./graph.js";

export function buildPathForTarget(options) {
  var store = options.store;
  var logic = options.logic;
  var clickx = options.clickx;
  var clicky = options.clicky;
  var playerx = options.playerx;
  var playery = options.playery;

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
      graph: new Graph(grid)
    };
  }
  var graph = store.gridCache.graph;
  var start = graph.nodes[playerx][playery];
  var end = graph.nodes[clickx][clicky];
  return astar.search(graph.nodes, start, end);
}

export function getClickIntent(options) {
  var store = options.store;
  var stage = options.stage;
  var ev = options.ev;
  var getMoveFromClick = options.getMoveFromClick;
  var isBlocked = options.isBlocked;
  var keyCodes = options.keyCodes;
  var getPath = options.getPath;

  var coords = getMoveFromClick(ev, stage, store.cameraX, store.cameraY);
  var clickx = coords.clickx;
  var clicky = coords.clicky;
  var playerx = store.levelObj["startState"]["player"][0];
  var playery = store.levelObj["startState"]["player"][1];

  if (clickx == playerx - 1 && clicky == playery) {
    return { kind: "direct", keyCode: keyCodes.LEFT };
  }
  if (clickx == playerx && clicky == playery - 1) {
    return { kind: "direct", keyCode: keyCodes.UP };
  }
  if (clickx == playerx + 1 && clicky == playery) {
    return { kind: "direct", keyCode: keyCodes.RIGHT };
  }
  if (clickx == playerx && clicky == playery + 1) {
    return { kind: "direct", keyCode: keyCodes.DOWN };
  }
  if (
    isBlocked(store.mapObj, store.levelObj["startState"], clickx, clicky) ||
    store.mapObj[clickx][clicky] == " "
  ) {
    return { kind: "none" };
  }

  var path = getPath(clickx, clicky, playerx, playery);
  if (!path || path.length === 0) {
    return { kind: "none" };
  }
  return { kind: "path", path: path };
}

export function followPath(path, options) {
  var store = options.store;
  var keyCodes = options.keyCodes;
  var runMoveByKey = options.runMoveByKey;

  store.moving = true;
  path.forEach(function(node, index, array) {
    setTimeout(function() {
      var player = store.levelObj["startState"]["player"];
      var keyCode = keyCodeFromStep(player[0], player[1], node.x, node.y, keyCodes);
      if (keyCode != null) {
        runMoveByKey(keyCode);
      }
      if (index == array.length - 1) {
        store.moving = false;
      }
    }, 100 * index);
  });
}

function keyCodeFromStep(fromX, fromY, toX, toY, keyCodes) {
  if (toX == fromX - 1 && toY == fromY) {
    return keyCodes.LEFT;
  }
  if (toX == fromX + 1 && toY == fromY) {
    return keyCodes.RIGHT;
  }
  if (toX == fromX && toY == fromY - 1) {
    return keyCodes.UP;
  }
  if (toX == fromX && toY == fromY + 1) {
    return keyCodes.DOWN;
  }
  return null;
}
