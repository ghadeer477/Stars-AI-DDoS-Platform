import numpy as np
import tensorflow as tf
import joblib

# =========================
# Load scaler (نفس حقك الحالي)
# =========================
scaler = joblib.load("models/UDPLag_scaler.pkl")

# =========================
# Build LSTM model
# =========================
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(79, 1)),

    tf.keras.layers.LSTM(64, return_sequences=True),
    tf.keras.layers.LSTM(32),

    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(2, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

print("Deep Learning Model Ready 🚀")
