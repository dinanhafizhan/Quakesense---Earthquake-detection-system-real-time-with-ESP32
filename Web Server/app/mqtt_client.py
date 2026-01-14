import json
import threading
from typing import Any, Dict, Optional
import paho.mqtt.client as mqtt
from datetime import datetime, timezone

from app import config, models

mqtt_status = {
    "connected": False,
    "last_msg_iso": None,
    "last_topic": None,
    "messages_received": 0,
    "broker": f"{config.MQTT_BROKER}:{config.MQTT_PORT}",
}

# Simpan status terakhir per wilayah di memory (untuk website)
_status_store: Dict[str, Dict[str, Any]] = {
    "region1": {"status": None, "ts_iso": None},
    "region2": {"status": None, "ts_iso": None},
}
_status_lock = threading.Lock()

mqtt_client: Optional[mqtt.Client] = None


def _utc_now_iso():
    # ISO 8601 dengan timezone UTC
    return datetime.now(timezone.utc).isoformat()


def _on_connect(client: mqtt.Client, userdata: Any, flags: dict, rc: int):
    mqtt_status["connected"] = (rc == 0)
    print("MQTT connected with result code", rc)

    base = getattr(config, "MQTT_BASE_TOPIC", "esp32/mpu6500")
    topics = [
        f"{base}/region1/status",
        f"{base}/region2/status",
        f"{base}/region1/data",
        f"{base}/region2/data",
        f"{base}/cmd/servo/region1",
        f"{base}/cmd/servo/region2",
    ]
    extra = getattr(config, "MQTT_TOPICS", []) or []
    topics = list(set(topics + extra))  # dedup

    for topic in topics:
        client.subscribe(topic)
        print(f"Subscribed to topic: {topic}")


def _on_disconnect(client: mqtt.Client, userdata: Any, rc: int):
    mqtt_status["connected"] = False
    print("MQTT disconnected, rc=", rc)


def _on_message(client: mqtt.Client, userdata: Any, msg: mqtt.MQTTMessage):
    try:
        topic = msg.topic
        payload_str = msg.payload.decode("utf-8", errors="ignore").strip()

        mqtt_status["last_msg_iso"] = _utc_now_iso()
        mqtt_status["last_topic"] = topic
        mqtt_status["messages_received"] += 1

        parts = topic.split("/")
        # Diharapkan: <base>/region1/data atau .../status
        wilayah = parts[2] if len(parts) > 2 else "unknown"
        leaf = parts[3] if len(parts) > 3 else ""

        # STATUS (string murni)
        if leaf == "status" and wilayah in _status_store:
            with _status_lock:
                _status_store[wilayah]["status"] = payload_str
                _status_store[wilayah]["ts_iso"] = _utc_now_iso()
            print(f"[MQTT] {wilayah.upper()} STATUS <- {payload_str}")
            return

        # DATA (JSON)
        if leaf == "data":
            data = {}
            try:
                data = json.loads(payload_str)
            except Exception:
                print("[MQTT] payload not JSON:", payload_str)

            # Common: getaran dari magnitude
            getaran = 0.0
            try:
                if data.get("magnitude") is not None:
                    getaran = float(data.get("magnitude", 0.0))
            except Exception:
                getaran = 0.0

            if wilayah == "region1":
                suhu = _to_float_or_none(data.get("suhu"))
                gas = _to_float_or_none(data.get("gas"))
                models.insert_region1(getaran, suhu=suhu, gas=gas)
                print(f"[MQTT] R1 DATA -> getaran={getaran}, suhu={suhu}, gas={gas}")

            elif wilayah == "region2":
                tekanan = _to_float_or_none(data.get("tekanan"))
                models.insert_region2(getaran, tekanan=tekanan)
                print(f"[MQTT] R2 DATA -> getaran={getaran}, tekanan={tekanan}")
            else:
                print(f"[MQTT] Unknown wilayah: {wilayah}, topic={topic}")
        else:
            # Topik lain (termasuk cmd/servo) ditangani di ESP, di sini cukup log
            print(f"[MQTT] Unhandled topic: {topic} -> {payload_str}")
    except Exception as e:
        print("[MQTT] Error processing message:", e)


def _to_float_or_none(x):
    try:
        if x is None:
            return None
        return float(x)
    except Exception:
        return None


def start_mqtt_client():
    global mqtt_client
    client = mqtt.Client()
    client.on_connect = _on_connect
    client.on_message = _on_message
    client.on_disconnect = _on_disconnect

    client.connect(config.MQTT_BROKER, config.MQTT_PORT, 60)
    mqtt_client = client

    thread = threading.Thread(target=client.loop_forever, daemon=True)
    thread.start()
    print("MQTT client started in background thread")


def ping_broker(timeout: int = 5):
    base = getattr(config, "MQTT_BASE_TOPIC", "esp32/mpu6500")
    try:
        if mqtt_client is not None and mqtt_status.get("connected", False):
            info = mqtt_client.publish(f"{base}/ping", payload="ping", qos=0)
            try:
                info.wait_for_publish()
            except Exception:
                pass
            return {
                "ok": True,
                "method": "existing_client",
                "rc": int(getattr(info, "rc", -1)),
                "mid": int(getattr(info, "mid", -1)),
                "topic": f"{base}/ping",
            }
        else:
            temp = mqtt.Client()
            temp.connect(config.MQTT_BROKER, config.MQTT_PORT, timeout)
            temp.disconnect()
            return {"ok": True, "method": "temporary_connect"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def publish_servo_command(region: str, angle: Optional[int] = None, action: Optional[str] = None):

    base = getattr(config, "MQTT_BASE_TOPIC", "esp32/mpu6500")
    
    # Normalisasi input region
    region = str(region or "").strip().lower()

    if region == "r1": 
        region = "region1"
    if region == "r2": 
        region = "region2"
    # -------------------------

    if region not in ("region1", "region2"):
        return {"ok": False, "error": "invalid region"}

    topic = f"{base}/cmd/servo/{region}"

    if mqtt_client is None or not mqtt_status.get("connected", False):
        return {"ok": False, "error": "MQTT not connected"}

    try:
        if angle is not None:
            angle = max(0, min(180, int(angle)))
            payload = str(angle)
        elif action:
            payload = str(action).strip()
        else:
            return {"ok": False, "error": "No angle or action provided"}

        info = mqtt_client.publish(topic, payload=payload, qos=0, retain=False)
        try:
            info.wait_for_publish()
        except Exception:
            pass
        return {
            "ok": True,
            "topic": topic,
            "payload": payload,
            "mid": int(getattr(info, "mid", -1)),
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}

# Getter untuk status agar bisa diakses API
def get_statuses():
    with _status_lock:
        return {
            "region1": dict(_status_store.get("region1", {})),
            "region2": dict(_status_store.get("region2", {})),
        }