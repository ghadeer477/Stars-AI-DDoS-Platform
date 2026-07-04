import numpy as np

FEATURE_COUNT = 79


def calculate_features(packets):

    if not packets or len(packets) == 0:
        return np.zeros((1, FEATURE_COUNT), dtype=np.float32)

    sizes = []
    timestamps = []

    for pkt in packets:
        try:
            sizes.append(float(len(pkt)))
            timestamps.append(float(pkt.time))
        except:
            continue

    if len(sizes) == 0:
        return np.zeros((1, FEATURE_COUNT), dtype=np.float32)

    duration = timestamps[-1] - timestamps[0]

    if duration <= 0:
        duration = 1e-6

    total_bytes = sum(sizes)

    features = []

    # =========================
    # BASIC FLOW FEATURES
    # =========================
    features.append(len(packets))                      # Total packets
    features.append(total_bytes)                       # Total bytes
    features.append(float(duration))                   # Duration
    features.append(total_bytes / duration)           # Bytes/sec
    features.append(len(packets) / duration)          # Packets/sec

    features.append(np.mean(sizes))                   # Avg packet size
    features.append(np.std(sizes))                    # Std packet size
    features.append(np.min(sizes))                    # Min packet size
    features.append(np.max(sizes))                    # Max packet size

    # =========================
    # FILL REST TO 79 FEATURES
    # =========================
    while len(features) < FEATURE_COUNT:
        features.append(0.0)

    # =========================
    # FINAL FIX
    # =========================
    features = np.array(features, dtype=np.float32).reshape(1, FEATURE_COUNT)

    return features
