from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import joblib
import numpy as np
import os
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
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"})

        file = request.files["file"]

        # ⚡ dummy features (بدلها لاحقاً بتحليل حقيقي)
        features = np.random.rand(1, 79)
        features = scaler.transform(features)

        # DL prediction
        pred = dl_model.predict(features)[0]
        label = int(np.argmax(pred))
        conf = float(np.max(pred))

        result = "ATTACK" if label == 1 else "NORMAL"

        alert = None

        if result == "ATTACK":
            alert = {
                "title": "DDoS Attack Detected",
                "source": "AI Engine",
                "mitre": "T1498",
                "confidence": conf * 100
            }

            send_telegram(f"🚨 {alert['title']} | {alert['confidence']:.2f}%")

        return jsonify({
            "success": True,
            "result": result,
            "confidence": conf * 100,
            "alert": alert
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
