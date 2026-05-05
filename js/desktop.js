(function () {
  function getWindowFactory() {
    if (typeof window.WinBox !== "function") {
      throw new Error("WinBox 未加载完成");
    }
    return window.WinBox;
  }

  function renderDesktop(container, onOpenApp) {
    const apps = window.NexaApps.loadApps();
    container.innerHTML = "";

    if (!apps.length) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = "还没有导入应用，点击右下角“导入”添加网页。";
      container.appendChild(empty);
      return;
    }

    for (const app of apps) {
      const button = document.createElement("button");
      button.className = "desktop-icon";
      button.type = "button";
      button.dataset.appId = app.id;
      button.innerHTML = `
        <div class="icon-surface">🌐</div>
        <div class="icon-name">${escapeHTML(app.title)}</div>
      `;
      button.addEventListener("click", () => onOpenApp(app));
      container.appendChild(button);
    }
  }

  function importApp(url) {
    return window.NexaApps.upsertApp(url);
  }

  function openAppWindow(app) {
    const WinBox = getWindowFactory();
    const frame = document.createElement("iframe");
    frame.src = app.url;
    frame.title = app.url;
    frame.style.width = "100%";
    frame.style.height = "100%";
    frame.style.border = "0";
    frame.referrerPolicy = "no-referrer";
    frame.allow = "clipboard-read; clipboard-write; fullscreen";

    return new WinBox({
      title: app.title,
      width: "70%",
      height: "72%",
      x: "center",
      y: "center",
      background: "#0a1222",
      mount: frame,
    });
  }

  function escapeHTML(text) {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  window.NexaDesktop = {
    renderDesktop,
    importApp,
    openAppWindow,
  };
})();
