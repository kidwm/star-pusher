var MUSIC_MUTED_KEY = "star-pusher.music-muted";
var EFFECT_NAMES = ["intro", "select", "match", "applause"];
var MAX_QUEUED_EFFECT_PLAYS = 6;
var effectAudioContext = null;
var effectBuffers = {};
var effectLoading = {};
var effectQueuedPlays = {};

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
  var index = EFFECT_NAMES.indexOf(filename);
  if (index < 0) {
    return;
  }
  var baseSound = document.querySelectorAll("audio.sound")[index];
  if (!baseSound) {
    return;
  }

  if (baseSound.muted) {
    return;
  }

  var ctx = getEffectAudioContext();
  if (!ctx) {
    fallbackPlay(baseSound);
    return;
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(function() {});
  }

  if (effectBuffers[filename]) {
    playDecodedBuffer(ctx, effectBuffers[filename], baseSound.volume);
    return;
  }

  if (!effectQueuedPlays[filename]) {
    effectQueuedPlays[filename] = 0;
  }
  effectQueuedPlays[filename] = Math.min(
    MAX_QUEUED_EFFECT_PLAYS,
    effectQueuedPlays[filename] + 1
  );
}

function getEffectAudioContext() {
  if (effectAudioContext) {
    return effectAudioContext;
  }
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    return null;
  }
  effectAudioContext = new Ctx();
  return effectAudioContext;
}

function getEffectSourceUrl(baseSound) {
  if (baseSound.currentSrc) {
    return baseSound.currentSrc;
  }
  var source = baseSound.querySelector("source");
  return source ? source.src : "";
}

function playDecodedBuffer(ctx, buffer, volume) {
  var gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);

  var source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(gain);
  source.start(0);
}

function preloadEffectBuffers() {
  var ctx = getEffectAudioContext();
  if (!ctx) {
    return;
  }
  var sounds = document.querySelectorAll("audio.sound");
  sounds.forEach(function(sound, index) {
    var filename = EFFECT_NAMES[index];
    if (!filename || effectBuffers[filename] || effectLoading[filename]) {
      return;
    }
    var src = getEffectSourceUrl(sound);
    if (!src) {
      return;
    }
    effectLoading[filename] = true;
    fetch(src)
      .then(function(res) {
        return res.arrayBuffer();
      })
      .then(function(data) {
        return ctx.decodeAudioData(data);
      })
      .then(function(buffer) {
        effectBuffers[filename] = buffer;
        var queued = effectQueuedPlays[filename] || 0;
        effectQueuedPlays[filename] = 0;
        for (var i = 0; i < queued; i++) {
          playDecodedBuffer(ctx, buffer, sound.volume);
        }
      })
      .catch(function() {
        effectQueuedPlays[filename] = 0;
      })
      .finally(function() {
        effectLoading[filename] = false;
      });
  });
}

function fallbackPlay(baseSound) {
  try {
    baseSound.currentTime = 0;
  } catch (_err) {
    // Ignore.
  }
  var playPromise = baseSound.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(function() {});
  }
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
    preloadEffectBuffers();

    if (!melody.muted) {
      document.addEventListener("pointerdown", startMusic, { once: true });
      document.addEventListener("keydown", startMusic, { once: true });
    }

    return { startMusic: startMusic };
  }

  return { startMusic: function() {} };
}
