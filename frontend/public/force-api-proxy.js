(function () {
  window.__sentinelApiBase = "/api";

  const oldFetch = window.fetch;

  window.fetch = function (input, init) {
    try {
      if (typeof input === "string") {
        input = input
          .replace("http://16.16.65.222:5000", "/api")
          .replace("https://16.16.65.222:5000", "/api")
          .replace("http://127.0.0.1:5000", "/api")
          .replace("https://127.0.0.1:5000", "/api")
          .replace("http://localhost:5000", "/api")
          .replace("https://localhost:5000", "/api");

        input = input.replace("/api/api/", "/api/");
      }
    } catch (e) {}

    return oldFetch.call(this, input, init);
  };
})();
