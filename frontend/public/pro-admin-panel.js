(function () {
  let apiBase = window.__sentinelApiBase || "/api";
  const originalFetch = window.fetch;

  window.fetch = async function () {
    try {
      const url = String(arguments[0]);
      if (url.includes("/predict")) {
        const parsed = new URL(url, window.location.href);
        apiBase = "/api";
        window.__sentinelApiBase = apiBase;
      }
    } catch (e) {}

    return originalFetch.apply(this, arguments);
  };

  function isDashboard() {
    const text = document.body.innerText || "";
    return text.includes("Dashboard") && text.includes("Logout");
  }

  function ensurePanel() {
    let panel = document.getElementById("proAdminPanel");
    if (panel) return panel;

    const style = document.createElement("style");
    style.innerHTML = `
      #proAdminPanel {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 360px;
        max-width: calc(100vw - 30px);
        background: rgba(2, 6, 23, .97);
        color: #e5f6ff;
        border: 1px solid rgba(34, 211, 238, .45);
        border-radius: 18px;
        padding: 14px;
        z-index: 999997;
        box-shadow: 0 20px 55px rgba(0,0,0,.45);
        font-family: Arial, sans-serif;
        display: none;
      }

      #proAdminPanel .pro-title {
        font-size: 15px;
        font-weight: 900;
        margin-bottom: 8px;
      }

      #proAdminPanel .pro-small {
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 8px;
        line-height: 1.4;
      }

      #proAdminPanel .pro-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
        margin-top: 8px;
      }

      #proAdminPanel button, #proAdminPanel a {
        background: #0f172a;
        color: #e0f2fe;
        border: 1px solid rgba(125, 211, 252, .25);
        border-radius: 10px;
        padding: 8px 9px;
        font-size: 12px;
        text-align: center;
        cursor: pointer;
        text-decoration: none;
      }

      #proAdminPanel button:hover, #proAdminPanel a:hover {
        background: #164e63;
      }

      #proAdminPanel .pro-box {
        background: #020617;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 12px;
        padding: 8px;
        font-size: 12px;
        max-height: 130px;
        overflow: auto;
        margin-top: 8px;
        line-height: 1.5;
      }

      .pro-ok { color: #4ade80; }
      .pro-bad { color: #f87171; }
      .pro-warn { color: #facc15; }
    `;
    document.head.appendChild(style);

    panel = document.createElement("div");
    panel.id = "proAdminPanel";
    panel.innerHTML = `
      <div class="pro-title">Professional Controls</div>
      <div class="pro-small" id="proSummary">Loading system status...</div>
      <div class="pro-grid">
        <button id="refreshProStatus">Refresh Status</button>
        <a id="exportProReport" target="_blank">Export Report</a>
        <button id="showBlockedIps">Blocked IPs</button>
        <button id="manualUnblockIp">Unblock IP</button>
      </div>
      <div class="pro-box" id="proDetails">Waiting...</div>
    `;

    document.body.appendChild(panel);

    document.getElementById("refreshProStatus").onclick = refreshStatus;
    document.getElementById("showBlockedIps").onclick = showBlocked;
    document.getElementById("manualUnblockIp").onclick = manualUnblock;
    document.getElementById("exportProReport").href = apiBase + "/professional/export-report?format=csv";

    return panel;
  }

  async function apiGet(path) {
    const res = await fetch(apiBase + path);
    return await res.json();
  }

  async function refreshStatus() {
    const panel = ensurePanel();
    const summary = document.getElementById("proSummary");
    const details = document.getElementById("proDetails");

    document.getElementById("exportProReport").href = apiBase + "/professional/export-report?format=csv";

    try {
      const model = await apiGet("/professional/model-status");
      const system = await apiGet("/professional/system-status");

      const active = system.service && system.service.active === "active";
      const modelCount = model.total_models || 0;
      const blockedCount = (system.blocked_rules || []).length;

      summary.innerHTML = `
        Backend Service: <b class="${active ? "pro-ok" : "pro-bad"}">${active ? "Active" : "Not Active"}</b><br>
        Loaded Models: <b class="pro-ok">${modelCount}</b> |
        Blocked Rules: <b class="${blockedCount ? "pro-warn" : "pro-ok"}">${blockedCount}</b>
      `;

      details.innerHTML = (model.models || []).map(m =>
        `<div>✅ ${m.attack_type}: ${m.status}</div>`
      ).join("") || "No model status available.";

      panel.style.display = isDashboard() ? "block" : "none";
    } catch (e) {
      summary.innerHTML = `<span class="pro-bad">Could not load professional status.</span>`;
      details.textContent = String(e);
    }
  }

  async function showBlocked() {
    const details = document.getElementById("proDetails");

    try {
      const data = await apiGet("/professional/blocked-ips");
      const rules = data.iptables_drop_rules || [];

      if (rules.length === 0) {
        details.innerHTML = `<span class="pro-ok">No blocked IP rules currently.</span>`;
      } else {
        details.innerHTML = rules.map(r => `<div>🚫 ${r}</div>`).join("");
      }
    } catch (e) {
      details.textContent = String(e);
    }
  }

  async function manualUnblock() {
    const ip = prompt("Enter IP address to unblock:");

    if (!ip) return;

    const details = document.getElementById("proDetails");

    try {
      const res = await fetch(apiBase + "/professional/unblock-ip", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ip})
      });

      const data = await res.json();

      details.innerHTML = `
        <div>IP: ${ip}</div>
        <div>Result: ${data.output || data.error || "Done"}</div>
      `;

      refreshStatus();
    } catch (e) {
      details.textContent = String(e);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensurePanel();

    setInterval(function () {
      const panel = ensurePanel();

      if (isDashboard()) {
        panel.style.display = "block";
      } else {
        panel.style.display = "none";
      }
    }, 1500);

    setTimeout(refreshStatus, 2000);
  });
})();
