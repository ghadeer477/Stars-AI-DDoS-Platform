import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib

# 1. حملي الداتا - عدلي المسار حق DrDoS_DNS.csv
df = pd.read_csv("E:/d/مشروع/DrDoS_DNS.csv") 

# 2. جهزي X و y
X = df.select_dtypes(include=[np.number])
y = df['Label']  # تأكدي اسم العمود صح
X = X.drop(['Label'], axis=1)

# 3. قسمي الداتا
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. سوي Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

# 5. دربي المودل
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train_scaled, y_train)

# 6. احفظي المودل والـ scaler
joblib.dump(rf, "rf_model.pkl")
joblib.dump(scaler, "scaler.pkl")
print("تم حفظ المودل بنجاح ✅")