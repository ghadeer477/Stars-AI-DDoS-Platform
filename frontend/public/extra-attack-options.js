(function () {
  const extraOptions = [
    { value: "SNMP", text: "SNMP Flood" },
    { value: "SSDP", text: "SSDP Flood" },
    { value: "TFTP", text: "TFTP Flood" },
    { value: "Portmap", text: "Portmap Flood" }
  ];

  function isAttackSelect(select) {
    const texts = Array.from(select.options).map(o => (o.textContent || "").trim());
    return texts.includes("Auto Detect") && (
      texts.includes("DNS Flood") ||
      texts.includes("LDAP Flood") ||
      texts.includes("SYN Flood") ||
      texts.includes("UDP Lag")
    );
  }

  function addExtraOptions() {
    document.querySelectorAll("select").forEach(select => {
      if (!isAttackSelect(select)) return;

      extraOptions.forEach(item => {
        const exists = Array.from(select.options).some(o => o.value === item.value || o.textContent.trim() === item.text);

        if (!exists) {
          const option = document.createElement("option");
          option.value = item.value;
          option.textContent = item.text;
          select.appendChild(option);
        }
      });
    });
  }

  addExtraOptions();

  const observer = new MutationObserver(addExtraOptions);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  setInterval(addExtraOptions, 1000);
})();
