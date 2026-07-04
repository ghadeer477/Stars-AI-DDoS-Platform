import os
import csv
import json
import io
import subprocess
import ipaddress
from datetime import datetime, timezone
from flask import jsonify, request, Response


BASE_DIR = os.path.dirname(__file__)
DETECTION_HISTORY_FILE = os.path.join(BASE_DIR, "detection_history.json")
BLOCK_HISTORY_FILE = os.path.join(BASE_DIR, "blocked_ips_history.json")


def load_json_list(path):
    if not os.path.exists(path):
        return []

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, list):
            return data
    except Exception:
        pass

    return []


def save_json_list(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data[-300:], f, ensure_ascii=False, indent=2)


def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

        return {
            "success": result.returncode == 0,
            "returncode": result.returncode,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
        }
    except Exception as e:
        return {
            "success": False,
            "returncode": -1,
            "stdout": "",
            "stderr": str(e),
        }


def valid_ipv4(ip_text):
    try:
        ip = ipaddress.ip_address(ip_text)
        return ip.version == 4
    except Exception:
        return False


def get_iptables_drops():
    result = run_cmd(["sudo", "iptables", "-L", "INPUT", "-n", "--line-numbers"])
    drops = []

    for line in result.get("stdout", "").splitlines():
        if "DROP" in line:
            drops.append(line)

    return drops


def get_service_status():
    active = run_cmd(["systemctl", "is-active", "sentinel-backend"])
    enabled = run_cmd(["systemctl", "is-enabled", "sentinel-backend"])

    return {
        "active": active.get("stdout"),
        "enabled": enabled.get("stdout"),
        "active_success": active.get("success"),
        "enabled_success": enabled.get("success"),
    }


def register_professional_routes(app):

    @app.route("/professional/model-status", methods=["GET"])
    def professional_model_status():
        models = []

        try:
            from multi_attack_models import load_all_attack_models, LOADED_MODELS

            load_all_attack_models()

            seen = set()

            for attack_type, item in LOADED_MODELS.items():
                display = item.get("display") or attack_type
                key = f"{attack_type}-{display}"

                if key in seen:
                    continue

                seen.add(key)

                model = item.get("model")
                scaler = item.get("scaler")

                models.append({
                    "attack_type": attack_type,
                    "display": display,
                    "model_loaded": model is not None,
                    "scaler_loaded": scaler is not None,
                    "status": "Loaded" if model is not None and scaler is not None else "Incomplete"
                })

        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e),
                "models": models
            })

        return jsonify({
            "success": True,
            "auto_classifier": "Active",
            "total_models": len(models),
            "models": models
        })

    @app.route("/professional/system-status", methods=["GET"])
    def professional_system_status():
        return jsonify({
            "success": True,
            "service": get_service_status(),
            "blocked_rules": get_iptables_drops(),
            "detection_history_count": len(load_json_list(DETECTION_HISTORY_FILE)),
            "block_history_count": len(load_json_list(BLOCK_HISTORY_FILE)),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    @app.route("/professional/blocked-ips", methods=["GET"])
    def professional_blocked_ips():
        return jsonify({
            "success": True,
            "iptables_drop_rules": get_iptables_drops(),
            "history": load_json_list(BLOCK_HISTORY_FILE)
        })

    @app.route("/professional/unblock-ip", methods=["POST"])
    def professional_unblock_ip():
        data = request.get_json(silent=True) or {}
        ip = str(data.get("ip", "")).strip()

        if not ip:
            return jsonify({
                "success": False,
                "error": "Missing IP address"
            }), 400

        if not valid_ipv4(ip):
            return jsonify({
                "success": False,
                "error": "Invalid IPv4 address"
            }), 400

        result = run_cmd(["sudo", "/usr/local/bin/sentinel-unblock-ip", ip])

        history = load_json_list(BLOCK_HISTORY_FILE)
        history.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": "UNBLOCK",
            "ip": ip,
            "result": result
        })
        save_json_list(BLOCK_HISTORY_FILE, history)

        return jsonify({
            "success": result.get("success"),
            "ip": ip,
            "output": result.get("stdout") or result.get("stderr"),
            "details": result
        })

    @app.route("/professional/export-report", methods=["GET"])
    def professional_export_report():
        report_format = str(request.args.get("format", "json")).lower()

        detection_history = load_json_list(DETECTION_HISTORY_FILE)
        block_history = load_json_list(BLOCK_HISTORY_FILE)

        if report_format == "csv":
            output = io.StringIO()
            writer = csv.writer(output)

            writer.writerow([
                "timestamp",
                "mode",
                "interface",
                "attack_type",
                "prediction",
                "model",
                "confidence",
                "severity",
                "attack_count",
                "total_flows",
                "cpu_used",
                "ram_used",
                "recommendation"
            ])

            for row in detection_history:
                writer.writerow([
                    row.get("timestamp"),
                    row.get("mode"),
                    row.get("interface"),
                    row.get("attack_type"),
                    row.get("prediction"),
                    row.get("model"),
                    row.get("confidence"),
                    row.get("severity"),
                    row.get("attack_count"),
                    row.get("total_flows"),
                    row.get("cpu_used"),
                    row.get("ram_used"),
                    row.get("recommendation")
                ])

            filename = "sentinel_detection_report.csv"

            return Response(
                output.getvalue(),
                mimetype="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )

        return jsonify({
            "success": True,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "system": "Sentinel AI DDoS Detection Platform",
            "detection_history": detection_history,
            "block_history": block_history,
            "summary": {
                "total_detection_records": len(detection_history),
                "total_block_records": len(block_history),
                "iptables_drop_rules": get_iptables_drops(),
                "service": get_service_status()
            }
        })
