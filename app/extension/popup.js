const DEFAULTS = { enabled: true, sensitivity: "media", serverUrl: "http://localhost:8787" };

chrome.storage.local.get(DEFAULTS, (s) => {
  const enabled = document.getElementById("enabled");
  enabled.checked = s.enabled;
  enabled.addEventListener("change", () => chrome.storage.local.set({ enabled: enabled.checked }));

  document.querySelectorAll("input[name=sens]").forEach((r) => {
    r.checked = r.value === s.sensitivity;
    r.addEventListener("change", () => chrome.storage.local.set({ sensitivity: r.value }));
  });

  const status = document.getElementById("status");
  fetch(s.serverUrl + "/api/health")
    .then((r) => r.json())
    .then((h) => {
      status.className = "status " + (h.ai ? "ok" : "warn");
      status.textContent = h.ai
        ? "Suggerimenti scritti dall'assistente AI."
        : "L'assistente AI non è raggiungibile: uso regole fisse. I suggerimenti arrivano lo stesso.";
      if (h.model) status.title = h.model;
    })
    .catch(() => {
      status.className = "status warn";
      status.textContent = "L'assistente AI non è raggiungibile: uso regole fisse. I suggerimenti arrivano lo stesso.";
    });
});
