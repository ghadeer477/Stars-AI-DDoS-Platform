(function () {
  function isDashboardPage() {
    const text = document.body.innerText || "";
    return text.includes("Dashboard") && text.includes("Logout");
  }

  function controlLiveWidget() {
    const box = document.getElementById("liveBox");
    if (!box) return;

    if (isDashboardPage()) {
      box.style.display = "block";
    } else {
      box.style.display = "none";

      const stopBtn = document.getElementById("stopLive");
      if (stopBtn && !stopBtn.disabled) {
        stopBtn.click();
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    controlLiveWidget();

    const observer = new MutationObserver(controlLiveWidget);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    setInterval(controlLiveWidget, 1000);
  });
})();
