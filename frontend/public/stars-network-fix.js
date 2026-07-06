(function () {
  console.log("Stars Network Fix Loaded - strong version");

  const API_BASE = "/api";

  function fixUrl(url) {
    if (!url) return url;

    url = String(url);

    // Convert any public/backend port 5000 URL to /api
    url = url.replace(/^https?:\/\/[^/]+:5000/i, API_BASE);

    url = url
      .replace("/api", API_BASE)
      .replace("/api", API_BASE)
      .replace("/api", API_BASE)
      .replace("/api", API_BASE)
      .replace("/api", API_BASE)
      .replace("/api", API_BASE)
      .replace("/api", API_BASE)
      .replace("/api", API_BASE);

    const endpoints = [
      "health",
      "predict",
      "predict-live",
      "detection-history",
      "blocked-ips",
      "professional/model-status",
      "professional/system-status",
      "professional/blocked-ips",
      "professional/unblock-ip",
      "professional/export-report"
    ];

    for (const ep of endpoints) {
      if (url === "/" + ep) url = API_BASE + "/" + ep;
      if (url === ep) url = API_BASE + "/" + ep;
      if (url.startsWith("/" + ep + "?")) {
        url = API_BASE + "/" + ep + url.substring(ep.length + 1);
      }
    }

    return url.replace("/api/", "/api/").replace("/api//", "/api/");
  }

  const oldFetch = window.fetch;
  window.fetch = function (input, init) {
    try {
      if (typeof input === "string") {
        input = fixUrl(input);
      } else if (input && input.url) {
        input = new Request(fixUrl(input.url), input);
      }
    } catch (e) {}

    return oldFetch.call(this, input, init);
  };

  if (window.XMLHttpRequest) {
    const oldOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      const fixedUrl = fixUrl(url);
      return oldOpen.apply(this, [method, fixedUrl].concat(Array.prototype.slice.call(arguments, 2)));
    };
  }
})();
