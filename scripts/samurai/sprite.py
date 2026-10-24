"""Write an SVG sprite (one <symbol> per traced frame) from a trace.py JSON file.

Usage: python sprite.py <trace.json> <id-prefix> <out.svg>
"""
import json
import sys

src, prefix, out = sys.argv[1], sys.argv[2], sys.argv[3]
data = json.load(open(src))
w, h = data["w"], data["h"]
parts = ['<svg xmlns="http://www.w3.org/2000/svg">']
for i, d in enumerate(data["paths"]):
    parts.append(f'<symbol id="{prefix}{i}" viewBox="0 0 {w} {h}"><path fill="currentColor" d="{d}"/></symbol>')
parts.append("</svg>\n")
open(out, "w", encoding="utf8").write("".join(parts))
print(out, len(data["paths"]), "frames", w, "x", h)
