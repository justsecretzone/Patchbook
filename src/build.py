#!/usr/bin/env python3
"""Inline the shared core into each review template: src/<name>.html -> skills/<name>-review/assets/review-template.html"""
import pathlib, re
SRC = pathlib.Path(__file__).parent
ROOT = SRC.parent
TARGETS = {"website": "website-review", "app": "app-review", "image": "image-review",
           "pdf": "pdf-review", "audio": "audio-review", "video": "video-review"}
def inline(text):
    return re.sub(r"/\*@([\w.]+)\*/", lambda m: (SRC / m.group(1)).read_text().rstrip(), text)
for name, skill in TARGETS.items():
    out = ROOT / "skills" / skill / "assets" / "review-template.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(inline((SRC / f"{name}.html").read_text()))
    print(f"{out.relative_to(ROOT)}  {out.stat().st_size // 1024} KB")
