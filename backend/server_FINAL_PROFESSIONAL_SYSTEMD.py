from unknown_suspicious import detect_unknown_suspicious
from professional_routes import register_professional_routes
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import joblib
import numpy as np
import os
import csv
import io
import requests
from security_insights import enhance_detection_payload, load_detection_history
from auto_blocker import auto_block_if_needed, load_block_history
import json
from multi_attack_models import load_all_attack_models, predict_attack_type, auto_classify_attack
from live_capture import capture_live_features
import time

app = Flask(__name__)

register_professional_routes(app)

# =========================
# 🔥 CORS FIX نهائي
# =========================
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)

app.config['SECRET_KEY'] = 'sentinel-secret-key-2026'



# =========================
# ENV LOADER
# =========================
def load_env_file():
    global LAST_TELEGRAM_ALERT_TIME
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return

    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())

load_env_file()


# =========================
# Telegram (اختياري)
# =========================
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
LAST_TELEGRAM_ALERT_TIME = 0


def send_telegram(message):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        return

    try:
        requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            data={"chat_id": TELEGRAM_CHAT_ID, "text": message}
        )
    except:
        pass



# =========================
# CSV FEATURE EXTRACTION
# =========================
EXPECTED_FEATURES = 79

def _to_float(value):
    """
    Convert clean numeric CSV cells to float.
    Skips text, headers, IP addresses, and non-numeric values.
    """
    value = str(value).strip().replace("\ufeff", "")

    if value == "":
        return None

    # Remove common symbols
    value = value.replace("%", "").strip()

    # Convert decimal comma like 12,5 to 12.5 only when safe
    if "," in value and "." not in value:
        parts = value.split(",")
        if len(parts) == 2 and all(part.strip().isdigit() for part in parts):
            value = ".".join(parts)

    # Remove thousands comma like 1,000
    if "," in value and "." in value:
        value = value.replace(",", "")

    try:
        return float(value)
    except ValueError:
        return None


def extract_features_from_csv(file_storage):
    """
    Reads uploaded CSV file and extracts real numeric features.
    Supports comma, semicolon, tab, pipe, and whitespace-separated files.
    The model expects 79 numeric features.
    Rows with fewer than 79 numeric values are padded with zeros.
    Rows with more than 79 numeric values are truncated.
    """
    raw = file_storage.read()

    try:
        text_data = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text_data = raw.decode("latin-1", errors="ignore")

    text_data = text_data.replace("\x00", "")
    lines = [line.strip() for line in text_data.splitlines() if line.strip()]

    if not lines:
        raise ValueError("CSV file is empty.")

    sample = "\n".join(lines[:10])

    delimiter = None
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        delimiter = dialect.delimiter
    except Exception:
        counts = {d: sample.count(d) for d in [",", ";", "\t", "|"]}
        best = max(counts, key=counts.get)
        delimiter = best if counts[best] > 0 else None

    if delimiter:
        rows = csv.reader(io.StringIO(text_data), delimiter=delimiter)
    else:
        rows = (re.split(r"\s+", line.strip()) for line in lines)

    features = []

    for row in rows:
        # If the row still came as one cell, try common separators again
        if len(row) == 1:
            row = re.split(r"[,;\t|]+", row[0])

        numeric_values = []

        for cell in row:
            number = _to_float(cell)
            if number is not None:
                numeric_values.append(number)

        # Skip header/text rows
        if not numeric_values:
            continue

        if len(numeric_values) >= EXPECTED_FEATURES:
            numeric_values = numeric_values[:EXPECTED_FEATURES]
        else:
            numeric_values = numeric_values + [0.0] * (EXPECTED_FEATURES - len(numeric_values))

        features.append(numeric_values)

        # Safety limit
        if len(features) >= 5000:
            break

    if not features:
        preview = "\\n".join(lines[:5])[:500]
        raise ValueError(
            "CSV file does not contain valid numeric features. "
            "Make sure the file contains numeric network traffic feature columns. "
            f"Preview: {preview}"
        )

    return np.array(features, dtype=float)


def get_system_usage():
    """
    Lightweight real server resource usage without extra packages.
    """
    try:
        cpu_count = os.cpu_count() or 1
        cpu_used = min(100.0, (os.getloadavg()[0] / cpu_count) * 100)
    except Exception:
        cpu_used = 0.0

    ram_used = 0.0
    try:
        meminfo = {}
        with open("/proc/meminfo", "r") as f:
            for line in f:
                key, value = line.split(":", 1)
                meminfo[key] = float(value.strip().split()[0])

        total = meminfo.get("MemTotal", 0)
        available = meminfo.get("MemAvailable", 0)

        if total > 0:
            ram_used = ((total - available) / total) * 100
    except Exception:
        ram_used = 0.0

    return round(cpu_used, 2), round(ram_used, 2)


# =========================
# AI MODELS
# =========================
model_xgb = joblib.load("models/UDPLag_xgb_model.pkl")
scaler = joblib.load("models/UDPLag_scaler.pkl")

dl_model = tf.keras.models.load_model(
    "models/ddos_lstm.h5",
    compile=False
)

# Deep Neural Network / MLP model for UDPLag DDoS detection
mlp_scaler = joblib.load("models/UDPLag_MLP_scaler.pkl")
mlp_model = tf.keras.models.load_model(
    "models/UDPLag_MLP_model.h5",
    compile=False
)

load_all_attack_models()
print("AI Deep Learning Models Loaded Successfully")


# =========================
# 🔐 LOGIN (Fix frontend issue)
# =========================

@app.after_request
def add_detection_insights(response):
    try:
        if request.path in ["/predict", "/predict-live"] and response.is_json:
            payload = response.get_json(silent=True)

            if isinstance(payload, dict) and payload.get("success") is True:
                payload = detect_unknown_suspicious(payload)

                enhanced = enhance_detection_payload(payload)
                if request.path == "/predict-live":
                    enhanced = auto_block_if_needed(enhanced)
                response.set_data(json.dumps(enhanced, ensure_ascii=False))
                response.headers["Content-Type"] = "application/json"
    except Exception as e:
        print("Detection insights enhancer error:", e)

    return response



@app.route("/blocked-ips", methods=["GET"])
def blocked_ips():
    return jsonify({
        "success": True,
        "blocked_ips": load_block_history()
    })


@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    return jsonify({
        "success": True,
        "token": "demo-token",
        "user": "admin"
    })


# =========================
# 🚀 PREDICT (MAIN ENGINE)
# =========================
@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    global LAST_TELEGRAM_ALERT_TIME
    live_interface = os.getenv("LIVE_CAPTURE_INTERFACE", "ens5")
    try:
        if request.method == "OPTIONS":
            return jsonify({"success": True})

        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"})

        file = request.files["file"]

        if not file.filename.lower().endswith(".csv"):
            return jsonify({"success": False, "error": "Only CSV files are supported"})

        # Read real CSV features instead of random dummy data
        features = extract_features_from_csv(file)

        total_flows = int(features.shape[0])

        # Scale features using the trained scaler
        scaled_features = scaler.transform(features)

        attack_type = request.form.get("attack_type", "UDPLag")

        # Multi-attack Deep Learning prediction
        if attack_type in ["Auto", "Auto Detect", "Auto Classify"]:
            labels, confidences, model_name, detected_attack_type, all_model_scores = auto_classify_attack(features)
            attack_type = detected_attack_type
        else:
            labels, confidences, model_name = predict_attack_type(attack_type, features)
            all_model_scores = []

        attack_count = int(np.sum(labels == 1))
        benign_count = int(total_flows - attack_count)

        final_prediction = "ATTACK" if attack_count > 0 else "NORMAL"

        if attack_count > 0:
            final_confidence = float(np.max(confidences[labels == 1]) * 100)
        else:
            final_confidence = float(np.mean(confidences) * 100)

        cpu_used, ram_used = get_system_usage()

        alert = None
        alerts = []

        if final_prediction == "ATTACK":
            alert = {
                "title": "Real Network DDoS Attack Detected",
                "source": "Live Packet Capture",
                "mitre": "T1498",
                "confidence": round(final_confidence, 2),
                "model": model_name
            }

            alerts.append(alert)

            now = time.time()

            if now - LAST_TELEGRAM_ALERT_TIME >= 60:
                send_telegram(
                    f"🚨 Real Network DDoS Attack Detected\n"
                    f"Interface: {os.getenv('LIVE_CAPTURE_INTERFACE', 'ens5')}\n"
                    f"Model: {model_name}\n"
                    f"Confidence: {final_confidence:.2f}%\n"
                    f"Total Flows: {total_flows}\n"
                    f"Attack Flows: {attack_count}\n"
                    f"CPU: {cpu_used}% | RAM: {ram_used}%"
                )

                LAST_TELEGRAM_ALERT_TIME = now

        return jsonify({
            "success": True,
            "mode": "Real Network Capture Monitor",
            "interface": os.getenv("LIVE_CAPTURE_INTERFACE", "ens5"),
            "prediction": final_prediction,
            "result": final_prediction,
            "confidence": round(final_confidence, 2),
            "model": model_name,
            "total_flows": total_flows,
            "attack_count": attack_count,
            "benign_count": benign_count,
            "cpu_used": cpu_used,
            "ram_used": ram_used,
            "alert": alert,
            "alerts": alerts
        })

    except Exception as e:
        error_message = str(e)

        if "No live packets captured" in error_message:
            cpu_used, ram_used = get_system_usage()

            return jsonify({
                "success": True,
                "mode": "Real Network Capture Monitor",
                "interface": os.getenv("LIVE_CAPTURE_INTERFACE", "ens5"),
                "attack_type": "No Traffic",
                "prediction": "NORMAL",
                "result": "NORMAL",
                "confidence": 100.0,
                "model": "Real Network Capture Monitor",
                "total_flows": 0,
                "attack_count": 0,
                "benign_count": 0,
                "cpu_used": cpu_used,
                "ram_used": ram_used,
                "alert": None,
                "alerts": [],
                "message": "No live packets captured during this time window"
            })

        return jsonify({
            "success": False,
            "mode": "Real Network Capture Monitor",
            "error": error_message
        })



# =========================
# HOME
# =========================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "status": "running",
        "service": "Sentinel AI Backend"
    })



@app.route("/predict-live", methods=["POST", "OPTIONS"])
def predict_live():
    global LAST_TELEGRAM_ALERT_TIME
    live_interface = os.getenv("LIVE_CAPTURE_INTERFACE", "ens5")

    try:
        if request.method == "OPTIONS":
            return jsonify({"success": True})

        data = request.get_json(silent=True) or {}
        attack_type = data.get("attack_type", "UDPLag")

        live_interface = os.getenv("LIVE_CAPTURE_INTERFACE", "ens5")
        expected_features = int(globals().get("EXPECTED_FEATURES", 79))

        features = capture_live_features(
            expected_features=expected_features,
            interface=live_interface,
            duration=8
        )

        total_flows = int(features.shape[0])

        if attack_type in ["Auto", "Auto Detect", "Auto Classify"]:
            labels, confidences, model_name, detected_attack_type, all_model_scores = auto_classify_attack(features)
            attack_type = detected_attack_type
        else:
            labels, confidences, model_name = predict_attack_type(attack_type, features)
            all_model_scores = []

        attack_count = int(np.sum(labels == 1))
        benign_count = int(total_flows - attack_count)

        final_prediction = "ATTACK" if attack_count > 0 else "NORMAL"

        if attack_count > 0:
            final_confidence = float(np.max(confidences[labels == 1]) * 100)
        else:
            final_confidence = float(np.mean(confidences) * 100)

        cpu_used, ram_used = get_system_usage()

        alert = None
        alerts = []

        if final_prediction == "ATTACK":
            alert = {
                "title": "Real Network DDoS Attack Detected",
                "source": "Live Packet Capture",
                "mitre": "T1498",
                "confidence": round(final_confidence, 2),
                "model": model_name
            }

            alerts.append(alert)

            now = time.time()

            if now - LAST_TELEGRAM_ALERT_TIME >= 60:
                send_telegram(
                    f"🚨 Real Network DDoS Attack Detected\n"
                    f"Attack Type: {attack_type}\n"
                    f"Interface: {os.getenv('LIVE_CAPTURE_INTERFACE', 'ens5')}\n"
                    f"Model: {model_name}\n"
                    f"Confidence: {final_confidence:.2f}%\n"
                    f"Total Flows: {total_flows}\n"
                    f"Attack Flows: {attack_count}\n"
                    f"CPU: {cpu_used}% | RAM: {ram_used}%"
                )

                LAST_TELEGRAM_ALERT_TIME = now

        return jsonify({
            "success": True,
            "mode": "Real Network Capture Monitor",
            "interface": os.getenv("LIVE_CAPTURE_INTERFACE", "ens5"),
            "attack_type": attack_type,
            "all_model_scores": all_model_scores,
            "prediction": final_prediction,
            "result": final_prediction,
            "confidence": round(final_confidence, 2),
            "model": model_name,
            "total_flows": total_flows,
            "attack_count": attack_count,
            "benign_count": benign_count,
            "cpu_used": cpu_used,
            "ram_used": ram_used,
            "alert": alert,
            "alerts": alerts
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "mode": "Real Network Capture Monitor",
            "error": str(e)
        })



@app.route("/detection-history", methods=["GET"])
def detection_history():
    return jsonify({
        "success": True,
        "history": load_detection_history()
    })


@app.route("/")
def home():
    return "Sentinel AI Backend Running OK"


# =========================
# RUN
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
