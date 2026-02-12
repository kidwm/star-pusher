var MUSIC_MUTED_KEY = "star-pusher.music-muted";

function loadMutedPreference() {
  try {
    return window.localStorage.getItem(MUSIC_MUTED_KEY) === "1";
  } catch (_err) {
    return false;
  }
}

function saveMutedPreference(isMuted) {
  try {
    window.localStorage.setItem(MUSIC_MUTED_KEY, isMuted ? "1" : "0");
  } catch (_err) {
    // Ignore storage failures (private mode / blocked storage).
  }
}

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
    var started = false;
    var isMuted = loadMutedPreference();

    function startMusic() {
      if (started) {
        return;
      }
      started = true;
      var playPromise = melody.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function() {
          // Autoplay blocked; allow a future user interaction to retry.
          started = false;
        });
      }
    }

    melody.volume = 0.15;
    melody.muted = isMuted;
    if (melody.muted) {
      music.classList.remove("melody");
    } else {
      music.classList.add("melody");
    }
    music.addEventListener(
      "click",
      function() {
        if (melody.muted) {
          melody.muted = false;
          music.classList.add("melody");
          saveMutedPreference(false);
          startMusic();
        } else {
          melody.muted = true;
          music.classList.remove("melody");
          saveMutedPreference(true);
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

    if (!melody.muted) {
      document.addEventListener("pointerdown", startMusic, { once: true });
      document.addEventListener("keydown", startMusic, { once: true });
    }

    return { startMusic: startMusic };
  }

  return { startMusic: function() {} };
}
