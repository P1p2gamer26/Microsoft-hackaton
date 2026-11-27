"""
CoffeBite - Python Data Intelligence & GIS Microservice (Flask + Pandas + Scikit-learn + GeoPandas)
"""
from flask import Flask, jsonify, request
from app.ttm_model import analyze_ttm_events
from app.spatial_gis import nearest_buyers_to_centers, haversine_km

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"status": "UP", "service": "CoffeBite Python Analytics & GIS"})


@app.post("/predict-ttm")
def predict_ttm():
    payload = request.get_json(silent=True) or {}
    events = payload.get("events", [])
    return jsonify(analyze_ttm_events(events, payload.get("features")))


@app.post("/spatial/nearest-buyers")
def spatial_nearest():
    payload = request.get_json(silent=True) or {}
    buyers = payload.get("buyers", [])
    centers = payload.get("distributionCenters", [])
    max_km = float(payload.get("maxKm", 500.0))
    return jsonify({
        "matches": nearest_buyers_to_centers(buyers, centers, max_km),
        "engine": "GeoPandas + Shapely (EPSG:4326)",
    })


@app.post("/spatial/road-estimate")
def road_estimate():
    payload = request.get_json(silent=True) or {}
    lat1 = float(payload.get("originLat", 5.0689))
    lon1 = float(payload.get("originLon", -75.5174))
    lat2 = float(payload.get("destLat", 10.3910))
    lon2 = float(payload.get("destLon", -75.4794))
    road_factor = float(payload.get("roadFactor", 1.32))
    geodesic = haversine_km(lat1, lon1, lat2, lon2)
    return jsonify({
        "geodesicKm": round(geodesic, 2),
        "estimatedRoadKm": round(geodesic * road_factor, 2),
        "roadFactor": road_factor,
        "dataProvenance": "ESTIMATED",
        "note": "Estimación geodésica con factor vial editable. Configure OSRM_BASE_URL para ruteo vial real.",
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001)
