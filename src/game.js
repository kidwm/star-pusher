import astar from "./astar.js";
import { Graph } from "./graph.js";
import { PxLoader } from "./pxloader.js";
import "./ios-orientationchange-fix.js";
import { installRequestAnimFrame } from "./animation.js";
import { initMusicUI, playSound } from "./audio.js";
import { toggleFullscreen } from "./fullscreen.js";
import {
	initTouchUI,
	initHammer,
	bindUIControls,
	getMoveFromClick
} from "./input.js";
import {
	initImages,
	createCloudRenderer,
	drawMap,
	drawStage,
	decorateMap
} from "./render.js";
import {
	TILEWIDTH,
	TILEFLOORHEIGHT,
	UP,
	DOWN,
	LEFT,
	RIGHT
} from "./constants.js";

var loader = new PxLoader();
loader.addImage('images/front.png');
loader.addImage('images/back.png');
loader.addImage('images/left.png');
loader.addImage('images/right.png');
loader.addImage('images/Grass_Block.png');
loader.addImage('images/Plain_Block.png');
loader.addImage('images/RedSelector.png');
loader.addImage('images/Rock.png');
loader.addImage('images/Selector.png');
loader.addImage('images/Star.png');
loader.addImage('images/Tree_Short.png');
loader.addImage('images/Tree_Tall.png');
loader.addImage('images/Tree_Ugly.png');
loader.addImage('images/Wall_Block_Tall.png');
loader.addImage('images/Wood_Block_Tall.png');
loader.addProgressListener(function(e) {
	if (e.completedCount * 6 < 100) {
		document.getElementById('loading').querySelector('span').textContent = e.completedCount * 6 + '%';
	}
});
loader.addCompletionListener(function() {
	document.getElementById('loading').classList.add('hidden');
	start();
});
loader.start();


// The total width and height of each tile in pixels.

var mapNeedsRedraw = false;
var levelIsComplete = false;
var playerMoveTo = null;

var stage = document.getElementById('stage');
var sky = document.getElementById('sky');
var map = document.createElement('canvas');
var position = stage.getContext('2d');
var cloud = sky.getContext('2d');
var platform = map.getContext('2d');
var animationState = { enabled: true };

installRequestAnimFrame();

var currentLevelIndex = 0;

var imageState = initImages();
var images = imageState.images;
var tileMapping = imageState.tileMapping;
var outsideDecoMapping = imageState.outsideDecoMapping;
var playerImages = imageState.playerImages;

var currentImage = 0;
var cloudRenderer = createCloudRenderer(sky, cloud, animationState);

var isLevelFinished = function(levelObj, gameStateObj) {
	var result = true;
    levelObj['goals'].forEach(function(element, index, array) {
    	var goal = element;
    	if (gameStateObj['stars'].every(function(element, index, array) {
			return element[0] != goal[0] || element[1] != goal[1];
		})) 
            result = false;
	});
    return result;
}

var isWall = function(mapObj, x, y) {
    if (x < 0 || x >= mapObj.length || y < 0 || y >= mapObj[x].length)
        return false;
    else if (['#', 'x'].indexOf(mapObj[x][y]) >= 0)
        return true;
    return false;
}

var isBlocked = function(mapObj, gameStateObj, x, y) {
    if (isWall(mapObj, x, y))
        return true;
    else if (x < 0 || x >= mapObj.length || y < 0 || y >= mapObj[x].length)
        return true;
    else if (gameStateObj['stars'].some(function(element, index, array) {
			return element[0] == x && element[1] == y;
		}))
        return true;
    return false;
}

var makeMove = function (mapObj, gameStateObj, playerMoveTo) {
    var playerx = gameStateObj['player'][0];
    var playery = gameStateObj['player'][1];
    var stars = gameStateObj['stars'];
	var xOffset, yOffset;
	switch(playerMoveTo) {
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
	}

    if (isWall(mapObj, playerx + xOffset, playery + yOffset))
        return false;
    else {
        if (hasItem(stars, playerx + xOffset, playery + yOffset)) {
            if (!isBlocked(mapObj, gameStateObj, playerx + (xOffset*2), playery + (yOffset*2)))
                stars.forEach(function(element, index, array) {
					if (element[0] == playerx + xOffset && element[1] == playery + yOffset) {
						array[index] = [array[index][0] + xOffset, array[index][1] + yOffset];
						if (hasItem(levelObj['goals'], array[index][0], array[index][1]))
							playSound('match');
					}
                });
			else
                return false;
        }
        gameStateObj['player'] = [playerx + xOffset, playery + yOffset];
        return true;
	}
}

var parser = function(lines) {
	var levels = [];
    var levelNum = -1;
    var mapTextLines = [];
    var mapObj = [];
	lines.forEach(function(element, index, array) {
		var line = element.replace(/;.*$/, '');
		if (line != '') {
			mapTextLines.push(line);
		} else if (line == '' && mapTextLines.length > 0) {
			var maxWidth = -1;
			mapTextLines.forEach(function(element, index, array) {
				if (element.length > maxWidth) {
					maxWidth = element.length;
				}
			});
			mapTextLines.forEach(function(element, index, array) {
				for (var i = 0; i < (maxWidth - element.length); i++)
					array[index] += ' ';
			});
			for (var i = 0; i < maxWidth; i++) {
				mapObj.push([]);
			};
			for (var y = 0; y < mapTextLines.length; y++) {
				for (var x = 0; x < maxWidth; x++) {
					mapObj[x].push(mapTextLines[y][x]);						
				};
			};
			var startx = null;
            var starty = null;
            var goals = [];
            var stars = [];
            for (x = 0; x < maxWidth; x++) {
				for (y = 0; y < mapObj[x].length; y++) {
					if (mapObj[x][y] == '@' || mapObj[x][y] == '+') {
	                    startx = x;
	                    starty = y;
                    }
                    if (mapObj[x][y] == '.' || mapObj[x][y] == '+' || mapObj[x][y] == '*') {
                    	goals.push([x, y]);
                    }
                    if (mapObj[x][y] == '$' || mapObj[x][y] == '*') {
                        stars.push([x, y]);
	                }
				};
			};
			
			var lineNum = index - mapObj[0].length;
			
			if (startx == null || starty == null)
				alert('Level ' + (levelNum + 1) + ' (around line ' + lineNum + ') is missing a "@" or "+" to mark the start point.');
            if (goals.length < 1)
            	alert('Level ' + (levelNum + 1) + ' (around line ' + lineNum + ') must have at least one goal.');
            if (stars.length < goals.length) 
            	alert('Level ' + (levelNum + 1) + ' (around line ' + lineNum + ') is impossible to solve. It has ' + goals.length + ' goals but only ' + stars.length + ' stars.');
			
            var gameStateObj = {
				'player': [startx, starty],
				'stars': stars
			}
			var levelObj = {
				'width': maxWidth,
				'height': mapObj.length,
				'mapObj': decorateMap(mapObj, gameStateObj['player'], isWall, outsideDecoMapping),
				'goals': goals,
				'startState': gameStateObj,
				'steps': [deepCopy(gameStateObj)]
			}

			levels.push(levelObj);
			mapTextLines = [];
			mapObj = [];
			gameStateObj = {};
			levelNum += 1;
		}
	});
    return levels;
}

var run = function(ev) {
	var key = ev.which ? ev.which : ev;
	playerMoveTo = null;
    var gameStateObj = levelObj['startState'];
    if (!title.classList.contains('hidden')) {
    	playSound('intro');
    	document.getElementById('control').classList.add('enable');
    	title.classList.add('hidden');
    	reset();
    	return;
    }	
	if (levelIsComplete) {
		currentLevelIndex += 1;
		if (currentLevelIndex >= levels.length)
            currentLevelIndex = 0;
		reset();
        splash.classList.add('hidden');
        levelIsComplete = false;
        return;
	} else {
		if([8, 27, 37, 38, 39, 40, 66, 78].indexOf(ev.which) >= 0) {
			ev.preventDefault();
			if (moving)
				return;
		}
		switch(key) {
			case 8:
				if(levelObj['steps'].length > 1) {
					levelObj['steps'].pop();
					levelObj['startState'] = deepCopy(levelObj['steps'][levelObj['steps'].length - 1]);
					mapNeedsRedraw = true;
				}
				break;
			case 27:
				reset();
				playSound('select');
				break;
			case 37:
				playerMoveTo = LEFT;
				currentImage = 2;
				break;
			case 38:
				playerMoveTo = UP;
				currentImage = 1;
				break;
			case 39:
				playerMoveTo = RIGHT;
				currentImage = 3;
				break;
			case 40:
				playerMoveTo = DOWN;
				currentImage = 0;
				break;
			case 66:
				prev();
				playSound('select');
				break;
			case 78:
				next();
				playSound('select');
				break;
		}
	}
	if (playerMoveTo != null && !levelIsComplete) {
            var moved = makeMove(mapObj, gameStateObj, playerMoveTo);
            if (moved) {
            	if (!moving) {
                	levelObj['steps'].push(deepCopy(gameStateObj));
                }
                mapNeedsRedraw = true;
			}
            if (isLevelFinished(levelObj, gameStateObj)) {
                levelIsComplete = true;
                splash.classList.remove('hidden');
                playSound('applause');
			}
	}
	if (mapNeedsRedraw) {
		drawStage(
			stage,
			position,
			map,
			mapObj,
			levelObj,
			currentImage,
			images,
			tileMapping,
			playerImages,
			hasItem
		);
        mapNeedsRedraw = false;
	}
};

var reset = function() {
	levelObj = deepCopy(levels[currentLevelIndex]);
	mapObj = levelObj['mapObj'];
	currentImage = 0;
	info.querySelector('span').textContent = currentLevelIndex;
	drawMap(map, platform, mapObj, tileMapping, outsideDecoMapping);
	drawStage(
		stage,
		position,
		map,
		mapObj,
		levelObj,
		currentImage,
		images,
		tileMapping,
		playerImages,
		hasItem
	);
}

var prev = function() {
	currentLevelIndex = (currentLevelIndex - 1 < 0) ? levels.length - 1 : currentLevelIndex - 1;
	reset();
}

var next = function() {
	currentLevelIndex = (currentLevelIndex + 1 >= levels.length) ? 0 : currentLevelIndex + 1;
	reset();
}

var move = function(ev) {
	var coords = getMoveFromClick(ev, stage);
	var clickx = coords.clickx;
	var clicky = coords.clicky;
	var playerx = levelObj['startState']['player'][0];
	var playery = levelObj['startState']['player'][1];
	if (clickx == (playerx - 1) && clicky == playery)
		run(37);
	else if (clickx == playerx && clicky == (playery - 1) )
		run(38);
	else if (clickx == (playerx + 1) && clicky == playery)
		run(39);
	else if (clickx == playerx && clicky == (playery + 1) )
		run(40);
	else if(isBlocked(mapObj, levelObj['startState'], clickx, clicky) || mapObj[clickx][clicky] == ' ')
		return
	else {
		var graph = new Graph(makeGrid(mapObj));
		var start = graph.nodes[playerx][playery];
		var end = graph.nodes[clickx][clicky];
		var result = astar.search(graph.nodes, start, end);
		if (result.length > 0) {
			moving = true;
			result.forEach(function(element, index, array) {
				if(index == array.length - 1) {
					setTimeout(function() {
						moving = false;
						move(element);
					}, 100 * index);
				} else {
					setTimeout(move, 100 * index, element);
				}
			});
		}
	}
}

var info = document.getElementById('info');
var fullscreen = document.getElementById('fullscreen');
var title = document.getElementById('title');
var splash = document.getElementById('splash');
var control = document.getElementById('control');
var touch = document.getElementById('touch');
var data = document.getElementById('data');
var lines = data.innerHTML + '\n';
var levels = parser(lines.split(/\n/));
var levelObj, map, mapObj, moving = false;

initTouchUI(control, touch);

initHammer(document.documentElement, function(direction) {
	if (moving) {
		return;
	}
	switch(direction) {
		case LEFT:
			run(37);
			break;
		case UP:
			run(38);
			break;
		case RIGHT:
			run(39);
			break;
		case DOWN:
			run(40);
			break;
	}
});

initMusicUI();

function start() {
	title.classList.remove('hidden');
	info.classList.remove('hidden');
	reset();
	document.addEventListener('keydown', run, false);
	bindUIControls({
		title: title,
		splash: splash,
		info: info,
		stage: stage,
		resetButton: document.getElementById('reset'),
		nextButton: document.getElementById('next'),
		prevButton: document.getElementById('prev'),
		undoButton: document.getElementById('undo'),
		onRun: function(ev) {
			if (!moving) {
				run(ev);
			}
		},
		onMove: function(ev) {
			if (!moving) {
				move(ev);
			}
		},
		onEgg: function() {
			if (confirm('Open Animation?')) {
				animationState.enabled = true;
				cloudRenderer.drawCloud();
			} else {
				animationState.enabled = false;
			}
		}
	});
	if (typeof document.cancelFullScreen != 'undefined' ||
		typeof document.mozCancelFullScreen != 'undefined' ||
		typeof document.webkitCancelFullScreen != 'undefined') {
		fullscreen.addEventListener('click', toggleFullscreen, false);
		fullscreen.classList.add('show');
	}
	/*
	window.addEventListener('orientationchange', function() {
		alert(document.body.clientWidth+' & '+document.body.clientHeight+' & '+stage.clientWidth);
		}, false);
	*/
}

function hasItem (array, itemx, itemy) {
	return array.some(function(element, index, array) {
    	return element[0] == itemx && element[1] == itemy;
    });
}

function makeGrid(mapObj) {
	var grid = [];
	for (var x = 0; x < mapObj.length; x++) {
		grid.push([]);
	}			
	for (var x = 0; x < mapObj.length; x++)
		for (var y = 0; y < mapObj[0].length; y++) {
			if(isBlocked(mapObj, levelObj['startState'], x, y))
				grid[x].push(1);
			else
				grid[x].push(0);
		}
	return grid;
}

function deepCopy(p,c) {
	var c = c||{};
	for (var i in p) {
	  if (typeof p[i] === 'object') {
		c[i] = (p[i].constructor === Array)?[]:{};
		deepCopy(p[i],c[i]);
	  } else c[i] = p[i];}
	return c;
}
