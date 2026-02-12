export function playSound(filename) {
  var index = ["intro", "select", "match", "applause"].indexOf(filename);
  var sound = document.querySelectorAll("audio.sound")[index];
  sound.play();
}

export function mediaSupport(mimetype, container) {
  var elem = document.createElement(container);
  if (typeof elem.canPlayType == "function") {
    var playable = elem.canPlayType(mimetype);
    if (playable.toLowerCase() == "maybe" || playable.toLowerCase() == "probably") {
      return true;
    }
  }
  return false;
}

export function initMusicUI() {
  if (
    mediaSupport("audio/ogg; codecs=vorbis", "audio") ||
    mediaSupport("audio/mpeg", "audio")
  ) {
    var melody = document.getElementById("melody");
    var music = document.getElementById("music");
    melody.volume = 0.15;
    melody.muted = false;
    music.addEventListener(
      "click",
      function() {
        if (melody.muted) {
          melody.muted = false;
          music.classList.add("melody");
        } else {
          melody.muted = true;
          music.classList.remove("melody");
        }
      },
      false
    );
    melody.addEventListener(
      "ended",
      function() {
        melody.currentTime = 0;
        melody.pause();
        melody.play();
      },
      false
    );
    music.classList.add("show");
    music.classList.add("melody");
    melody.play();
  }
}
