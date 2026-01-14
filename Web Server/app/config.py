import os
from dotenv import load_dotenv

load_dotenv()

# MySQL config
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "quakesense")

# MQTT base topic
MQTT_BASE_TOPIC = os.getenv("MQTT_BASE_TOPIC", "esp32/mpu6500")

# MQTT config
MQTT_BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPICS = [
    f"{MQTT_BASE_TOPIC}/+/data",
    f"{MQTT_BASE_TOPIC}/+/status",
]
# Cloudflare Tunnel config
CF_TUNNEL_URLS = [u.strip() for u in os.getenv("CF_TUNNEL_URLS", "").split(",") if u.strip()]

# Aplikasi
API_TITLE = "QuakeSense API"
API_VERSION = "1.0.0"