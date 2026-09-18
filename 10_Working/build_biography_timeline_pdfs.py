"""Build compact bilingual biography timeline PDFs from the published HTML pages."""
from collections import Counter
from html import unescape
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Flowable, LongTable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "20_Output"
PUBLIC = ROOT / "assets" / "documents"
PUBLIC.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("Body", "C:/Windows/Fonts/arial.ttf"))
pdfmetrics.registerFont(TTFont("Bold", "C:/Windows/Fonts/arialbd.ttf"))
INK = colors.HexColor("#193f52")
RED = colors.HexColor("#9b1f1f")
GOLD = colors.HexColor("#c89e32")
LINE = colors.HexColor("#d9d2c5")


class YearChart(Flowable):
    def __init__(self, years, counts, width, height=92 * mm):
        super().__init__(); self.years = years; self.counts = counts; self.width = width; self.height = height

    def draw(self):
        panels = [self.years[:29], self.years[29:]]
        panel_h = self.height / 2
        maximum = max(self.counts.values())
        for panel_index, panel in enumerate(panels):
            if not panel:
                continue
            base = self.height - (panel_index + 1) * panel_h + 14
            plot_h = panel_h - 30
            step = self.width / len(panel)
            bar_w = min(8, step * .5)
            self.canv.setStrokeColor(LINE); self.canv.line(0, base, self.width, base)
            for index, year in enumerate(panel):
                count = self.counts.get(year, 0)
                x = index * step + step / 2
                if count:
                    h = max(4, plot_h * count / maximum)
                    self.canv.setFillColor(RED); self.canv.roundRect(x - bar_w / 2, base, bar_w, h, 1.5, stroke=0, fill=1)
                    self.canv.setFont("Bold", 6.5); self.canv.setFillColor(INK); self.canv.drawCentredString(x, base + h + 3, str(count))
                self.canv.setFont("Body", 5.6); self.canv.setFillColor(INK); self.canv.drawCentredString(x, base - 9, str(year)[2:])


def plain(value: str) -> str:
    value = re.sub(r"<br\s*/?>", " ", value)
    value = re.sub(r"<[^>]+>", "", value)
    return unescape(value).replace("—", "-").replace("–", "-").strip()


def timeline(html_path: Path, section_id: str):
    text = html_path.read_text(encoding="utf-8")
    section = re.search(rf'<section class="section reveal" id="{section_id}">([\s\S]*?)</section>', text).group(1)
    rows = []
    for item in re.findall(r"<li>([\s\S]*?)</li>", section):
        date = plain(re.search(r"<span>(.*?)</span>", item).group(1))
        desc = plain(re.sub(r"<span>.*?</span>", "", item, count=1))
        year_match = re.search(r"(?:19|20)\d{2}", date)
        if not year_match:
            raise RuntimeError(f"No year in {date}")
        rows.append((int(year_match.group()), date, desc))
    return rows


def build(lang: str, html_path: Path, section_id: str, target: Path):
    rows = timeline(html_path, section_id)
    counts = Counter(y for y, _, _ in rows)
    strings = {
        "it": {
            "title": "Gigi Montico | Cronologia delle attività",
            "sub": "Sintesi annuale e registro degli eventi pubblicati nella biografia",
            "chart": "Eventi per anno",
            "note": "Ogni barra rappresenta il numero di voci biografiche collocate nell'anno. Le date stimate sono indicate nella descrizione.",
            "year": "Anno", "date": "Data o periodo", "desc": "Evento o attività",
            "footer": "Archivio Gigi Montico | Cronologia biografica",
        },
        "en": {
            "title": "Gigi Montico | Activities timeline",
            "sub": "Annual overview and register of the events published in the biography",
            "chart": "Events by year",
            "note": "Each bar represents the number of biographical entries placed in that year. Estimated dates are identified in the description.",
            "year": "Year", "date": "Date or period", "desc": "Event or activity",
            "footer": "Gigi Montico Archive | Biographical timeline",
        },
    }[lang]
    page = landscape(A4)
    width = page[0] - 28 * mm
    styles = {
        "title": ParagraphStyle("title", fontName="Bold", fontSize=21, leading=25, textColor=INK),
        "sub": ParagraphStyle("sub", fontName="Body", fontSize=10, leading=14, textColor=colors.HexColor("#665f55")),
        "head": ParagraphStyle("head", fontName="Bold", fontSize=9, leading=11, textColor=colors.white),
        "cell": ParagraphStyle("cell", fontName="Body", fontSize=8.2, leading=10.5, textColor=INK),
        "small": ParagraphStyle("small", fontName="Body", fontSize=8.5, leading=12, textColor=colors.HexColor("#665f55")),
    }
    story = [Paragraph(strings["title"], styles["title"]), Paragraph(strings["sub"], styles["sub"]), Spacer(1, 5 * mm), Paragraph(strings["chart"], styles["title"]), Spacer(1, 3 * mm)]
    years = list(range(min(counts), max(counts) + 1))
    max_count = max(counts.values())
    chart = YearChart(years, counts, width)
    story += [chart, Spacer(1, 2 * mm), Paragraph(strings["note"], styles["small"]), PageBreak()]
    data = [[Paragraph(strings["year"], styles["head"]), Paragraph(strings["date"], styles["head"]), Paragraph(strings["desc"], styles["head"])]]
    for year, date, desc in rows:
        data.append([Paragraph(str(year), styles["cell"]), Paragraph(date, styles["cell"]), Paragraph(desc, styles["cell"])])
    table = LongTable(data, colWidths=[20 * mm, 54 * mm, width - 74 * mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f1e8")]),
        ("GRID", (0, 0), (-1, -1), .3, LINE), ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(table)

    def footer(canvas, doc):
        canvas.saveState(); canvas.setStrokeColor(LINE); canvas.line(14 * mm, 12 * mm, page[0] - 14 * mm, 12 * mm)
        canvas.setFont("Body", 8); canvas.setFillColor(INK); canvas.drawString(14 * mm, 8 * mm, strings["footer"]); canvas.drawRightString(page[0] - 14 * mm, 8 * mm, str(doc.page)); canvas.restoreState()

    doc = SimpleDocTemplate(str(target), pagesize=page, leftMargin=14 * mm, rightMargin=14 * mm, topMargin=13 * mm, bottomMargin=17 * mm, title=strings["title"], author="Archivio Gigi Montico")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return len(rows)


outputs = [
    ("it", ROOT / "it" / "biografia.html", "cronologia", OUT / "Montico_cronologia_biografica_v1_IT.pdf", PUBLIC / "cronologia-eventi-gigi-montico-it.pdf"),
    ("en", ROOT / "en" / "biography.html", "timeline", OUT / "Montico_biographical_timeline_v1_EN.pdf", PUBLIC / "gigi-montico-events-timeline-en.pdf"),
]
for lang, html_path, section_id, review, public in outputs:
    count = build(lang, html_path, section_id, review)
    public.write_bytes(review.read_bytes())
    print(lang, count, review, public)
