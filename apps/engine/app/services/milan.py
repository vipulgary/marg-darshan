"""Ashtakoot Guna Milan (North Indian, 36 points) — pure functions on Moon nakshatra/sign/longitude.

Tables follow the commonly published Parashari matching tables. DRAFT: to be verified by the
client's Jyotish against a few known matches before launch.
"""
from __future__ import annotations

from app.services.astro_constants import SIGN_LORDS as SIGN_LORD

KOOTS = ("varna", "vashya", "tara", "yoni", "maitri", "gana", "bhakoot", "nadi")
MAX = {"varna": 1, "vashya": 2, "tara": 3, "yoni": 4, "maitri": 5, "gana": 6, "bhakoot": 7, "nadi": 8}

# --- Varna: sign (1..12) → rank (4 Brahmin, 3 Kshatriya, 2 Vaishya, 1 Shudra)
VARNA = {4: 4, 8: 4, 12: 4, 1: 3, 5: 3, 9: 3, 2: 2, 6: 2, 10: 2, 3: 1, 7: 1, 11: 1}

# --- Vashya groups: 0 chatushpada, 1 manava, 2 jalachara, 3 vanachara, 4 keeta
VASHYA_TABLE = [
    [2, 1, 1, 0.5, 1],
    [1, 2, 0.5, 0, 1],
    [1, 0.5, 2, 1, 1],
    [0.5, 0, 1, 2, 0],
    [1, 1, 1, 0, 2],
]


def vashya_group(sign: int, moon_lon: float) -> int:
    deg = moon_lon % 30
    if sign in (1, 2):
        return 0
    if sign in (3, 6, 7, 11):
        return 1
    if sign == 9:
        return 1 if deg < 15 else 0
    if sign == 10:
        return 0 if deg < 15 else 2
    if sign in (4, 12):
        return 2
    if sign == 5:
        return 3
    return 4  # Scorpio


# --- Yoni: nakshatra (1..27) → animal index
ANIMALS = ("horse", "elephant", "sheep", "serpent", "dog", "cat", "rat", "cow", "buffalo", "tiger", "deer", "monkey", "mongoose", "lion")
NAK_YONI = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1]
YONI_TABLE = [
    [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
    [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
    [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
    [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
    [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
    [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
    [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
    [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
    [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
    [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
    [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
    [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
    [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
    [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],
]

# --- Graha maitri: natural friendship (Parashari); nodes not used (sign lords only)
FRIENDS = {
    "sun": {"moon", "mars", "jupiter"}, "moon": {"sun", "mercury"}, "mars": {"sun", "moon", "jupiter"},
    "mercury": {"sun", "venus"}, "jupiter": {"sun", "moon", "mars"}, "venus": {"mercury", "saturn"},
    "saturn": {"mercury", "venus"},
}
ENEMIES = {
    "sun": {"venus", "saturn"}, "moon": set(), "mars": {"mercury"}, "mercury": {"moon"},
    "jupiter": {"mercury", "venus"}, "venus": {"sun", "moon"}, "saturn": {"sun", "moon", "mars"},
}


def relation(a: str, b: str) -> str:
    if a == b:
        return "same"
    if b in FRIENDS[a]:
        return "friend"
    if b in ENEMIES[a]:
        return "enemy"
    return "neutral"


def maitri_score(lord_boy: str, lord_girl: str) -> float:
    if lord_boy == lord_girl:
        return 5
    pair = sorted([relation(lord_boy, lord_girl), relation(lord_girl, lord_boy)])
    table = {
        ("friend", "friend"): 5, ("friend", "neutral"): 4, ("neutral", "neutral"): 3,
        ("enemy", "friend"): 1, ("enemy", "neutral"): 0.5, ("enemy", "enemy"): 0,
    }
    return table[tuple(pair)]


# --- Gana: 0 deva, 1 manushya, 2 rakshasa
GANA = {n: 0 for n in (1, 5, 7, 8, 13, 15, 17, 22, 27)}
GANA.update({n: 1 for n in (2, 4, 6, 11, 12, 20, 21, 25, 26)})
GANA.update({n: 2 for n in (3, 9, 10, 14, 16, 18, 19, 23, 24)})
GANA_TABLE = [[6, 5, 1], [6, 6, 0], [0, 0, 6]]  # rows girl gana, cols boy gana

# --- Nadi: 0 adi, 1 madhya, 2 antya
NADI = {n: 0 for n in (1, 6, 7, 12, 13, 18, 19, 24, 25)}
NADI.update({n: 1 for n in (2, 5, 8, 11, 14, 17, 20, 23, 26)})
NADI.update({n: 2 for n in (3, 4, 9, 10, 15, 16, 21, 22, 27)})


def tara_good(from_nak: int, to_nak: int) -> bool:
    count = (to_nak - from_nak) % 27 + 1
    return (count % 9) not in (3, 5, 7)


def sign_distance(a: int, b: int) -> int:
    """Houses from a to b, counting a as 1."""
    return (b - a) % 12 + 1


def guna_milan(boy: dict, girl: dict) -> dict:
    """boy/girl: {nakshatra: 1..27, pada: 1..4, sign: 1..12, moon_lon: 0..360}."""
    bn, gn, bs, gs = boy["nakshatra"], girl["nakshatra"], boy["sign"], girl["sign"]
    lb, lg = SIGN_LORD[bs], SIGN_LORD[gs]

    s = {}
    s["varna"] = 1 if VARNA[bs] >= VARNA[gs] else 0
    s["vashya"] = VASHYA_TABLE[vashya_group(bs, boy["moon_lon"])][vashya_group(gs, girl["moon_lon"])]
    good = [tara_good(gn, bn), tara_good(bn, gn)]
    s["tara"] = 3 if all(good) else 1.5 if any(good) else 0
    s["yoni"] = YONI_TABLE[NAK_YONI[bn - 1]][NAK_YONI[gn - 1]]
    s["maitri"] = maitri_score(lb, lg)
    s["gana"] = GANA_TABLE[GANA[gn]][GANA[bn]]
    dist = sign_distance(bs, gs)
    bhakoot_bad = dist in (2, 12, 5, 9, 6, 8)
    s["bhakoot"] = 0 if bhakoot_bad else 7
    nadi_bad = NADI[bn] == NADI[gn]
    s["nadi"] = 0 if nadi_bad else 8

    # Classical exceptions (parihara)
    nadi_cancel = nadi_bad and ((bs == gs and bn != gn) or (bn == gn and bs != gs) or (bn == gn and boy.get("pada") != girl.get("pada")))
    bhakoot_cancel = bhakoot_bad and (lb == lg or relation(lb, lg) == "friend" and relation(lg, lb) == "friend")

    total = sum(s.values())
    verdict = "excellent" if total >= 28 else "good" if total >= 24 else "average" if total >= 18 else "low"
    return {
        "koots": [{"key": k, "score": s[k], "max": MAX[k]} for k in KOOTS],
        "total": total,
        "max": 36,
        "verdict": verdict,
        "nadi_dosha": {"present": nadi_bad, "cancelled": bool(nadi_cancel)},
        "bhakoot_dosha": {"present": bhakoot_bad, "cancelled": bool(bhakoot_cancel), "distance": dist},
        "details": {
            "boy": {"varna": VARNA[bs], "vashya": vashya_group(bs, boy["moon_lon"]), "yoni": ANIMALS[NAK_YONI[bn - 1]], "gana": GANA[bn], "nadi": NADI[bn], "lord": lb},
            "girl": {"varna": VARNA[gs], "vashya": vashya_group(gs, girl["moon_lon"]), "yoni": ANIMALS[NAK_YONI[gn - 1]], "gana": GANA[gn], "nadi": NADI[gn], "lord": lg},
        },
    }


def manglik_match(boy_manglik: bool, girl_manglik: bool) -> str:
    if boy_manglik and girl_manglik:
        return "both"  # cancels each other traditionally
    if boy_manglik or girl_manglik:
        return "one"
    return "none"
