import numpy as np
import joblib
import tensorflow as tf

# fake dataset للتجربة (مؤقت)
X = np.random.rand(1000, 79)
y = np.random.randint(0, 2, 1000)

X = X.reshape((1000, 79, 1))

model = tf.keras.Sequential([
    tf.keras.layers.LSTM(64, return_sequences=True, input_shape=(79, 1)),
    tf.keras.layers.LSTM(32),
    tf.keras.layers.Dense(2, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(X, y, epochs=5, batch_size=32)

model.save("models/ddos_lstm.h5")

print("DL Model Trained 🚀")
