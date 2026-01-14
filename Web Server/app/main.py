from typing import List
from fastapi import FastAPI, Query
from fastapi.responses import FileResponse, JSONResponse
from app import config, models
from app.schemas import SensorDataRegion1, SensorDataRegion2, ServoCommand
from app.mqtt_client import start_mqtt_client, mqtt_status, ping_broker, get_statuses, publish_servo_command
import requests

app = FastAPI(title=config.API_TITLE, version=config.API_VERSION)

@app.on_event("startup")
def startup_event():
    start_mqtt_client()

@app.get("/api/health")
def api_health():
    cloudflare_info = {
        "configured": bool(config.CF_TUNNEL_URLS),
        "urls": config.CF_TUNNEL_URLS,
        "error": None if config.CF_TUNNEL_URLS else "CF_TUNNEL_URLS not set in environment",
    }

    health = {
        "mqtt": {
            "connected": mqtt_status.get("connected", False),
            "last_msg_iso": mqtt_status.get("last_msg_iso"),
            "last_topic": mqtt_status.get("last_topic"),
            "messages_received": mqtt_status.get("messages_received", 0),
            "broker": mqtt_status.get("broker"),
        },
        "cloudflare": cloudflare_info,
        "statuses": get_statuses(),
        "server": {"api_version": config.API_VERSION},
    }
    return JSONResponse(content=health)

@app.get("/api/mqtt/ping")
def api_mqtt_ping():
    return JSONResponse(content=ping_broker())

# Endpoint untuk publish perintah servo ke MQTT (per region)
@app.post("/api/servo/{region}")
def api_servo(region: str, cmd: ServoCommand):
    res = publish_servo_command(region=region, angle=cmd.angle, action=cmd.action)
    return JSONResponse(content=res)

@app.get("/status")
def status_page():
    return FileResponse("app/static/status.html")

@app.get("/api/status")
def api_status():
    return JSONResponse(content=get_statuses())

@app.get("/api/data/latest")
def get_latest_both():
    rows = models.get_latest_both()
    return rows

@app.get("/api/data/region1", response_model=List[SensorDataRegion1])
def get_r1(limit: int = Query(20, ge=1, le=1000)):
    return models.get_data_region1(limit=limit)

@app.get("/api/data/region2", response_model=List[SensorDataRegion2])
def get_r2(limit: int = Query(20, ge=1, le=1000)):
    return models.get_data_region2(limit=limit)

@app.get("/api/data/stats")
def get_stats():
    # Mengambil data dari models yang baru dibuat
    s1 = models.get_stats_region1() or {}
    s2 = models.get_stats_region2() or {}
    
    return JSONResponse(content={
        "region1": s1,
        "region2": s2
    })