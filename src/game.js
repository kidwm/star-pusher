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
import { parseLevels } from "./levels.js";
import { createGameActions } from "./controller.js";
import {
	isWall,
	isBlocked,
	hasItem,
	isLevelFinished,
	makeMove,
	makeGrid
} from "./state.js";
import {
	initImages,
	createCloudRenderer,
	drawMap,
	drawStage,
	decorateMap
} from "./render.js";
import {
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

var stage = document.getElementById('stage');
var sky = document.getElementById('sky');
var map = document.createElement('canvas');
var position = stage.getContext('2d');
var cloud = sky.getContext('2d');
var platform = map.getContext('2d');
var animationState = { enabled: true };

installRequestAnimFrame();

var imageState = initImages();
var images = imageState.images;
var tileMapping = imageState.tileMapping;
var outsideDecoMapping = imageState.outsideDecoMapping;
var playerImages = imageState.playerImages;

var cloudRenderer = createCloudRenderer(sky, cloud, animationState);

var info = document.getElementById('info');
var fullscreen = document.getElementById('fullscreen');
var title = document.getElementById('title');
var splash = document.getElementById('splash');
var control = document.getElementById('control');
var touch = document.getElementById('touch');
var resetButton = document.getElementById('reset');
var nextButton = document.getElementById('next');
var prevButton = document.getElementById('prev');
var undoButton = document.getElementById('undo');
var data = document.getElementById('data');
var lines = data.innerHTML + '\n';
var levels = parseLevels(lines.split(/\n/), isWall, outsideDecoMapping, structuredClone);
var state = {
	mapNeedsRedraw: false,
	levelIsComplete: false,
	playerMoveTo: null,
	currentImage: 0,
	moving: false,
	currentLevelIndex: 0,
	levelObj: null,
	mapObj: null
};

var actions = createGameActions({
	dom: {
		title: title,
		splash: splash,
		info: info,
		fullscreen: fullscreen,
		resetButton: resetButton,
		nextButton: nextButton,
		prevButton: prevButton,
		undoButton: undoButton
	},
	render: {
		drawMap: drawMap,
		drawStage: drawStage
	},
	assets: {
		stage: stage,
		position: position,
		map: map,
		platform: platform,
		images: images,
		tileMapping: tileMapping,
		outsideDecoMapping: outsideDecoMapping,
		playerImages: playerImages
	},
	data: {
		levels: levels
	},
	state: state,
	logic: {
		isWall: isWall,
		isBlocked: isBlocked,
		hasItem: hasItem,
		isLevelFinished: isLevelFinished,
		makeMove: makeMove,
		makeGrid: makeGrid
	},
	pathing: {
		Graph: Graph,
		astar: astar
	},
	audio: {
		playSound: playSound
	},
	input: {
		getMoveFromClick: getMoveFromClick
	},
	directions: {
		UP: UP,
		DOWN: DOWN,
		LEFT: LEFT,
		RIGHT: RIGHT
	}
});

initTouchUI(control, touch);

initHammer(document.documentElement, function(direction) {
	if (state.moving) {
		return;
	}
	switch(direction) {
		case LEFT:
			actions.run(37);
			break;
		case UP:
			actions.run(38);
			break;
		case RIGHT:
			actions.run(39);
			break;
		case DOWN:
			actions.run(40);
			break;
	}
});

initMusicUI();

function start() {
	actions.start({
		bindUIControls: bindUIControls,
		toggleFullscreen: toggleFullscreen,
		animationState: animationState,
		cloudRenderer: cloudRenderer
	});
	/*
	window.addEventListener('orientationchange', function() {
		alert(document.body.clientWidth+' & '+document.body.clientHeight+' & '+stage.clientWidth);
		}, false);
	*/
}
