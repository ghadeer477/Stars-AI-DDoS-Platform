(function () {
  function addStyle() {
    if (document.getElementById("sentinel-visual-motion-style")) return;

    const style = document.createElement("style");
    style.id = "sentinel-visual-motion-style";
    style.innerHTML = `
      .sentinel-motion-card {
        position: relative;
        overflow: hidden;
      }

      .sentinel-motion-card::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: radial-gradient(circle at 50% 50%, rgba(56,189,248,.08), transparent 55%);
        opacity: .55;
        pointer-events: none;
        animation: sentinelSoftGlow 4s ease-in-out infinite;
      }

      @keyframes sentinelSoftGlow {
        0%, 100% {
          opacity: .25;
          transform: scale(1);
        }
        50% {
          opacity: .65;
          transform: scale(1.03);
        }
      }

      .sentinel-ai-orbit {
        animation: sentinelRotateSlow 9s linear infinite;
        transform-origin: center center;
      }

      .sentinel-ai-pulse {
        animation: sentinelPulseCenter 2.2s ease-in-out infinite;
      }

      @keyframes sentinelRotateSlow {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes sentinelPulseCenter {
        0%, 100% {
          transform: scale(1);
          filter: drop-shadow(0 0 4px rgba(56,189,248,.25));
        }
        50% {
          transform: scale(1.045);
          filter: drop-shadow(0 0 14px rgba(56,189,248,.55));
        }
      }

      .sentinel-floating-label {
        animation: sentinelFloatLabel 2.8s ease-in-out infinite;
      }

      .sentinel-floating-label:nth-child(2n) {
        animation-delay: .4s;
      }

      .sentinel-floating-label:nth-child(3n) {
        animation-delay: .8s;
      }

      @keyframes sentinelFloatLabel {
        0%, 100% {
          transform: translateY(0);
          box-shadow: 0 0 0 rgba(56,189,248,0);
        }
        50% {
          transform: translateY(-5px);
          box-shadow: 0 0 18px rgba(56,189,248,.22);
        }
      }

      .sentinel-integrity-ring {
        animation: sentinelIntegrityBreath 3s ease-in-out infinite;
        transform-origin: center center;
      }

      @keyframes sentinelIntegrityBreath {
        0%, 100% {
          transform: scale(1);
          filter: drop-shadow(0 0 0 rgba(34,211,238,0));
        }
        50% {
          transform: scale(1.035);
          filter: drop-shadow(0 0 16px rgba(34,211,238,.45));
        }
      }

      .sentinel-number-glow {
        animation: sentinelNumberGlow 2.4s ease-in-out infinite;
      }

      @keyframes sentinelNumberGlow {
        0%, 100% {
          text-shadow: 0 0 0 rgba(34,211,238,0);
        }
        50% {
          text-shadow: 0 0 16px rgba(34,211,238,.55);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function isDashboard() {
    const text = document.body.innerText || "";
    return text.includes("Dashboard") && text.includes("Logout");
  }

  function findCardByText(keyword) {
    const nodes = Array.from(document.querySelectorAll("div, section, article"));
    let best = null;

    for (const node of nodes) {
      const text = node.innerText || "";
      const rect = node.getBoundingClientRect();

      if (
        text.includes(keyword) &&
        rect.width > 250 &&
        rect.height > 180
      ) {
        if (!best || rect.width * rect.height < best.getBoundingClientRect().width * best.getBoundingClientRect().height) {
          best = node;
        }
      }
    }

    return best;
  }

  function animatePredictiveCard() {
    const card = findCardByText("Predictive Model Deployment");
    if (!card) return;

    card.classList.add("sentinel-motion-card");

    const elements = Array.from(card.querySelectorAll("div, span, p, svg, canvas"));

    elements.forEach(el => {
      const text = (el.innerText || el.textContent || "").trim();
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      if (
        text === "DNS 14%" ||
        text === "NTP 11%" ||
        text === "UDP 18%" ||
        text === "SYN 24%"
      ) {
        el.classList.add("sentinel-floating-label");
      }

      if (
        text === "AI" ||
        text.includes("AI")
      ) {
        el.classList.add("sentinel-ai-pulse");
      }

      const isCircle =
        rect.width > 45 &&
        rect.height > 45 &&
        Math.abs(rect.width - rect.height) < 60 &&
        (
          style.borderRadius.includes("50") ||
          style.borderRadius.includes("999") ||
          style.borderRadius !== "0px"
        );

      if (isCircle && rect.width > 80) {
        el.classList.add("sentinel-ai-orbit");
      }
    });
  }

  function animateIntegrityCard() {
    const card = findCardByText("Security Model Integrity");
    if (!card) return;

    card.classList.add("sentinel-motion-card");

    const elements = Array.from(card.querySelectorAll("div, span, p, svg, canvas"));

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const text = (el.innerText || el.textContent || "").trim();

      if (text === "7869") {
        el.classList.add("sentinel-number-glow");
      }

      if (
        rect.width > 90 &&
        rect.height > 90 &&
        Math.abs(rect.width - rect.height) < 90
      ) {
        el.classList.add("sentinel-integrity-ring");
      }

      if (el.tagName.toLowerCase() === "svg" || el.tagName.toLowerCase() === "canvas") {
        el.classList.add("sentinel-integrity-ring");
      }
    });
  }

  function run() {
    if (!isDashboard()) return;

    addStyle();
    animatePredictiveCard();
    animateIntegrityCard();
  }

  document.addEventListener("DOMContentLoaded", function () {
    run();

    const observer = new MutationObserver(run);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    setInterval(run, 3000);
  });
})();
