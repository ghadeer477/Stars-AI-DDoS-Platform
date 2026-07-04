from scapy.all import sniff, IP
import time
import requests
from feature_engine import calculate_features
from firewall import block_ip
from attack_db import save_attack

flows = {}
TIME_WINDOW = 5


def get_flow_key(packet):
    return (packet[IP].src, packet[IP].dst, packet[IP].proto)


def send_prediction(features):
    try:
        r = requests.post(
            "http://127.0.0.1:5000/predict",
            json={"features": features}
        )

        data = r.json()
        print("AI:", data)

        result = data.get("result")
        confidence = data.get("confidence", 0)

        return result, confidence

    except Exception as e:
        print("Prediction Error:", e)
        return None, 0


def process_packet(packet):
    if IP not in packet:
        return

    src_ip = packet[IP].src
    dst_ip = packet[IP].dst

    key = get_flow_key(packet)
    now = time.time()

    if key not in flows:
        flows[key] = []

    flows[key].append(packet)

    # تنظيف القديم
    flows[key] = [p for p in flows[key] if now - time.time() <= TIME_WINDOW]

    # إذا عندنا بيانات كافية
    if len(flows[key]) < 5:
        return

    features = calculate_features(flows[key])

    result, confidence = send_prediction(features)

    if result == "ATTACK":

        print(f"🚨 ATTACK DETECTED from {src_ip}")

        # 1. حفظ في قاعدة البيانات
        save_attack(src_ip, dst_ip, confidence, result)

        # 2. حظر IP مباشرة
        block_ip(src_ip)

        # 3. تنبيه تيليجرام
        message = f"""
🚨 DDoS ATTACK DETECTED

Source: {src_ip}
Target: {dst_ip}
Confidence: {confidence:.2f}%
"""

        requests.post(
            "http://127.0.0.1:5000/telegram-test",
            json={"message": message}
        )


print("🚀 Sentinel AI Flow Engine Running...")

sniff(prn=process_packet, store=0)
