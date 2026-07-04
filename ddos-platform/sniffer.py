from scapy.all import sniff, IP, TCP, UDP
import asyncio, json, time
import websockets

INTERFACE = r'\Device\NPF_{32D6FD8B-5F6E-11F1-8206-185E0FA5EBDB}' # كرت الـ Wi-Fi حقك
clients = set()

async def send_alert(data):
    if clients:
        await asyncio.wait([c.send(json.dumps(data)) for c in clients])

def packet_handler(pkt):
    if pkt.haslayer(IP):
        # مثال: كشف SYN Flood مبدئي
        if pkt.haslayer(TCP) and pkt[TCP].flags == 'S':
            alert = {
                "type": "SYN Flood Detected",
                "src_ip": pkt[IP].src,
                "timestamp": time.time(),
                "level": "danger"
            }
            asyncio.run(send_alert(alert))
            print(f"[ALERT] SYN from {pkt[IP].src}")

async def handler(websocket):
    clients.add(websocket)
    print("Client connected")
    try:
        await websocket.wait_closed()
    finally:
        clients.remove(websocket)

async def main():
    async with websockets.serve(handler, "localhost", 8000):
        print(f"[*] WebSocket server on ws://localhost:8000")
        print(f"[*] Sniffing on Wi-Fi...")
        sniff(iface=INTERFACE, prn=packet_handler, store=0)

if __name__ == "__main__":
    asyncio.run(main())