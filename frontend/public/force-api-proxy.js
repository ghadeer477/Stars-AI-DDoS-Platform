(function () {
  window.__sentinelApiBase = "/api";

  const originalFetch = window.fetch;

  window.fetch = function (input, init) {
    try {
      if (typeof input === "string") {
        let url = input;

        url = url
          .replace("http://16.16.65.222:5000", "/api")
          .replace("https://16.16.65.222:5000", "/api")
          .replace("http://127.0.0.1:5000", "/api")
          .replace("https://127.0.0.1:5000", "/api")
          .replace("http://localhost:5000", "/api")
          .replace("https://localhost:5000", "/api");

        if (url.includes(":5000/predict-live")) {
          url = "/api/predict-live";
        }

        if (url.includes(":5000/predict")) {
          url = "/api/predict";
        }

        if (url.includes(":5000/health")) {
          url = "/api/health";
        }

        url = url.replace("/api/api/", "/api/").replace("/api//", "/api/");

        input = url;
      }
    } catch (e) {}

    return originalFetch.call(this, input, init);
  };
})();
