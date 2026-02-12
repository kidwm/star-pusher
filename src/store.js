export function createStore(levels) {
  return {
    levels: levels,
    mapNeedsRedraw: false,
    levelIsComplete: false,
    playerMoveTo: null,
    currentImage: 0,
    moving: false,
    currentLevelIndex: 0,
    levelObj: null,
    mapObj: null,
    gridCache: null,
    cameraX: 0,
    cameraY: 0,
    maxCameraX: 0,
    maxCameraY: 0,
    suppressNextClick: false
  };
}
