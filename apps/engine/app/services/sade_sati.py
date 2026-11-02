"""Sade Sati and small Panoti (Dhaiya) periods from real Saturn transits (AMX-200).

Steps day by day through the Swiss Ephemeris (sidereal, Lahiri) and records every stretch
Saturn spends in a sign that matters for the natal Moon. Retrograde back-and-forth shows up
as separate rows, exactly like a published Sade Sati table.

  Sade Sati   : Saturn in the 12th (rising), 1st (peak) or 2nd (setting) from the Moon.
  Small Panoti: Saturn in the 4th or 8th from the Moon (Dhaiya / Kantak Shani).
"""
from datetime import date, timedelta

PHASE = {12: ("sade_sati", "rising"), 1: ("sade_sati", "peak"), 2: ("sade_sati", "setting"),
         4: ("small_panoti", "4th"), 8: ("small_panoti", "8th")}


def saturn_sign_on(day: date) -> int:
    """Sidereal sign (1..12) of Saturn at 00:00 UT on `day`."""
    import swisseph as swe

    from app.services.chart import FLAGS

    jd = swe.julday(day.year, day.month, day.day, 0.0, swe.GREG_CAL)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    pos, _ = swe.calc_ut(jd, swe.SATURN, FLAGS)
    return int((pos[0] % 360) // 30) + 1


def periods(moon_sign: int, start: date, years: int = 100) -> list[dict]:
    """Every Sade Sati / small Panoti stretch from `start` for `years` years, in order."""
    end = start.replace(year=start.year + years) if not (start.month == 2 and start.day == 29) else start + timedelta(days=365 * years)
    out: list[dict] = []
    cur_sign = saturn_sign_on(start)
    seg_start = start
    day = start
    coarse = timedelta(days=5)  # Saturn never changes sign twice within 5 days
    one = timedelta(days=1)

    def close(until: date) -> None:
        house = (cur_sign - moon_sign) % 12 + 1
        if house in PHASE:
            kind, phase = PHASE[house]
            out.append({"kind": kind, "phase": phase, "saturn_sign": cur_sign,
                        "start": seg_start.isoformat(), "end": until.isoformat()})

    while day < end:
        nxt = min(day + coarse, end)
        sign = saturn_sign_on(nxt)
        if sign != cur_sign:
            d = day + one  # find the exact day of the change
            while saturn_sign_on(d) == cur_sign:
                d += one
            close(d - one)
            cur_sign, seg_start = saturn_sign_on(d), d
            day = d
            continue
        day = nxt
    close(end)
    return out
