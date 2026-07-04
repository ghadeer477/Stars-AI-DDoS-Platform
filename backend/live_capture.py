import os
import subprocess
import pickle
import statistics
import numpy as np

BASE_DIR = os.path.dirname(__file__)
FEATURE_FILE = os.path.join(BASE_DIR, "models", "UDPLag_feature_names.pkl")


def load_feature_names(expected_features=79):
    try:
        with open(FEATURE_FILE, "rb") as f:
            names = list(pickle.load(f))
        return names[:expected_features]
    except Exception:
        return [f"feature_{i}" for i in range(expected_features)]


def to_float(value, default=0.0):
    try:
        if value is None or value == "":
            return default
        return float(value)
    except Exception:
        return default


def to_int(value, default=0):
    try:
        if value is None or value == "":
            return default
        return int(float(value))
    except Exception:
        return default


def avg(values):
    return float(statistics.mean(values)) if values else 0.0


def stdev(values):
    return float(statistics.pstdev(values)) if len(values) > 1 else 0.0


def build_stats(packets):
    packets = sorted(packets, key=lambda x: x["time"])
    first = packets[0]

    src0 = first["src"]
    dst0 = first["dst"]
    sport0 = first["sport"]
    dport0 = first["dport"]

    all_lengths = []
    all_times = []
    fwd_lengths = []
    bwd_lengths = []
    fwd_times = []
    bwd_times = []

    syn_count = 0
    ack_count = 0
    rst_count = 0
    fin_count = 0

    for p in packets:
        is_fwd = (
            p["src"] == src0 and
            p["dst"] == dst0 and
            p["sport"] == sport0 and
            p["dport"] == dport0
        )

        all_lengths.append(p["length"])
        all_times.append(p["time"])

        if is_fwd:
            fwd_lengths.append(p["length"])
            fwd_times.append(p["time"])
        else:
            bwd_lengths.append(p["length"])
            bwd_times.append(p["time"])

        syn_count += p["syn"]
        ack_count += p["ack"]
        rst_count += p["rst"]
        fin_count += p["fin"]

    duration = max(all_times) - min(all_times) if len(all_times) > 1 else 0.000001
    iats = [all_times[i] - all_times[i - 1] for i in range(1, len(all_times))]
    fwd_iats = [fwd_times[i] - fwd_times[i - 1] for i in range(1, len(fwd_times))]
    bwd_iats = [bwd_times[i] - bwd_times[i - 1] for i in range(1, len(bwd_times))]

    total_bytes = sum(all_lengths)
    total_packets = len(all_lengths)

    return {
        "dst_port": dport0,
        "protocol": first["proto"],
        "duration": duration * 1000000,
        "fwd_count": len(fwd_lengths),
        "bwd_count": len(bwd_lengths),
        "fwd_bytes": sum(fwd_lengths),
        "bwd_bytes": sum(bwd_lengths),
        "fwd_len_max": max(fwd_lengths) if fwd_lengths else 0,
        "fwd_len_min": min(fwd_lengths) if fwd_lengths else 0,
        "fwd_len_mean": avg(fwd_lengths),
        "fwd_len_std": stdev(fwd_lengths),
        "bwd_len_max": max(bwd_lengths) if bwd_lengths else 0,
        "bwd_len_min": min(bwd_lengths) if bwd_lengths else 0,
        "bwd_len_mean": avg(bwd_lengths),
        "bwd_len_std": stdev(bwd_lengths),
        "flow_bytes_per_s": total_bytes / duration,
        "flow_packets_per_s": total_packets / duration,
        "iat_mean": avg(iats) * 1000000,
        "iat_std": stdev(iats) * 1000000,
        "iat_max": (max(iats) if iats else 0) * 1000000,
        "iat_min": (min(iats) if iats else 0) * 1000000,
        "fwd_iat_total": sum(fwd_iats) * 1000000,
        "fwd_iat_mean": avg(fwd_iats) * 1000000,
        "fwd_iat_std": stdev(fwd_iats) * 1000000,
        "fwd_iat_max": (max(fwd_iats) if fwd_iats else 0) * 1000000,
        "fwd_iat_min": (min(fwd_iats) if fwd_iats else 0) * 1000000,
        "bwd_iat_total": sum(bwd_iats) * 1000000,
        "bwd_iat_mean": avg(bwd_iats) * 1000000,
        "bwd_iat_std": stdev(bwd_iats) * 1000000,
        "bwd_iat_max": (max(bwd_iats) if bwd_iats else 0) * 1000000,
        "bwd_iat_min": (min(bwd_iats) if bwd_iats else 0) * 1000000,
        "syn_count": syn_count,
        "ack_count": ack_count,
        "rst_count": rst_count,
        "fin_count": fin_count,
        "pkt_len_min": min(all_lengths) if all_lengths else 0,
        "pkt_len_max": max(all_lengths) if all_lengths else 0,
        "pkt_len_mean": avg(all_lengths),
        "pkt_len_std": stdev(all_lengths),
        "pkt_len_var": stdev(all_lengths) ** 2,
        "avg_pkt_size": avg(all_lengths),
        "down_up_ratio": len(bwd_lengths) / len(fwd_lengths) if len(fwd_lengths) > 0 else 0,
    }


def value_by_name(name, stats):
    n = name.lower().replace("_", " ").replace("-", " ")

    if "destination port" in n or "dst port" in n:
        return stats["dst_port"]
    if "protocol" in n:
        return stats["protocol"]
    if "flow duration" in n:
        return stats["duration"]
    if "total fwd packets" in n or "tot fwd pkts" in n:
        return stats["fwd_count"]
    if "total backward packets" in n or "total bwd packets" in n or "tot bwd pkts" in n:
        return stats["bwd_count"]
    if "total length of fwd" in n or "totlen fwd" in n:
        return stats["fwd_bytes"]
    if "total length of bwd" in n or "totlen bwd" in n:
        return stats["bwd_bytes"]
    if "fwd packet length max" in n or "fwd pkt len max" in n:
        return stats["fwd_len_max"]
    if "fwd packet length min" in n or "fwd pkt len min" in n:
        return stats["fwd_len_min"]
    if "fwd packet length mean" in n or "fwd pkt len mean" in n:
        return stats["fwd_len_mean"]
    if "fwd packet length std" in n or "fwd pkt len std" in n:
        return stats["fwd_len_std"]
    if "bwd packet length max" in n or "bwd pkt len max" in n:
        return stats["bwd_len_max"]
    if "bwd packet length min" in n or "bwd pkt len min" in n:
        return stats["bwd_len_min"]
    if "bwd packet length mean" in n or "bwd pkt len mean" in n:
        return stats["bwd_len_mean"]
    if "bwd packet length std" in n or "bwd pkt len std" in n:
        return stats["bwd_len_std"]
    if "flow bytes" in n:
        return stats["flow_bytes_per_s"]
    if "flow packets" in n:
        return stats["flow_packets_per_s"]
    if "flow iat mean" in n:
        return stats["iat_mean"]
    if "flow iat std" in n:
        return stats["iat_std"]
    if "flow iat max" in n:
        return stats["iat_max"]
    if "flow iat min" in n:
        return stats["iat_min"]
    if "fwd iat total" in n:
        return stats["fwd_iat_total"]
    if "fwd iat mean" in n:
        return stats["fwd_iat_mean"]
    if "fwd iat std" in n:
        return stats["fwd_iat_std"]
    if "fwd iat max" in n:
        return stats["fwd_iat_max"]
    if "fwd iat min" in n:
        return stats["fwd_iat_min"]
    if "bwd iat total" in n:
        return stats["bwd_iat_total"]
    if "bwd iat mean" in n:
        return stats["bwd_iat_mean"]
    if "bwd iat std" in n:
        return stats["bwd_iat_std"]
    if "bwd iat max" in n:
        return stats["bwd_iat_max"]
    if "bwd iat min" in n:
        return stats["bwd_iat_min"]
    if "syn flag" in n:
        return stats["syn_count"]
    if "ack flag" in n:
        return stats["ack_count"]
    if "rst flag" in n:
        return stats["rst_count"]
    if "fin flag" in n:
        return stats["fin_count"]
    if "packet length min" in n or "pkt len min" in n or "min packet length" in n:
        return stats["pkt_len_min"]
    if "packet length max" in n or "pkt len max" in n or "max packet length" in n:
        return stats["pkt_len_max"]
    if "packet length mean" in n or "pkt len mean" in n:
        return stats["pkt_len_mean"]
    if "packet length std" in n or "pkt len std" in n:
        return stats["pkt_len_std"]
    if "packet length variance" in n or "pkt len var" in n:
        return stats["pkt_len_var"]
    if "average packet size" in n or "avg packet size" in n:
        return stats["avg_pkt_size"]
    if "subflow fwd packets" in n:
        return stats["fwd_count"]
    if "subflow fwd bytes" in n:
        return stats["fwd_bytes"]
    if "subflow bwd packets" in n:
        return stats["bwd_count"]
    if "subflow bwd bytes" in n:
        return stats["bwd_bytes"]
    if "down up ratio" in n:
        return stats["down_up_ratio"]
    if "active mean" in n or "active max" in n or "active min" in n:
        return stats["duration"]
    if "idle mean" in n or "idle max" in n or "idle min" in n:
        return stats["iat_mean"]

    return 0.0


def capture_live_features(expected_features=79, interface="ens5", duration=3, max_flows=200):
    feature_names = load_feature_names(expected_features)

    cmd = [
        "/usr/bin/tshark",
        "-i", interface,
        "-a", f"duration:{duration}",
        "-T", "fields",
        "-E", "separator=\t",
        "-E", "occurrence=f",
        "-e", "frame.time_epoch",
        "-e", "ip.src",
        "-e", "ip.dst",
        "-e", "tcp.srcport",
        "-e", "tcp.dstport",
        "-e", "udp.srcport",
        "-e", "udp.dstport",
        "-e", "ip.proto",
        "-e", "frame.len",
        "-e", "tcp.flags.syn",
        "-e", "tcp.flags.ack",
        "-e", "tcp.flags.reset",
        "-e", "tcp.flags.fin",
    ]

    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=duration + 8
    )

    flows = {}

    for line in result.stdout.splitlines():
        parts = line.split("\t")

        if len(parts) < 13:
            continue

        time_value = to_float(parts[0])
        src = parts[1]
        dst = parts[2]

        sport = to_int(parts[3] or parts[5])
        dport = to_int(parts[4] or parts[6])
        proto = to_int(parts[7])
        length = to_int(parts[8])

        if not src or not dst or length <= 0:
            continue

        packet = {
            "time": time_value,
            "src": src,
            "dst": dst,
            "sport": sport,
            "dport": dport,
            "proto": proto,
            "length": length,
            "syn": to_int(parts[9]),
            "ack": to_int(parts[10]),
            "rst": to_int(parts[11]),
            "fin": to_int(parts[12]),
        }

        forward_key = (src, dst, sport, dport, proto)
        backward_key = (dst, src, dport, sport, proto)
        key = backward_key if backward_key in flows else forward_key

        flows.setdefault(key, []).append(packet)

    if not flows:
        raise RuntimeError("No live packets captured from interface " + interface)

    rows = []

    for packets in list(flows.values())[:max_flows]:
        stats = build_stats(packets)
        row = [value_by_name(name, stats) for name in feature_names]
        rows.append(row)

    return np.array(rows, dtype=float)
