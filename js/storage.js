(function () {
  const STORAGE_KEYS = {
    user: "nexaline.user",
    apps: "nexaline.apps",
    windows: "nexaline.windows",
    settings: "nexaline.settings",
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  window.NexaStorage = {
    keys: STORAGE_KEYS,
    loadJSON,
    saveJSON,
  };
})();
