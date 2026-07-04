import time
import requests
import numpy as np
import os
import joblib

from scapy.all import sniff, IP
from feature_engine import calculate_features
from attack_db import init_db, save_attack


# =========================
# INIT DB
# =========================

init_db()


# =========================
# CONFIG
# =========================

TIME_WINDOW = 5
flows = {}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 🔥 LOAD SCALER ONCE ONLY
SCALER_PATH = os.path.join(BASE_DIR, "models/UDPLag_scaler.pkl")
scaler = joblib.load(SCALER_PATH)


# =========================
# TELEGRAM
# =========================

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


def send_telegram(message):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        print("Telegram not configured")
        return

    try:
        requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message
            }
        )
    except Exception as e:
        print("Telegram Error:", e)


# =========================
# BLOCK IP
# =========================

def block_ip(ip):
    print("BLOCKED:", ip)


# =========================
# FLOW KEY
# =========================

def get_flow_key(packet):
    return (packet[IP].src, packet[IP].dst, packet[IP].proto)


# =========================
# PREDICTION PIPELINE (FIXED SCALING)
# =========================

def send_prediction(features, src_ip, dst_ip):

    try:
        features = np.array(features, dtype=np.float32)

        # fix shape
        if features.shape[1] > 79:
            features = features[:, :79]
        elif features.shape[1] < 79:
            pad = 79 - features.shape[1]
            features = np.pad(features, ((0, 0), (0, pad)))

        # =========================
        # 🔥 FIXED SCALING (NO DATAFRAME ISSUE)
        # =========================
        scaled_features = scaler.transform(features)

        payload = scaled_features.reshape(1, 79, 1)

        r = requests.post(
            "http://127.0.0.1:5000/predict",
            json={"features": payload.tolist()}
        )

        data = r.json()

        result = data.get("result")
        confidence = data.get("confidence", 0)

        print("AI:", result, confidence)

        if result == "ATTACK":

            print("🚨 ATTACK DETECTED")

            save_attack(src_ip, dst_ip, confidence, result)

            send_telegram(f"""
🚨 DDoS ATTACK DETECTED

Source: {src_ip}
Target: {dst_ip}
Confidence: {confidence:.2f}%

Sentinel AI
""")

            block_ip(src_ip)

    except Exception as e:
        print("Prediction Error:", e)


# =========================
# PACKET HANDLER
# =========================

def process_packet(packet):

    if IP not in packet:
        return

    key = get_flow_key(packet)
    now = time.time()

    if key not in flows:
        flows[key] = {"packets": [], "start": now}

    flows[key]["packets"].append(packet)

    if now - flows[key]["start"] >= TIME_WINDOW:

        packets = flows[key]["packets"]

        try:
            features = calculate_features(packets)
        except Exception as e:
            print("Feature Error:", e)
            del flows[key]
            return

        send_prediction(features, key[0], key[1])

        del flows[key]


# =========================
# START
# =========================

print("🚀 Sentinel AI IDS Running...")

sniff(
    iface="ens5",
    prn=process_packet,
    store=0
)
