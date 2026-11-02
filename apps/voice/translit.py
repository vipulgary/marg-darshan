"""Phonetic Latin -> Devanagari for names inside Hindi text, so the Hindi voice can say them.

The Hindi Piper voice only reads Devanagari; "Tanuj Kothari" would be skipped. This is a small,
rule-based Indian-name transliterator (greedy longest match), good enough for speech:
  Tanuj -> तनुज, Asmita -> अस्मिता, Jain -> जैन, Kothari -> कोथरी.
"""
import re

VOWELS = [("aa", "आ", "ा"), ("ai", "ऐ", "ै"), ("au", "औ", "ौ"), ("ee", "ई", "ी"), ("ii", "ई", "ी"), ("oo", "ऊ", "ू"),
          ("uu", "ऊ", "ू"), ("ei", "ए", "े"), ("a", "अ", ""), ("i", "इ", "ि"), ("u", "उ", "ु"), ("e", "ए", "े"), ("o", "ओ", "ो")]
CONS = [("chh", "छ"), ("kh", "ख"), ("gh", "घ"), ("ch", "च"), ("jh", "झ"), ("th", "थ"), ("dh", "ध"), ("ph", "फ"), ("bh", "भ"),
        ("sh", "श"), ("k", "क"), ("g", "ग"), ("j", "ज"), ("t", "त"), ("d", "द"), ("p", "प"), ("f", "फ़"), ("b", "ब"),
        ("m", "म"), ("n", "न"), ("y", "य"), ("r", "र"), ("l", "ल"), ("v", "व"), ("w", "व"), ("s", "स"), ("h", "ह"),
        ("z", "ज़"), ("q", "क"), ("c", "क"), ("x", "क्स")]
HALANT = "्"


def word(w: str) -> str:
    s = w.lower()
    out = []
    i = 0
    after_cons = False
    while i < len(s):
        for lat, ind, matra in VOWELS:
            if s.startswith(lat, i):
                end = i + len(lat) == len(s)
                if after_cons:
                    # Names ending in a / i usually end long: Asmita -> अस्मिता, Kothari -> कोथरी.
                    out.append("ा" if lat == "a" and end else "ी" if lat == "i" and end else matra)
                else:
                    out.append(ind)
                i += len(lat)
                after_cons = False
                break
        else:
            for lat, ind in CONS:
                if s.startswith(lat, i):
                    if after_cons:
                        out.append(HALANT)
                    out.append(ind)
                    i += len(lat)
                    after_cons = True
                    break
            else:
                out.append(s[i])
                i += 1
                after_cons = False
    return "".join(out)


def latin_to_devanagari(text: str) -> str:
    return re.sub(r"[A-Za-z]+", lambda m: word(m.group(0)), text)


if __name__ == "__main__":
    for n in ["Tanuj Kothari", "Asmita Jain", "Sample Kumar", "Priya Sharma", "Rohit"]:
        print(n, "->", latin_to_devanagari(n))
