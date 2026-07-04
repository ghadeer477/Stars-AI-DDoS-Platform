(function () {
  const originalFetch = window.fetch;

  function isDashboard() {
    const text = document.body.innerText || "";
    return text.includes("Dashboard") && text.includes("Logout");
  }

  function ensurePanel() {
    let panel = document.getElementById("securityInsightsPanel");

    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "securityInsightsPanel";
    panel.innerHTML = `
      <div class="insight-title">Security Insights</div>
      <div class="insight-row"><span>Severity</span><b id="insightSeverity">--</b></div>
      <div class="insight-row"><span>Recommendation</span></div>
      <div id="insightRecommendation" class="insight-box">Waiting for analysis...</div>
      <div class="insight-row"><span>Top Model Scores</span></div>
      <div id="insightScores" class="insight-box">No scores yet.</div>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
      #securityInsightsPanel {
        position: fixed;
        left: 20px;
        bottom: 20px;
        width: 360px;
        max-width: calc(100vw - 30px);
        background: rgba(7,17,31,.96);
        color: #eaf6ff;
        border: 1px solid rgba(56,189,248,.45);
        border-radius: 18px;
        box-shadow: 0 20px 50px rgba(0,0,0,.45);
        z-index: 999998;
        font-family: Arial, sans-serif;
        padding: 14px;
        display: none;
      }

      #securityInsightsPanel .insight-title {
        font-size: 15px;
        font-weight: 900;
        margin-bottom: 10px;
      }

      #securityInsightsPanel .insight-row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: #94a3b8;
        font-size: 12px;
        margin: 8px 0 5px;
      }

      #securityInsightsPanel .insight-box {
        background: #020617;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 12px;
        padding: 9px;
        font-size: 12px;
        line-height: 1.45;
        max-height: 120px;
        overflow: auto;
      }

      #insightSeverity.Normal { color: #4ade80; }
      #insightSeverity.Low { color: #a3e635; }
      #insightSeverity.Medium { color: #facc15; }
      #insightSeverity.High { color: #fb923c; }
      #insightSeverity.Critical { color: #f87171; }

      .score-line {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255,255,255,.06);
        padding: 4px 0;
        gap: 8px;
      }

      .score-line:last-child {
        border-bottom: 0;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);

    return panel;
  }

  function updatePanel(data) {
    if (!data || !data.success) return;

    const panel = ensurePanel();

    if (!isDashboard()) {
      panel.style.display = "none";
      return;
    }

    panel.style.display = "block";

    const severity = data.severity || "--";
    const sevEl = document.getElementById("insightSeverity");
    sevEl.textContent = severity;
    sevEl.className = severity;

    document.getElementById("insightRecommendation").textContent =
      data.recommendation || "No recommendation available.";

    const scoresEl = document.getElementById("insightScores");
    const scores = data.top_model_scores || data.all_model_scores || [];

    if (scores.length === 0) {
      scoresEl.innerHTML = "No model comparison scores available.";
    } else {
      scoresEl.innerHTML = scores.slice(0, 6).map(item => {
        const model = item.model || item.attack_type || "Model";
        const score = item.score !== undefined ? item.score : "--";
        const conf = item.confidence !== undefined ? item.confidence + "%" : "--";
        return `<div class="score-line"><span>${model}</span><b>${score} / ${conf}</b></div>`;
      }).join("");
    }
  }

  window.fetch = async function () {
    const response = await originalFetch.apply(this, arguments);

    try {
      const url = String(arguments[0]);

      if (url.includes("/predict") || url.includes("/predict-live")) {
        response.clone().json().then(updatePanel).catch(function () {});
      }
    } catch (e) {}

    return response;
  };

  document.addEventListener("DOMContentLoaded", function () {
    ensurePanel();

    setInterval(function () {
      const panel = document.getElementById("securityInsightsPanel");
      if (!panel) return;
      panel.style.display = isDashboard() ? panel.style.display : "none";
    }, 1000);
  });
})();
