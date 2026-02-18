import frontPng from "../images/front.png";
import backPng from "../images/back.png";
import leftPng from "../images/left.png";
import rightPng from "../images/right.png";
import grassBlockPng from "../images/Grass_Block.png";
import plainBlockPng from "../images/Plain_Block.png";
import redSelectorPng from "../images/RedSelector.png";
import rockPng from "../images/Rock.png";
import selectorPng from "../images/Selector.png";
import starPng from "../images/Star.png";
import treeShortPng from "../images/Tree_Short.png";
import treeTallPng from "../images/Tree_Tall.png";
import treeUglyPng from "../images/Tree_Ugly.png";
import wallBlockTallPng from "../images/Wall_Block_Tall.png";
import woodBlockTallPng from "../images/Wood_Block_Tall.png";

export const TILEWIDTH = 50;
export const TILEHEIGHT = 85;
export const TILEFLOORHEIGHT = 40;

export const OUTSIDE_DECORATION_PCT = 0.2;
export const REPO_URL = "https://github.com/kidwm/star-pusher";

export const UP = "up";
export const DOWN = "down";
export const LEFT = "left";
export const RIGHT = "right";

export const KEY_CODES = {
  BACKSPACE: 8,
  ESC: 27,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  B: 66,
  N: 78
};

export const MOVEMENT_KEYS = [
  KEY_CODES.BACKSPACE,
  KEY_CODES.ESC,
  KEY_CODES.LEFT,
  KEY_CODES.UP,
  KEY_CODES.RIGHT,
  KEY_CODES.DOWN,
  KEY_CODES.B,
  KEY_CODES.N
];

export const FILES = {
  "uncovered goal": redSelectorPng,
  "covered goal": selectorPng,
  "star": starPng,
  "corner": wallBlockTallPng,
  "wall": woodBlockTallPng,
  "inside floor": plainBlockPng,
  "outside floor": grassBlockPng,
  "front": frontPng,
  "back": backPng,
  "left": leftPng,
  "right": rightPng,
  "rock": rockPng,
  "short tree": treeShortPng,
  "tall tree": treeTallPng,
  "ugly tree": treeUglyPng
};
