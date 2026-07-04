from fastapi import FastAPI, UploadFile, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import pandas as pd
import numpy as np
from tensorflow.keras.models import load_model
import os
from datetime import datetime

app = FastAPI(title="Sentinel Eye Pro")

# تحميل كل المودلات تلقائي من مجلدك
MODELS = {}
ATTACKS = ["LDAP", "DNS", "MSSQL", "NetBIOS", "NTP", "Syn", "UDPLag", "0.595325"]

for attack in ATTACKS:
    try:
        MODELS[attack] = {
            "model": load_model(f"Hybrid_Models/{attack}_Hybrid_model.keras"),
            "scaler": np.load(f"Hybrid_Models/{attack}_Hybridscaler_scale.npy"),
            "mean": np.load(f"Hybrid_Models/{attack}_Hybridscaler_mean.npy"),
            "features": np.load(f"Hybrid_Models/{attack}_Hybridfeatures.npy", allow_pickle=True)
        }
        print(f"✅ {attack} loaded")
    except:
        print(f"⚠️ {attack} not found")

app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/", response_class=HTMLResponse)
async def home():
    with open("frontend/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/predict")
async def predict(file: UploadFile, attack_type: str = Form(...)):
    df = pd.read_csv(file.file)

    # اخذ الفيتشرز المطلوبة بس
    features = MODELS[attack_type]["features"]
    X = df[features].values

    # تطبيق الـ scaler
    X = (X - MODELS[attack_type]["mean"]) / MODELS[attack_type]["scaler"]

    # التنبؤ الفوري
    pred = MODELS[attack_type]["model"].predict(X)
    confidence = float(pred[0][0]) * 100

    result = "ATTACK" if confidence > 50 else "BENIGN"
    color = "#FF3366" if result == "ATTACK" else "#00FF88"

    return {
        "status": result,
        "confidence": f"{confidence:.2f}%",
        "attack_type": attack_type,
        "color": color,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }