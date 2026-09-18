"""Validate the bilingual biography release and its local references."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "assets/data/archive.json").read_text(encoding="utf-8-sig"))
items = data if isinstance(data, list) else data["items"]
ids = [item.get("id") for item in items if isinstance(item, dict)]
assert len(ids) == len(set(ids))
for item in items:
    for key in ("thumb", "full"):
        if item.get(key):
            assert (ROOT / item[key].lstrip("/")).exists(), (item.get("id"), key, item[key])

pages = [ROOT / "it/biografia.html", ROOT / "en/biography.html"]
pattern = re.compile(r'(?:href|src)="([^"]+)"')
missing = []
for page in pages:
    for url in pattern.findall(page.read_text(encoding="utf-8")):
        if url.startswith(("http:", "https:", "mailto:", "#", "/")):
            continue
        candidate = (page.parent / url.split("#")[0].split("?")[0]).resolve()
        if not candidate.exists():
            missing.append((str(page), url))
assert not missing, missing
for path in pages + [ROOT / "assets/css/biography-preview.css"]:
    assert "\u2014" not in path.read_text(encoding="utf-8"), path
for pdf in [ROOT / "assets/documents/cronologia-eventi-gigi-montico-it.pdf", ROOT / "assets/documents/gigi-montico-events-timeline-en.pdf"]:
    assert pdf.exists() and pdf.stat().st_size > 20_000
print({"archive_items": len(items), "unique_ids": len(ids), "page_links_ok": True, "pdfs_ok": True, "em_dash_scan": "clear"})
