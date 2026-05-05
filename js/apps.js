(function () {
  function slugify(input) {
    return (
      input
        .replace(/^https?:\/\//i, "")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase()
        .slice(0, 32) || "app"
    );
  }

  function deriveTitle(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  function loadApps() {
    return window.NexaStorage.loadJSON(window.NexaStorage.keys.apps, []);
  }

  function saveApps(apps) {
    window.NexaStorage.saveJSON(window.NexaStorage.keys.apps, apps);
  }

  function reorderApps(ids) {
    const apps = loadApps();
    const byId = new Map(apps.map((app) => [app.id, app]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
    const leftovers = apps.filter((app) => !ids.includes(app.id));
    saveApps([...ordered, ...leftovers]);
  }

  function upsertApp(url) {
    const apps = loadApps();
    const id = slugify(url);
    const existing = apps.find((app) => app.id === id);
    const app = {
      id,
      url,
      title: deriveTitle(url),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    const nextApps = existing ? apps.map((item) => (item.id === id ? app : item)) : [...apps, app];
    saveApps(nextApps);
    return app;
  }

  window.NexaApps = {
    loadApps,
    saveApps,
    reorderApps,
    upsertApp,
  };
})();
