import os
import json
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(__file__)
HISTORY_FILE = os.path.join(BASE_DIR, "detection_history.json")


RECOMMENDATIONS = {
    "DNS": "Apply DNS rate limiting, monitor recursive queries, and block suspicious DNS sources.",
    "DNS Flood": "Apply DNS rate limiting, monitor recursive queries, and block suspicious DNS sources.",
    "LDAP": "Restrict LDAP exposure, apply firewall filtering, and block abnormal LDAP request sources.",
    "LDAP Flood": "Restrict LDAP exposure, apply firewall filtering, and block abnormal LDAP request sources.",
    "NTP": "Disable open NTP amplification, enable rate limiting, and restrict NTP access.",
    "NTP Flood": "Disable open NTP amplification, enable rate limiting, and restrict NTP access.",
    "NetBIOS": "Block unnecessary NetBIOS traffic, restrict UDP ports 137-139, and monitor abnormal broadcasts.",
    "SYN": "Enable SYN cookies, reduce half-open TCP connections, and apply TCP rate limiting.",
    "SYN Flood": "Enable SYN cookies, reduce half-open TCP connections, and apply TCP rate limiting.",
    "UDPLag": "Apply UDP rate limiting, monitor abnormal UDP flow spikes, and block suspicious source IPs.",
    "UDP Lag": "Apply UDP rate limiting, monitor abnormal UDP flow spikes, and block suspicious source IPs.",
    "NORMAL": "No mitigation is required. Continue monitoring normal network traffic.",
    "No Traffic": "No live packets were captured during this time window. Continue monitoring.",
}


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


def calculate_severity(prediction, confidence, attack_count, total_flows):
    prediction = str(prediction or "").upper()

    if prediction in ("SUSPICIOUS", "UNKNOWN"):
        return "Medium"

    confidence = safe_float(confidence)
    attack_count = safe_int(attack_count)
    total_flows = max(safe_int(total_flows), 1)

    if prediction == "NORMAL" or attack_count == 0:
        return "Normal"

    attack_ratio = attack_count / total_flows

    if confidence >= 95 or attack_count >= 100 or attack_ratio >= 0.70:
        return "Critical"

    if confidence >= 85 or attack_count >= 50 or attack_ratio >= 0.40:
        return "High"

    if confidence >= 70 or attack_count >= 10 or attack_ratio >= 0.20:
        return "Medium"

    return "Low"


def get_recommendation(attack_type, model, prediction):
    prediction = str(prediction or "").upper()

    if prediction == "NORMAL":
        return RECOMMENDATIONS["NORMAL"]

    attack_text = f"{attack_type} {model}".lower()

    for key, rec in RECOMMENDATIONS.items():
        if key.lower() in attack_text:
            return rec

    return "Investigate the suspicious traffic, review source IPs, and apply temporary rate limiting."


def load_detection_history():
    if not os.path.exists(HISTORY_FILE):
        return []

    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, list):
            return data
    except Exception:
        pass

    return []


def save_detection_history(history):
    history = history[-200:]

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def append_detection_history(payload):
    history = load_detection_history()

    entry = {
        "timestamp": payload.get("timestamp"),
        "mode": payload.get("mode"),
        "interface": payload.get("interface"),
        "attack_type": payload.get("attack_type"),
        "prediction": payload.get("prediction") or payload.get("result"),
        "model": payload.get("model"),
        "confidence": payload.get("confidence"),
        "severity": payload.get("severity"),
        "attack_count": payload.get("attack_count"),
        "total_flows": payload.get("total_flows"),
        "cpu_used": payload.get("cpu_used"),
        "ram_used": payload.get("ram_used"),
        "recommendation": payload.get("recommendation"),
    }

    history.append(entry)
    save_detection_history(history)

    return len(history)


def enhance_detection_payload(payload):
    if not isinstance(payload, dict):
        return payload

    prediction = payload.get("prediction") or payload.get("result")
    confidence = payload.get("confidence", 0)
    attack_count = payload.get("attack_count", 0)
    total_flows = payload.get("total_flows", 0)
    attack_type = payload.get("attack_type", "Unknown")
    model = payload.get("model", "Unknown Model")

    severity = calculate_severity(prediction, confidence, attack_count, total_flows)
    recommendation = get_recommendation(attack_type, model, prediction)

    payload["timestamp"] = datetime.now(timezone.utc).isoformat()
    payload["severity"] = severity
    payload["recommendation"] = recommendation

    scores = payload.get("all_model_scores", [])

    if isinstance(scores, list):
        try:
            payload["top_model_scores"] = sorted(
                scores,
                key=lambda x: safe_float(x.get("score", 0)),
                reverse=True
            )[:6]
        except Exception:
            payload["top_model_scores"] = []
    else:
        payload["top_model_scores"] = []

    alerts = payload.get("alerts")

    if isinstance(alerts, list):
        for alert in alerts:
            if isinstance(alert, dict):
                alert["severity"] = severity
                alert["recommendation"] = recommendation

    payload["history_id"] = append_detection_history(payload)

    return payload
