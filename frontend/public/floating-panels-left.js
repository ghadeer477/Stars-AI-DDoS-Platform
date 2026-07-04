(function () {
  function findLiveMonitorBox() {
    const nodes = Array.from(document.querySelectorAll("div, section, aside"));

    return nodes.find(el => {
      const text = el.innerText || "";
      const rect = el.getBoundingClientRect();

      return text.includes("Stars Live Monitor") &&
             rect.width >= 230 &&
             rect.width <= 460 &&
             rect.height >= 170 &&
             rect.height <= 520;
    });
  }

  function movePanelsLeft() {
    const live = findLiveMonitorBox();
    const pro = document.getElementById("proAdminPanel");
    const insights = document.getElementById("securityInsightsPanel");

    if (live) {
      live.style.position = "fixed";
      live.style.left = "22px";
      live.style.right = "auto";
      live.style.top = "170px";
      live.style.bottom = "auto";
      live.style.width = "300px";
      live.style.maxWidth = "300px";
      live.style.transform = "scale(0.88)";
      live.style.transformOrigin = "top left";
      live.style.zIndex = "999990";
    }

    if (pro) {
      pro.style.position = "fixed";
      pro.style.left = "22px";
      pro.style.right = "auto";
      pro.style.bottom = "22px";
      pro.style.top = "auto";
      pro.style.width = "315px";
      pro.style.maxWidth = "315px";
      pro.style.transform = "scale(0.90)";
      pro.style.transformOrigin = "bottom left";
      pro.style.zIndex = "999989";
    }

    if (insights) {
      insights.style.position = "fixed";
      insights.style.left = "22px";
      insights.style.right = "auto";
      insights.style.bottom = "360px";
      insights.style.top = "auto";
      insights.style.width = "315px";
      insights.style.maxWidth = "315px";
      insights.style.transform = "scale(0.90)";
      insights.style.transformOrigin = "bottom left";
      insights.style.zIndex = "999988";
    }

    if (window.innerWidth < 1200) {
      if (live) {
        live.style.left = "12px";
        live.style.top = "140px";
        live.style.width = "270px";
        live.style.maxWidth = "270px";
        live.style.transform = "scale(0.82)";
      }

      if (pro) {
        pro.style.left = "12px";
        pro.style.bottom = "12px";
        pro.style.width = "280px";
        pro.style.maxWidth = "280px";
        pro.style.transform = "scale(0.82)";
      }

      if (insights) {
        insights.style.display = "none";
      }
    }
  }

  function addHardCss() {
    if (document.getElementById("floatingPanelsLeftStyle")) return;

    const style = document.createElement("style");
    style.id = "floatingPanelsLeftStyle";
    style.innerHTML = `
      #proAdminPanel {
        left: 22px !important;
        right: auto !important;
        bottom: 22px !important;
        top: auto !important;
      }

      #securityInsightsPanel {
        left: 22px !important;
        right: auto !important;
      }

      body {
        overflow-x: hidden !important;
      }
    `;

    document.head.appendChild(style);
  }

  document.addEventListener("DOMContentLoaded", function () {
    addHardCss();
    movePanelsLeft();
  });

  setInterval(function () {
    addHardCss();
    movePanelsLeft();
  }, 500);
})();
