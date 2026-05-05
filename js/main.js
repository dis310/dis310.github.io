(function () {
  const bootScreen = document.getElementById("boot-screen");
  const loginScreen = document.getElementById("login-screen");
  const desktopScreen = document.getElementById("desktop-screen");
  const shutdownScreen = document.getElementById("shutdown-screen");
  const shutdownText = document.getElementById("shutdown-text");
  const bootProgress = document.getElementById("boot-progress");
  const bootStatus = document.getElementById("boot-status");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const desktopIcons = document.getElementById("desktop-icons");
  const taskItems = document.getElementById("task-items");
  const clock = document.getElementById("clock");
  const taskbarClock = document.getElementById("taskbar-clock");
  const importBtn = document.getElementById("import-app-btn");
  const importModal = document.getElementById("import-modal");
  const importForm = document.getElementById("import-form");
  const cancelImport = document.getElementById("cancel-import");
  const appUrl = document.getElementById("app-url");
  const startBtn = document.getElementById("start-btn");
  const startMenu = document.getElementById("start-menu");
  const contextMenu = document.getElementById("context-menu");
  const openUserBtn = document.getElementById("open-user-btn");
  const openUserModal = document.getElementById("open-user-modal");
  const openUserList = document.getElementById("open-user-list");
  const closeOpenUser = document.getElementById("close-open-user");

  const windows = new Map();
  let activeWindowId = null;
  let audioCtx = null;
  let dragId = null;

  bootSequence();
  wireEvents();
  syncClock();
  setInterval(syncClock, 1000);

  function bootSequence() {
    const steps = [
      ["Loading kernel", 18],
      ["Mounting storage", 42],
      ["Starting session manager", 68],
      ["Preparing desktop", 100],
    ];

    let index = 0;
    const timer = setInterval(() => {
      const current = steps[index];
      if (!current) {
        clearInterval(timer);
        finishBoot();
        return;
      }
      const [status, progress] = current;
      bootStatus.textContent = `${status}...`;
      bootProgress.style.width = `${progress}%`;
      if (index === 1) playBootTone();
      index += 1;
    }, 320);
  }

  function finishBoot() {
    setTimeout(() => {
      bootScreen.classList.remove("active");
      const auth = window.NexaAuth.getAuthState();
      if (auth.loggedIn) {
        showDesktop();
      } else {
        loginScreen.classList.add("active");
      }
    }, 420);
  }

  function wireEvents() {
    loginForm.addEventListener("submit", handleLogin);
    importBtn.addEventListener("click", openImportModal);
    cancelImport.addEventListener("click", closeImportModal);
    importForm.addEventListener("submit", handleImport);
    importModal.addEventListener("click", (event) => {
      if (event.target === importModal) closeImportModal();
    });
    openUserBtn.addEventListener("click", openOpenUserModal);
    closeOpenUser.addEventListener("click", closeOpenUserModal);
    openUserModal.addEventListener("click", (event) => {
      if (event.target === openUserModal) closeOpenUserModal();
    });

    startBtn.addEventListener("click", toggleStartMenu);
    document.addEventListener("click", (event) => {
      if (!startMenu.contains(event.target) && event.target !== startBtn) hideStartMenu();
      if (!contextMenu.contains(event.target)) hideContextMenu();
    });

    desktopScreen.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleHotkeys);
    desktopIcons.addEventListener("dragstart", handleDragStart);
    desktopIcons.addEventListener("dragover", handleDragOver);
    desktopIcons.addEventListener("drop", handleDrop);
    desktopIcons.addEventListener("dragend", handleDragEnd);

    startMenu.addEventListener("click", (event) => {
      const action = event.target?.dataset?.action;
      if (!action) return;
      if (action === "logout") return logout();
      if (action === "restart") return restart();
      if (action === "shutdown") return shutdown();
    });
  }

  function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (!window.NexaAuth.isValidCredentials(username, password)) {
      loginMessage.textContent = "用户名或密码错误。";
      return;
    }

    loginMessage.textContent = "";
    window.NexaAuth.signIn(username);
    showDesktop();
  }

  function showDesktop() {
    loginScreen.classList.remove("active");
    desktopScreen.classList.add("active");
    renderDesktop();
    refreshTaskbar();
  }

  function renderDesktop() {
    window.NexaDesktop.renderDesktop(desktopIcons, openAppFromIcon);
    makeIconsDraggable();
  }

  function openAppFromIcon(app) {
    openApp(app);
  }

  function openApp(app) {
    if (windows.has(app.id)) {
      const existing = windows.get(app.id);
      if (existing?.win?.focus) existing.win.focus();
      activeWindowId = app.id;
      refreshTaskbar();
      return;
    }

    const win = window.NexaDesktop.openAppWindow(app);
    const record = { id: app.id, app, win };
    windows.set(app.id, record);
    activeWindowId = app.id;
    refreshTaskbar();

    const nativeClose = win.close.bind(win);
    win.close = () => {
      windows.delete(app.id);
      if (activeWindowId === app.id) activeWindowId = null;
      refreshTaskbar();
      nativeClose();
    };
  }

  function openImportModal() {
    importModal.classList.remove("hidden");
    importModal.setAttribute("aria-hidden", "false");
    appUrl.value = "";
    setTimeout(() => appUrl.focus(), 0);
  }

  function closeImportModal() {
    importModal.classList.add("hidden");
    importModal.setAttribute("aria-hidden", "true");
  }

  function handleImport(event) {
    event.preventDefault();
    const url = appUrl.value.trim();

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      alert("请输入有效 URL，例如 https://example.com");
      return;
    }

    const app = window.NexaDesktop.importApp(parsed.href);
    closeImportModal();
    renderDesktop();
    openApp(app);
  }

  function openOpenUserModal() {
    const users = window.NexaAuth.getOpenUsers();
    openUserList.innerHTML = users
      .map((user) => `<div class="user-row"><span>${user.username}</span><span>${user.password}</span></div>`)
      .join("");
    openUserModal.classList.remove("hidden");
    openUserModal.setAttribute("aria-hidden", "false");
  }

  function closeOpenUserModal() {
    openUserModal.classList.add("hidden");
    openUserModal.setAttribute("aria-hidden", "true");
  }

  function syncClock() {
    const now = new Date();
    const text = now.toLocaleString("zh-CN", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    clock.textContent = text;
    taskbarClock.textContent = text;
  }

  function toggleStartMenu() {
    if (startMenu.classList.contains("hidden")) showStartMenu();
    else hideStartMenu();
  }

  function showStartMenu() {
    startMenu.classList.remove("hidden");
    startMenu.setAttribute("aria-hidden", "false");
    startMenu.style.left = "16px";
    startMenu.style.bottom = "76px";
  }

  function hideStartMenu() {
    startMenu.classList.add("hidden");
    startMenu.setAttribute("aria-hidden", "true");
  }

  function showContextMenu(x, y, app) {
    contextMenu.innerHTML = `
      <button type="button" data-action="open">打开</button>
      <button type="button" data-action="close">关闭窗口</button>
      <button type="button" data-action="remove">删除图标</button>
    `;
    contextMenu.dataset.appId = app?.id || "";
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.remove("hidden");
    contextMenu.setAttribute("aria-hidden", "false");
    contextMenu.onclick = (e) => {
      const action = e.target?.dataset?.action;
      if (!action || !app) return;
      if (action === "open") openApp(app);
      if (action === "close") {
        const rec = windows.get(app.id);
        if (rec) rec.win.close();
      }
      if (action === "remove") {
        const next = window.NexaApps.loadApps().filter((item) => item.id !== app.id);
        window.NexaStorage.saveJSON(window.NexaStorage.keys.apps, next);
        const rec = windows.get(app.id);
        if (rec) rec.win.close();
        renderDesktop();
      }
      hideContextMenu();
    };
  }

  function hideContextMenu() {
    contextMenu.classList.add("hidden");
    contextMenu.setAttribute("aria-hidden", "true");
    contextMenu.dataset.appId = "";
  }

  function handleContextMenu(event) {
    const icon = event.target.closest(".desktop-icon");
    if (!icon) return;
    event.preventDefault();
    const app = window.NexaApps.loadApps().find((item) => item.id === icon.dataset.appId);
    if (!app) return;
    showContextMenu(event.clientX, event.clientY, app);
  }

  function refreshTaskbar() {
    taskItems.innerHTML = "";
    const list = Array.from(windows.values());
    for (const record of list) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `task-item ${record.id === activeWindowId ? "active" : ""}`;
      btn.textContent = record.app.title;
      btn.addEventListener("click", () => {
        activeWindowId = record.id;
        if (record.win?.focus) record.win.focus();
        refreshTaskbar();
      });
      taskItems.appendChild(btn);
    }
  }

  function handleHotkeys(event) {
    if (event.key === "Escape") {
      hideStartMenu();
      hideContextMenu();
      closeImportModal();
    }
  }

  function logout() {
    window.NexaAuth.signOut();
    location.reload();
  }

  function restart() {
    shutdown("正在重启...", true);
  }

  function shutdown(message = "正在关机...", reboot = false) {
    hideStartMenu();
    desktopScreen.classList.remove("active");
    shutdownScreen.classList.remove("hidden");
    shutdownText.textContent = message;
    setTimeout(() => {
      window.NexaAuth.signOut();
      if (reboot) location.reload();
      else shutdownText.textContent = "系统已关闭。刷新页面可重新开机。";
    }, 900);
  }

  function makeIconsDraggable() {
    desktopIcons.querySelectorAll(".desktop-icon").forEach((icon) => {
      icon.draggable = true;
    });
  }

  function handleDragStart(event) {
    const icon = event.target.closest(".desktop-icon");
    if (!icon) return;
    dragId = icon.dataset.appId;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragId);
  }

  function handleDragOver(event) {
    if (!dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event) {
    const targetIcon = event.target.closest(".desktop-icon");
    if (!dragId || !targetIcon || targetIcon.dataset.appId === dragId) return;
    event.preventDefault();

    const ids = Array.from(desktopIcons.querySelectorAll(".desktop-icon")).map((icon) => icon.dataset.appId);
    const fromIndex = ids.indexOf(dragId);
    const toIndex = ids.indexOf(targetIcon.dataset.appId);
    if (fromIndex < 0 || toIndex < 0) return;

    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, dragId);
    window.NexaApps.reorderApps(ids);
    renderDesktop();
  }

  function handleDragEnd() {
    dragId = null;
  }

  function playBootTone() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = audioCtx || new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = 392;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
      osc.stop(audioCtx.currentTime + 0.36);
    } catch {}
  }
})();
