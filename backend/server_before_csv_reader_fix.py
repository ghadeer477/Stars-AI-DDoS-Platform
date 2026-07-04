from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import joblib
import numpy as np
import os
import csv
import io
import requests

app = Flask(__name__)

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
# Telegram (اختياري)
# =========================
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


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

print("AI Model Loaded Successfully")


# =========================
# 🔐 LOGIN (Fix frontend issue)
# =========================
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

        # Deep learning prediction
        predictions = dl_model.predict(scaled_features, verbose=0)

        predictions = np.array(predictions)

        # Support both binary sigmoid output and softmax output
        if predictions.ndim == 1:
            scores = predictions
            labels = (scores >= 0.5).astype(int)
            confidences = np.where(labels == 1, scores, 1 - scores)
        elif predictions.shape[1] == 1:
            scores = predictions[:, 0]
            labels = (scores >= 0.5).astype(int)
            confidences = np.where(labels == 1, scores, 1 - scores)
        else:
            labels = np.argmax(predictions, axis=1)
            confidences = np.max(predictions, axis=1)

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
                "title": "DDoS Attack Detected",
                "source": "AI Engine",
                "mitre": "T1498",
                "confidence": final_confidence
            }

            alerts.append(alert)

            send_telegram(f"🚨 {alert['title']} | {alert['confidence']:.2f}%")

        return jsonify({
            "success": True,

            # Frontend-compatible fields
            "prediction": final_prediction,
            "result": final_prediction,
            "confidence": round(final_confidence, 2),
            "model": request.form.get("attack_type", "DDoS AI Model"),

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
            "error": str(e)
        })


# =========================
# LIVE CHECK
# =========================
@app.route("/predict-live", methods=["POST", "OPTIONS"])
def predict_live():
    return jsonify({
        "success": True,
        "message": "live system active"
    })


# =========================
# HOME
# =========================
@app.route("/")
def home():
    return "Sentinel AI Backend Running OK"


# =========================
# RUN
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
