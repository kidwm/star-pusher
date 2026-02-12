import {
  TILEWIDTH,
  TILEHEIGHT,
  TILEFLOORHEIGHT,
  OUTSIDE_DECORATION_PCT,
  FILES
} from "./constants.js";

export function initImages() {
  var images = {};
  for (var key in FILES) {
    images[key] = new Image();
    images[key].src = FILES[key];
    images[key].width = TILEWIDTH;
    images[key].height = TILEHEIGHT;
  }

  var tileMapping = {
    x: images["corner"],
    "#": images["wall"],
    o: images["inside floor"],
    " ": images["outside floor"]
  };

  var outsideDecoMapping = {
    "1": images["rock"],
    "2": images["short tree"],
    "3": images["tall tree"],
    "4": images["ugly tree"]
  };

  var playerImages = [
    images["front"],
    images["back"],
    images["left"],
    images["right"]
  ];

  return {
    images,
    tileMapping,
    outsideDecoMapping,
    playerImages
  };
}

export function createCloudRenderer(sky, cloud, animationState) {
  var clouds = 10;
  var circles = [];

  for (var i = 0; i < clouds; i++) {
    circles.push([
      Math.random() * sky.width,
      Math.random() * sky.height,
      0,
      Math.floor(Math.random() * (80 - 50 + 1) + 50 * 100)
    ]);
  }

  function drawCloud() {
    sky.width = document.documentElement.clientWidth; // clean the canvas
    sky.height = document.documentElement.clientHeight;
    if (!animationState.enabled) {
      return;
    }
    for (var i = 0; i < clouds; i++) {
      if (circles[i][1] - circles[i][2] > sky.height) {
        circles[i][0] = Math.random() * sky.width;
        circles[i][2] = Math.random() * 100;
        circles[i][1] = 0 - circles[i][2];
        circles[i][3] = Math.random() / 2;
      } else {
        circles[i][1] += 5;
      }
      cloud.fillStyle = "rgba(255, 255, 255, " + circles[i][3] + ")";
      cloud.beginPath();
      cloud.arc(circles[i][0], circles[i][1], circles[i][2], 0, Math.PI * 2, true);
      cloud.closePath();
      cloud.fill();
    }
    window.requestAnimFrame(function() {
      drawCloud();
    });
  }

  return { drawCloud };
}

export function drawMap(map, platform, mapObj, tileMapping, outsideDecoMapping) {
  var baseTile;
  map.width = mapObj.length * TILEWIDTH;
  map.height = (mapObj[0].length - 1) * TILEFLOORHEIGHT + TILEHEIGHT;
  for (var x = 0; x < mapObj.length; x++) {
    for (var y = 0; y < mapObj[0].length; y++) {
      var tx = x * TILEWIDTH;
      var ty = y * TILEFLOORHEIGHT;
      if (tileMapping[mapObj[x][y]]) {
        baseTile = tileMapping[mapObj[x][y]];
      } else if (outsideDecoMapping[mapObj[x][y]]) {
        baseTile = tileMapping[" "];
      }
      platform.drawImage(baseTile, tx, ty);
      if (outsideDecoMapping[mapObj[x][y]]) {
        platform.drawImage(outsideDecoMapping[mapObj[x][y]], tx, ty);
      }
    }
  }
}

export function drawStage(
  stage,
  position,
  map,
  mapObj,
  levelObj,
  currentImage,
  images,
  tileMapping,
  playerImages,
  hasItem,
  viewState
) {
  var gameStateObj = levelObj["startState"];
  var goals = levelObj["goals"];
  var viewportWidth = Math.min(map.width, document.documentElement.clientWidth);
  var viewportHeight = Math.min(map.height, document.documentElement.clientHeight);

  stage.width = viewportWidth;
  stage.height = viewportHeight;

  var maxCameraX = Math.max(0, map.width - viewportWidth);
  var maxCameraY = Math.max(0, map.height - viewportHeight);
  viewState.maxCameraX = maxCameraX;
  viewState.maxCameraY = maxCameraY;
  viewState.cameraX = Math.max(0, Math.min(viewState.cameraX, maxCameraX));
  viewState.cameraY = Math.max(0, Math.min(viewState.cameraY, maxCameraY));

  var cameraX = viewState.cameraX;
  var cameraY = viewState.cameraY;

  position.drawImage(
    map,
    cameraX,
    cameraY,
    viewportWidth,
    viewportHeight,
    0,
    0,
    viewportWidth,
    viewportHeight
  );

  var revamp = function(x, y) {
    var tx = x * TILEWIDTH - cameraX;
    var ty = y * TILEFLOORHEIGHT - cameraY;
    if (mapObj[x][y + 1] == "x" || mapObj[x][y + 1] == "#") {
      position.drawImage(
        tileMapping[mapObj[x][y + 1]],
        0,
        0,
        TILEWIDTH,
        TILEFLOORHEIGHT,
        tx,
        ty + TILEFLOORHEIGHT,
        TILEWIDTH,
        TILEFLOORHEIGHT
      );
    }
  };

  for (var x = 0; x < mapObj.length; x++) {
    for (var y = 0; y < mapObj[0].length; y++) {
      var tx = x * TILEWIDTH - cameraX;
      var ty = y * TILEFLOORHEIGHT - cameraY;
      if (hasItem(gameStateObj["stars"], x, y)) {
        if (hasItem(goals, x, y)) {
          position.drawImage(images["covered goal"], tx, ty);
        }
        position.drawImage(images["star"], tx, ty);
        revamp(x, y);
      } else if (hasItem(goals, x, y)) {
        position.drawImage(images["uncovered goal"], tx, ty);
        revamp(x, y);
      }
      if (gameStateObj["player"][0] == x && gameStateObj["player"][1] == y) {
        position.drawImage(playerImages[currentImage], tx, ty);
        revamp(x, y);
      }
    }
  }
}

export function decorateMap(mapObj, startxy, isWall, outsideDecoMapping) {
  var startx = startxy[0];
  var starty = startxy[1];

  var mapObjCopy = mapObj;

  for (var x = 0; x < mapObjCopy.length; x++) {
    for (var y = 0; y < mapObjCopy[0].length; y++) {
      if (["$", ".", "@", "+", "*"].indexOf(mapObjCopy[x][y]) >= 0) {
        mapObjCopy[x][y] = " ";
      }
    }
  }

  floodFill(mapObjCopy, startx, starty, " ", "o");

  for (x = 0; x < mapObjCopy.length; x++) {
    for (y = 0; y < mapObjCopy[0].length; y++) {
      if (mapObjCopy[x][y] == "#") {
        if (
          (isWall(mapObjCopy, x, y - 1) && isWall(mapObjCopy, x + 1, y)) ||
          (isWall(mapObjCopy, x + 1, y) && isWall(mapObjCopy, x, y + 1)) ||
          (isWall(mapObjCopy, x, y + 1) && isWall(mapObjCopy, x - 1, y)) ||
          (isWall(mapObjCopy, x - 1, y) && isWall(mapObjCopy, x, y - 1))
        ) {
          mapObjCopy[x][y] = "x";
        }
      } else if (mapObjCopy[x][y] == " " && Math.random() < OUTSIDE_DECORATION_PCT) {
        var items = Object.keys(outsideDecoMapping);
        mapObjCopy[x][y] = items[Math.floor(Math.random() * items.length)];
      }
    }
  }
  return mapObjCopy;
}

function floodFill(mapObj, x, y, oldCharacter, newCharacter) {
  if (mapObj[x][y] == oldCharacter) {
    mapObj[x][y] = newCharacter;
  }
  if (x < mapObj.length - 1 && mapObj[x + 1][y] == oldCharacter) {
    floodFill(mapObj, x + 1, y, oldCharacter, newCharacter);
  }
  if (x > 0 && mapObj[x - 1][y] == oldCharacter) {
    floodFill(mapObj, x - 1, y, oldCharacter, newCharacter);
  }
  if (y < mapObj[x].length - 1 && mapObj[x][y + 1] == oldCharacter) {
    floodFill(mapObj, x, y + 1, oldCharacter, newCharacter);
  }
  if (y > 0 && mapObj[x][y - 1] == oldCharacter) {
    floodFill(mapObj, x, y - 1, oldCharacter, newCharacter);
  }
}
