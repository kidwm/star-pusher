import { UP, DOWN, LEFT, RIGHT } from "./constants.js";

export function isWall(mapObj, x, y) {
  if (x < 0 || x >= mapObj.length || y < 0 || y >= mapObj[x].length) {
    return false;
  } else if (["#", "x"].indexOf(mapObj[x][y]) >= 0) {
    return true;
  }
  return false;
}

export function isBlocked(mapObj, gameStateObj, x, y, isWallFn) {
  var isWallLocal = isWallFn || isWall;
  if (isWallLocal(mapObj, x, y)) {
    return true;
  } else if (x < 0 || x >= mapObj.length || y < 0 || y >= mapObj[x].length) {
    return true;
  } else if (
    gameStateObj.stars.some(function(element) {
      return element[0] == x && element[1] == y;
    })
  ) {
    return true;
  }
  return false;
}

export function hasItem(array, itemx, itemy) {
  return array.some(function(element) {
    return element[0] == itemx && element[1] == itemy;
  });
}

export function isLevelFinished(levelObj, gameStateObj) {
  var result = true;
  levelObj.goals.forEach(function(goal) {
    if (
      gameStateObj.stars.every(function(star) {
        return star[0] != goal[0] || star[1] != goal[1];
      })
    ) {
      result = false;
    }
  });
  return result;
}

export function makeMove(mapObj, gameStateObj, playerMoveTo, options) {
  var playerx = gameStateObj.player[0];
  var playery = gameStateObj.player[1];
  var stars = gameStateObj.stars;
  var xOffset;
  var yOffset;

  switch (playerMoveTo) {
    case UP:
      xOffset = 0;
      yOffset = -1;
      break;
    case RIGHT:
      xOffset = 1;
      yOffset = 0;
      break;
    case DOWN:
      xOffset = 0;
      yOffset = 1;
      break;
    case LEFT:
      xOffset = -1;
      yOffset = 0;
      break;
    default:
      return false;
  }

  var isWallFn = options && options.isWall ? options.isWall : isWall;
  var isBlockedFn = options && options.isBlocked ? options.isBlocked : isBlocked;
  var hasItemFn = options && options.hasItem ? options.hasItem : hasItem;
  var playSoundFn = options && options.playSound ? options.playSound : function() {};
  var goals = options && options.goals ? options.goals : [];

  if (isWallFn(mapObj, playerx + xOffset, playery + yOffset)) {
    return false;
  } else {
    if (hasItemFn(stars, playerx + xOffset, playery + yOffset)) {
      if (
        !isBlockedFn(
          mapObj,
          gameStateObj,
          playerx + xOffset * 2,
          playery + yOffset * 2,
          isWallFn
        )
      ) {
        stars.forEach(function(element, index, array) {
          if (element[0] == playerx + xOffset && element[1] == playery + yOffset) {
            array[index] = [array[index][0] + xOffset, array[index][1] + yOffset];
            if (hasItemFn(goals, array[index][0], array[index][1])) {
              playSoundFn("match");
            }
          }
        });
      } else {
        return false;
      }
    }
    gameStateObj.player = [playerx + xOffset, playery + yOffset];
    return true;
  }
}

export function makeGrid(mapObj, levelObj, isBlockedFn) {
  var grid = [];
  for (var x = 0; x < mapObj.length; x++) {
    grid.push([]);
  }
  for (var x = 0; x < mapObj.length; x++) {
    for (var y = 0; y < mapObj[0].length; y++) {
      if (isBlockedFn(mapObj, levelObj.startState, x, y)) {
        grid[x].push(1);
      } else {
        grid[x].push(0);
      }
    }
  }
  return grid;
}
