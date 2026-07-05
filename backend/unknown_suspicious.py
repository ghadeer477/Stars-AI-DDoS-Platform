import os


def safe_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def detect_unknown_suspicious(payload):
    if not isinstance(payload, dict):
        return payload

    if payload.get("success") is not True:
        return payload

    prediction = str(payload.get("prediction") or payload.get("result") or "").upper()

    if prediction == "ATTACK":
        return payload

    scores = payload.get("all_model_scores", [])

    if not isinstance(scores, list) or len(scores) == 0:
        return payload

    max_score = 0.0
    top_attack = "Unknown"

    for item in scores:
        if not isinstance(item, dict):
            continue

        score = safe_float(item.get("score", 0.0), 0.0)

        if score > max_score:
            max_score = score
            top_attack = item.get("attack_type") or item.get("model") or "Unknown"

    threshold = safe_float(os.getenv("UNKNOWN_SUSPICIOUS_MIN_SCORE", "0.35"), 0.35)
    strong_known_threshold = safe_float(os.getenv("KNOWN_ATTACK_STRONG_SCORE", "0.90"), 0.90)

    if max_score >= threshold and max_score < strong_known_threshold:
        payload["original_prediction"] = payload.get("prediction") or payload.get("result")
        payload["prediction"] = "SUSPICIOUS"
        payload["result"] = "SUSPICIOUS"
        payload["attack_type"] = "Potential Zero-Day / Unknown DDoS Attack"
        payload["model"] = "Auto Classifier - Potential Zero-Day Detector"
        payload["confidence"] = round(max_score * 100 if max_score <= 1 else max_score, 2)
        payload["suspected_nearest_attack"] = top_attack
        payload["zero_day_status"] = "Potential Zero-Day"
        payload["unknown_reason"] = (
            "Traffic appears abnormal but does not strongly match any trained DDoS attack type. "
            "Further security investigation is required."
        )

    return payload
