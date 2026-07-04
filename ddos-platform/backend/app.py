from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import numpy as np
import pandas as pd  # مكتبة مهمة لقراءة ملفات CSV
from tensorflow.keras.models import load_model
import os
import time

app = Flask(__name__)
# تفعيل CORS ضروري جداً للاتصال مع React
CORS(app)

THRESHOLD = 0.6
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'Hybrid_Models')

ATTACK_TYPES = ['DNS', 'LDAP', 'NTP', 'NetBIOS', 'Syn', 'UDPLag']

# الكاش لتخزين المودلات في الذاكرة
models_cache = {}
scalers_cache = {}
features_cache = {}

# --- دالة تحميل المودل (كما هي موجودة لديك) ---
def load_attack_model(attack_type):
    if attack_type not in models_cache:
        print(f"🔄 جاري تحميل مودل {attack_type}...")
        try:
            model = load_model(os.path.join(MODEL_DIR, f'{attack_type}_Hybrid_model.keras'))
            scaler_mean = np.load(os.path.join(MODEL_DIR, f'{attack_type}_Hybridscaler_mean.npy'))
            scaler_scale = np.load(os.path.join(MODEL_DIR, f'{attack_type}_Hybridscaler_scale.npy'))
            features = np.load(os.path.join(MODEL_DIR, f'{attack_type}_Hybridfeatures.npy'), allow_pickle=True)

            models_cache[attack_type] = model
            scalers_cache[attack_type] = (scaler_mean, scaler_scale)
            features_cache[attack_type] = features
            print(f"✅ تم تحميل {attack_type} بنجاح - الفيتشرز: {len(features)}")
        except Exception as e:
            print(f"❌ خطأ في تحميل المودل {attack_type}: {e}")
            raise e
    return models_cache[attack_type], scalers_cache[attack_type], features_cache[attack_type]

# --- HTML للتجربة السريعة (اختياري) ---
HTML_PAGE = '''
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>اختبار سريع</title>
<style>body{font-family:sans-serif;background:#f0f2f5;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.card{background:white;padding:30px;border-radius:15px;box-shadow:0 4px 15px rgba(0,0,0,0.1);width:350px}input,select,button{width:100%;padding:10px;margin:5px 0;border:1px solid #ddd;border-radius:5px}button{background:#4CAF50;color:white;border:none;cursor:pointer}</style>
</head>
<body>
<div class="card">
    <h3>تجربة المودل</h3>
    <select id="t"><option>DNS</option><option>LDAP</option></select>
    <input type="number" id="cpu" placeholder="CPU %" value="50">
    <button onclick="test()">اختبار</button>
    <div id="res" style="margin-top:10px;font-weight:bold"></div>
</div>
<script>
async function test(){
    const r = await fetch('/predict', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({attack_type: document.getElementById('t').value, cpu: document.getElementById('cpu').value, ram: 80})
    });
    const d = await r.json();
    document.getElementById('res').innerText = d.prediction + " (" + d.confidence + "%)";
}
</script>
</body>
</html>
'''

# --- نقطة النهاية الرئيسية للتحليل ---
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1. تحديد نوع الطلب (ملف CSV من React أو أرقام من HTML)
        file = request.files.get('file')
        json_data = request.get_json()

        attack_type = None

        # الحالة أ: جاء طلب من React (يحتوي على ملف)
        if file:
            attack_type = request.form.get('attack_type', 'DNS')
            
            # قراءة ملف CSV باستخدام Pandas
            try:
                df = pd.read_csv(file)
            except Exception as e:
                return jsonify({"error": f"فشل قراءة ملف CSV: {str(e)}"}), 400

            # التأكد أن المودل محمل
            model, (scaler_mean, scaler_scale), features = load_attack_model(attack_type)

            # استخراج الأعمدة المطلوبة فقط
            # نقوم بملء الأعمدة المفقودة بـ 0 لتجنب الأخطاء
            missing_cols = set(features) - set(df.columns)
            if missing_cols:
                print(f"⚠️ تنبيه: الأعمدة التالية مفقودة وسيتم ملؤها بـ 0: {missing_cols}")
                for col in missing_cols:
                    df[col] = 0
            
            input_data = df[features].values

            # Scaling
            input_scaled = (input_data - scaler_mean) / scaler_scale
            
            # التنبؤ
            start_time = time.time()
            preds = model.predict(input_scaled, verbose=0).flatten()
            inference_time = time.time() - start_time

            # تحويل التنبؤات إلى 0 أو 1 بناءً على العتبة
            final_preds = (preds > THRESHOLD).astype(int)
            
            # حساب الإحصائيات المطلوبة للواجهة
            total_flows = len(df)
            attack_count = int(np.sum(final_preds))
            benign_count = total_flows - attack_count
            
            # محاولة حساب متوسط CPU/RAM من الملف (إن وجدت الأعمدة)
            cpu_mean = float(df['CPU_Usage'].mean()) if 'CPU_Usage' in df.columns else 0
            ram_mean = float(df['RAM_Usage'].mean()) if 'RAM_Usage' in df.columns else 0

            # تحديد النتيجة النهائية (إذا وجد هجوم واحد على الأقل نعتبر الملف هجوماً)
            prediction = "ATTACK" if attack_count > 0 else "BENIGN"
            
            # حساب الثقة (متوسط احتمالات الهجمات المكتشفة)
            if attack_count > 0:
                confidence = round(float(np.mean(preds[final_preds == 1])) * 100, 2)
            else:
                confidence = round(float(np.mean(1 - preds)) * 100, 2)

            return jsonify({
                "success": True,
                "model": attack_type,
                "prediction": prediction,
                "confidence": confidence,
                "total_flows": total_flows,
                "attack_count": attack_count,
                "benign_count": benign_count,
                "cpu_used": round(cpu_mean, 2),
                "ram_used": round(ram_mean, 2)
            })

        # الحالة ب: جاء طلب من HTML القديم (JSON بسيط)
        elif json_data:
            attack_type = json_data.get('attack_type', 'DNS')
            cpu = float(json_data.get('cpu', 0))
            ram = float(json_data.get('ram', 0))

            model, (scaler_mean, scaler_scale), features = load_attack_model(attack_type)

            # تجهيز مصفوفة أصفار
            input_data = np.zeros((1, len(features)))
            
            # وضع القيم في مكانها الصحيح
            try:
                cpu_idx = list(features).index('CPU_Usage')
                ram_idx = list(features).index('RAM_Usage')
                input_data[0][cpu_idx] = cpu
                input_data[0][ram_idx] = ram
            except ValueError:
                return jsonify({"error": "CPU_Usage أو RAM_Usage غير موجود في هذا المودل"}), 400

            input_scaled = (input_data - scaler_mean) / scaler_scale
            pred = model.predict(input_scaled, verbose=0)[0][0]

            if pred > THRESHOLD:
                prediction = "ATTACK"
                confidence = round(pred * 100, 2)
            else:
                prediction = "BENIGN"
                confidence = round((1-pred) * 100, 2)

            return jsonify({
                "model": attack_type,
                "prediction": prediction,
                "confidence": confidence
            })
        
        else:
            return jsonify({"error": "لا توجد بيانات (لا ملف ولا JSON)"}), 400

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/')
def home():
    return render_template_string(HTML_PAGE)

# نقاط نهاية المصادقة (لدعم تسجيل الدخول في React)
users_db = {}

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    users_db[data['username']] = data['password']
    return jsonify({'success': True})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if username in users_db and users_db[username] == password:
        return jsonify({'success': True, 'token': 'token-123', 'user': username})
    if username == 'admin' and password == 'admin123':
        return jsonify({'success': True, 'token': 'admin-token', 'user': username})
        
    return jsonify({'success': False, 'message': 'بيانات خاطئة'})


if __name__ == '__main__':
    print("🚀 Starting Sentinel AI Backend...")
    app.run(host='0.0.0.0', port=5000, debug=True)