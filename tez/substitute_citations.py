"""
[@xxx] yer tutucularini IEEE numerik atiflara cevirir.
Kaynak listesi 08_kaynaklar.md ile eslestirilir.

Calistirma: python substitute_citations.py
"""

from __future__ import annotations

import re
from pathlib import Path

HERE = Path(__file__).parent.resolve()

# Kaynak listesi: 08_kaynaklar.md sirasi ile
CITATION_MAP: dict[str, int] = {
    "wang2003": 1,
    "cano2005review": 2,
    "lalinsky2010": 3,
    "echoprint2011": 4,
    "haitsma2002robust": 5,
    "burges2003dda": 6,
    "arcas2018nowplaying": 7,
    "kim2020neuralfp": 8,
    "page2021prisma": 9,
    "wilkinson2016fair": 10,
    "newman2015microservices": 11,
    "tanenbaum2017dist": 12,
    "merkel2014docker": 13,
    "holt2017caddy": 14,
    "bellard2003ffmpeg": 15,
    "w3c2023mediarecorder": 16,
    "brookes2018browseraudio": 17,
    "spotify2010arch": 18,
}


def substitute(text: str) -> tuple[str, list[str]]:
    """[@xxx] -> [N], bilinmeyen taglar icin uyari listesi dondur."""
    unknown: list[str] = []

    def repl(match: re.Match) -> str:
        tag = match.group(1)
        if tag in CITATION_MAP:
            return f"[{CITATION_MAP[tag]}]"
        unknown.append(tag)
        return f"[?{tag}?]"

    new_text = re.sub(r"\[@([a-zA-Z0-9_]+)\]", repl, text)
    # [KAYNAK] yer tutucularini bos birak (manuel doldurmak icin)
    return new_text, unknown


def main() -> None:
    md_files = sorted(HERE.glob("[0-9][0-9]_*.md"))
    print(f"Islenen dosyalar: {len(md_files)}")

    total_subs = 0
    all_unknown: dict[str, set[str]] = {}

    for md in md_files:
        text = md.read_text(encoding="utf-8")
        before_count = len(re.findall(r"\[@[a-zA-Z0-9_]+\]", text))
        new_text, unknown = substitute(text)
        if before_count > 0:
            md.write_text(new_text, encoding="utf-8")
            total_subs += before_count
            print(f"  + {md.name}: {before_count} atif yerlestirildi")
            if unknown:
                all_unknown[md.name] = set(unknown)

    print(f"\nToplam {total_subs} atif numaralandirildi.")
    if all_unknown:
        print("\nBilinmeyen tagler (kaynak listesinde yok):")
        for fname, tags in all_unknown.items():
            print(f"  {fname}: {', '.join(sorted(tags))}")


if __name__ == "__main__":
    main()
