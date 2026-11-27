import unittest
import werkzeug
if not hasattr(werkzeug, "__version__"):
    werkzeug.__version__ = "3.1"

from app.main import app
from app.ttm_model import analyze_ttm_events
from app.spatial_gis import nearest_buyers_to_centers


class AnalyticsServiceTest(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health(self):
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["status"], "UP")

    def test_ttm_prediction_and_bottleneck(self):
        events = [
            {"entityId": 1, "stageCode": "PRODUCT_AVAILABLE", "durationDaysFromPrev": 0},
            {"entityId": 1, "stageCode": "NEGOTIATION_START", "durationDaysFromPrev": 8},
            {"entityId": 1, "stageCode": "IN_TRANSIT", "durationDaysFromPrev": 14},
            {"entityId": 2, "stageCode": "PRODUCT_AVAILABLE", "durationDaysFromPrev": 0},
            {"entityId": 2, "stageCode": "NEGOTIATION_START", "durationDaysFromPrev": 6},
            {"entityId": 2, "stageCode": "IN_TRANSIT", "durationDaysFromPrev": 16},
            {"entityId": 3, "stageCode": "PRODUCT_AVAILABLE", "durationDaysFromPrev": 0},
            {"entityId": 3, "stageCode": "NEGOTIATION_START", "durationDaysFromPrev": 7},
            {"entityId": 3, "stageCode": "IN_TRANSIT", "durationDaysFromPrev": 15},
        ]
        r = self.client.post("/predict-ttm", json={"events": events})
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertEqual(data["sample_operations"], 3)
        self.assertEqual(data["bottleneck"]["stageCode"], "IN_TRANSIT")
        self.assertIsNotNone(data["prediction"])

    def test_spatial_nearest_buyers(self):
        payload = {
            "buyers": [{"companyName": "Biscayne Demo", "latitude": 25.7985, "longitude": -80.3240}],
            "distributionCenters": [{"name": "Doral Hub Demo", "latitude": 25.8195, "longitude": -80.3553}],
            "maxKm": 50,
        }
        r = self.client.post("/spatial/nearest-buyers", json=payload)
        self.assertEqual(r.status_code, 200)
        matches = r.get_json()["matches"]
        self.assertEqual(len(matches), 1)
        self.assertLess(matches[0]["distanceKm"], 10.0)


if __name__ == "__main__":
    unittest.main()
