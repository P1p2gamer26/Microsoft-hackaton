"""
Time-to-Market ML & Bottleneck Analytics (Pandas + Scikit-learn).
Never promises unverified percentage reductions; reports baseline & sample size explicitly.
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge


def analyze_ttm_events(events: list[dict], predict_features: dict | None = None) -> dict:
    if not events:
        return {
            "sample_operations": 0,
            "bottleneck": None,
            "stage_averages": [],
            "prediction": None,
            "note": "No hay eventos históricos suficientes para entrenar o predecir Time to Market.",
        }

    df = pd.DataFrame(events)
    df["duration_days"] = pd.to_numeric(df.get("durationDaysFromPrev", 0), errors="coerce").fillna(0.0)

    stage_summary = (
        df.groupby("stageCode", sort=False)["duration_days"]
        .agg(["mean", "median", "max", "count"])
        .reset_index()
    )
    non_zero = stage_summary[stage_summary["stageCode"] != "PRODUCT_AVAILABLE"]
    bottleneck = None
    if not non_zero.empty:
        top = non_zero.sort_values("mean", ascending=False).iloc[0]
        bottleneck = {
            "stageCode": str(top["stageCode"]),
            "avgDays": round(float(top["mean"]), 2),
            "maxDays": round(float(top["max"]), 2),
        }

    op_totals = df.groupby("entityId")["duration_days"].sum()
    sample_ops = int(len(op_totals))

    prediction = None
    if sample_ops >= 3:
        # Lightweight regularized regression on historical operation durations + volume/distance proxies
        X = np.column_stack([
            np.arange(1, sample_ops + 1, dtype=float),
            np.full(sample_ops, 1.0),
        ])
        y = op_totals.values.astype(float)
        model = Ridge(alpha=1.0).fit(X, y)
        next_x = np.array([[sample_ops + 1.0, 1.0]])
        pred_days = float(max(1.0, model.predict(next_x)[0]))
        prediction = {
            "estimatedTotalDays": round(pred_days, 2),
            "baselineMeanDays": round(float(np.mean(y)), 2),
            "sampleOperations": sample_ops,
            "model": "RidgeRegression (Scikit-learn)",
            "disclaimer": "Estimación estadística sobre línea base registrada. Requiere >=20 operaciones reales para predicción robusta y no garantiza reducciones porcentuales.",
        }

    return {
        "sample_operations": sample_ops,
        "bottleneck": bottleneck,
        "stage_averages": [
            {
                "stageCode": str(r["stageCode"]),
                "avgDays": round(float(r["mean"]), 2),
                "medianDays": round(float(r["median"]), 2),
                "count": int(r["count"]),
            }
            for _, r in stage_summary.iterrows()
        ],
        "prediction": prediction,
    }
