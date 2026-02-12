export function createNotifier() {
  var dialog = document.getElementById("notice");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "notice";
    dialog.setAttribute("role", "alert");
    dialog.style.position = "fixed";
    dialog.style.top = "16px";
    dialog.style.left = "50%";
    dialog.style.transform = "translateX(-50%)";
    dialog.style.padding = "10px 14px";
    dialog.style.background = "rgba(0, 0, 0, 0.85)";
    dialog.style.color = "#fff";
    dialog.style.fontFamily = "sans-serif";
    dialog.style.fontSize = "14px";
    dialog.style.borderRadius = "6px";
    dialog.style.border = "none";
    dialog.style.zIndex = "9999";
    dialog.style.maxWidth = "90%";
    dialog.style.textAlign = "center";
    dialog.style.pointerEvents = "none";
    dialog.style.boxShadow = "0 6px 20px rgba(0,0,0,0.25)";
    document.body.appendChild(dialog);
  }

  var timer = null;

  function show(message, durationMs) {
    var duration = typeof durationMs === "number" ? durationMs : 4000;
    dialog.textContent = message;
    if (typeof dialog.show === "function" && !dialog.open) {
      dialog.show();
    } else {
      dialog.open = true;
    }
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function() {
      hide();
    }, duration);
  }

  function hide() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (dialog.open) {
      dialog.close();
    }
  }

  return {
    show: show,
    hide: hide,
    element: dialog
  };
}
