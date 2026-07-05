import os
import json
import subprocess
import ipaddress
import socket
from collections import Counter
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(__file__)
BLOCK_HISTORY_FILE = os.path.join(BASE_DIR, "blocked_ips_history.json")


def env_bool(name, default=False):
    value = os.getenv(name, str(default)).strip().lower()
    return value in ("1", "true", "yes", "on")


def safe_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def safe_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return default


def load_block_history():
    if not os.path.exists(BLOCK_HISTORY_FILE):
        return []

    try:
        with open(BLOCK_HISTORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, list):
            return data
    except Exception:
        pass

    return []


def save_block_history(history):
    history = history[-200:]

    with open(BLOCK_HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def add_block_history(entry):
    history = load_block_history()
    history.append(entry)
    save_block_history(history)


def get_allowlist():
    allow = set()

    env_allow = os.getenv("ADMIN_ALLOWLIST", "")
    for item in env_allow.replace(";", ",").split(","):
        item = item.strip()
        if item:
            allow.add(item)

    try:
        out = subprocess.check_output(["hostname", "-I"], text=True).strip()
        for ip in out.split():
            allow.add(ip.strip())
    except Exception:
        pass

    try:
        with open("/etc/sentinel-allowlist.txt", "r", encoding="utf-8") as f:
            for line in f:
                ip = line.strip()
                if ip:
                    allow.add(ip)
    except Exception:
        pass

    allow.add("127.0.0.1")

    # Prevent blocking Telegram API addresses used for alert notifications
    try:
        for info in socket.getaddrinfo("api.telegram.org", 443, type=socket.SOCK_STREAM):
            ip = info[4][0]
            if ":" not in ip:
                allow.add(ip)
    except Exception:
        pass

    return allow


def is_safe_public_ipv4(ip_text):
    try:
        ip = ipaddress.ip_address(ip_text)
    except Exception:
        return False

    if ip.version != 4:
        return False

    if ip.is_private or ip.is_loopback or ip.is_link_local:
        return False

    if ip.is_multicast or ip.is_reserved or ip.is_unspecified:
        return False

    if ip_text in get_allowlist():
        return False

    return True


def capture_top_source_ips(interface="ens5", duration=3, max_ips=1):
    tshark = "/usr/bin/tshark"

    if not os.path.exists(tshark):
        return []

    cmd = [
        tshark,
        "-i", interface,
        "-a", f"duration:{duration}",
        "-T", "fields",
        "-e", "ip.src",
        "-Y", "ip"
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=duration + 8
        )
    except Exception:
        return []

    ips = []

    for line in result.stdout.splitlines():
        ip = line.strip()

        if ip and is_safe_public_ipv4(ip):
            ips.append(ip)

    counts = Counter(ips)

    return [
        {"ip": ip, "packet_count": count}
        for ip, count in counts.most_common(max_ips)
    ]


def block_ip(ip):
    try:
        result = subprocess.run(
            ["sudo", "/usr/local/bin/sentinel-block-ip", ip],
            capture_output=True,
            text=True,
            timeout=10
        )

        output = (result.stdout or result.stderr or "").strip()

        return {
            "ip": ip,
            "success": result.returncode == 0,
            "output": output,
            "returncode": result.returncode
        }
    except Exception as e:
        return {
            "ip": ip,
            "success": False,
            "output": str(e),
            "returncode": -1
        }


def auto_block_if_needed(payload):
    if not isinstance(payload, dict):
        return payload

    payload["auto_block_enabled"] = env_bool("AUTO_BLOCK_ENABLED", False)

    if not payload["auto_block_enabled"]:
        payload["blocking_action"] = "Auto block is disabled."
        return payload

    prediction = str(payload.get("prediction") or payload.get("result") or "").upper()
    confidence = safe_float(payload.get("confidence"), 0.0)
    attack_count = safe_int(payload.get("attack_count"), 0)

    min_conf = safe_float(os.getenv("AUTO_BLOCK_MIN_CONFIDENCE", "90"), 90.0)
    min_attack_count = safe_int(os.getenv("AUTO_BLOCK_MIN_ATTACK_COUNT", "1"), 1)

    if prediction != "ATTACK":
        payload["blocking_action"] = "No block: traffic is not classified as ATTACK."
        payload["blocked_ips"] = []
        return payload

    if confidence < min_conf:
        payload["blocking_action"] = f"No block: confidence {confidence}% is below threshold {min_conf}%."
        payload["blocked_ips"] = []
        return payload

    if attack_count < min_attack_count:
        payload["blocking_action"] = f"No block: attack_count {attack_count} is below threshold {min_attack_count}."
        payload["blocked_ips"] = []
        return payload

    interface = payload.get("interface") or os.getenv("LIVE_CAPTURE_INTERFACE", "ens5")
    duration = safe_int(os.getenv("AUTO_BLOCK_CAPTURE_SECONDS", "3"), 3)
    max_ips = safe_int(os.getenv("AUTO_BLOCK_MAX_IPS", "1"), 1)

    candidates = capture_top_source_ips(interface=interface, duration=duration, max_ips=max_ips)

    if not candidates:
        payload["blocking_action"] = "Attack detected, but no safe public source IP was found to block."
        payload["blocked_ips"] = []
        return payload

    blocked = []

    for item in candidates:
        ip = item["ip"]
        result = block_ip(ip)

        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "ip": ip,
            "packet_count": item.get("packet_count"),
            "attack_type": payload.get("attack_type"),
            "model": payload.get("model"),
            "confidence": confidence,
            "severity": payload.get("severity"),
            "result": result,
        }

        add_block_history(entry)

        if result["success"]:
            blocked.append(entry)

    payload["blocked_ips"] = blocked

    if blocked:
        payload["blocking_action"] = "Blocked suspicious source IP using iptables."
    else:
        payload["blocking_action"] = "Block attempt failed or IP was rejected by safety rules."

    return payload
