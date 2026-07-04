import tensorflow as tf
import joblib
import numpy as np

# تحميل scaler (نستخدم نفس حقك)
scaler = joblib.load("models/UDPLag_scaler.pkl")

# بناء نموذج Deep Learning
model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(79,)),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)


def train(X, y):
    X = scaler.transform(X)
    model.fit(X, y, epochs=10, batch_size=32)
    model.save("models/ddos_dl_model.h5")


def predict(features):
    X = scaler.transform([features])
    pred = model.predict(X)[0][0]

    if pred > 0.5:
        return {"result": "ATTACK", "confidence": float(pred * 100)}
    else:
        return {"result": "NORMAL", "confidence": float((1 - pred) * 100)}
