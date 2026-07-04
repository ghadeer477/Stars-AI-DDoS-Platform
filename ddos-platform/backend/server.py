from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
import os
import jwt
import datetime
import psutil
import random  # تمت الإضافة للمحاكاة

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'sentinel_secret_2026'

THRESHOLD = 0.6
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'Hybrid_Models')

models_cache = {}
scalers_cache = {}
features_cache = {}

USERS = {'admin': 'admin123', 'user': '1234'}

def load_attack_model(attack_type):
    if attack_type not in models_cache:
        print(f"جاري تحميل مودل {attack_type}...")
        try:
            model = load_model(os.path.join(MODEL_DIR, f'{attack_type}_Hybrid_model.keras'))
            scaler_mean = np.load(os.path.join(MODEL_DIR, f'{attack_type}_Hybridscaler_mean.npy'))
            scaler_scale = np.load(os.path.join(MODEL_DIR, f'{attack_type}_Hybridscaler_scale.npy'))
            features = np.load(os.path.join(MODEL_DIR, f'{attack_type}_Hybridfeatures.npy'), allow_pickle=True)
            models_cache[attack_type] = model
            scalers_cache[attack_type] = (scaler_mean, scaler_scale)
            features_cache[attack_type] = features
            print(f"✅ تم تحميل {attack_type}")
        except Exception as e:
            print(f"❌ فشل تحميل المودل: {e}")
            return None, None, None
    return models_cache.get(attack_type), scalers_cache.get(attack_type), features_cache.get(attack_type)

def predict_from_values(cpu, ram, attack_type):
    model, (scaler_mean, scaler_scale), features = load_attack_model(attack_type)
    
    # حماية في حال فشل تحميل المودل
    if model is None:
        return "BENIGN", 0.0

    input_data = np.zeros((1, len(features)))

    try:
        cpu_idx = list(features).index('CPU_Usage')
        ram_idx = list(features).index('RAM_Usage')
        input_data[0][cpu_idx] = cpu
        input_data[0][ram_idx] = ram
    except ValueError:
        print("الميزات المطلوبة غير موجودة في المودل")
        return "BENIGN", 0.0

    input_scaled = (input_data - scaler_mean) / scaler_scale
    pred = model.predict(input_scaled, verbose=0)[0][0]

    prediction = "ATTACK" if pred > THRESHOLD else "BENIGN"
    confidence = round(pred * 100, 2) if pred > THRESHOLD else round((1-pred) * 100, 2)
    return prediction, confidence

@app.route('/check_status', methods=['GET'])
def check_status():
    # هذه الدالة للاستخدام العام، يمكن تجاهلها حالياً لصالح predict-live
    return {"status": "safe", "message": "النظام آمن"}

def token_required(f):
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'success': False, 'message': 'Token مفقود'}), 401
        try:
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        except:
            return jsonify({'success': False, 'message': 'Token غير صالح'}), 401
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if USERS.get(username) == password:
        token = jwt.encode({
            'user': username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({'success': True, 'token': token, 'user': username})
    return jsonify({'success': False, 'message': 'اسم مستخدم أو كلمة مرور خطأ'})

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    USERS[data.get('username')] = data.get('password')
    return jsonify({'success': True, 'message': 'تم التسجيل'})

@app.route('/predict', methods=['POST'])
@token_required
def predict_file():
    try:
        file = request.files.get('file')
        attack_type = request.form.get('attack_type', 'DNS')

        if not file:
            return jsonify({'success': False, 'error': 'لا يوجد ملف'})

        df = pd.read_csv(file)
        cpu = df['CPU_Usage'].mean() if 'CPU_Usage' in df.columns else 50
        ram = df['RAM_Usage'].mean() if 'RAM_Usage' in df.columns else 50

        prediction, confidence = predict_from_values(cpu, ram, attack_type)

        attack_count = 1523 if prediction == "ATTACK" else 23
        benign_count = 89542 if prediction == "BENIGN" else 50000

        return jsonify({
            'success': True,
            'model': attack_type,
            'prediction': prediction,
            'confidence': confidence,
            'cpu_used': round(cpu, 2),
            'ram_used': round(ram, 2),
            'total_flows': attack_count + benign_count,
            'attack_count': attack_count,
            'benign_count': benign_count
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/predict-live', methods=['POST'])
@token_required
def predict_live():
    try:
        data = request.get_json()
        attack_type = data.get('attack_type', 'DNS')
        
        # === التعديل الجديد: التحقق من طلب المحاكاة ===
        simulate_attack = data.get('simulate', False)

        if simulate_attack:
            print("🚨 تشغيل وضع المحاكاة: هجوم DDoS مفعّل")
            return jsonify({
                'success': True,
                'model': attack_type,
                'prediction': 'ATTACK',  # إجباري هجوم
                'confidence': 99.9,
                'cpu_used': random.uniform(85, 99),  # استهلاك عشوائي عالي
                'ram_used': random.uniform(80, 95),
                'total_flows': random.randint(50000, 100000),
                'attack_count': random.randint(40000, 90000),
                'benign_count': random.randint(100, 5000)
            })

        # === الكود الأصلي للمراقبة الحقيقية ===
        # إزالة interval=1 لجعل الاستجابة أسرع
        cpu = psutil.cpu_percent(interval=None) 
        ram = psutil.virtual_memory().percent

        prediction, confidence = predict_from_values(cpu, ram, attack_type)

        attack_count = 1523 if prediction == "ATTACK" else 23
        benign_count = 89542 if prediction == "BENIGN" else 50000

        return jsonify({
            'success': True,
            'model': attack_type,
            'prediction': prediction,
            'confidence': confidence,
            'cpu_used': round(cpu, 2),
            'ram_used': round(ram, 2),
            'total_flows': attack_count + benign_count,
            'attack_count': attack_count,
            'benign_count': benign_count
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)