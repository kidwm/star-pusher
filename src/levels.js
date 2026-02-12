import { decorateMap } from "./render.js";

export function parseLevels(lines, isWall, outsideDecoMapping, deepCopy, notify) {
  var notifyFn = typeof notify === "function" ? notify : function(message) {
    alert(message);
  };
  var levels = [];
  var levelNum = -1;
  var mapTextLines = [];
  var mapObj = [];

  lines.forEach(function(element, index) {
    var line = element.replace(/;.*$/, "");
    if (line != "") {
      mapTextLines.push(line);
    } else if (line == "" && mapTextLines.length > 0) {
      var maxWidth = -1;
      mapTextLines.forEach(function(lineText) {
        if (lineText.length > maxWidth) {
          maxWidth = lineText.length;
        }
      });
      mapTextLines.forEach(function(lineText, lineIndex, array) {
        for (var i = 0; i < maxWidth - lineText.length; i++) {
          array[lineIndex] += " ";
        }
      });
      for (var i = 0; i < maxWidth; i++) {
        mapObj.push([]);
      }
      for (var y = 0; y < mapTextLines.length; y++) {
        for (var x = 0; x < maxWidth; x++) {
          mapObj[x].push(mapTextLines[y][x]);
        }
      }

      var startx = null;
      var starty = null;
      var goals = [];
      var stars = [];
      for (var x = 0; x < maxWidth; x++) {
        for (var y = 0; y < mapObj[x].length; y++) {
          if (mapObj[x][y] == "@" || mapObj[x][y] == "+") {
            startx = x;
            starty = y;
          }
          if (mapObj[x][y] == "." || mapObj[x][y] == "+" || mapObj[x][y] == "*") {
            goals.push([x, y]);
          }
          if (mapObj[x][y] == "$" || mapObj[x][y] == "*") {
            stars.push([x, y]);
          }
        }
      }

      var lineNum = index - mapObj[0].length;

      if (startx == null || starty == null) {
        notifyFn(
          "Level " +
            (levelNum + 1) +
            " (around line " +
            lineNum +
            ") is missing a \"@\" or \"+\" to mark the start point."
        );
      }
      if (goals.length < 1) {
        notifyFn(
          "Level " +
            (levelNum + 1) +
            " (around line " +
            lineNum +
            ") must have at least one goal."
        );
      }
      if (stars.length < goals.length) {
        notifyFn(
          "Level " +
            (levelNum + 1) +
            " (around line " +
            lineNum +
            ") is impossible to solve. It has " +
            goals.length +
            " goals but only " +
            stars.length +
            " stars."
        );
      }

      var gameStateObj = {
        player: [startx, starty],
        stars: stars
      };
      var levelObj = {
        width: maxWidth,
        height: mapObj.length,
        mapObj: decorateMap(mapObj, gameStateObj.player, isWall, outsideDecoMapping),
        goals: goals,
        startState: gameStateObj,
        steps: [deepCopy(gameStateObj)]
      };

      levels.push(levelObj);
      mapTextLines = [];
      mapObj = [];
      gameStateObj = {};
      levelNum += 1;
    }
  });
  return levels;
}
