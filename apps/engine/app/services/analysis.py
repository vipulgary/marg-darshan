"""Shared horoscope pipeline used by the HTTP router and the Celery task."""
from datetime import date

from app.services import doshas, yogas


def yogas_doshas(chart: dict, on_date: date | None = None) -> dict:
    return {"doshas": doshas.evaluate(chart, on_date=on_date), "yogas": yogas.detect(chart)}


def compute_core(dob, tob, tz_name: str, latitude: float, longitude: float, sade_sati: bool = True) -> dict:
    """compute_chart + yogas_doshas. Needs swisseph (imported lazily)."""
    from app.services.chart import compute_chart

    chart = compute_chart(dob, tob, tz_name, latitude, longitude)
    chart["yogas_doshas"] = yogas_doshas(chart)
    chart["calc_version"] = 3  # 2 = Lahiri forced; 3 = adds personal wedding + work-start muhurats
    if sade_sati:
        from app.services.sade_sati import periods

        chart["sade_sati_periods"] = periods(chart["rashi"]["sign"], dob)
        # Next wedding muhurats for this person (own Moon), at the birthplace, within a year.
        from app.services.vivah import find

        moon = chart["rashi"]["sign"]
        chart["vivah_muhurats"] = find(moon, moon, latitude, longitude, tz_name, count=80, horizon_days=366)
        chart["karya_muhurats"] = find(moon, moon, latitude, longitude, tz_name, count=6, horizon_days=90, kind="karya")
    return chart
