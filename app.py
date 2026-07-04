from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import jwt
from datetime import datetime, timedelta

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origings=["http://localhost:5173","http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
SECRET_KEY = "sentinel_secret_key"

@app.post("/login")
async def login(data: dict):
    if data["username"] == "admin" and data["password"] == "admin123":
        token = jwt.encode({"user": data["username"], "exp": datetime.utcnow() + timedelta(hours=24)}, SECRET_KEY, algorithm="HS256")
        return {"success": True, "token": token, "user": data["username"]}
    return {"success": False, "message": "خطأ في البيانات"}

@app.post("/register")
async def register(data: dict):
    return {"success": True, "message": "تم انشاء الحساب"}

@app.post("/predict")
async def predict(file: UploadFile = File(...), attack_type: str = Form(...)):
    return {"success": True, "total_flows": 1000, "attack_count": 300, "benign_count": 700, "cpu_used": 65.2, "ram_used": 71.8, "prediction": "ATTACK", "confidence": 99.94, "model": attack_type}

@app.post("/predict-live")
async def predict_live(data: dict):
    return {"success": True, "total_flows": 12450, "attack_count": 3847, "benign_count": 8603, "cpu_used": 67.3, "ram_used": 72.1, "prediction": "ATTACK", "confidence": 99.87, "model": data["attack_type"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)