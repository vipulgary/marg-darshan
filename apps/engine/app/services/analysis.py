"""Shared horoscope pipeline used by the HTTP router and the Celery task."""
from datetime import date

from app.services import doshas, yogas


def yogas_doshas(chart: dict, on_date: date | None = None) -> dict:
    return {"doshas": doshas.evaluate(chart, on_date=on_date), "yogas": yogas.detect(chart)}


def compute_core(dob, tob, tz_name: str, latitude: float, longitude: float) -> dict:
    """compute_chart + yogas_doshas. Needs swisseph (imported lazily)."""
    from app.services.chart import compute_chart

    chart = compute_chart(dob, tob, tz_name, latitude, longitude)
    chart["yogas_doshas"] = yogas_doshas(chart)
    return chart
