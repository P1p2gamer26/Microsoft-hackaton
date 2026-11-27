"""
Geospatial GIS Analytics using GeoPandas & Shapely (EPSG:4326 -> metric distance calculations).
"""
import math
import geopandas as gpd
from shapely.geometry import Point


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def nearest_buyers_to_centers(buyers: list[dict], centers: list[dict], max_km: float = 500.0) -> list[dict]:
    if not buyers or not centers:
        return []

    b_gdf = gpd.GeoDataFrame(
        buyers,
        geometry=[Point(float(b["longitude"]), float(b["latitude"])) for b in buyers],
        crs="EPSG:4326",
    )
    c_gdf = gpd.GeoDataFrame(
        centers,
        geometry=[Point(float(c["longitude"]), float(c["latitude"])) for c in centers],
        crs="EPSG:4326",
    )

    results = []
    for _, b in b_gdf.iterrows():
        best_c = None
        best_km = float("inf")
        for _, c in c_gdf.iterrows():
            d = haversine_km(b.geometry.y, b.geometry.x, c.geometry.y, c.geometry.x)
            if d < best_km:
                best_km = d
                best_c = c
        if best_c is not None and best_km <= max_km:
            results.append({
                "buyerName": str(b.get("companyName", b.get("name", ""))),
                "distributionCenter": str(best_c.get("name", "")),
                "distanceKm": round(best_km, 2),
                "crs": "EPSG:4326",
                "dataProvenance": "ESTIMATED",
            })

    results.sort(key=lambda x: x["distanceKm"])
    return results
