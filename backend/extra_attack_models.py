import os
import pickle
import numpy as np


class NpyStandardScaler:
    def __init__(self, mean, scale):
        self.mean_ = np.asarray(mean, dtype=float).reshape(-1)
        self.scale_ = np.asarray(scale, dtype=float).reshape(-1)
        self.scale_[self.scale_ == 0] = 1.0
        self.n_features_in_ = len(self.mean_)

    def transform(self, x):
        x = np.asarray(x, dtype=float)
        x = np.nan_to_num(x, nan=0.0, posinf=0.0, neginf=0.0)

        if x.ndim == 1:
            x = x.reshape(1, -1)

        if x.shape[1] < self.n_features_in_:
            pad = np.zeros((x.shape[0], self.n_features_in_ - x.shape[1]))
            x = np.hstack([x, pad])
        elif x.shape[1] > self.n_features_in_:
            x = x[:, :self.n_features_in_]

        return (x - self.mean_) / self.scale_


def load_keras_model(path):
    from tensorflow.keras.models import load_model

    try:
        return load_model(path, compile=False, safe_mode=False)
    except TypeError:
        return load_model(path, compile=False)


def load_pickle_scaler(path):
    with open(path, "rb") as f:
        scaler = pickle.load(f)

    if not hasattr(scaler, "n_features_in_"):
        try:
            scaler.n_features_in_ = len(scaler.mean_)
        except Exception:
            pass

    return scaler


def register_npy_model(loaded_models, base_dir, key, model_file, mean_file, scale_file, display):
    folder = os.path.join(base_dir, "new_attack_models")

    model_path = os.path.join(folder, model_file)
    mean_path = os.path.join(folder, mean_file)
    scale_path = os.path.join(folder, scale_file)

    missing = [p for p in [model_path, mean_path, scale_path] if not os.path.exists(p)]

    if missing:
        print(f"[Extra Models] Skipped {key}, missing files:", missing)
        return False

    model = load_keras_model(model_path)
    scaler = NpyStandardScaler(np.load(mean_path), np.load(scale_path))

    loaded_models[key] = {
        "model": model,
        "scaler": scaler,
        "display": display,
        "source": "new_attack_models"
    }

    print(f"[Extra Models] Loaded {key}: {display}")
    return True


def load_extra_attack_models(loaded_models, base_dir):
    added = []

    # Do not load MSSQL / MySQL
    candidates = [
        {
            "key": "SNMP",
            "model": "DrDoS_SNMP_model.keras",
            "mean": "DrDoS_SNMP_scaler_mean.npy",
            "scale": "DrDoS_SNMP_scaler_scale.npy",
            "display": "SNMP Flood MLP Deep Neural Network"
        },
        {
            "key": "SSDP",
            "model": "DrDoS_SSDP_model.keras",
            "mean": "DrDoS_SSDP_scaler_mean.npy",
            "scale": "DrDoS_SSDP_scaler_scale.npy",
            "display": "SSDP Flood MLP Deep Neural Network"
        },
        {
            "key": "TFTP",
            "model": "TFTP_model.keras",
            "mean": "TFTPscaler_mean.npy",
            "scale": "TFTPscaler_scale.npy",
            "display": "TFTP Flood MLP Deep Neural Network"
        },
        {
            "key": "Portmap",
            "model": "Portmap_model.keras",
            "mean": "Portmapscaler_mean.npy",
            "scale": "Portmapscaler_scale.npy",
            "display": "Portmap Flood MLP Deep Neural Network"
        },
    ]

    for item in candidates:
        ok = register_npy_model(
            loaded_models=loaded_models,
            base_dir=base_dir,
            key=item["key"],
            model_file=item["model"],
            mean_file=item["mean"],
            scale_file=item["scale"],
            display=item["display"]
        )

        if ok:
            added.append(item["key"])

    print("[Extra Models] Added:", added)
    return added
