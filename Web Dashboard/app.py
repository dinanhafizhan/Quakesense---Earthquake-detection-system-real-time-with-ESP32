from flask import Flask, render_template, jsonify, request
from datetime import datetime
import requests

app = Flask(__name__)

BASE_API = "https://wedding-weblogs-quarterly-paperback.trycloudflare.com"

# ======================== IN-MEMORY ACTIVITY LOG ========================
# Catat perubahan status untuk tiap wilayah
last_status = {1: None, 2: None}
activity_logs = []  # item: {time, wilayah, status, level, message}

def _status_level(status_text: str) -> str:
    s = (status_text or "").upper()
    if "GEMPA" in s:
        return "danger"
    if "WASPADA" in s:
        return "warning"
    return "info"

def _status_message(new_status: str) -> str:
    s = (new_status or "").upper()
    if "GEMPA" in s:
        return "PERINGATAN: Status berubah menjadi BAHAYA GEMPA"
    if "WASPADA" in s:
        return "PERINGATAN: Status berubah menjadi WASPADA"
    return "INFO: Status kembali normal (AMAN)"

def _append_log(wilayah: int, status_text: str):
    activity_logs.append({
        "time": datetime.now().strftime("%H:%M:%S"),
        "wilayah": wilayah,
        "status": status_text,
        "level": _status_level(status_text),
        "message": _status_message(status_text),
    })
    # batasi agar tidak membengkak
    if len(activity_logs) > 500:
        del activity_logs[: len(activity_logs) - 500]

# ======================== HALAMAN ========================
@app.route("/")
def dashboard():
    return render_template("dashboard.html")

@app.route("/grafik")
def grafik():
    return render_template("grafik.html")

@app.route("/data")
def data_page():
    return render_template("data.html")

@app.route("/log")
def log_page():
    return render_template("log.html")

# ======================== REALTIME ========================
@app.route("/api/sensor/<int:wilayah>")
def api_sensor(wilayah):
    try:
        region = "region1" if wilayah == 1 else "region2"
        r = requests.get(f"{BASE_API}/api/data/{region}", timeout=3)
        data = r.json()

        if isinstance(data, list) and len(data) > 0:
            return jsonify(data[0])

        return jsonify({"error": "No data"})
    except Exception as e:
        return jsonify({"error": str(e)})

# ======================== GRAFIK (HISTORY) ========================
@app.route("/api/grafik/<int:wilayah>")
def api_grafik(wilayah):
    try:
        region = "region1" if wilayah == 1 else "region2"
        r = requests.get(f"{BASE_API}/api/data/{region}", timeout=3)
        data = r.json()

        if isinstance(data, list):
            return jsonify(data)

        return jsonify([data])

    except Exception as e:
        return jsonify({"error": str(e)})

# ======================== DATA========================
@app.route("/api/data/<string:region>")
def api_data(region):
    try:
        if region not in ["region1", "region2"]:
            return jsonify({"error": "Invalid region"})

        r = requests.get(f"{BASE_API}/api/data/{region}", timeout=3)
        return jsonify(r.json())

    except Exception as e:
        return jsonify({"error": str(e)})


# ======================== STATUS========================
@app.route("/api/status/<int:wilayah>")
def api_status(wilayah):
    try:
        r = requests.get(f"{BASE_API}/api/status", timeout=3)
        data = r.json()

        region_key = f"region{wilayah}"

        if region_key not in data:
            return jsonify({"error": "Region not found"})

        result = data[region_key]

        # Deteksi perubahan status dan catat log
        # result diharapkan memiliki field 'status'
        try:
            new_status = (result.get("status") if isinstance(result, dict) else None) or ""
            if last_status.get(wilayah) is None:
                # Pertama kali: set tanpa log agar tidak bising
                last_status[wilayah] = new_status
            elif new_status != last_status.get(wilayah):
                last_status[wilayah] = new_status
                _append_log(wilayah, new_status)
        except Exception:
            pass

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)})


# ======================== ACTIVITY LOG API ========================
@app.route("/api/logs", methods=["GET"])
def api_logs():
    # kembalikan dari terbaru ke terlama
    return jsonify(list(reversed(activity_logs)))


@app.route("/api/logs/clear", methods=["POST"])
def api_logs_clear():
    activity_logs.clear()
    return jsonify({"ok": True})


# ======================== SERVO ========================
@app.route("/api/servo/<string:region>", methods=["POST"])
def api_servo(region):
    try:
        if region not in ["region1", "region2"]:
            return jsonify({"error": "Invalid region"}), 400

        payload = request.json or {}

        r = requests.post(
            f"{BASE_API}/api/servo/{region}",
            json=payload,
            timeout=3
        )

        return jsonify(r.json())

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# ======================== DATA STATS (ALL REGIONS) ========================
@app.route("/api/data/stats")
def api_data_stats():
    try:
        r = requests.get(f"{BASE_API}/api/data/stats", timeout=3)
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


    
if __name__ == "__main__":
    app.run(debug=True)
