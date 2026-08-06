"""Extract structured Annex II scoring tables from the supplied BOE PDF.
Source: Orden DEF/15/2026, BOE 19 (21 January 2026), PDF pages 15–23.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF = Path(r"C:\Users\Drpic\Desktop\Pruebas fisicas nuevas.pdf")
OUTPUT = ROOT / "src" / "data" / "annex-ii.json"
AGES = ["17-25", "26-30", "31-35", "36-40", "41-45", "46-50", "51-55", "56-59", "60+"]


def lines_for(reader: PdfReader, pages: range) -> list[str]:
    text = "\n".join(reader.pages[p - 1].extract_text(extraction_mode="layout") or "" for p in pages)
    return [" ".join(line.split()) for line in text.splitlines()]


def parse_rows(lines: list[str], score_count: int, mark_re: str, mark_to_value):
    pattern = re.compile(rf"^(?P<mark>{mark_re})\s+(?P<scores>(?:\d+\s+){{{score_count - 1}}}\d+)\s+(?P=mark)$")
    rows = []
    seen = set()
    for line in lines:
        match = pattern.match(line)
        if not match:
            continue
        mark = match.group("mark")
        if mark in seen:
            continue
        seen.add(mark)
        scores = [int(item) for item in match.group("scores").split()]
        if len(scores) == score_count:
            rows.append({"mark": mark_to_value(mark), "scores": scores})
    return rows


def main() -> None:
    reader = PdfReader(PDF)
    flex = parse_rows(lines_for(reader, range(15, 18)), 18, r"\d+", int)
    plank = [row for row in parse_rows(lines_for(reader, range(17, 20)), 9, r"\d:\d{2}", lambda v: int(v.split(":")[0]) * 60 + int(v.split(":")[1])) if row["mark"] <= 315]
    run = [row for row in parse_rows(lines_for(reader, range(19, 22)), 18, r"\d{2}:\d{2}", lambda v: int(v[:2]) * 60 + int(v[3:])) if row["mark"] >= 386]
    agility = parse_rows(lines_for(reader, range(21, 24)), 10, r"\d{1,2}(?:,\d)?", lambda v: round(float(v.replace(",", ".")) * 10))

    # The PDF lists tables from strongest / fastest to weakest / slowest.
    data = {
        "source": {
            "order": "Orden DEF/15/2026, de 13 de enero",
            "boe": "BOE núm. 19, 21 de enero de 2026",
            "annex": "Anexo II",
            "pdf_pages": "15-23",
            "rule": "Artículo 12.1: apto con carácter general = 20 puntos en cada prueba aplicable.",
        },
        "ageBands": AGES,
        "tests": {
            "flex": {"label": "Flexo-extensiones de brazo", "unit": "repeticiones", "direction": "higher", "sexes": ["M", "F"], "rows": flex},
            "plank": {"label": "Plancha isométrica", "unit": "segundos", "direction": "higher", "sexes": ["all"], "rows": plank},
            "run": {"label": "Carrera continua de 2.000 metros", "unit": "segundos", "direction": "lower", "sexes": ["M", "F"], "rows": run},
            "agility": {"label": "Circuito de agilidad-velocidad", "unit": "décimas de segundo", "direction": "lower", "sexes": ["M", "F"], "ageBands": AGES[:5], "rounding": "floor-to-tenth", "rows": agility},
        },
    }
    if min(map(len, (flex, plank, run, agility))) == 0:
        raise RuntimeError({"flex": len(flex), "plank": len(plank), "run": len(run), "agility": len(agility)})
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"flex": len(flex), "plank": len(plank), "run": len(run), "agility": len(agility)}, indent=2))


if __name__ == "__main__":
    main()
