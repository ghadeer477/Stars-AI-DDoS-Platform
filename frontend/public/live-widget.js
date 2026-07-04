(function () {
  const API_URL = window.location.protocol + "//" + window.location.hostname + ":5000/predict-live";

  let timer = null;
  let running = false;

  const style = document.createElement("style");
  style.innerHTML = `
    #liveBox {
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 360px;
      max-width: calc(100vw - 30px);
      background: #07111f;
      color: #eaf6ff;
      border: 1px solid rgba(56,189,248,.45);
      border-radius: 18px;
      box-shadow: 0 20px 50px rgba(0,0,0,.45);
      z-index: 999999;
      font-family: Arial, sans-serif;
      overflow: hidden;
    }

    #liveBox .head {
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,.12);
    }

    #liveBox .title {
      font-weight: 800;
      font-size: 15px;
    }

    #liveBox .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #64748b;
    }

    #liveBox.running .dot {
      background: #22c55e;
      box-shadow: 0 0 18px #22c55e;
    }

    #liveBox.attack .dot {
      background: #ef4444;
      box-shadow: 0 0 18px #ef4444;
    }

    #liveBox .body {
      padding: 14px 16px;
    }

    #liveBox button {
      border: 0;
      border-radius: 10px;
      padding: 10px;
      color: white;
      font-weight: 800;
      cursor: pointer;
    }

    #startLive {
      background: #16a34a;
      width: 48%;
    }

    #stopLive {
      background: #dc2626;
      width: 48%;
    }

    #liveBox button:disabled {
      opacity: .45;
      cursor: not-allowed;
    }

    #liveBox .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 14px;
    }

    #liveBox .card {
      background: rgba(15,23,42,.8);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 12px;
      padding: 10px;
    }

    #liveBox .label {
      color: #94a3b8;
      font-size: 11px;
      margin-bottom: 5px;
    }

    #liveBox .value {
      font-size: 16px;
      font-weight: 900;
    }

    #prediction.ATTACK {
      color: #f87171;
    }

    #prediction.NORMAL {
      color: #4ade80;
    }

    #log {
      margin-top: 12px;
      background: #020617;
      border-radius: 12px;
      padding: 10px;
      max-height: 120px;
      overflow: auto;
      font-size: 12px;
      line-height: 1.5;
    }
  `;

  document.head.appendChild(style);

  const box = document.createElement("div");
  box.id = "liveBox";

  box.innerHTML = `
    <div class="head">
      <div>
        <div class="title">Stars Live Monitor</div>
        <div id="status" style="font-size:12px;color:#94a3b8;margin-top:4px;">Stopped</div>
      </div>
      <div class="dot"></div>
    </div>

    <div class="body">
      <div style="display:flex;justify-content:space-between;gap:10px;">
        <button id="startLive">Start Live</button>
        <button id="stopLive" disabled>Stop Live</button>
      </div>

      <div class="grid">
        <div class="card">
          <div class="label">Prediction</div>
          <div class="value" id="prediction">--</div>
        </div>

        <div class="card">
          <div class="label">Confidence</div>
          <div class="value" id="confidence">--</div>
        </div>

        <div class="card">
          <div class="label">Attack Flows</div>
          <div class="value" id="attackFlows">--</div>
        </div>

        <div class="card">
          <div class="label">CPU / RAM</div>
          <div class="value" id="resources">--</div>
        </div>
      </div>

      <div id="log">Live monitor is ready.</div>
    </div>
  `;

  document.addEventListener("DOMContentLoaded", function () {
    document.body.appendChild(box);
    document.getElementById("startLive").onclick = startLive;
    document.getElementById("stopLive").onclick = stopLive;
  });

  function writeLog(message) {
    const log = document.getElementById("log");
    const time = new Date().toLocaleTimeString();
    log.innerHTML = "[" + time + "] " + message + "<br>" + log.innerHTML;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  }

  async function checkLive() {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          attack_type: "UDPLag"
        })
      });

      const data = await response.json();

      if (!data.success) {
        writeLog("Backend error: " + (data.error || "Unknown error"));
        return;
      }

      const prediction = data.prediction || data.result || "--";

      setText("prediction", prediction);
      setText("confidence", (data.confidence ?? "--") + "%");
      setText("attackFlows", data.attack_count ?? "--");
      setText("resources", (data.cpu_used ?? "--") + "% / " + (data.ram_used ?? "--") + "%");
      setText("status", "Running - Live Deep Learning Monitor");

      const pred = document.getElementById("prediction");
      pred.className = "value " + prediction;

      if (prediction === "ATTACK") {
        box.classList.add("attack");
        box.classList.remove("running");
        writeLog("ATTACK detected | " + data.model + " | " + data.confidence + "%");
      } else {
        box.classList.add("running");
        box.classList.remove("attack");
        writeLog("NORMAL traffic | " + data.confidence + "%");
      }

    } catch (error) {
      writeLog("Connection failed: " + error.message);
    }
  }

  function startLive() {
    if (running) {
      return;
    }

    running = true;

    box.classList.add("running");
    box.classList.remove("attack");

    document.getElementById("startLive").disabled = true;
    document.getElementById("stopLive").disabled = false;

    setText("status", "Starting...");
    writeLog("Live monitoring started.");

    checkLive();
    timer = setInterval(checkLive, 5000);
  }

  function stopLive() {
    running = false;

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    box.classList.remove("running");
    box.classList.remove("attack");

    document.getElementById("startLive").disabled = false;
    document.getElementById("stopLive").disabled = true;

    setText("status", "Stopped");
    writeLog("Live monitoring stopped.");
  }
})();
