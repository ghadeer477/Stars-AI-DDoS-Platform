(function () {
  function addStyle() {
    if (document.getElementById("sentinelUiPolishStyle")) return;

    const style = document.createElement("style");
    style.id = "sentinelUiPolishStyle";
    style.innerHTML = `
      :root {
        --sentinel-bg: #020617;
        --sentinel-card: rgba(15, 23, 42, .72);
        --sentinel-border: rgba(56, 189, 248, .22);
        --sentinel-cyan: #22d3ee;
        --sentinel-blue: #38bdf8;
        --sentinel-green: #22c55e;
        --sentinel-red: #ef4444;
        --sentinel-yellow: #facc15;
        --sentinel-text: #e5f6ff;
        --sentinel-muted: #94a3b8;
      }

      html, body {
        min-height: 100%;
        background:
          radial-gradient(circle at 20% 10%, rgba(34, 211, 238, .14), transparent 32%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, .16), transparent 30%),
          radial-gradient(circle at 50% 90%, rgba(16, 185, 129, .10), transparent 35%),
          linear-gradient(135deg, #020617 0%, #07111f 45%, #020617 100%) !important;
        color: var(--sentinel-text) !important;
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background-image:
          linear-gradient(rgba(56, 189, 248, .055) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56, 189, 248, .055) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: linear-gradient(to bottom, rgba(0,0,0,.8), rgba(0,0,0,.2));
      }

      body::after {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background: linear-gradient(120deg, transparent 0%, rgba(34,211,238,.05) 50%, transparent 100%);
        animation: sentinelScan 8s linear infinite;
      }

      @keyframes sentinelScan {
        0% { transform: translateX(-80%); }
        100% { transform: translateX(80%); }
      }

      #root {
        position: relative;
        z-index: 1;
      }

      button,
      input,
      select,
      textarea {
        border-radius: 12px !important;
      }

      input,
      select,
      textarea {
        background: rgba(2, 6, 23, .72) !important;
        color: #e0f2fe !important;
        border: 1px solid rgba(125, 211, 252, .30) !important;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.02) !important;
      }

      input:focus,
      select:focus,
      textarea:focus {
        outline: none !important;
        border-color: rgba(34, 211, 238, .75) !important;
        box-shadow: 0 0 0 3px rgba(34, 211, 238, .13) !important;
      }

      button {
        background: linear-gradient(135deg, rgba(14,165,233,.95), rgba(6,182,212,.92)) !important;
        color: white !important;
        border: 1px solid rgba(255,255,255,.16) !important;
        box-shadow: 0 12px 30px rgba(8,145,178,.25) !important;
        font-weight: 700 !important;
        letter-spacing: .2px;
        transition: transform .18s ease, box-shadow .18s ease, filter .18s ease !important;
      }

      button:hover {
        transform: translateY(-1px) !important;
        filter: brightness(1.08) !important;
        box-shadow: 0 16px 38px rgba(8,145,178,.35) !important;
      }

      button:active {
        transform: translateY(0px) scale(.99) !important;
      }

      a {
        color: #7dd3fc !important;
      }

      /* Make common dashboard containers look like glass cards */
      main,
      section,
      form,
      .card,
      [class*="card"],
      [class*="Card"],
      [class*="panel"],
      [class*="Panel"],
      [class*="dashboard"],
      [class*="Dashboard"] {
        backdrop-filter: blur(16px);
      }

      .sentinel-glassify {
        background: rgba(15, 23, 42, .72) !important;
        border: 1px solid rgba(56, 189, 248, .20) !important;
        box-shadow: 0 18px 50px rgba(0, 0, 0, .28) !important;
      }

      .sentinel-highlight-normal {
        color: #4ade80 !important;
        text-shadow: 0 0 18px rgba(74, 222, 128, .25);
      }

      .sentinel-highlight-attack {
        color: #fb7185 !important;
        text-shadow: 0 0 18px rgba(251, 113, 133, .25);
      }

      .sentinel-highlight-suspicious {
        color: #facc15 !important;
        text-shadow: 0 0 18px rgba(250, 204, 21, .25);
      }

      #sentinelExecutiveRibbon {
        position: fixed;
        top: 14px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999996;
        display: none;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(2, 6, 23, .78);
        border: 1px solid rgba(34, 211, 238, .34);
        color: #e0f2fe;
        box-shadow: 0 16px 45px rgba(0,0,0,.35);
        backdrop-filter: blur(14px);
        font-family: Arial, sans-serif;
        font-size: 12px;
        white-space: nowrap;
      }

      #sentinelExecutiveRibbon .dot {
        width: 8px;
        height: 8px;
        border-radius: 99px;
        background: #22c55e;
        box-shadow: 0 0 14px #22c55e;
        animation: sentinelPulse 1.4s ease-in-out infinite;
      }

      @keyframes sentinelPulse {
        0%, 100% { opacity: .55; transform: scale(.88); }
        50% { opacity: 1; transform: scale(1.15); }
      }

      #sentinelExecutiveRibbon b {
        color: #67e8f9;
      }

      #sentinelMiniMetrics {
        position: fixed;
        top: 68px;
        right: 20px;
        z-index: 999996;
        display: none;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        width: 370px;
        max-width: calc(100vw - 30px);
        font-family: Arial, sans-serif;
      }

      #sentinelMiniMetrics .metric {
        background: rgba(15, 23, 42, .76);
        border: 1px solid rgba(125, 211, 252, .18);
        border-radius: 16px;
        padding: 10px;
        box-shadow: 0 16px 36px rgba(0,0,0,.25);
        backdrop-filter: blur(12px);
      }

      #sentinelMiniMetrics .label {
        font-size: 11px;
        color: #94a3b8;
        margin-bottom: 5px;
      }

      #sentinelMiniMetrics .value {
        font-size: 13px;
        font-weight: 900;
        color: #e0f2fe;
      }

      @media (max-width: 850px) {
        #sentinelExecutiveRibbon {
          top: 8px;
          font-size: 11px;
          max-width: calc(100vw - 20px);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        #sentinelMiniMetrics {
          display: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function isDashboard() {
    const text = document.body.innerText || "";
    return text.includes("Dashboard") && text.includes("Logout");
  }

  function ensureRibbon() {
    let ribbon = document.getElementById("sentinelExecutiveRibbon");

    if (!ribbon) {
      ribbon = document.createElement("div");
      ribbon.id = "sentinelExecutiveRibbon";
      ribbon.innerHTML = `
        <span class="dot"></span>
        <span><b>Stars Defense Center</b></span>
        <span>• AWS Live</span>
        <span>• MLP Deep Learning</span>
        <span>• Auto Block Ready</span>
      `;
      document.body.appendChild(ribbon);
    }

    return ribbon;
  }

  function ensureMiniMetrics() {
    let box = document.getElementById("sentinelMiniMetrics");

    if (!box) {
      box = document.createElement("div");
      box.id = "sentinelMiniMetrics";
      box.innerHTML = `
        <div class="metric">
          <div class="label">Detection Mode</div>
          <div class="value">Auto Detect</div>
        </div>
        <div class="metric">
          <div class="label">Models</div>
          <div class="value">Multi-MLP</div>
        </div>
        <div class="metric">
          <div class="label">Response</div>
          <div class="value">Alert + Block</div>
        </div>
      `;
      document.body.appendChild(box);
    }

    return box;
  }

  function polishCards() {
    const candidates = Array.from(document.querySelectorAll("main, section, form, .card, [class*='card'], [class*='Card'], [class*='panel'], [class*='Panel']"));

    candidates.slice(0, 20).forEach(el => {
      const rect = el.getBoundingClientRect();

      if (rect.width > 180 && rect.height > 80) {
        el.classList.add("sentinel-glassify");
      }
    });
  }

  function highlightKeywords() {
    const elements = Array.from(document.querySelectorAll("h1,h2,h3,h4,p,span,div,strong,b"));

    elements.slice(0, 250).forEach(el => {
      if (el.children.length > 0) return;

      const text = (el.textContent || "").trim();

      if (text === "ATTACK" || text.includes("ATTACK")) {
        el.classList.add("sentinel-highlight-attack");
      }

      if (text === "NORMAL" || text.includes("NORMAL")) {
        el.classList.add("sentinel-highlight-normal");
      }

      if (text.includes("SUSPICIOUS") || text.includes("UNKNOWN")) {
        el.classList.add("sentinel-highlight-suspicious");
      }
    });
  }

  function updateVisibility() {
    const show = isDashboard();
    const ribbon = ensureRibbon();
    const metrics = ensureMiniMetrics();

    ribbon.style.display = show ? "flex" : "none";
    metrics.style.display = show ? "grid" : "none";

    if (show) {
      polishCards();
      highlightKeywords();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    addStyle();
    ensureRibbon();
    ensureMiniMetrics();
    updateVisibility();

    setInterval(updateVisibility, 1500);
  });
})();

/* ===== Final UI Cleanup Overrides ===== */
(function () {
  function cleanupStyle() {
    if (document.getElementById("sentinelFinalCleanStyle")) return;

    const style = document.createElement("style");
    style.id = "sentinelFinalCleanStyle";
    style.innerHTML = `
      /* Hide top mini cards to reduce dashboard crowding */
      #sentinelMiniMetrics {
        display: none !important;
      }

      /* Make the top ribbon smaller and cleaner */
      #sentinelExecutiveRibbon {
        top: 12px !important;
        padding: 8px 13px !important;
        font-size: 11px !important;
        opacity: .96 !important;
      }

      /* Make live monitor smaller and less intrusive */
      #liveBox,
      #sentinelLiveBox,
      #liveMonitorBox,
      [id*="live"][id*="Box"],
      [id*="Live"][id*="Box"] {
        width: 320px !important;
        max-width: 320px !important;
        right: 18px !important;
        bottom: 18px !important;
        transform: scale(.92) !important;
        transform-origin: bottom right !important;
      }

      /* Improve page spacing */
      body {
        overflow-x: hidden !important;
      }

      /* Cleaner dashboard border glow */
      main,
      section,
      form,
      .sentinel-glassify {
        border-color: rgba(34, 211, 238, .18) !important;
      }
    `;

    document.head.appendChild(style);
  }

  document.addEventListener("DOMContentLoaded", cleanupStyle);
  setInterval(cleanupStyle, 1200);
})();
