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

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInlineMarkdown(text) {
  var escaped = escapeHtml(text);
  return escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(_m, label, href) {
    var safeHref = href.trim();
    if (!/^https?:\/\//i.test(safeHref)) {
      return label;
    }
    return (
      '<a href="' +
      escapeHtml(safeHref) +
      '" target="_blank" rel="noopener noreferrer">' +
      label +
      "</a>"
    );
  });
}

function markdownToHtml(markdown) {
  var src = (markdown || "").replace(/\r\n/g, "\n");
  var rawLines = src.split("\n");
  var lines = [];

  for (var i = 0; i < rawLines.length; i++) {
    var current = rawLines[i];
    var next = rawLines[i + 1];
    if (next && /^=+$/.test(next.trim()) && current.trim()) {
      lines.push("# " + current);
      i += 1;
      continue;
    }
    if (next && /^-+$/.test(next.trim()) && current.trim()) {
      lines.push("## " + current);
      i += 1;
      continue;
    }
    lines.push(current);
  }

  var html = [];
  var paragraph = [];
  var list = [];

  function flushParagraph() {
    if (!paragraph.length) {
      return;
    }
    html.push("<p>" + renderInlineMarkdown(paragraph.join(" ").trim()) + "</p>");
    paragraph = [];
  }

  function flushList() {
    if (!list.length) {
      return;
    }
    html.push("<ul>");
    list.forEach(function(item) {
      html.push("<li>" + renderInlineMarkdown(item) + "</li>");
    });
    html.push("</ul>");
    list = [];
  }

  lines.forEach(function(line) {
    var trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    var headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      var level = headingMatch[1].length;
      html.push(
        "<h" + level + ">" + renderInlineMarkdown(headingMatch[2].trim()) + "</h" + level + ">"
      );
      return;
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      flushParagraph();
      flushList();
      html.push("<hr />");
      return;
    }

    var listMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      list.push(listMatch[1].trim());
      return;
    }

    flushList();
    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();

  return html.join("\n");
}

export function initAboutDialog(trigger, dialog, closeButton, content, readmeText, repoUrl) {
  if (!trigger || !dialog || !closeButton || !content) {
    return;
  }

  var rendered = markdownToHtml(readmeText);
  if (repoUrl) {
    rendered +=
      '\n<h2>Source Code</h2><p><a href="' +
      escapeHtml(repoUrl) +
      '" target="_blank" rel="noopener noreferrer">GitHub Repository</a></p>';
  }
  content.innerHTML = rendered;

  trigger.addEventListener("click", function() {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.open = true;
    }
  });

  closeButton.addEventListener("click", function() {
    dialog.close();
  });
}
