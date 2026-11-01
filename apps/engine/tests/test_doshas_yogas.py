"""Doshas & yogas on synthetic charts (no swisseph).

Default chart (chartfactory): Aries lagna; Sun Aries, Moon Gemini, Mars Leo, Mercury Taurus,
Jupiter Sagittarius, Venus Pisces, Saturn Libra, Rahu Cancer, Ketu Capricorn.
"""
from datetime import date

from chartfactory import make_chart

from app.services import doshas, yogas
from app.services.doshas import evaluate, sade_sati

DOSHA_KEYS = ["manglik", "kaal_sarp", "sade_sati", "pitru", "guru_chandal", "shrapit", "grahan"]
CONTRACT_DOSHA_KEYS = {"key", "name_hi", "name_en", "present", "cancelled", "details_hi", "details_en"}


def by_key(items):
    return {i["key"]: i for i in items}


def test_default_chart_has_no_doshas_and_contract_shape():
    out = evaluate(make_chart(0.0), transit_saturn_sign=8)
    assert [d["key"] for d in out] == DOSHA_KEYS
    for d in out:
        assert set(d) == CONTRACT_DOSHA_KEYS  # severity only appears when present
        assert d["present"] is False and d["cancelled"] is False
        assert d["details_hi"] and d["details_en"]


def test_manglik_two_references_medium_not_cancelled():
    d = doshas.manglik(make_chart(0.0, mars_sign=7))  # 7th from Lagna, 8th from Venus
    assert d["present"] and not d["cancelled"] and d["severity"] == "medium"
    assert "Lagna" in d["details_en"] and "Venus" in d["details_en"]


def test_manglik_cancelled_by_own_sign():
    d = doshas.manglik(make_chart(0.0, mars_sign=8))  # Scorpio, 8th from Lagna
    assert d["present"] and d["cancelled"] and d["severity"] == "low"
    assert "own sign" in d["details_en"] and "भंग" in d["details_hi"]


def test_manglik_cancelled_by_jupiter_aspect():
    d = doshas.manglik(make_chart(0.0, mars_sign=4, jupiter_sign=12))  # Jupiter 5th aspect onto Cancer
    assert d["present"] and d["cancelled"] and "Jupiter aspects Mars" in d["details_en"]


def test_manglik_house_specific_exception():
    # Mars in Cancer = 7th from a Capricorn lagna -> 7th in Cancer exception
    d = doshas.manglik(make_chart(9 * 30 + 5, mars_sign=4, jupiter_sign=6, moon_sign=6, venus_sign=6))
    assert d["present"] and d["cancelled"] and "7th from Lagna" in d["details_en"]


def test_kaal_sarp_full_partial_and_type():
    hemmed = dict(rahu=100.0, sun=110.0, moon=150.0, mars=170.0, mercury=200.0, jupiter=220.0,
                  venus=240.0, saturn=260.0)
    d = doshas.kaal_sarp(make_chart(0.0, **hemmed))
    assert d["present"] and d["severity"] == "high" and "Shankhpal" in d["details_en"]  # Rahu in 4th
    d = doshas.kaal_sarp(make_chart(0.0, **{**hemmed, "saturn": 300.0}))
    assert d["present"] and d["severity"] == "low" and "Saturn is outside" in d["details_en"]
    assert not doshas.kaal_sarp(make_chart(0.0))["present"]


def test_sade_sati_phases():
    assert sade_sati(5, 4) == "rising"
    assert sade_sati(5, 5) == "peak"
    assert sade_sati(5, 6) == "setting"
    assert sade_sati(5, 8) is None
    assert sade_sati(1, 12) == "rising"
    out = by_key(evaluate(make_chart(0.0), on_date=date(2025, 1, 1), transit_saturn_sign=3))
    assert out["sade_sati"]["present"] and out["sade_sati"]["severity"] == "high"
    dhaiya = by_key(evaluate(make_chart(0.0), transit_saturn_sign=6))["sade_sati"]  # 4th from Moon
    assert not dhaiya["present"] and "Dhaiya" in dhaiya["details_en"]


def test_sade_sati_unknown_transit_is_reported_not_checked(monkeypatch):
    def boom(_day):
        raise ImportError("no swisseph")
    monkeypatch.setattr(doshas, "saturn_sign_on", boom)
    d = by_key(evaluate(make_chart(0.0)))["sade_sati"]
    assert not d["present"] and "could not" in d["details_en"]


def test_node_conjunction_doshas():
    out = by_key(evaluate(make_chart(0.0, rahu=20.0), transit_saturn_sign=8))  # Sun 15° with Rahu 20°
    assert out["pitru"]["present"] and out["pitru"]["severity"] == "medium"
    assert out["grahan"]["present"] and out["grahan"]["severity"] == "high"
    out = by_key(evaluate(make_chart(0.0, rahu=290.0, saturn=280.0, jupiter=105.0), transit_saturn_sign=8))
    assert out["shrapit"]["present"]          # Saturn with Rahu in Capricorn
    assert out["guru_chandal"]["present"]     # Jupiter with Ketu in Cancer
    assert out["guru_chandal"]["severity"] == "medium"


def test_pitru_ninth_house_with_afflicted_sun():
    d = doshas.pitru(make_chart(0.0, saturn_sign=9, sun_sign=7))  # Saturn in 9th, Sun debilitated
    assert d["present"] and d["severity"] == "low"


YOGA_KEYS = {"key", "name_hi", "name_en", "description_hi", "description_en", "planets"}


def test_default_chart_yogas_shape_and_unique_keys():
    found = yogas.detect(make_chart(0.0))
    keys = [y["key"] for y in found]
    assert len(keys) == len(set(keys))
    assert "gajakesari" in keys  # Jupiter 7th from Moon
    for y in found:
        assert set(y) == YOGA_KEYS and y["planets"] and y["description_hi"]


def test_simple_yogas():
    assert yogas.gajakesari(make_chart(0.0, jupiter_sign=2)) is None
    assert yogas.budhaditya(make_chart(0.0, mercury_sign=1))["planets"] == ["sun", "mercury"]
    assert yogas.budhaditya(make_chart(0.0)) is None
    assert yogas.chandra_mangal(make_chart(0.0, mars_sign=9)) is not None
    assert yogas.chandra_mangal(make_chart(0.0)) is None


def test_panch_mahapurusha():
    keys = {y["key"] for y in yogas.panch_mahapurusha(make_chart(0.0, mars_sign=10, jupiter_sign=4, saturn_sign=8))}
    assert keys == {"ruchaka", "hamsa"}
    # Saturn exalted in Libra in the 7th = Shasha; Venus exalted in Pisces but in the 12th, not a kendra
    assert [y["key"] for y in yogas.panch_mahapurusha(make_chart(0.0))] == ["shasha"]


def test_raj_and_dhana_yoga():
    raj = yogas.raj_yoga(make_chart(0.0))  # Sun (5th lord) and Saturn (10th lord) in mutual 7th aspect
    assert raj and {"sun", "saturn"} <= set(raj["planets"])
    # Taurus lagna: Saturn is yogakaraka (9th + 10th); placed in the 10th (Aquarius)
    raj = yogas.raj_yoga(make_chart(35.0, saturn_sign=11))
    assert raj and "yogakaraka" in raj["description_en"]
    # Aries: 2nd lord Venus with 9th lord Jupiter
    dhana = yogas.dhana_yoga(make_chart(0.0, venus_sign=9))
    assert dhana and {"venus", "jupiter"} <= set(dhana["planets"])


def test_vipreet_neecha_adhi_kemadruma():
    v = yogas.vipreet_raj(make_chart(0.0, mercury_sign=8))  # 6th lord in 8th
    assert v and "Harsha" in v["description_en"]
    assert yogas.vipreet_raj(make_chart(0.0)) is None
    nb = yogas.neecha_bhanga(make_chart(0.0, sun_sign=7))  # Sun debilitated; Venus in 10th from Moon
    assert nb and "sun" in nb["planets"] and "venus" in nb["planets"]
    assert yogas.adhi_yoga(make_chart(0.0)) is None
    assert yogas.adhi_yoga(make_chart(0.0, venus_sign=10)) is not None
    assert yogas.kemadruma(make_chart(0.0)) is None  # Mercury in Taurus, 12th from Moon
    assert yogas.kemadruma(make_chart(0.0, mercury_sign=1)) is not None


def test_manglik_from_moon_only_is_not_manglik():
    d = doshas.manglik(make_chart(0.0, mars_sign=10))  # 10th from Lagna, 8th from Moon only
    assert d["present"] is False
    assert "Not Manglik" in d["details_en"]
