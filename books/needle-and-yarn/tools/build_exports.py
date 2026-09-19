from pathlib import Path
import re, html, zipfile
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch

root=Path("books/needle-and-yarn")
src=(root/"book.md").read_text(encoding="utf-8")
out=root/"exports"; out.mkdir(parents=True,exist_ok=True)

def inline(s):
    x=html.escape(s)
    x=re.sub(r"\\*\\*(.+?)\\*\\*",r"<b>\\1</b>",x)
    x=re.sub(r"\\*(.+?)\\*",r"<i>\\1</i>",x)
    return x

pdf=out/"Needle_and_Yarn_A_Love_Stitched_in_Time.pdf"
S=getSampleStyleSheet()
T=ParagraphStyle("T",parent=S["Title"],fontSize=24,leading=29,alignment=TA_CENTER,spaceAfter=18)
H=ParagraphStyle("H",parent=S["Heading1"],fontSize=16,leading=20,spaceBefore=12,spaceAfter=8)
B=ParagraphStyle("B",parent=S["BodyText"],fontSize=10.5,leading=15,spaceAfter=7)
flow=[]; first=True
for line in src.splitlines():
    s=line.strip()
    if not s: continue
    if s.startswith("# "):
        if not first: flow.append(PageBreak())
        flow.append(Paragraph(inline(s[2:]),T)); first=False
    elif s.startswith("## "): flow.append(Paragraph(inline(s[3:]),H))
    elif s=="---": flow.append(Spacer(1,10))
    else: flow.append(Paragraph(inline(s),B))
def pn(canvas,doc):
    canvas.saveState(); canvas.setFont("Helvetica",8); canvas.drawCentredString(LETTER[0]/2,.38*inch,str(doc.page)); canvas.restoreState()
SimpleDocTemplate(str(pdf),pagesize=LETTER,rightMargin=.72*inch,leftMargin=.72*inch,topMargin=.72*inch,bottomMargin=.62*inch,title="Needle & Yarn: A Love Stitched in Time",author="Leola (Sister) Lee").build(flow,onFirstPage=pn,onLaterPages=pn)

parts=[]
for line in src.splitlines():
    s=line.strip()
    if not s: continue
    if s.startswith("# "): parts.append("<h1>"+inline(s[2:])+"</h1>")
    elif s.startswith("## "): parts.append("<h2>"+inline(s[3:])+"</h2>")
    else: parts.append("<p>"+inline(s)+"</p>")
xhtml='<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Needle &amp; Yarn</title></head><body>'+''.join(parts)+'</body></html>'
opf='<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="id" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">leolas-library-needle-yarn-2026</dc:identifier><dc:title>Needle &amp; Yarn: A Love Stitched in Time</dc:title><dc:creator>Leola (Sister) Lee</dc:creator><dc:language>en-US</dc:language></metadata><manifest><item id="book" href="book.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="book"/></spine></package>'
with zipfile.ZipFile(out/"Needle_and_Yarn_A_Love_Stitched_in_Time.epub","w") as z:
    z.writestr("mimetype","application/epub+zip",compress_type=zipfile.ZIP_STORED)
    z.writestr("META-INF/container.xml",'<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>')
    z.writestr("OEBPS/content.opf",opf); z.writestr("OEBPS/book.xhtml",xhtml)

# Build trigger: 2026-09-19 final PDF/EPUB publication
