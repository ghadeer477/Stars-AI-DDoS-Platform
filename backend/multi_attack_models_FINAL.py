import os
import numpy as np
import joblib
import tensorflow as tf

BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "models")

ATTACK_MODEL_CONFIG = {
    "DNS": {
        "display": "DNS Flood MLP Deep Neural Network",
        "model": "DrDoS_DNS_MLP_SMOTE20K_model.keras",
        "scaler": "DrDoS_DNS_MLP_SMOTE20K_scaler.pkl",
    },
    "DNS Flood": {
        "display": "DNS Flood MLP Deep Neural Network",
        "model": "DrDoS_DNS_MLP_SMOTE20K_model.keras",
        "scaler": "DrDoS_DNS_MLP_SMOTE20K_scaler.pkl",
    },
    "LDAP": {
        "display": "LDAP Flood MLP Deep Neural Network",
        "model": "DrDoS_LDAP_MLP_SMOTE20K_model.keras",
        "scaler": "DrDoS_LDAP_MLP_SMOTE20K_scaler.pkl",
    },
    "LDAP Flood": {
        "display": "LDAP Flood MLP Deep Neural Network",
        "model": "DrDoS_LDAP_MLP_SMOTE20K_model.keras",
        "scaler": "DrDoS_LDAP_MLP_SMOTE20K_scaler.pkl",
    },
    "NTP": {
        "display": "NTP Flood MLP Deep Neural Network",
        "model": "DrDoS_NTP_MLP_SMOTE20K_model.keras",
        "scaler": "DrDoS_NTP_MLP_SMOTE20K_scaler.pkl",
    },
    "NTP Flood": {
        "display": "NTP Flood MLP Deep Neural Network",
        "model": "DrDoS_NTP_MLP_SMOTE20K_model.keras",
        "scaler": "DrDoS_NTP_MLP_SMOTE20K_scaler.pkl",
    },
    "NetBIOS": {
        "display": "NetBIOS MLP Deep Neural Network",
        "model": "DrDoS_NetBIOS_MLP_SMOTE20K_model.keras",
        "scaler": "DrDoS_NetBIOS_MLP_SMOTE20K_scaler.pkl",
    },
    "SYN": {
        "display": "SYN Flood MLP Deep Neural Network",
        "model": "Syn_MLP_SMOTE20K_model.keras",
        "scaler": "Syn_MLP_SMOTE20K_scaler.pkl",
    },
    "SYN Flood": {
        "display": "SYN Flood MLP Deep Neural Network",
        "model": "Syn_MLP_SMOTE20K_model.keras",
        "scaler": "Syn_MLP_SMOTE20K_scaler.pkl",
    },
    "UDPLag": {
        "display": "UDPLag MLP Deep Neural Network",
        "model": "UDPLag_MLP_model.h5",
        "scaler": "UDPLag_MLP_scaler.pkl",
    },
    "UDP Lag": {
        "display": "UDPLag MLP Deep Neural Network",
        "model": "UDPLag_MLP_model.h5",
        "scaler": "UDPLag_MLP_scaler.pkl",
    },
}

LOADED_MODELS = {}


def load_all_attack_models():
    global LOADED_MODELS

    for attack_name, cfg in ATTACK_MODEL_CONFIG.items():
        if attack_name in LOADED_MODELS:
            continue

        model_path = os.path.join(MODEL_DIR, cfg["model"])
        scaler_path = os.path.join(MODEL_DIR, cfg["scaler"])

        if not os.path.exists(model_path):
            print(f"Missing model for {attack_name}: {model_path}")
            continue

        if not os.path.exists(scaler_path):
            print(f"Missing scaler for {attack_name}: {scaler_path}")
            continue

        scaler = joblib.load(scaler_path)
        model = tf.keras.models.load_model(model_path, compile=False)

        LOADED_MODELS[attack_name] = {
            "model": model,
            "scaler": scaler,
            "display": cfg["display"],
        }

    print("Loaded attack models:", list(LOADED_MODELS.keys()))


def align_features(features, expected_count):
    arr = np.asarray(features, dtype=float)

    if arr.ndim == 1:
        arr = arr.reshape(1, -1)

    current_count = arr.shape[1]

    if current_count < expected_count:
        padding = np.zeros((arr.shape[0], expected_count - current_count))
        arr = np.hstack([arr, padding])

    elif current_count > expected_count:
        arr = arr[:, :expected_count]

    return arr


def predict_attack_type(attack_type, features):
    if not LOADED_MODELS:
        load_all_attack_models()

    selected = LOADED_MODELS.get(attack_type)

    if selected is None:
        selected = LOADED_MODELS.get("UDPLag")

    if selected is None:
        raise RuntimeError("No attack model loaded")

    scaler = selected["scaler"]
    model = selected["model"]
    model_name = selected["display"]

    expected_count = getattr(scaler, "n_features_in_", features.shape[1])
    aligned_features = align_features(features, expected_count)

    scaled_features = scaler.transform(aligned_features)
    predictions = model.predict(scaled_features, verbose=0)
    predictions = np.array(predictions)

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

    labels = np.array(labels).astype(int)
    confidences = np.array(confidences).astype(float)

    return labels, confidences, model_name
