"""Generate EWM_Workforce_Tech_Brief.pdf — marketing one-pager."""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle,
)
from reportlab.platypus.flowables import HRFlowable

NAVY = HexColor("#101A25")
TEAL = HexColor("#275768")
SLATE_50 = HexColor("#F8FAFC")
SLATE_300 = HexColor("#CBD5E1")
SLATE_500 = HexColor("#64748B")
SLATE_700 = HexColor("#334155")

LOGO = "/Users/Christian/Desktop/EWN App/brand/ewm-logo.png"
SHOTS_DIR = "/Users/Christian/Desktop/EWN App/app-store-screenshots"
OUT = "/Users/Christian/Desktop/EWM_Workforce_Tech_Brief.pdf"

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
                   fontSize=22, leading=26, textColor=NAVY, spaceBefore=0, spaceAfter=8)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
                   fontSize=15, leading=18, textColor=NAVY, spaceBefore=12, spaceAfter=6)
H3 = ParagraphStyle("H3", parent=styles["Heading3"], fontName="Helvetica-Bold",
                   fontSize=11, leading=14, textColor=TEAL, spaceBefore=10, spaceAfter=4)
BODY = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica",
                     fontSize=10, leading=14, textColor=SLATE_700, spaceAfter=6)
BODY_SMALL = ParagraphStyle("BodySmall", parent=BODY, fontSize=9, leading=12, textColor=SLATE_500)
BODY_BOLD = ParagraphStyle("BodyBold", parent=BODY, fontName="Helvetica-Bold", textColor=NAVY)
TAGLINE = ParagraphStyle("Tagline", parent=styles["Italic"], fontName="Helvetica-Oblique",
                         fontSize=12, leading=16, textColor=TEAL, alignment=TA_LEFT, spaceAfter=18)
PILLAR_LABEL = ParagraphStyle("PillarLabel", parent=H3, fontSize=10, textColor=TEAL, spaceBefore=0, spaceAfter=2)
PILLAR_TITLE = ParagraphStyle("PillarTitle", parent=BODY_BOLD, fontSize=12, leading=15, spaceAfter=4)
PILLAR_BODY = ParagraphStyle("PillarBody", parent=BODY, fontSize=9, leading=12, spaceAfter=0)

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SLATE_500)
    canvas.drawString(0.6 * inch, 0.4 * inch, "EWM Workforce — Technology brief")
    canvas.drawRightString(letter[0] - 0.6 * inch, 0.4 * inch,
                          f"elevated-workforce.com  ·  page {doc.page}")
    canvas.restoreState()

def build():
    doc = SimpleDocTemplate(
        OUT, pagesize=letter,
        leftMargin=0.6 * inch, rightMargin=0.6 * inch,
        topMargin=0.6 * inch, bottomMargin=0.7 * inch,
        title="EWM Workforce — Technology brief",
        author="Elevated Workforce Management",
    )
    story = []

    # Cover
    logo = Image(LOGO, width=4 * inch, height=1.6 * inch, kind="proportional")
    logo.hAlign = "LEFT"
    story.append(logo)
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("The EWM Technology Platform", H1))
    story.append(Paragraph(
        "Every shift, every task, every dollar — tracked from clock-in to paycheck.",
        TAGLINE,
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=SLATE_300, spaceAfter=12))
    story.append(Paragraph(
        "EWM Workforce is the field-side tool every EWM employee uses — and the live "
        "operational dashboard every customer site can watch in real time. Built by "
        "operators. Used every shift, every day.",
        BODY,
    ))
    story.append(Spacer(1, 0.2 * inch))

    pillars = [
        [Paragraph("ON-SITE", PILLAR_LABEL),
         Paragraph("LIVE", PILLAR_LABEL),
         Paragraph("PAID", PILLAR_LABEL)],
        [Paragraph("Geo-fence clock-in", PILLAR_TITLE),
         Paragraph("Real-time productivity", PILLAR_TITLE),
         Paragraph("Hours-to-payroll", PILLAR_TITLE)],
        [Paragraph(
            "Workers can punch in only when they're physically at your property. "
            "Custom radius per site. No buddy-punching. No honor system.",
            PILLAR_BODY),
         Paragraph(
            "You and your EWM supervisor see the same screen: who's clocked in, "
            "what room they're cleaning right now, photo proof attached.",
            PILLAR_BODY),
         Paragraph(
            "Clock-times feed straight into a weekly payroll run. FLSA overtime "
            "auto-flagged. CSV export to ADP, Gusto, Paychex — one click.",
            PILLAR_BODY)],
    ]
    pt = Table(pillars, colWidths=[2.3 * inch] * 3, hAlign="LEFT")
    pt.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("BACKGROUND", (0, 0), (-1, -1), SLATE_50),
        ("BOX", (0, 0), (0, -1), 0.5, SLATE_300),
        ("BOX", (1, 0), (1, -1), 0.5, SLATE_300),
        ("BOX", (2, 0), (2, -1), 0.5, SLATE_300),
    ]))
    story.append(pt)
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph(
        "Trained, supervised, productivity-tracked workforce — across hospitality, "
        "healthcare, mobility, and light industrial. People. Performance. Elevated.",
        BODY_SMALL,
    ))
    story.append(PageBreak())

    # Page 2: Geo-fence
    story.append(Paragraph("On-site, on time", H2))
    story.append(Paragraph("GEO-FENCE CLOCK-IN", H3))
    story.append(Paragraph(
        "When a worker presses Clock In, EWM Workforce reads their phone's location "
        "<b>once</b> and verifies it's inside the fence you configured for the site. "
        "Tight to a single building, or wider to cover a campus or two adjacent towns "
        "(e.g. our Frisco / Prosper pilot uses a 12&nbsp;km radius covering both city "
        "limits). Off-site clock-in attempts are declined and logged.",
        BODY,
    ))
    story.append(Paragraph(
        "Once the worker is clocked in, the app stops watching their location. "
        "We track <i>presence at clock-in</i>, not movement throughout the day. "
        "That's a conscious choice — it builds trust with the workforce while still "
        "giving you the accountability you're paying for.",
        BODY,
    ))
    story.append(Spacer(1, 0.15 * inch))
    img_l = Image(f"{SHOTS_DIR}/01_today_shift.png", width=2.6 * inch, height=5.6 * inch, kind="proportional")
    img_r = Image(f"{SHOTS_DIR}/03_sites_list.png", width=2.6 * inch, height=5.6 * inch, kind="proportional")
    pt2 = Table([[img_l, img_r],
                 [Paragraph("<i>Today's shift card — geo-fence checked at Clock In.</i>", BODY_SMALL),
                  Paragraph("<i>Multi-site assignment — workers see only their sites.</i>", BODY_SMALL)]],
                colWidths=[3.5 * inch, 3.5 * inch])
    pt2.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, 1), 6),
    ]))
    story.append(pt2)
    story.append(PageBreak())

    # Page 3: Real-time tracking
    story.append(Paragraph("See the floor from anywhere", H2))
    story.append(Paragraph("LIVE PRODUCTIVITY BOARD", H3))
    story.append(Paragraph(
        "Every task ships with a printable QR code (room, bed, vehicle, zone). "
        "Workers <b>scan to start</b>, work, then <b>scan to complete</b> — and "
        "snap a photo right from the task screen for tasks that require proof "
        "(checkout cleans, terminal cleans, vehicle prep). The photo lives with "
        "the record forever, indexed and searchable.",
        BODY,
    ))
    story.append(Paragraph(
        "Site managers, area managers, and the customer site itself watch the "
        "same live screen — who's clocked in, what task they're on, which room, "
        "how many minutes in. When the shift ends, the report writes itself.",
        BODY,
    ))
    story.append(Spacer(1, 0.15 * inch))
    img_l = Image(f"{SHOTS_DIR}/02_tasks_list.png", width=2.6 * inch, height=5.6 * inch, kind="proportional")
    img_r = Image(f"{SHOTS_DIR}/04_task_scan.png", width=2.6 * inch, height=5.6 * inch, kind="proportional")
    pt3 = Table([[img_l, img_r],
                 [Paragraph("<i>Worker task list — 4 open, 1 done.</i>", BODY_SMALL),
                  Paragraph("<i>Scan-to-start with QR code targeting Room 201.</i>", BODY_SMALL)]],
                colWidths=[3.5 * inch, 3.5 * inch])
    pt3.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, 1), 6),
    ]))
    story.append(pt3)
    story.append(PageBreak())

    # Page 4: Payroll
    story.append(Paragraph("Hours that turn into paychecks", H2))
    story.append(Paragraph("PAYROLL AUTOMATION", H3))
    story.append(Paragraph(
        "The platform creates weekly pay periods automatically (Sunday-Saturday "
        "FLSA workweek), buckets each worker's hours into <b>regular</b> and "
        "<b>overtime</b>, applies the per-hour rate on file, and rolls up gross "
        "pay. We hand you a CSV ready for ADP, Gusto, Paychex — or integrate "
        "directly on request.",
        BODY,
    ))
    story.append(Paragraph(
        "On the customer side, the same hours feed our billing engine: rate × "
        "billable units = an itemized invoice your finance team can audit "
        "without picking up the phone. Print or download as PDF, drop the CSV "
        "into your AP system. No retyping. No reconciliation Mondays.",
        BODY,
    ))
    story.append(Spacer(1, 0.15 * inch))
    img = Image(f"{SHOTS_DIR}/05_shift_summary.png", width=3 * inch, height=6.5 * inch, kind="proportional")
    pt4 = Table([[img],
                 [Paragraph("<i>End-of-shift summary — tasks done, open, blocked. Feeds payroll + billing.</i>", BODY_SMALL)]],
                colWidths=[7 * inch])
    pt4.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, 1), 6),
    ]))
    story.append(pt4)
    story.append(PageBreak())

    # Page 5: Privacy + close
    story.append(Paragraph("Privacy you can stand behind", H2))
    story.append(Paragraph(
        "We collect only what's needed to schedule, time, and bill the work "
        "your team does. <b>No advertising, no third-party analytics, no "
        "background location tracking — ever.</b> The mobile app contains zero "
        "tracking SDKs.",
        BODY,
    ))
    story.append(Paragraph(
        "Workers' locations are recorded only at the moment of clock-in. "
        "Photos taken for task proof are stored in a private bucket, "
        "accessible only to authorized supervisors at that site. Database "
        "row-level security enforces that one customer's data is invisible "
        "to another's, even by the same EWM employee.",
        BODY,
    ))
    story.append(Paragraph(
        "Full privacy policy: <b>elevated-workforce.com/privacy.html</b>",
        BODY_SMALL,
    ))
    story.append(Spacer(1, 0.4 * inch))
    story.append(HRFlowable(width="100%", thickness=1, color=SLATE_300, spaceBefore=12, spaceAfter=12))
    story.append(Paragraph("BUILT FOR FOUR VERTICALS", H3))
    verticals = Table([
        ["Hospitality", "Healthcare", "Mobility", "Light Industrial"],
        [Paragraph("Hotels and hospitality services. Room cleans, refreshes, linen runs.", BODY_SMALL),
         Paragraph("Hospital EVS, terminal cleans, patient transport, bed turnover.", BODY_SMALL),
         Paragraph("Rental ready-line, valet, vehicle prep, fleet detailing.", BODY_SMALL),
         Paragraph("Warehouse picks, zone cleans, equipment safety checks.", BODY_SMALL)],
    ], colWidths=[1.8 * inch] * 4)
    verticals.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("TEXTCOLOR", (0, 0), (-1, 0), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
    ]))
    story.append(verticals)
    story.append(Spacer(1, 0.4 * inch))
    story.append(HRFlowable(width="100%", thickness=1, color=SLATE_300, spaceBefore=12, spaceAfter=12))
    story.append(Paragraph(
        "<b>Get a demo or quote</b><br/>"
        "<font color='#275768'>elevated-workforce.com</font>  ·  "
        "<font color='#275768'>support@elevated-workforce.com</font>  ·  "
        "Frisco, TX",
        ParagraphStyle("Close", parent=BODY, alignment=TA_CENTER, fontSize=11, leading=16, textColor=NAVY),
    ))

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"PDF saved: {OUT}")

if __name__ == "__main__":
    build()
