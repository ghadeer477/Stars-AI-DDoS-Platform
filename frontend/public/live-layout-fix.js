(function () {
  function findLiveMonitorBox() {
    const nodes = Array.from(document.querySelectorAll("div, section, aside"));

    return nodes.find(el => {
      const text = el.innerText || "";
      const rect = el.getBoundingClientRect();

      return text.includes("Stars Live Monitor") &&
             rect.width >= 230 &&
             rect.width <= 450 &&
             rect.height >= 180 &&
             rect.height <= 500;
    });
  }

  function fixLiveMonitorPosition() {
    const box = findLiveMonitorBox();

    if (!box) return;

    box.style.position = "fixed";
    box.style.bottom = "22px";
    box.style.right = "430px";
    box.style.left = "auto";
    box.style.width = "300px";
    box.style.maxWidth = "300px";
    box.style.transform = "none";
    box.style.zIndex = "999990";

    if (window.innerWidth < 1200) {
      box.style.right = "22px";
      box.style.bottom = "22px";
      box.style.width = "280px";
      box.style.maxWidth = "280px";
      box.style.transform = "scale(0.88)";
      box.style.transformOrigin = "bottom right";
    }
  }

  document.addEventListener("DOMContentLoaded", fixLiveMonitorPosition);
  setInterval(fixLiveMonitorPosition, 700);
})();
