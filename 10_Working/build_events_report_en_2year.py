"""Build the bilingual two-year event chart and interactive review PDF.

The chart groups 1961-2026 into 33 two-year bins while the table keeps the
original event year. Invisible PDF widgets provide native hover tooltips and
links from each coloured chart segment to its table row.
"""
from collections import Counter
from html import escape
from io import BytesIO
from pathlib import Path
import re
import sys

from PIL import Image as PILImage, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject, DictionaryObject, DecodedStreamObject, FloatObject,
    NameObject, NumberObject, TextStringObject,
)
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image, LongTable, Paragraph, SimpleDocTemplate, Spacer, TableStyle

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "20_Output" / "Montico_eventi_per_anno_1961-2026_v9.md"
LANGUAGE = "it" if len(sys.argv) > 1 and sys.argv[1].lower() in {"it", "italian", "italiano"} else "en"
WORKING_CHART = ROOT / "10_Working" / f"Montico_events_chart_1961-2026_v1_{'IT' if LANGUAGE == 'it' else 'EN'}_2year.png"
TARGET = ROOT / "20_Output" / f"Montico_events_chart_register_1961-2026_v1_{'IT' if LANGUAGE == 'it' else 'EN'}_2year_review.pdf"

CATEGORIES = [
    ("mostra", "Exhibitions and exhibition participation", "#193f52"),
    ("performance", "Exhibition and performance", "#db6b28"),
    ("progetto", "Art and education project launches", "#8053a0"),
    ("premio", "Awards and award ceremonies", "#c89e32"),
    ("opera", "Artwork presentations and donations", "#ba4979"),
    ("corso", "Courses and educational activities", "#269476"),
    ("proposta", "Project proposals (not implemented)", "#477aca"),
    ("prosegue", "Continuations of existing exhibitions", "#8a969b"),
    ("libro", "Books: first known publication", "#793d20"),
    ("incontro", "Cultural meetings and openings", "#ad5b41"),
    ("media", "Documentaries and audiovisual activities", "#4169a1"),
    ("pubblicazione", "Critical publications", "#58683b"),
]
CATEGORY_LABELS = dict((key, label) for key, label, _ in CATEGORIES)
CATEGORY_LABELS_IT = {
    "mostra": "Mostre e partecipazioni espositive",
    "performance": "Mostra e performance",
    "progetto": "Avvio di progetti artistico-didattici",
    "premio": "Premi e premiazioni",
    "opera": "Presentazioni e donazioni di opere",
    "corso": "Corsi e attività formative",
    "proposta": "Proposte progettuali (non realizzazioni)",
    "prosegue": "Prosecuzioni di mostre già avviate",
    "libro": "Libri: prima pubblicazione nota",
    "incontro": "Incontri culturali e inaugurazioni",
    "media": "Documentari e attività audiovisive",
    "pubblicazione": "Pubblicazioni critiche",
}
CATEGORY_LABELS = CATEGORY_LABELS_IT if LANGUAGE == "it" else CATEGORY_LABELS
CATEGORY_COLOURS = dict((key, colour) for key, _, colour in CATEGORIES)
ITALIAN_CATEGORY_KEYS = {
    "Mostre e partecipazioni espositive": "mostra",
    "Mostra e performance": "performance",
    "Avvio di progetti artistico-didattici": "progetto",
    "Premi e premiazioni": "premio",
    "Presentazioni e donazioni di opere": "opera",
    "Corsi e attività formative": "corso",
    "Proposte progettuali (non realizzazioni)": "proposta",
    "Prosecuzioni di mostre già avviate": "prosegue",
    "Libri: prima pubblicazione nota": "libro",
    "Incontri culturali e inaugurazioni": "incontro",
    "Documentari e attività audiovisive": "media",
    "Pubblicazioni critiche": "pubblicazione",
}


def parse_rows():
    text = SOURCE.read_text(encoding="utf-8")
    block = text.split("## Registro analitico", 1)[1].split("## Serie annuale", 1)[0]
    rows = []
    for line in block.splitlines():
        if not re.match(r"^\| \d{4} \|", line):
            continue
        year, category, description = [part.strip() for part in line.strip("|").split("|", 2)]
        translated = description if LANGUAGE == "it" else english_description(description)
        rows.append((year, ITALIAN_CATEGORY_KEYS[category], translated.replace("–", "-").replace("—", "-").replace("\u2011", "-")))
    assert len(rows) == len(set(rows)) == 95
    assert [int(row[0]) for row in rows] == sorted(int(row[0]) for row in rows)
    return rows


def english_description(value):
    """Translate recurring archive vocabulary while preserving proper names."""
    value = value.replace("–", "-").replace("—", "-").replace("’", "'")
    exact = {
        "Gruppo P4, Piacenza e itineranza (un ciclo)": "Gruppo P4, Piacenza and touring cycle (one cycle)",
        "Incontro culturale al Consolato generale del Portogallo, Milano, 10 febbraio [anno stimato]": "Cultural meeting at the Consulate General of Portugal, Milan, 10 February [estimated year]",
        "Ripresa del testo critico di Gioacchino Li Causi su Il Cittadino, 5 settembre; prima edizione non datata": "Reprint of Gioacchino Li Causi's critical text in Il Cittadino, 5 September; first edition undated",
        "Mostra al Telegrafo, Melegnano, fino al 15 gennaio": "Exhibition at Il Telegrafo, Melegnano, until 15 January",
        "Ciao Milan: medaglia d'argento alla segnalazione speciale": "Ciao Milan: silver medal for the special mention",
        "Mostra di 25 dipinti, Fondazione Ospedale dei Poveri, Pandino": "Exhibition of 25 paintings, Fondazione Ospedale dei Poveri, Pandino",
        "Mostra ispirata ai versi di Guido Oldani, Il Telegrafo, Melegnano": "Exhibition inspired by the verses of Guido Oldani, Il Telegrafo, Melegnano",
        "Dall'emozione alla rappresentazione, Bottega dell'Artista, 26 aprile": "From emotion to representation, Bottega dell'Artista, 26 April",
        "Collettiva all'IIS Cesaris, Casalpusterlengo, fino al 4 gennaio": "Group exhibition at IIS Cesaris, Casalpusterlengo, until 4 January",
        "Collezione privata: primo anno indicato nella biblioteca del sito": "Private collection: first year listed in the website library",
        "11 / 1000: italiano e inglese contati una sola volta": "11 / 1000: Italian and English editions counted once",
        "Digital art with AI support: prima pubblicazione confermata dal proprietario": "Digital art with AI support: first publication confirmed by the owner",
        "L'arte della sostenibilità: versioni riunite in un solo titolo": "L'arte della sostenibilità: editions consolidated under one title",
    }
    if value in exact:
        return exact[value]
    replacements = [
        ("Galleria", "Gallery"),
        ("[data stimata:", "[estimated date:"),
        ("[anno rappresentativo stimato; fonti discordanti: già citati nel marzo 1976]", "[representative year estimated; sources conflict: already mentioned in March 1976]"),
        ("[anno rappresentativo stimato]", "[representative year estimated]"),
        ("[anno stimato; collocazione indicativa nel ciclo dal 2001]", "[estimated year; indicative placement within the cycle begun in 2001]"),
        ("[anno stimato]", "[estimated year]"),
        ("[circa 1995]", "[circa 1995]"),
        ("[possibile 1971]", "[possibly 1971]"),
        ("prima edizione non datata", "first edition undated"),
        ("sede non identificata", "venue not identified"),
        ("apertura non precisata", "opening date not specified"),
        ("durata non precisata", "duration not specified"),
        ("due sedi, un evento", "two venues, one event"),
        ("un ciclo", "one cycle"),
        ("stagione", "season"),
        ("Collettiva", "Group exhibition"),
        ("collettiva", "group exhibition"),
        ("Mostre", "Exhibitions"),
        ("Mostra", "Exhibition"),
        ("mostra", "exhibition"),
        ("Antologica", "Retrospective"),
        ("antologica", "retrospective"),
        ("Presentazione della tela al complesso", "Presentation of the canvas at the"),
        ("Presentazione delle colonne e della parete dipinte al ristorante", "Presentation of the painted columns and wall at the restaurant"),
        ("Presentazione", "Presentation"),
        ("presentazione", "presentation"),
        ("Donazione di", "Donation of"),
        ("donazione", "donation"),
        ("Inaugurazione della sede rinnovata della", "Opening of the renovated premises of"),
        ("Inaugurazione", "Opening of"),
        ("inaugurazione", "opening"),
        ("Partecipazione a", "Participation in"),
        ("Partecipazione in", "Participation in"),
        ("partecipazione", "participation"),
        ("Avvio di", "Launch of"),
        ("avvio di", "launch of"),
        ("Premiazione dei lavori artistici scolastici", "Award ceremony for school artworks"),
        ("Premiazione", "Award ceremony"),
        ("Proposta per il", "Proposal for the"),
        ("Tappa di", "Stop of"),
        ("Attività guidata da", "activity guided by"),
        ("attività guidata da", "activity guided by"),
        ("corsi, incontri e visite culturali", "courses, meetings and cultural visits"),
        ("Ripresa del testo critico di", "Reprint of the critical text by"),
        ("Documentari della televisione svizzera dedicati a Montico", "Documentaries about Montico broadcast by Swiss television"),
        ("medaglia d'argento alla segnalazione speciale", "silver medal for the special mention"),
        ("al museo di", "to the museum of"),
        ("al complesso", "at the complex"),
        ("al ristorante", "at the restaurant"),
        (" al ", " at the "),
        ("alla", "at the"),
        ("presso il", "at the"),
        ("presso la", "at the"),
        ("in Via", "at Via"),
        ("Via ", "Via "),
        ("Milano", "Milan"),
        ("Lione", "Lyon"),
        ("Francia", "France"),
        ("Germania", "Germany"),
        ("Svizzera", "Switzerland"),
        ("Portogallo", "Portugal"),
        ("Câmara Municipal", "Municipal Chamber"),
        ("Museo Civico", "Civic Museum"),
        ("Museo Parrocchiale", "Parish Museum"),
        ("scuole elementari", "primary schools"),
        ("bambini", "children"),
        ("Il Cittadino", "Il Cittadino"),
        ("maggio", "May"),
        ("giugno", "June"),
        ("luglio", "July"),
        ("agosto", "August"),
        ("settembre", "September"),
        ("ottobre", "October"),
        ("novembre", "November"),
        ("dicembre", "December"),
        ("gennaio", "January"),
        ("fino al", "until"),
        ("con opere di", "with works by"),
        ("organizzata da", "organised by"),
        ("curata da", "curated by"),
        ("seconda mostra", "second exhibition"),
        ("terza mostra", "third exhibition"),
        ("sede", "venue"),
        ("iniziata nel", "begun in"),
        ("dedicati", "dedicated"),
        ("dedicata", "dedicated"),
        ("realizzati", "made"),
        ("lavori artistici", "artworks"),
        ("confermata", "confirmed by"),
        ("non è riportato", "not recorded"),
        ("non realizzazioni", "not implemented"),
    ]
    for old, new in replacements:
        value = value.replace(old, new)
    return value


def make_chart(rows):
    width, height = 3000, 1280
    image = PILImage.new("RGB", (width, height), "#f8f6ef")
    draw = ImageDraw.Draw(image)
    font_dir = Path("C:/Windows/Fonts")

    def font(size, bold=False):
        return ImageFont.truetype(str(font_dir / ("arialbd.ttf" if bold else "arial.ttf")), size)

    navy = "#193f52"
    muted = "#637078"
    if LANGUAGE == "it":
        chart_title = "GIGI MONTICO | EVENTI PER BIENNIO"
        chart_subtitle = "1961-2026 · 95 occorrenze annuali · * anno stimato · i segmenti colorati identificano le tipologie"
        chart_note = "Ogni barra raggruppa due anni consecutivi. Passa su un segmento colorato per il nome dell'evento e fai clic per aprire la riga nella tabella."
        chart_zero = "Zero indica che nel biennio non sono conteggiati eventi datati, non che non vi sia stata attività."
    else:
        chart_title = "GIGI MONTICO | EVENTS BY TWO-YEAR PERIOD"
        chart_subtitle = "1961-2026 · 95 annual occurrences · * estimated year · coloured segments identify event types"
        chart_note = "Each bar groups two calendar years. Hover over a coloured segment for the event name and click to open its table row."
        chart_zero = "Zero means that no dated item is counted in the bin, not that no activity occurred."
    draw.text((100, 45), chart_title, font=font(54, True), fill=navy)
    draw.text((100, 118), chart_subtitle, font=font(28), fill=muted)

    for index, (key, _, colour) in enumerate(CATEGORIES):
        x = 100 + (index % 3) * 965
        y = 185 + (index // 3) * 43
        draw.rounded_rectangle((x, y, x + 28, y + 28), radius=5, fill=colour)
        count = sum(1 for _, category, _ in rows if category == key)
        label = CATEGORY_LABELS[key]
        draw.text((x + 42, y - 1), f"{label} ({count})", font=font(24), fill=navy)

    left, right = 155, width - 100
    baseline = 995
    top = 440
    unit = 43
    max_total = max(Counter((int(year) // 2 * 2, ) for year, _, _ in rows).values())
    max_total = max(10, max_total)
    step = (right - left) / 33
    grouped = {}
    for year, category, description in rows:
        year_int = int(year)
        start = year_int if year_int % 2 == 1 else year_int - 1
        grouped.setdefault(start, []).append((year_int, category, description))

    for level in range(max_total + 1):
        y = baseline - level * unit
        draw.line((left - 12, y, right, y), fill="#dce0dc", width=2)
        draw.text((85, y - 15), str(level), font=font(22), fill=muted)

    for index, start in enumerate(range(1961, 2027, 2)):
        center = left + (index + 0.5) * step
        items = grouped.get(start, [])
        total = len(items)
        by_category = {key: [] for key, _, _ in CATEGORIES}
        for item in items:
            by_category[item[1]].append(item)
        accumulated = 0
        for key, _, colour in CATEGORIES:
            amount = len(by_category[key])
            if amount:
                draw.rectangle((center - 28, baseline - (accumulated + amount) * unit, center + 28, baseline - accumulated * unit), fill=colour, outline="#f8f6ef", width=2)
                accumulated += amount
        label = f"{start}-{str(start + 1)[-2:]}"
        if total:
            estimated = any("estimated" in description for _, _, description in items)
            draw.text((center, baseline + 24), label, font=font(22), fill=navy, anchor="ma")
            draw.text((center, baseline - total * unit - 33), f"{total}{'*' if estimated else ''}", font=font(24, True), fill=navy, anchor="ma")
        else:
            draw.text((center, baseline + 24), label, font=font(22), fill=muted, anchor="ma")
            draw.ellipse((center - 3, baseline - 3, center + 3, baseline + 3), fill="#acb5b8")

    draw.text((100, 1160), chart_note, font=font(27, True), fill=navy)
    draw.text((100, 1210), chart_zero, font=font(24), fill=muted)
    image.save(WORKING_CHART)
    return grouped, baseline, unit, left, step, width, height


def normalise(value):
    return value.replace("–", "-").replace("—", "-").replace("\u2011", "-")


rows = parse_rows()
grouped, baseline, unit, chart_left, chart_step, chart_width_px, chart_height_px = make_chart(rows)
annual_bins = {start: len(grouped.get(start, [])) for start in range(1961, 2027, 2)}
assert sum(annual_bins.values()) == len(rows) == 95

for name, filename in [("Body", "arial.ttf"), ("Bold", "arialbd.ttf")]:
    pdfmetrics.registerFont(TTFont(name, str(Path("C:/Windows/Fonts") / filename)))

navy = colors.HexColor("#193f52")
def style(name, size, **kwargs):
    return ParagraphStyle(name, fontName="Body", fontSize=size, leading=size * 1.32, textColor=navy, **kwargs)

title = ParagraphStyle("title", fontName="Bold", fontSize=19, leading=23, textColor=navy)
body = style("body", 9.3, spaceAfter=5)
cell = style("cell", 8.8)
header = ParagraphStyle("header", fontName="Bold", fontSize=9.2, leading=11, textColor=colors.white)
heading = ParagraphStyle("heading", fontName="Bold", fontSize=12, leading=16, textColor=navy, spaceAfter=6)

def paragraph(value, paragraph_style=cell):
    return Paragraph(escape(normalise(value)), paragraph_style)

destinations = {}
chart_position = {}

class EventParagraph(Paragraph):
    def __init__(self, description, event_id):
        super().__init__(escape(normalise(description)), cell)
        self.event_id = event_id

    def draw(self):
        x, y = self.canv.absolutePosition(0, self.height)
        destinations[self.event_id] = (self.canv.getPageNumber() - 1, x, y + 6)
        super().draw()

class InteractiveChart(Image):
    def draw(self):
        chart_position["origin"] = self.canv.absolutePosition(0, 0)
        super().draw()

page_width = A4[0] - 28 * mm
chart_height = page_width * chart_height_px / chart_width_px
if LANGUAGE == "it":
    pdf_title = "Gigi Montico | Eventi 1961-2026"
    pdf_subtitle = "Grafico e registro completo - raggruppamento biennale, aggiornato al 18 settembre 2026"
    interactive_note = "Grafico interattivo: ogni segmento colorato rappresenta un elemento. Passa il mouse per il nome dell'evento e fai clic per raggiungere la riga nella tabella. Il supporto dei suggerimenti nativi è migliore in Adobe Acrobat Reader desktop e può variare negli altri lettori PDF."
    count_note = "95 occorrenze annuali: 91 eventi o avvii e 4 prosecuzioni. I quattro libri sono conteggiati una sola volta per titolo. Le descrizioni marcate come stimate identificano le 11 collocazioni provvisorie dell'anno."
    register_heading = "Registro degli elementi rappresentati"
    reading_heading = "Come leggere il grafico"
    reading_note = "L'asse orizzontale raggruppa gli anni consecutivi in periodi biennali per mantenere l'intera carriera su una linea compatta. La tabella conserva l'anno assegnato a ogni elemento. Un asterisco indica un biennio che contiene almeno un anno stimato."
    estimate_note = "Le collocazioni stimate non sono presentate come certezze. Il registro documenta la migliore ricostruzione corrente sulla base dei materiali disponibili e potrà essere rivisto se Montico fornirà una data o un documento più preciso."
    source_note = "Fonte: Montico_eventi_per_anno_1961-2026_v9.md e relativo registro degli eventi. È una ricostruzione ragionata, non un censimento completo della carriera dell'artista."
    footer_text = "Archivio Gigi Montico | 18 settembre 2026"
    table_headers = ("Anno", "Tipologia", "Evento o attività")
else:
    pdf_title = "Gigi Montico | Events 1961-2026"
    pdf_subtitle = "Chart and complete register - two-year grouping, updated 18 September 2026"
    interactive_note = "Interactive chart: each coloured segment represents one item. Hover for the event name and click to reach its table row. Native tooltip support is best in Adobe Acrobat Reader desktop and may vary in other PDF viewers."
    count_note = "95 annual occurrences: 91 events or launches and 4 continuations. The four books are counted once per title. Descriptions marked estimated identify the 11 provisional year placements."
    register_heading = "Register of represented items"
    reading_heading = "Reading the chart"
    reading_note = "The x-axis groups consecutive years into two-year periods to keep the complete career on one compact line. The table preserves the exact year assigned to each item. A star marks a two-year bin containing at least one estimated year."
    estimate_note = "Estimated placements are not presented as certainties. The register records the best current reconstruction from the available material and may be revised if Montico supplies a more precise date or document."
    source_note = "Source: Montico_eventi_per_anno_1961-2026_v9.md and its event register. This is a reasoned reconstruction, not a complete census of the artist's career."
    footer_text = "Gigi Montico Archive | 18 September 2026"
    table_headers = ("Year", "Type", "Event or activity")

story = [
    paragraph(pdf_title, title),
    Spacer(1, 3 * mm),
    paragraph(pdf_subtitle, body),
    InteractiveChart(str(WORKING_CHART), width=page_width, height=chart_height),
    Spacer(1, 3 * mm),
    paragraph(interactive_note, body),
    paragraph(count_note, body),
    paragraph(register_heading, heading),
]

table_data = [[paragraph(table_headers[0], header), paragraph(table_headers[1], header), paragraph(table_headers[2], header)]]
table_data.extend([[paragraph(year), paragraph(CATEGORY_LABELS[category]), EventParagraph(description, index)] for index, (year, category, description) in enumerate(rows)])
table = LongTable(table_data, colWidths=[17 * mm, 52 * mm, page_width - 69 * mm], repeatRows=1, hAlign="LEFT")
commands = [
    ("BACKGROUND", (0, 0), (-1, 0), navy),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 5.2),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5.2),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f5f4")]),
    ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#dce0dc")),
]
for row_index, (_, category, _) in enumerate(rows, 1):
    commands.append(("LINEBEFORE", (1, row_index), (1, row_index), 3, colors.HexColor(CATEGORY_COLOURS[category])))
table.setStyle(TableStyle(commands))
story.append(table)
story.extend([
    Spacer(1, 4 * mm),
    paragraph(reading_heading, heading),
    paragraph(reading_note, body),
    paragraph(estimate_note, body),
    paragraph(source_note, body),
])

def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor("#dce0dc"))
    canvas.line(14 * mm, 13 * mm, A4[0] - 14 * mm, 13 * mm)
    canvas.setFont("Body", 8)
    canvas.setFillColor(navy)
    canvas.drawString(14 * mm, 9 * mm, footer_text)
    canvas.drawRightString(A4[0] - 14 * mm, 9 * mm, str(doc.page))

buffer = BytesIO()
doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=14 * mm, leftMargin=14 * mm, topMargin=14 * mm, bottomMargin=18 * mm, title=pdf_title, author="Gigi Montico Archive")
doc.build(story, onFirstPage=footer, onLaterPages=footer)

writer = PdfWriter()
writer.clone_document_from_reader(PdfReader(buffer))
fields = ArrayObject()
appearance = DecodedStreamObject()
appearance.set_data(b"")
appearance.update({NameObject("/Type"): NameObject("/XObject"), NameObject("/Subtype"): NameObject("/Form"), NameObject("/BBox"): ArrayObject([NumberObject(0), NumberObject(0), NumberObject(1), NumberObject(1)]), NameObject("/Resources"): DictionaryObject()})
appearance_ref = writer._add_object(appearance)
origin_x, origin_y = chart_position["origin"]
scale = page_width / chart_width_px

for start in range(1961, 2027, 2):
    items = grouped.get(start, [])
    center = chart_left + ((start - 1961) // 2 + 0.5) * chart_step
    by_category = {key: [] for key, _, _ in CATEGORIES}
    for item in items:
        by_category[item[1]].append(item)
    accumulated = 0
    for category, _, _ in CATEGORIES:
        for item in by_category[category]:
            event_id = rows.index((str(item[0]), item[1], item[2]))
            lower = chart_height_px - baseline + accumulated * unit
            upper = chart_height_px - baseline + (accumulated + 1) * unit
            rect = [origin_x + (center - 28) * scale, origin_y + lower * scale, origin_x + (center + 28) * scale, origin_y + upper * scale]
            page_index, _, target_y = destinations[event_id]
            action = DictionaryObject({NameObject("/S"): NameObject("/GoTo"), NameObject("/D"): ArrayObject([writer.pages[page_index].indirect_reference, NameObject("/XYZ"), NumberObject(0), FloatObject(target_y), NumberObject(0)])})
            tooltip = f"{item[0]} | {CATEGORY_LABELS[item[1]]} | {item[2]}"
            annotation = DictionaryObject({NameObject("/Type"): NameObject("/Annot"), NameObject("/Subtype"): NameObject("/Widget"), NameObject("/FT"): NameObject("/Btn"), NameObject("/Ff"): NumberObject(65536), NameObject("/F"): NumberObject(4), NameObject("/T"): TextStringObject(f"event_{event_id:03d}"), NameObject("/TU"): TextStringObject(tooltip), NameObject("/Contents"): TextStringObject(item[2]), NameObject("/Rect"): ArrayObject([FloatObject(value) for value in rect]), NameObject("/A"): action, NameObject("/AP"): DictionaryObject({NameObject("/N"): appearance_ref}), NameObject("/Border"): ArrayObject([NumberObject(0)] * 3), NameObject("/H"): NameObject("/I")})
            writer.add_annotation(0, annotation)
            fields.append(writer.pages[0]["/Annots"][-1])
            accumulated += 1
    assert accumulated == len(items)

writer._root_object[NameObject("/AcroForm")] = writer._add_object(DictionaryObject({NameObject("/Fields"): fields}))
with TARGET.open("wb") as output:
    writer.write(output)

pdf = PdfReader(TARGET)
assert len(pdf.get_fields()) == len(destinations) == len(rows)
for annotation in pdf.pages[0]["/Annots"]:
    widget = annotation.get_object()
    assert widget["/TU"] and widget["/A"]["/S"] == "/GoTo" and widget["/AP"]["/N"] is not None
actual_text = " ".join(" ".join(page.extract_text().split()) for page in pdf.pages)
for _, _, description in rows:
    assert " ".join(normalise(description).split()) in actual_text
print({"rows": len(rows), "two_year_bins": len(annual_bins), "pages": len(pdf.pages), "widgets": len(pdf.get_fields()), "pdf": str(TARGET), "chart": str(WORKING_CHART)})
