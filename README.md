# Stars AI DDoS Detection Platform

Stars is an AI-based DDoS detection and mitigation platform deployed on AWS EC2. The system supports CSV-based traffic analysis and real-time network monitoring using TShark. Captured traffic is analyzed using multiple MLP Deep Learning models to detect and classify DDoS attacks.

## Main Features

- CSV traffic analysis
- Live network traffic monitoring
- Deep Learning MLP models
- Auto attack classification
- Normal traffic detection
- Suspicious / unknown traffic detection
- Severity assessment
- Mitigation recommendations
- Telegram alerts
- Detection history
- Auto IP blocking using iptables
- Manual unblock
- Exportable security reports
- HTTPS deployment using Nginx and Let's Encrypt
- Backend managed using systemd

## Technologies Used

- React.js
- Vite
- JavaScript
- Python
- Flask
- Gunicorn
- TensorFlow / Keras
- Scikit-learn
- Pandas
- NumPy
- TShark
- Nginx
- Let's Encrypt
- AWS EC2
- systemd
- iptables
- Telegram Bot API

## Security Notice

Sensitive files such as `.env`, private keys, tokens, virtual environments, logs, and runtime history files are excluded from the repository.
