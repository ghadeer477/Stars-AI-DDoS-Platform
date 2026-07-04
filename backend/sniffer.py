from scapy.all import sniff, IP, TCP
import requests

BACKEND_URL = "http://127.0.0.1:5000/predict"

def process_packet(packet):
    try:
        if IP in packet:

            ip_src = packet[IP].src
            ip_dst = packet[IP].dst

            features = [
                len(packet),
                packet[IP].len,
                packet[IP].ttl,
                packet[IP].proto,
                0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
            ]

            r = requests.post(BACKEND_URL, json={
                "features": features
            })

            print(r.json())

    except Exception as e:
        print("error:", e)

print("🚀 Starting packet capture...")

sniff(prn=process_packet, store=0)
