import "./ios-orientationchange-fix.js";
import { installRequestAnimFrame } from "./animation.js";
import { initMusicUI, playSound } from "./audio.js";
import { toggleFullscreen } from "./fullscreen.js";
import {
	initTouchUI,
	bindUIControls,
	bindPanControls,
	getMoveFromClick
} from "./input.js";
import { parseLevels } from "./levels.js";
import { createGameActions } from "./controller.js";
import { createStore } from "./store.js";
import { initLoader } from "./loader.js";
import { createNotifier, initAboutDialog } from "./ui.js";
import * as pathing from "./pathing.js";
import readmeText from "../README.md?raw";
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
	RIGHT,
	KEY_CODES,
	MOVEMENT_KEYS,
	REPO_URL
} from "./constants.js";

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
var about = document.getElementById('about');
var aboutDialog = document.getElementById('aboutDialog');
var aboutClose = document.getElementById('aboutClose');
var aboutContent = document.getElementById('aboutContent');
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
var notifier = createNotifier();
var levels = parseLevels(lines.split(/\n/), isWall, outsideDecoMapping, structuredClone, notifier.show);
var store = createStore(levels);

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
	store: store,
	logic: {
		isWall: isWall,
		isBlocked: isBlocked,
		hasItem: hasItem,
		isLevelFinished: isLevelFinished,
		makeMove: makeMove,
		makeGrid: makeGrid
	},
	pathing: pathing,
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
	},
	keys: {
		codes: KEY_CODES,
		movement: MOVEMENT_KEYS
	}
});

initTouchUI(control, touch);
initAboutDialog(about, aboutDialog, aboutClose, aboutContent, readmeText, REPO_URL);

bindPanControls(stage, {
	canPan: function() {
		return actions.canPan();
	},
	onPan: function(dx, dy) {
		actions.panBy(dx, dy);
	},
	onPanEnd: function() {
		store.suppressNextClick = true;
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
	window.addEventListener("resize", function() {
		actions.panBy(0, 0);
	});
	/*
	window.addEventListener('orientationchange', function() {
		alert(document.body.clientWidth+' & '+document.body.clientHeight+' & '+stage.clientWidth);
		}, false);
	*/
}

initLoader(start);
