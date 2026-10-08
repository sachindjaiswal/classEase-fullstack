# -*- coding: utf-8 -*-
"""Generate the ClassEase academic blackbook (.docx) — structured on the Dastagir Blackbook format,
content sourced solely from PROJECT_CONTEXT.md. Institutional placeholders are NOT fabricated."""
import os
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = r"C:\Users\Shaikh Farhan\OneDrive\Desktop\ClassEase"
DIAG = os.path.join(ROOT, "docs", "diagrams")
OUT = os.path.join(ROOT, "ClassEase_Blackbook.docx")

BLACK = RGBColor(0, 0, 0)
GREY = RGBColor(0x50, 0x50, 0x50)
TEMP_GLYPH = "\u2014"

BODY_FONT = "Times New Roman"

# =====================================================================================
# DOCUMENT SETUP
# =====================================================================================
doc = Document()

def set_font(style_or_run, name=BODY_FONT):
    f = style_or_run.font
    f.name = name
    rpr = style_or_run.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rfonts.set(qn(attr), name)

# --- normal ---
normal = doc.styles["Normal"]
normal.font.name = BODY_FONT
normal.font.size = Pt(12)
normal.font.color.rgb = BLACK
set_font(normal)
npf = normal.paragraph_format
npf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
npf.space_after = Pt(6)
npf.line_spacing = 1.0

# --- headings ---
for nm, sz in [("Heading 1", 20), ("Heading 2", 15), ("Heading 3", 13)]:
    hs = doc.styles[nm]
    hs.font.name = BODY_FONT
    hs.font.size = Pt(sz)
    hs.font.bold = True
    hs.font.color.rgb = BLACK
    set_font(hs)
    hs.paragraph_format.space_before = Pt(12)
    hs.paragraph_format.space_after = Pt(8)
    hs.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER if nm == "Heading 1" else WD_ALIGN_PARAGRAPH.LEFT
    hs.paragraph_format.keep_with_next = True

# ---- margins: 1.5" left (binding), 1" elsewhere ----
sec0 = doc.sections[0]
for s in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
    setattr(sec0, s, Inches(1.5 if s == "left_margin" else 1))
sec0.header_distance = Inches(0.5)
sec0.footer_distance = Inches(0.5)

# =====================================================================================
# HELPERS
# =====================================================================================
def para(text="", *, bold=False, italic=False, size=None, align=WD_ALIGN_PARAGRAPH.JUSTIFY,
         space_after=None, color=None):
    par = doc.add_paragraph()
    par.alignment = align
    if space_after is not None:
        par.paragraph_format.space_after = Pt(space_after)
    r = par.add_run(text)
    r.bold = bold
    r.italic = italic
    r.font.name = BODY_FONT
    if size:
        r.font.size = Pt(size)
    if color:
        r.font.color.rgb = color
    return par

def bullets(items, indent=0.25):
    for it in items:
        par = doc.add_paragraph()
        par.paragraph_format.left_indent = Inches(indent)
        par.paragraph_format.first_line_indent = Inches(-0.15)
        par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r = par.add_run("\u2022  " + it)
        r.font.name = BODY_FONT

def numbered(items):
    for i, it in enumerate(items, 1):
        par = doc.add_paragraph()
        par.paragraph_format.left_indent = Inches(0.35)
        par.paragraph_format.first_line_indent = Inches(-0.25)
        par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r = par.add_run(f"{i}.   " + it)
        r.font.name = BODY_FONT

def chapter(num, title, first=False):
    if not first:
        doc.add_page_break()
    h = doc.add_paragraph(style="Heading 1")
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = h.add_run(f"CHAPTER {num}: {title}")
    r.font.name = BODY_FONT
    r.bold = True
    set_font(r)
    return h

def section(text):
    h = doc.add_paragraph(style="Heading 2")
    h.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = h.add_run(text)
    set_font(r)
    return h

def subsection(text):
    h = doc.add_paragraph(style="Heading 3")
    r = h.add_run(text)
    set_font(r)
    return h

def figure_tag(ch, n, caption, width=5.8):
    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p = os.path.join(DIAG, ch + ".png")
    if os.path.exists(p):
        run = par.add_run()
        run.add_picture(p, width=Inches(width))
    else:
        par.add_run(f"[Figure image {ch}.{n} not found: {caption}]").italic = True
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_before = Pt(2)
    r = cap.add_run(f"Figure 4.{n}: {caption}")
    r.font.name = BODY_FONT
    r.font.size = Pt(10)
    r.bold = True
    _keep(cap)

def table_tag(ch, n, title):
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_before = Pt(6)
    r = cap.add_run(f"Table {ch}.{n}: {title}")
    r.font.name = BODY_FONT
    r.font.size = Pt(10)
    r.bold = True
    _keep(cap)

def _keep(par):
    par.paragraph_format.keep_with_next = True

def tbl(headers, rows, col_widths=None, font_size=11):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = doc.styles["Table Grid"]
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t.rows[0].cells
    for i, htxt in enumerate(headers):
        hdr[i].text = ""
        r = hdr[i].paragraphs[0].add_run(htxt)
        r.bold = True
        r.font.name = BODY_FONT
        r.font.size = Pt(font_size)
        hdr[i].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    for rowvals in rows:
        cells = t.add_row().cells
        for i, val in enumerate(rowvals):
            cells[i].text = ""
            r = cells[i].paragraphs[0].add_run(str(val))
            r.font.name = BODY_FONT
            r.font.size = Pt(font_size)
    if col_widths:
        for i, w in enumerate(col_widths):
            for row in t.rows:
                row.cells[i].width = Inches(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t

def placeholder_box(text, height_lines=5):
    t = doc.add_table(rows=1, cols=1)
    t.style = doc.styles["Table Grid"]
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = t.rows[0].cells[0]
    cell.text = ""
    for _ in range(height_lines):
        p = cell.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par = cell.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = par.add_run(text)
    r.italic = True
    r.font.name = BODY_FONT
    r.font.size = Pt(11)
    for _ in range(height_lines):
        p = cell.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    # shade
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), "EFEFEF")
    cell._tc.get_or_add_tcPr().append(shd)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def front_title(text, size=13):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(14)
    r = p.add_run(text)
    r.bold = True
    r.font.name = BODY_FONT
    r.font.size = Pt(size)
    return p

def page_break():
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

def signature_block(lines):
    para("", space_after=18)
    for ln, sp in lines:
        para(ln, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=Pt(sp or 0))
    para("", space_after=0)

def add_field(par, instr):
    r1 = par.add_run()
    f1 = OxmlElement("w:fldChar"); f1.set(qn("w:fldCharType"), "begin"); f1.set(qn("w:dirty"), "true")
    r1._r.append(f1)
    r2 = par.add_run()
    it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = instr
    r2._r.append(it)
    r3 = par.add_run()
    f3 = OxmlElement("w:fldChar"); f3.set(qn("w:fldCharType"), "end")
    r3._r.append(f3)

def footer_page_number(fmt="decimal", start=None):
    sec = doc.sections[-1]
    # footer page number field, centered
    ft = sec.footer
    ft.is_linked_to_previous = False
    if not ft.paragraphs:
        ft.add_paragraph()
    fp = ft.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for r in list(fp.runs):
        r.clear()
    add_field(fp, " PAGE ")
    for r in fp.runs:
        r.font.name = BODY_FONT
        r.font.size = Pt(10)
    # pgNumType
    pgpr = sec._sectPr.find(qn("w:pgNumType"))
    if pgpr is None:
        pgpr = OxmlElement("w:pgNumType")
        sec._sectPr.append(pgpr)
    pgpr.set(qn("w:fmt"), fmt)
    if start is not None:
        pgpr.set(qn("w:start"), str(start))

def clear_footer(sec=None):
    sec = doc.sections[-1] if sec is None else sec
    sec.footer.is_linked_to_previous = False
    p = sec.footer.paragraphs[0]
    for r in list(p.runs):
        r.clear()

# =====================================================================================
# FRONT MATTER  (Section 1 — roman numerals)
# =====================================================================================

# ---------- 1) TITLE / COVER ----------
for _ in range(5):
    doc.add_paragraph()
para("A PROJECT REPORT", bold=True, size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
para("on", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
para("ClassEase", bold=True, size=22, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
para("\u201cAn Academic Performance, Ranking and Feedback System for Schools\u201d",
     size=13, align=WD_ALIGN_PARAGRAPH.CENTER, color=GREY, space_after=16)
para("Submitted by", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
para("Mr. Shaikh Farhan", bold=True, size=14, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
para("in partial fulfilment for the award of the degree", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
para("BACHELOR OF SCIENCE (B.Sc.)", bold=True, size=14, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
para("in", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
para("COMPUTER SCIENCE", bold=True, size=14, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=10)
para("under the guidance of", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
para("[Name of Project Guide]", bold=True, size=13, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
para("and", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
para("[Name of Co-Guide / Mentor]", bold=True, size=13, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
para("Department of Computer Science", bold=True, size=13, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
para("[Name of College]", bold=True, size=13, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
para("[City, State \u2014 PIN Code]", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, color=GREY, space_after=2)
para("Semester [V]  \u2022  Academic Year [20XX \u2013 20XX]", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
_ = doc.add_paragraph()
page_break()

# ---------- 2) CERTIFICATE ----------
front_title("CERTIFICATE")
para("This is to certify that Mr. Shaikh Farhan of the B.Sc. (Computer Science) class, Roll No. [Roll Number] "
     ", University Seat No. [Seat Number], has satisfactorily completed the project titled \u201cClassEase: An "
     "Academic Performance, Ranking and Feedback System for Schools\u201d, submitted in the partial fulfilment for the "
     "award of the Bachelor of Science degree in Computer Science during the academic year [20XX \u2013 20XX].")
para("")
para("Date of Submission: ____________________________")
para("Place: ____________________________")
para("")
para("Coordinator                                  Project Guide", space_after=0)
para("Department of Computer Science              Department of Computer Science", space_after=0)
para("")
para("Checked by: _______________________         Signature of Examiner: _______________________",
     space_after=0)
para("")
para("College Seal")
para("[Affix College Seal here]")
para("")
note_text = ("[NOTE: The genuine institutional certificate must be printed on the college / department "
             "letterhead and must be signed by the coordinator, project guide and examiner before "
             "submission. The details above are placeholders only.]")
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
r = p.add_run(note_text); r.italic = True; r.font.name = BODY_FONT; r.font.size = Pt(10.5); r.font.color.rgb = GREY
page_break()

# ---------- 3) DECLARATION ----------
front_title("DECLARATION")
para("I, Mr. Shaikh Farhan, hereby declare that the project entitled \u201cClassEase: An Academic Performance, "
     "Ranking and Feedback System for Schools\u201d, submitted in the partial fulfilment for the award of the Bachelor "
     "of Science degree in Computer Science during the academic year [20XX \u2013 20XX], is my original work and that "
     "the project, in whole or in part, has not been submitted for the award of any other degree, diploma, "
     "associateship, fellowship or any other similar title at this or any other institution.")
para("")
para("Signature of the Student : ____________________________")
para("Place : ________________________________")
para("Date :  ______________________________")
para("")
para("Head / Coordinator")
para("Department of Computer Science")
page_break()

# ---------- 4) ACKNOWLEDGEMENT ----------
front_title("ACKNOWLEDGEMENT")
para("I would like to express my sincere gratitude to all those who contributed to the successful design and "
     "development of this project.")
para("I extend my deepest gratitude to my project guide, [Name of Project Guide], and to my co-guide / mentor, "
     "[Name of Co-Guide / Mentor], for their invaluable guidance, constant encouragement and expert feedback at "
     "every stage of this work. Their insights significantly improved the quality of this project.")
para("I would also like to thank the Head and Coordinator of the Department of Computer Science, [Name of HOD / "
     "Coordinator], and the entire faculty and staff of the department for providing the necessary resources, "
     "tools and a supportive environment that made this work possible.")
para("My heartfelt thanks go to my family and friends for their unwavering support, patience and constructive "
     "feedback throughout the project journey. Their encouragement has been a constant source of motivation.")
para("Finally, I wish to thank all the participants and classmates who tested the system and shared their "
     "feedback, which played an important role in refining the functionality and usability of the application.")
para("")
para("Thank You,")
para("Shaikh Farhan", bold=True)
page_break()

# ---------- 5) ABSTRACT ----------
front_title("ABSTRACT")
para("ClassEase is a web-based academic management system designed to consolidate student performance, "
     "attendance, homework, ranking and feedback information within a unified role-based platform. The system "
     "serves three principal user categories: the institutional administration, teachers and students.")
para("The primary motivation for the project is the comparative-performance vision on which the entire "
     "application is built. Each student is able to compare himself or herself with classmates of the same class "
     "(who scored more, in which subject, and by how much), to learn what higher-performing students do in order "
     "to improve subject-wise performance, and to compare against his or her own previous semester in order to "
     "track progress over time. These views are delivered through dedicated comparative analytics endpoints and "
     "a student-facing Performance page that presents ranking, gap analysis, semester-wise progress and "
     "head-to-head comparisons.")
para("The system supports the complete academic workflow: authentication and role-based access control, class, "
     "teacher, student and subject management, bulk attendance marking, homework assignment, score recording "
     "with semester tracking, a composite leaderboard, announcements, a weekly timetable, a student-concern "
     "feedback workflow, and role-specific analytical dashboards with graphical representation. The feedback "
     "engine is deliberately rule-based and shallow: it derives actionable recommendations from attendance "
     "thresholds, homework completion thresholds and subject-wise performance gaps rather than from machine "
     "learning models.")
para("Technically, ClassEase is implemented as a Laravel 13 backend API (PHP 8.3) secured with Laravel Sanctum "
     "and a role middleware, paired with a React 18 / TypeScript single-page application using Vite, Tailwind "
     "CSS and Recharts. MySQL 8 is the primary database with Redis 7 used for caching, sessions and queues. The "
     "environment is containerised with Docker and nginx. The verified development baseline records zero "
     "PHPStan (level 7) errors and twenty passing tests with eighty-one assertions.")
page_break()

# ---------- 6) LIST OF FIGURES ----------
front_title("LIST OF FIGURES")
tbl(["Figure Number", "Figure Title"], [
    ["Figure 4.1", "ClassEase High-Level System Architecture"],
    ["Figure 4.2", "Flow of Project (Process Model)"],
    ["Figure 4.3", "Request / Data Flow Sequence"],
    ["Figure 4.4", "Entity Relationship Diagram"],
    ["Figure 4.5", "Role Hierarchy and Authorization Design"],
    ["Figure 4.6", "Docker / Deployment Architecture"],
    ["Figure 4.7", "Comparative Performance Logic"],
    ["Figure 4.8", "Feedback Engine Decision Flow"],
    ["Figure 4.9", "Module and Navigation Structure"],
    ["Figure 5.1", "Login Interface (screenshot placeholder)"],
    ["Figure 5.2", "Management Dashboard (screenshot placeholder)"],
    ["Figure 5.3", "Student Performance Page (screenshot placeholder)"],
], col_widths=[1.8, 4.6])
page_break()

# ---------- 7) LIST OF TABLES ----------
front_title("LIST OF TABLES")
tbl(["Table Number", "Table Title"], [
    ["Table 4.1", "Hardware Requirements"],
    ["Table 4.2", "Software Requirements"],
    ["Table 4.3", "Functional Requirements"],
    ["Table 4.4", "Non-Functional Requirements"],
    ["Table 4.5", "User Roles and Route-Level Permissions"],
    ["Table 4.6", "Database Entities"],
    ["Table 4.7", "Composite Score Policy Weights"],
    ["Table 4.8", "Feedback Engine Policy Thresholds"],
    ["Table 4.9", "Technologies Used"],
    ["Table 5.1", "Development Environment"],
    ["Table 5.2", "Verification and Test Results"],
    ["Table 5.3", "Demonstration (Development) Credentials"],
    ["Appendix A.1", "Detailed Role\u2013Permission Matrix"],
    ["Appendix B.1", "Full-Stage Verification Summary"],
], col_widths=[1.8, 4.6])
page_break()

# ---------- 8) INDEX / TABLE OF CONTENTS ----------
front_title("INDEX", size=14)
par = doc.add_paragraph()
par.alignment = WD_ALIGN_PARAGRAPH.LEFT
add_field(par, ' TOC \\o "1-3" \\h \\z \\u ')
par2 = doc.add_paragraph()
r = par2.add_run("[Table of Contents is auto-generated. It is refreshed automatically during final "
                 "processing before the PDF is exported.]")
r.italic = True; r.font.name = BODY_FONT; r.font.size = Pt(10); r.font.color.rgb = GREY
page_break()

# ---------- 9) REQUIRED INSTITUTIONAL ATTACHMENT PLACEHOLDERS ----------
front_title("APPROVED PROJECT PROPOSAL")
placeholder_box("[Insert the institution-approved ClassEase project proposal here \u2014 approved and "
                "signed by the department before final submission.]", height_lines=8)
page_break()
front_title("PLAGIARISM / SIMILARITY REPORT")
placeholder_box("[Insert the genuine plagiarism / similarity report issued for this project here (e.g. "
                "report generated by the institution\u2019s approved similarity-check tool).]", height_lines=8)
page_break()

# =====================================================================================
# SECTION BREAK + FOOTERS
# =====================================================================================
# Front matter (section 1) uses roman numerals; body (section 2 onward) restarts at 1.
footer_page_number(fmt="lowerRoman")          # applies to current (front matter) section
doc.add_section(WD_SECTION.NEW_PAGE)          # body section
# margins for the new section
for s in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
    setattr(doc.sections[-1], s, Inches(1.5 if s == "left_margin" else 1))
footer_page_number(fmt="decimal", start=1)    # body page numbers restart at 1

# =====================================================================================
# CHAPTER 1 — PROJECT OVERVIEW
# =====================================================================================
chapter(1, "PROJECT OVERVIEW", first=True)
para("ClassEase: An Academic Performance, Ranking and Feedback System for Schools", bold=True,
     align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)

section("1.1 Introduction")
para("ClassEase is a web-based academic management system designed to consolidate student performance, "
     "attendance, homework, ranking and feedback information within a unified platform. The system is organised "
     "around three principal user roles: the institutional administration (management), teachers and students "
     "to enable efficient handling of classes, subjects, student records, attendance, homework, scores, "
     "leaderboards, announcements, timetables and student concerns.")
para("The defining purpose of the project is its comparative-performance vision: every student is able to "
     "compare results against classmates, understand how higher-performing students differ subject-wise, and "
     "compare present performance with past semesters. This comparative capability is provided through a "
     "dedicated performance module rather than a simple score list.")

section("1.2 Project Background")
para("Traditional school administration relies on manual paper registers, scattered records and informal "
     "communication between administration, teachers and students. Attendance is recorded by hand, homework is "
     "assigned and tracked in isolation, and student results are rarely consolidated or analysed. Students in "
     "particular have no structured means of benchmarking themselves against classmates or their own previous "
     "performance. ClassEase was conceived to address these gaps with a single digital platform that records the "
     "academic workflow and transforms the accumulated records into meaningful, comparative insight.")

section("1.3 Project Objectives")
bullets([
    "To build a centralized platform for managing school operations including classes, teachers, students and subjects.",
    "To implement role-based access control for administration, teacher and student categories.",
    "To digitize attendance tracking with bulk marking and per-student daily records.",
    "To enable homework assignment, tracking and deadline visibility.",
    "To record subject-wise, semester-wise scores and compute class leaderboards on demand.",
    "To provide comparative performance analytics: compare with classmates, identify subject gaps to the top three, track semester progress, and support head-to-head comparison.",
    "To deliver role-specific analytical dashboards with graphical representation of the above data.",
    "To include a rule-based feedback mechanism that translates attendance, homework and performance-gap data into actionable recommendations.",
])

section("1.4 Scope")
subsection("1.4.1 Functional Scope")
bullets([
    "Authentication: registration (student-role only, enforced server-side), login, logout and token-based sessions.",
    "Role-based access control at the level of every protected API route.",
    "Maintenance of teachers, classes, students and subjects including linked login accounts.",
    "Attendance marking and viewing by class, date and student.",
    "Homework creation, editing, deletion and class-wise listing.",
    "Score recording per student, subject, exam type and semester.",
    "Class leaderboard computed from score averages with exam and semester filters.",
    "Comparative analytics endpoints for subject comparison, gap analysis, progress tracking and head-to-head comparison.",
    "Announcements (general or class-specific), weekly timetable maintenance and a student-concern feedback workflow.",
    "Role-specific dashboards incorporating charts and notices/tasks feeds.",
])
subsection("1.4.2 Technical Scope")
bullets([
    "Backend: Laravel 13 (PHP 8.3) exposing a REST-style JSON API protected by Laravel Sanctum and a role middleware.",
    "Frontend: standalone React 18 / TypeScript single-page application built with Vite and styled with Tailwind CSS, using Recharts for visualisation.",
    "Data: MySQL 8 as the primary relational store; Redis 7 for caching, sessions and queues.",
    "Deployment: containerised with Docker and nginx; local development uses SQLite.",
    "Quality gates: Pint, PHPStan (level 7) and a Pest/PHPUnit test suite.",
])

section("1.5 Target Users")
bullets([
    "Administration (Management) \u2014 school administrators managing master data, statistics and global operations.",
    "Teachers \u2014 staff who mark attendance, assign homework, record scores and interact with their classes.",
    "Students \u2014 learners who view their records, timetables, announcements and comparative performance.",
])

section("1.6 Major Features")
bullets([
    "Comparative performance engine (classmate comparison, gap analysis, semester progress, head-to-head).",
    "Composite class leaderboard with exam and semester filters.",
    "Rule-based feedback engine with configurable policy thresholds.",
    "Role-scoped dashboards with charts (donut, bar, grouped bar, sparkline).",
    "Bulk attendance marking with uniqueness enforcement per student per day.",
    "Semester-aware score management with duplicate detection.",
    "Weekly timetable grid editor for a class, with per-teacher and per-student views.",
    "General and class-scoped announcements with a notices/tasks dashboard feed.",
    "Student concern lifecycle (raise, respond, resolve) with automatic resolver tracking.",
    "Linked login accounts for administration-created teachers and students.",
])

section("1.7 Hardware Requirements")
table_tag(4, 1, "Hardware Requirements")
tbl(["Component", "Minimum Specification", "Purpose"], [
    ["Processor", "Dual-core x86-64 (64-bit), 2.0 GHz or better", "Development and hosting"],
    ["Memory (RAM)", "8 GB (16 GB recommended)", "PHP-FPM, MySQL, Redis, Node build"],
    ["Storage", "10 GB free disk space", "Code, dependencies, database volumes"],
    ["Network", "LAN / internet connectivity", "Client\u2013server communication, npm/composer installs"],
    ["Display", "1366 \u00d7 768 or higher", "Frontend usage and dashboards"],
], col_widths=[1.3, 2.7, 2.4])

section("1.8 Software Requirements")
table_tag(4, 2, "Software Requirements")
tbl(["Component", "Version / Detail", "Role"], [
    ["PHP", "8.3 or newer", "Backend runtime"],
    ["Laravel", "13.x", "Web framework"],
    ["Laravel Sanctum", "4.x", "Token authentication"],
    ["MySQL", "8.0", "Primary relational database"],
    ["Redis", "7.x", "Cache, sessions, queues"],
    ["Node.js / npm", "20+ / latest", "Frontend tooling"],
    ["React / TypeScript", "18.3.x / \u2265 5", "Frontend SPA"],
    ["Vite", "latest", "Dev server and build"],
    ["Tailwind CSS", "3.4.x", "Styling"],
    ["Recharts", "^3.10.1", "Charts"],
    ["Docker / docker compose", "latest", "Containerised stack"],
    ["Nginx", "latest", "Reverse proxy"],
], col_widths=[1.7, 1.8, 2.9])

section("1.9 Assumptions")
bullets([
    "The institution operates single-school records (a single tenant model).",
    "Administration personnel have the authority to create and revoke teacher and student accounts.",
    "Scores, attendance and homework data are entered digitally by authorised staff.",
    "Internet browsers support the modern JavaScript features used by the React frontend.",
])
section("1.10 Dependencies")
bullets([
    "Composer package installation requires PHP 8.3-compatible tooling.",
    "Windows development requires npm.cmd invocations because PowerShell blocks npm.ps1 scripts.",
    "PHP static analysis and tests run inside a Docker verification container because the local XAMPP PHP (8.2.12) is below the Composer platform requirement.",
    "The frontend client proxies /api requests to the Laravel backend during development.",
])
section("1.11 Deliverables")
bullets([
    "Backend REST API source (Laravel 13) with migrations, models, seeders and route definitions.",
    "Frontend single-page application source (React 18 / TypeScript).",
    "Dockerized deployment definition (docker-compose and service images).",
    "This blackbook report together with the project journal and diagram sources.",
])
section("1.12 Report Organization")
para("Chapter 1 presents the project overview. Chapter 2 discusses the introduction and motivation for the "
     "system. Chapter 3 provides a literature review of related academic-management software and analytics "
     "approaches. Chapter 4 presents the analysis and design covering functional and non-functional requirements, "
     "roles, use cases, architecture, database design and the comparative-performance and feedback logic. "
     "Chapter 5 explains the implementation. Chapter 6 presents the conclusion and future scope. Chapter 7 lists "
     "the references. A glossary and appendices complete the report.")

# =====================================================================================
# CHAPTER 2 — INTRODUCTION AND MOTIVATION
# =====================================================================================
chapter(2, "INTRODUCTION AND MOTIVATION")

section("2.1 Background")
para("Modern educational institutions generate large volumes of operational data \u2014 class rosters, attendance "
     "records, homework submissions and assessment marks. When these records exist only on paper or in "
     "independent spreadsheets, they cannot be related easily. The relationship between consistent attendance, "
     "prompt homework completion and examination performance is well understood in education literature; yet in "
     "most school settings this relationship is not made visible to the students or to the staff who guide them.")
para("Assessment has two complementary purposes: certification (measuring achievement) and feedback (helping "
     "the learner improve). Systems that address only the first purpose produce marks without guidance. A "
     "system that also surfaces comparative information \u2014 how a student performs relative to classmates, where "
     "the greatest gap to higher achievers lies, and how performance changes across time \u2014 turns recorded marks "
     "into a tool for improvement.")

section("2.2 Existing Situation")
bullets([
    "Attendance is recorded manually, making daily registers error-prone and time-consuming.",
    "Homework and deadlines are not tracked centrally across classes.",
    "Student, teacher and class data reside in separate, unconnected records.",
    "Management has no immediate, consolidated view of institutional metrics.",
    "There is no central platform for announcements, timetables or student concerns.",
    "Students receive marks but no structured comparison with classmates or with their own past performance.",
])

section("2.3 Problem Definition")
para("The core problem is that valuable academic data exists but is not organised or analysed. Without "
     "consolidation and comparative analysis, neither students nor staff can act on it. Students cannot answer "
     "elementary improvement questions \u2014 \u201cwho scored more than me and in which subject?\u201d, \u201cwhat separates me from "
     "the top of my class?\u201d, or \u201cam I improving compared with my previous semester?\u201d. This limits the formative "
     "value of assessment.") 
para("Formally, the problem addressed by this project is the absence of an integrated, role-secured academic "
     "platform that (i) records class, teacher, student, subject, attendance, homework and score data, "
     "(ii) derives comparative performance information from that data, and (iii) communicates actionable "
     "feedback to students.")

section("2.4 Motivation")
para("The motivation for ClassEase is threefold. First, the digital consolidation of academic records removes "
     "manual duplication and errors. Second, comparative analytics convert static records into usable insight, "
     "making the formative purpose of assessment explicit. Third, a role-based platform with a student-concern "
     "workflow closes the communication gap between students and administration. These motivations follow the "
     "comparative-performance vision that is the foundation of the project: compare with classmates, learn how "
     "to outscore others, and beat one\u2019s past performance.")

section("2.5 Need for the Proposed System")
bullets([
    "A single authoritative repository for classes, teachers, students and subjects.",
    "Digital, verifiable attendance records with per-student-per-day uniqueness.",
    "Centralized homework tracking with deadlines visible to students and teachers.",
    "Semester-aware score records that make time-based comparison possible.",
    "Automatically computed class leaderboards and rank information.",
    "Comparative performance views and rule-based feedback for students.",
    "A structured channel for announcements, timetables and student concerns.",
])

section("2.6 Goals")
bullets([
    "Deliver all planned academic modules with verified quality gates (Pint, PHPStan level 7, automated tests).",
    "Enforce role-based access on every authenticated route.",
    "Provide accurate, semester-aware comparative analytics computed on the fly from stored scores.",
    "Present dashboards that are informative to each role.",
    "Keep the feedback mechanism transparent and rule-based rather than opaque.",
])

section("2.7 Expected Benefits")
bullets([
    "Reduced administrative effort and fewer manual errors in attendance and records.",
    "Improved student insight through comparative benchmarks (classmates, top three, past self).",
    "Early identification of subjects in which a student lags the strongest peers.",
    "Better visibility of deadlines and institutional notices.",
    "Accountable concern resolution with automatic resolver tracking.",
    "Real-time institutional statistics for management.",
])

section("2.8 Functional Perspective")
para("Functionally, ClassEase operates as a set of vertical modules over a shared relational store. Master-data "
     "modules (teachers, classes, students, subjects) feed operational modules (attendance, homework, scores). "
     "The leaderboard and comparative analytics modules are read-only derivations over scores. The feedback "
     "engine is a thin rule layer over the derived metrics. All modules are exposed through a JSON API and "
     "consumed by a single-page client, which renders role-appropriate screens.")

section("2.9 Relevant Theoretical Concepts")
bullets([
    "Role-Based Access Control (RBAC): resources are protected by a role middleware so that route access is decided by the authenticated role.",
    "REST-style APIs: resources are exposed as stateless endpoints carrying JSON; authentication uses bearer tokens.",
    "ORM and the repository view: Eloquent maps database tables to domain models, allowing the analytic modules to compose queries.",
    "Comparative and self-referential assessment: the design follows the well-established educational principle that feedback that includes a point of comparison (class, top performers, previous self) supports improvement (Bloom, 1984) [1].",
    "Cache-aside pattern: Redis caches derived values while MySQL remains the source of truth.",
    "Composite scoring: multiple weighted indicators (academics, attendance, homework) are combined by an explicitly stated institutional policy.",
])

# =====================================================================================
# CHAPTER 3 — LITERATURE REVIEW
# =====================================================================================
chapter(3, "LITERATURE REVIEW")

section("3.1 Purpose of This Review")
para("This chapter reviews the categories of existing work that are relevant to ClassEase. The review is "
     "thematic and is written from the documented knowledge of comparable software and educational practice. "
     "Only verifiable sources are cited; a consolidated reference list appears in Chapter 7. Where specific "
     "literature has not yet been consolidated within the institution, the relevant pages are identified as "
     "requiring completion before final submission.")

section("3.2 Academic Performance Management Systems")
para("Academic management software is a mature category. Products in this space commonly provide student "
     "records, class schedules, attendance and grade books, and increasingly expose parent portals. The "
     "limitation of many commercial systems is that they are oriented toward administration and reporting rather "
     "than toward the individual student\u2019s comparative learning view. ClassEase differentiates itself by making "
     "share-of-class, top-three gaps and semester-over-semester change first-class features of the student "
     "experience rather than management-only reports.")

section("3.3 Student Performance Analytics and Ranking")
para("Ranking students within a cohort is used widely as a motivational instrument. The education literature "
     "cautions that ranking can be demotivating if it emphasises position without guidance on improvement; the "
     "constructive approach pairs ranking with the information needed to act (cf. the broader evidence that "
     "success-criterion feedback supports learning [2]). ClassEase addresses this by pairing the class rank with "
     "gap analysis and subject-level diagnosis, so that a rank value is accompanied by an explanation of where "
     "improvement is most achievable.")

section("3.4 Attendance Monitoring")
para("Attendance is a well-documented correlate of academic achievement. Electronic attendance systems replace "
     "manual registers with structured records, typically enforcing one record per student per day and allowing "
     "summary statistics. ClassEase implements this enforcement as a database-level uniqueness constraint and "
     "feeds attendance rates into its feedback rules. This mirrors common practice in lightweight classroom "
     "management tools while keeping the data integration in one database.")

section("3.5 Homework and Assessment Tracking")
para("Centralized homework tracking with deadlines addresses the classic failure of paper-based assignment "
     "management: deadlines are lost and completion is invisible. The literature on formative assessment "
     "emphasizes frequent, low-stakes tasks with prompt feedback (the \u201c90% plus time-on-task\u201d relation to "
     "mastery learning is well established [1]). ClassEase therefore records homework at class and subject "
     "level, exposes deadlines with an overdue indicator, and treats homework completion as one component of its "
     "composite view of a student.")

section("3.6 Feedback Systems and Rule-Based Recommendations")
para("Automated feedback ranges from rule-based decision systems to data-driven machine-learning systems. "
     "Rule-based engines are transparent, explainable and cheap to operate: a small set of thresholds converts "
     "measured indicators into recommendations. Machine-learning systems may be more adaptive but are opaque and "
     "require substantial labelled data. For an institutional academic setting, transparency is a primary "
     "requirement, so ClassEase deliberately adopts a shallow, rule-based feedback engine built on attendance, "
     "homework completion and subject-gap thresholds; it is not claimed to be an artificial-intelligence "
     "system.")

section("3.7 Role-Based Academic Platforms and Dashboards")
para("Multi-role platforms enforce that each user sees only data permitted by his or her role. The standard "
     "implementation is route-level middleware combined with object-level checks. Dashboards that summarise "
     "metrics per role (administrative statistics, teacher class-performance, student self-comparison) are a "
     "common and effective presentation device. ClassEase follows this pattern with role-scoped dashboard feeds "
     "and chart-based presentation.")

section("3.8 Identified Gap and Motivation")
para("Existing approaches either store data without comparative analysis, or provide analytics without data "
     "collection, or restrict comparative views to administration. The identified gap is an integrated platform "
     "that (a) records the full academic workflow and (b) exposes comparative, semester-aware analytics and "
     "rule-based feedback directly to students. ClassEase is designed to fill that gap. The technical realisation "
     "follows the documented Laravel and React ecosystem [3][4][5][6][7][8][9][10][11][12][13][14].")

# =====================================================================================
# CHAPTER 4 — ANALYSIS AND DESIGN
# =====================================================================================
chapter(4, "ANALYSIS AND DESIGN")

section("4.1 System Analysis")
para("The system was analysed from the perspective of the three user roles and the data they exchange. A "
     "typical cycle begins with an administrator creating the master data (teachers, classes, students, "
     "subjects). Teachers then operate the academic modules (attendance, homework, scores). Students consume the "
     "resulting records through dashboards, timetables and the comparative performance views. Two derived "
     "components complete the analysis: the composite leaderboard and the rule-based feedback engine.")

section("4.2 Functional Requirements")
table_tag(4, 3, "Functional Requirements")
tbl(["Requirement", "Description"], [
    ["Authentication", "Registration (student role enforced server-side), login, logout, current-user retrieval"],
    ["Role-based access", "Every protected route gated to role:admin, role:admin,teacher or role:admin,teacher,student"],
    ["Master data CRUD", "Teachers, classes, students and subjects with admin-only writes"],
    ["Linked accounts", "Teacher/student accounts created by admin receive a matching login (email + password)"],
    ["Attendance", "Bulk marking per class and date (present/absent/late), one record per student per day, view by class/date/student"],
    ["Homework", "Create (teachers scoped to their own subjects), list by class, edit, delete (teacher own only), overdue indicator"],
    ["Scores", "Record per student/subject/exam_type/semester; duplicate detection; update and delete"],
    ["Leaderboard", "Rank students of a class by overall average percentage with exam and semester filters"],
    ["Comparative analytics", "Subject comparison, gap-to-top-three analysis, semester progress, head-to-head comparisons"],
    ["Feedback", "Rule-based recommendations from attendance, homework completion and subject gaps"],
    ["Announcements", "Post general or per-class notices; list, edit, delete; role-scoped feeds"],
    ["Timetable", "Per-class weekly grid (periods \u00d7 days), bulk save, teacher and student views"],
    ["Concerns", "Student raise, admin/teacher manage status and reply, automatic resolver tracking"],
    ["Dashboards", "Role-scoped statistics, feeds and charts"],
], font_size=10)

section("4.3 Non-Functional Requirements")
table_tag(4, 4, "Non-Functional Requirements")
tbl(["Category", "Requirement"], [
    ["Security", "Password hashing (bcrypt), bearer-token authentication, route-level RBAC, validated and least-privilege data exposure"],
    ["Performance", "Leaderboard and comparative analytics computed on the fly over indexed score records; Redis caching for derived data"],
    ["Reliability", "Transactions for operations that create linked records; idempotent seeders; unique-constraint enforcement in the database"],
    ["Maintainability", "Pint code style, PHPStan level 7, typed controllers, structured module layout"],
    ["Testability", "Pest test suite covering authentication, RBAC, workflows and analytics"],
    ["Usability", "Role-specialised navigation, clear dashboards, consistent form patterns"],
    ["Portability", "Dockerised deployment; local SQLite fallback for development"],
], font_size=10)

section("4.4 User Roles")
para("Three roles are defined: admin (management), teacher and student. Route groups enforce access at the "
     "transport layer, and controller-level guards (for example isStudentForbidden) enforce object-level "
     "restrictions, such as a student reading only his or her own records or only the roster of his or her own "
     "class.")
table_tag(4, 5, "User Roles and Route-Level Permissions")
tbl(["Feature Area", "admin", "teacher", "student"], [
    ["Dashboard statistics", "\u25cf", "\u2014", "\u2014"],
    ["Teacher/Class/Student/Subject CRUD", "\u25cf", "\u2014", "\u2014"],
    ["Class roster, teacher & subject reads", "\u25cf", "\u25cf", "own class only"],
    ["Attendance / Homework / Scores / Announcements (write)", "\u25cf", "\u25cf", "\u2014"],
    ["Raise a concern", "\u2014", "\u2014", "\u25cf"],
    ["Read endpoints (own data, lists, leaderboard)", "\u25cf", "\u25cf", "\u25cf"],
    ["/me and /logout", "\u25cf", "\u25cf", "\u25cf"],
], col_widths=[3.1, 1.1, 1.1, 1.5])

section("4.5 Use Cases")
bullets([
    "Admin use case: authenticate and manage teachers, classes, students, subjects; view statistics; manage announcements; resolve concerns.",
    "Teacher use case: authenticate; view own profile and subjects; mark attendance; record scores; assign homework; manage timetable and announcements; respond to concerns.",
    "Student use case: authenticate; view own records, class schedule, announcements and homework; raise concerns; explore comparative performance (class, rank, focus, progress, head-to-head).",
    "Cross-cutting use case: any authenticated role retrieves his or her profile and logs out.",
])

section("4.6 System Architecture")
para("The system follows a client\u2013server architecture. A standalone React single-page application consumes a "
     "Laravel JSON API. All protected endpoints require a Sanctum bearer token and pass through the role "
     "middleware. The architecture is shown in Figure 4.1.")
figure_tag("1-architecture-high-level", 1, "ClassEase High-Level System Architecture", width=5.9)

section("4.7 Flow of Project")
para("The operational flow of the system proceeds from master-data creation through the academic modules to "
     "the analytical and feedback views, as illustrated in Figure 4.2.")
figure_tag("0-process-flow", 2, "Flow of Project (Process Model)", width=5.5)

section("4.8 Data Flow")
para("A request flows from the browser to the Vite development server, which proxies /api/ requests to the "
     "Laravel backend (through nginx in the Docker deployment). The Laravel router authenticates the token, "
     "checks the role, dispatches to a controller, and the controller returns JSON data that the client renders. "
     "Figure 4.3 shows this sequence.")
figure_tag("2-request-flow-sequence", 3, "Request / Data Flow Sequence", width=5.9)

section("4.9 Feasibility Study")
bullets([
    "Technical feasibility: the Laravel/React/MySQL/Redis stack is mature, freely available and well documented; a Dockerised setup removes environment variability. Feasible.",
    "Operational feasibility: the three-role interaction model matches the working practices of schools; role-specific pages reduce training effort. Feasible.",
    "Economic feasibility: all core technologies are open source; development and hosting cost are limited to infrastructure. Feasible.",
])

section("4.10 Database Design")
para("The database is relational and normalised around the master entities. The entity relationship diagram in "
     "Figure 4.4 captures the entities, attributes and relationships.")
figure_tag("4-erd", 4, "Entity Relationship Diagram", width=6.35)
para("Table 4.6 lists the principal entities.")
table_tag(4, 6, "Database Entities")
tbl(["Entity", "Primary Reference", "Key Attributes"], [
    ["users", "Authentication", "name, email, password, role, deleted_at"],
    ["teachers", "Teacher master data", "first_name, middle_name, surname, email, contact, designation, monthly_salary, user_id"],
    ["classes", "Class master data", "class_name, section, room_no, class_teacher"],
    ["students", "Student master data", "firstName, middleName, surname, email, password, contact, parentContact, address, classId, user_id"],
    ["subjects", "Subjects of a class", "subjectName, classId, teacherId"],
    ["attendances", "Daily presence", "student_id, class_id, date, status, marked_by, remarks"],
    ["homeworks", "Assignments", "class_id, subject_id, assigned_by, title, description, assigned_date, due_date"],
    ["scores", "Assessment marks", "student_id, subject_id, class_id, exam_type, semester, marks_obtained, total_marks"],
    ["announcements", "Notices", "class_id, title, description, posted_by"],
    ["timetables", "Weekly schedule", "class_id, day, period, subject_id, teacher_id, start_time, end_time"],
    ["concerns", "Student feedback", "student_id, subject, description, status, admin_reply, resolved_by"],
], font_size=10)

section("4.11 Role-Based Access Control and Authorization Design")
para("Authorization is enforced at two levels. The role middleware evaluates the token holder\u2019s role against "
     "route groups: role:admin, role:admin,teacher and role:admin,teacher,student. Object-level rules are "
     "implemented in controllers, for example restricting a student to his or her own records, to the roster of "
     "his or her own class, and to comparisons involving himself or herself within the same class. Figure 4.5 "
     "shows the role hierarchy.")
figure_tag("5-role-hierarchy", 5, "Role Hierarchy and Authorization Design", width=5.3)

section("4.12 Deployment Architecture")
para("The application is containerised with Docker Compose. Services are described in Figure 4.6. Host ports "
     "were retuned so that the stack does not conflict with local services: MySQL maps to host port 3307, Redis "
     "to 6380, nginx to 8080 and the client Vite server to 5174.")
figure_tag("3-docker-architecture", 6, "Docker / Deployment Architecture", width=6.0)

section("4.13 Comparative Performance Logic")
para("The comparative-performance module is implemented by a dedicated backend controller with four read-only "
     "endpoints over the scores table. All comparisons are computed on the fly; no derived tables are stored.")
bullets([
    "Subject comparison: per-student marks and percentages for a chosen class, subject and semester, marking the requester\u2019s own row (is_you) and returning the class average, minimum and maximum.",
    "Gap analysis: for each subject of a student, the student\u2019s percentage is compared with the average of the top three performers and with the class average; gaps are sorted in descending order so the biggest opportunity appears first.",
    "Progress tracking: for each subject, the current semester is compared with the most recent previous semester (determined by latest record date), yielding a delta and a trend (up / down / same) together with a summary of improved and declined counts.",
    "Head-to-head: two students are compared subject by subject for a chosen semester; the response reports percentages, the delta, the leader (A / B / tie / n-a) and a summary of wins; rows are sorted by absolute delta.",
])
figure_tag("0-comparative-flow", 7, "Comparative Performance Logic", width=6.0)
subsection("4.13.1 Composite Leaderboard Policy")
para("For ranking purposes the institution adopts a composite score that combines three components with "
     "explicitly stated weights. These weights are institutional policy constants for this project, not "
     "scientifically established optima. They are documented here so that they may be adjusted as policy.")
table_tag(4, 7, "Composite Score Policy Weights")
tbl(["Component", "Weight"], [
    ["Academics (average percentage across assessed subjects)", "60%"],
    ["Attendance rate", "20%"],
    ["Homework completion", "20%"],
], col_widths=[4.0, 1.5])

section("4.14 Feedback Engine Design")
para("The feedback engine is deliberately rule-based and shallow. It does not employ artificial intelligence or "
     "machine learning. Given a student\u2019s recorded indicators, a small set of policy thresholds produces a "
     "recommendation that is shown in the student\u2019s performance views. The decision rules are visualised in "
     "Figure 4.8 and the thresholds are stated in Table 4.8.")
figure_tag("0-feedback-engine", 8, "Feedback Engine Decision Flow", width=5.5)
table_tag(4, 8, "Feedback Engine Policy Thresholds")
tbl(["Indicator", "Threshold / Condition", "Generated Recommendation"], [
    ["Attendance rate", "Below 85%", "Attendance gap warning with a revision-plan recommendation"],
    ["Homework completion", "Below 90%", "Task-consistency warning"],
    ["Subject gap to top-3 average", "Equal to or greater than 8 percentage points", "Identify the subject as a key opportunity area"],
    ["No rule triggered", "\u2014", "No critical weakness detected"],
], font_size=10)

section("4.15 Module and Navigation Structure")
para("The single-page application organises navigation around the authenticated role. The module and "
     "navigation structure is shown in Figure 4.9.")
figure_tag("6-navigation-flow", 9, "Module and Navigation Structure", width=6.2)

section("4.16 UI / Dashboard Design")
para("Each role receives a dedicated dashboard. The student dashboard presents a class-rank ring, an "
     "attendance breakdown, subject-wise percentage bars, a comparison of the student against the class average "
     "and the top three, a progress-over-time chart and a homework overview. The teacher dashboard presents "
     "attendance summaries, class performance by subject and per-student performance. The management dashboard "
     "presents school-wide counts, students-per-class, class performance and score distribution. Charts are "
     "drawn with Recharts and are organised in a responsive, card-based layout.")

section("4.17 Technologies Used")
table_tag(4, 9, "Technologies Used")
tbl(["Purpose", "Technology"], [
    ["Backend framework", "Laravel 13 (PHP 8.3)"],
    ["Authentication", "Laravel Sanctum (bearer tokens, bcrypt hashing)"],
    ["Primary database", "MySQL 8"],
    ["Caching / sessions / queues", "Redis 7 (cache-aside; MySQL remains the source of truth)"],
    ["Frontend", "React 18, TypeScript, Vite"],
    ["Styling", "Tailwind CSS 3.4"],
    ["Charts", "Recharts"],
    ["Testing", "Pest (PHPUnit based)"],
    ["Static analysis", "PHPStan level 7, Pint"],
    ["Deployment", "Docker, docker compose, nginx, PHP-FPM"],
], col_widths=[2.3, 3.8])

# =====================================================================================
# CHAPTER 5 — IMPLEMENTATION
# =====================================================================================
chapter(5, "IMPLEMENTATION")

section("5.1 Development Environment")
table_tag(5, 1, "Development Environment")
tbl(["Item", "Setting"], [
    ["Operating system", "Windows (host); Linux containers for verification and deployment"],
    ["Local PHP", "XAMPP PHP 8.2.12 (Pint runs locally)"],
    ["Verification PHP", "Docker container with PHP 8.3 (PHPStan, artisan, tests)"],
    ["Backend", "Laravel 13, SQLite locally / MySQL in Docker"],
    ["Frontend", "Vite dev server on port 5173 (local) and 5174 (Docker)"],
    ["Package managers", "Composer 2 (backend), npm (frontend)"],
    ["Container tooling", "Docker Desktop (daemon v29.4.0)"],
], col_widths=[1.9, 4.2])

section("5.2 Backend Implementation")
para("The backend is organised as models, controllers and route definitions. Eloquent models map the database "
     "tables described in Chapter 4. Controllers expose the resource operations, and three role-scoped groups "
     "in the API route file apply the role middleware.")
para("Two implementation details are noteworthy. First, the Homework model explicitly declares its table name "
     "because Eloquent treats \u201chomework\u201d as an uncountable noun: ")
par = doc.add_paragraph(); par.paragraph_format.left_indent = Inches(0.5)
r = par.add_run("protected $table = 'homeworks';")
r.font.name = "Consolas"; r.font.size = Pt(10)
para("Second, the rank values of the leaderboard are injected into the response collection during mapping "
     "(previously a by-reference loop over an Eloquent collection never wrote the rank back, so ranks were "
     "absent from the JSON). Combined with ordered score aggregation this yields a correct, exam- and "
     "semester-aware ranking.")

section("5.3 Authentication and Role-Based Access Control")
para("Authentication uses Laravel Sanctum bearer tokens. Registration always creates a student account: the "
     "role is forced server-side and a client-supplied role is ignored. Login verifies credentials against the "
     "users table and issues a token. The role alias (RoleMiddleware) then gates every protected route. "
     "Admin-created teachers and students receive linked login accounts within a transaction; updates keep the "
     "linked login in sync, and deletion revokes the login (soft-deletes on users). Email uniqueness is "
     "validated against non-deleted rows only, which permits email reuse after deletion.")

section("5.4 API Implementation")
para("Routes are declared in routes/api.php under three role-scoped middleware groups plus the public "
     "authentication endpoints. Route ordering is significant: literal segments such as /student/me and "
     "/concerns/student are declared before parameterised segments such as /student/{id} so that the router does "
     "not swallow them. The API surface includes authentication, master data, attendance, homework, scores, "
     "leaderboard, announcements, timetable, concerns, comparative performance and the dashboard feed.")

section("5.5 Database Implementation")
para("The schema is created through migrations. Notable constraints include the composite uniqueness on scores "
     "(student_id, subject_id, exam_type, semester), the per-day uniqueness on attendance (student_id, date), "
     "the week-slot uniqueness on timetables (class_id, day, period), and soft deletes on users, students and "
     "teachers. A dedicated migration makes the homework assignment owner nullable, allowing administration to "
     "create homework records without a linked teacher profile.")

section("5.6 Dashboard Implementation")
para("The three role dashboards were rebuilt with Recharts. The student dashboard resolves the authenticated "
     "user\u2019s own student row through a dedicated endpoint (user identifiers differ from student identifiers in "
     "the seed data) and charts the student\u2019s rank, attendance, subject percentages, comparisons and progress. "
     "The teacher dashboard resolves the teacher\u2019s own profile in the same way. The management dashboard "
     "summarises school-wide counts and class performance. Every dashboard additionally includes a notices and "
     "tasks feed scoped to the role.")

section("5.7 Attendance, Homework and Scores Implementation")
bullets([
    "Attendance: a bulk endpoint marks one record per student per class and date; the database enforces uniqueness; records carry a status (present / absent / late), a marker (teacher) and optional remarks.",
    "Homework: creation validates class, subject, title and dates; teachers may only assign within their own subjects; editing and deletion are restricted to the assigning teacher; a class-wise listing shows deadlines and overdue state.",
    "Scores: creation validates student, subject, class, exam type, semester, and marks; a composite-unique check returns HTTP 409 for duplicates; reads expose only safe columns and present marks and percentages.",
])

section("5.8 Leaderboard and Comparative Analytics Implementation")
bullets([
    "The leaderboard endpoint aggregates score sums (marks obtained over total marks) per class, applies optional exam and semester filters, orders descending and injects the rank into each entry.",
    "The subject-comparison endpoint computes per-student percentages and the class minimum, maximum and average for the selected subject and semester.",
    "Gap analysis computes, per subject, the gap between the student\u2019s percentage, the top-three average and the class average; results are sorted by descending gap.",
    "Progress tracking compares the \u201ccurrent\u201d semester with the latest other semester by record date and produces per-subject deltas and trends.",
    "Head-to-head compares two students across the union of their subject records for a semester and returns the leader per subject plus a win summary.",
    "Student access is guarded so that a student can only read his or her own analytic results and own-class comparisons.",
])

section("5.9 Feedback Engine Implementation")
para("The feedback engine is implemented as a shallow, rule-based computation over the derived indicators "
     "described in Chapter 4. Its recommendations are surfaced in the student \u201cWhere to Focus\u201d view. The engine "
     "evaluates the attendance rate against the 85% policy threshold, homework completion against the 90% "
     "threshold, and the per-subject gap to the top-three average against the 8-point threshold, generating the "
     "corresponding recommendations listed in Table 4.8. The rules are transparent and configurable as policy "
     "constants.")

section("5.10 Announcements, Timetable and Concerns Implementation")
bullets([
    "Announcements: class-scoped records with a null class denoting a general announcement; students see their own class plus general notices; the dashboard feed is role-scoped.",
    "Timetable: a bulk save operation idempotently updates the whole class grid (periods \u00d7 days), deleting removed slots and auto-filling the teacher from the subject; read views exist for class and teacher.",
    "Concerns: a student raises a concern whose subject and description are recorded and whose student is resolved from the authenticated account; staff update the status and reply, and the resolver is recorded automatically; students are scoped to their own concerns.",
])

section("5.11 Caching and Performance")
para("Redis is used for caching, sessions and queues in the deployed stack; the application follows a "
     "cache-aside approach in which MySQL remains the source of truth. Leaderboards and comparative analytics "
     "are computed over indexed score records, and no redundant derived tables are maintained.")

section("5.12 Validation and Error Handling")
bullets([
    "Server-side validation is applied on every create and update operation; controller methods are typed with explicit return types to keep static analysis precise.",
    "Duplicate detection returns HTTP 409 for repeated composite records (scores) and validation failures return 422 with field-scoped messages.",
    "Role and ownership violations return 403; missing records return 404.",
    "Transactions wrap multi-record operations such as account creation and timetable bulk saves.",
    "Relations that controllers eager-load are declared on the models, keeping both runtime and static analysis correct.",
])

section("5.13 Testing")
para("Testing is performed with Pest under the development verification container. Environment overrides force "
     "an isolated, in-memory SQLite database for the test run. The suite covers authentication, role-based "
     "access, the linked-account lifecycle, dashboard feed scoping, teacher workflows and a leaderboard ranking. "
     "Table 5.2 records the verified results at the time this report was prepared.")
table_tag(5, 2, "Verification and Test Results")
tbl(["Check", "Tool / Command", "Result (latest baseline)"], [
    ["PHP static analysis", "PHPStan level 7", "0 errors"],
    ["Automated tests", "Pest (artisan test)", "20 passed / 81 assertions"],
    ["PHP code style", "Pint", "Passed"],
    ["JavaScript lint", "ESLint", "Passed"],
    ["JavaScript format", "Prettier", "Passed"],
    ["JavaScript types", "tsc --noEmit", "Passed"],
    ["Frontend build", "Vite + TypeScript", "Passed"],
    ["Full-stack smoke", "docker compose + API/login/me/classes", "Passed"],
], font_size=10)

section("5.14 Interface Screens")
para("The representative screens of the application are presented below. The figures are placeholders until "
     "actual captures from the running application are inserted before submission.")
para("Figure 5.1 shows the login interface, which is the entry point for all roles.")
placeholder_box("[Screenshot to be inserted: Login interface]")
cap = doc.add_paragraph(); cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = cap.add_run("Figure 5.1: Login Interface"); r.bold = True; r.font.name = BODY_FONT; r.font.size = Pt(10)
para("Figure 5.2 shows the management dashboard with statistical cards and charts.")
placeholder_box("[Screenshot to be inserted: Management dashboard]")
cap = doc.add_paragraph(); cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = cap.add_run("Figure 5.2: Management Dashboard"); r.bold = True; r.font.name = BODY_FONT; r.font.size = Pt(10)
para("Figure 5.3 shows the student performance page with the comparative views.")
placeholder_box("[Screenshot to be inserted: Student Performance page]")
cap = doc.add_paragraph(); cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = cap.add_run("Figure 5.3: Student Performance Page"); r.bold = True; r.font.name = BODY_FONT; r.font.size = Pt(10)

section("5.15 Demonstration Credentials")
para("The following development accounts are used to demonstrate the system. These are development and "
     "demonstration credentials only and must never be used in a production environment.")
table_tag(5, 3, "Demonstration (Development) Credentials")
tbl(["Role", "Email", "Password"], [
    ["Admin", "admin@classease.com", "ClassEase@123 (DEV ONLY)"],
    ["Teacher", "teacher1@classease.com, teacher2@classease.com, teacher3@classease.com", "ClassEase@123 (DEV ONLY)"],
    ["Student", "student1@classease.com \u2026 student6@classease.com", "ClassEase@123 (DEV ONLY)"],
], col_widths=[1.2, 3.6, 2.3])

# =====================================================================================
# CHAPTER 6 — CONCLUSION AND FUTURE SCOPE
# =====================================================================================
chapter(6, "CONCLUSION AND FUTURE SCOPE")

section("6.1 Project Summary")
para("ClassEase was designed and implemented as a role-secured academic platform that records the school "
     "workflow and converts the accumulated records into comparative, semester-aware insight for students. The "
     "system integrates master data, attendance, homework, scores, leaderboards, announcements, timetables and "
     "concerns, and derives from the scores a set of comparative analytics supported by a rule-based feedback "
     "engine.")

section("6.2 Objectives Achieved")
bullets([
    "A centralized platform for school operations was delivered across all planned modules.",
    "Role-based access control was enforced on every protected endpoint.",
    "Attendance tracking with bulk marking and per-day uniqueness was implemented.",
    "Homework assignment and tracking with deadlines and overdue indicators was completed.",
    "Semester-aware score management with a composite-leaderboard view was implemented.",
    "Comparative performance analytics (classmates, gaps, progress, head-to-head) were delivered to students.",
    "A transparent, rule-based feedback engine with clearly stated policy thresholds was provided.",
    "Role-specific analytical dashboards with charts were completed for all three roles.",
    "The quality gates were satisfied: zero PHPStan errors, a passing test suite, and passing lint, format, type and build checks.",
])

section("6.3 Major Contributions")
bullets([
    "A comparative-performance design that pairs every rank or result with actionable comparison (class, top three, past self).",
    "Semester-aware data model and analytics enabling time-based comparison.",
    "A layered authorization design combining route-level roles and object-level guards.",
    "A documented composite-score and feedback-threshold policy that institutions can tune.",
    "A Dockerised, reproducible toolchain with a stable verification process.",
])

section("6.4 Limitations")
bullets([
    "The feedback engine is rule-based and intentionally shallow; it does not learn from outcomes and does not use artificial-intelligence or machine-learning techniques.",
    "Seed and demonstration data are synthetic; conclusions about general school workloads are limited.",
    "There is no offline mode; the client depends on connectivity to the backend.",
    "Ranking can be psychologically sensitive; the system mitigates this with accompanying guidance but does not eliminate the consideration.",
    "Composite weights (60/20/20) and feedback thresholds are institutional policy choices and are not empirically validated optima.",
    "Object-level hardening is complete for student self-scoping; some teacher write routes rely primarily on the user interface for subject scoping.",
])

section("6.5 Future Scope")
bullets([
    "Code-splitting the chart library to reduce the initial bundle size.",
    "A Grade/Grade-Point engine built on the semester-aware score records.",
    "Email or SMS notifications for homework deadlines and concern replies.",
    "Report export (PDF/Excel) for scores, attendance and leaderboards.",
    "A parent portal providing read-only visibility into a student\u2019s records.",
    "Aphoristic model improvement of the feedback rules with more historical data.",
    "Deeper, data-driven feedback that extends the current rule set.",
])

section("6.6 Final Conclusion")
para("ClassEase fulfils its stated objective of consolidating academic records and exposing comparative, "
     "semester-aware analytics to students in a secure, role-based platform. The system is functionally complete "
     "across its planned modules and passes the verified quality gates. It does not claim to solve every problem "
     "of educational analytics; its feedback engine is explicitly rule-based and its scoring policy is an "
     "institutional choice. Within those honest boundaries, ClassEase provides a coherent, reproducible and "
     "extensible foundation for comparative academic performance, ranking and feedback in a school setting.")

# =====================================================================================
# CHAPTER 7 — REFERENCES
# =====================================================================================
chapter(7, "REFERENCES")
refs = [
    "Bloom, B. S. (1984). The 2 Sigma Problem: The Search for Methods of Group Instruction as Effective as One-to-One Tutoring. Educational Researcher, 13(6), 4\u201316.",
    "Hattie, J. (2009). Visible Learning: A Synthesis of Over 800 Meta-Analyses Relating to Achievement. Routledge.",
    "Laravel Documentation. Laravel 13.x. Available: https://laravel.com/docs",
    "Laravel Sanctum Documentation. Available: https://laravel.com/docs/sanctum",
    "React Documentation. Available: https://react.dev",
    "TypeScript Documentation. Available: https://www.typescriptlang.org/docs",
    "Vite Documentation. Available: https://vitejs.dev",
    "Tailwind CSS Documentation. Available: https://tailwindcss.com/docs",
    "Recharts Documentation. Available: https://recharts.org",
    "MySQL 8.0 Reference Manual. Available: https://dev.mysql.com/doc/refman/8.0/en/",
    "Redis Documentation. Available: https://redis.io/docs",
    "PHPStan Documentation. Available: https://phpstan.org",
    "Pest PHP Testing Documentation. Available: https://pestphp.com/docs",
    "Docker Documentation. Available: https://docs.docker.com",
]
for i, ref in enumerate(refs, 1):
    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    par.paragraph_format.left_indent = Inches(0.5)
    par.paragraph_format.first_line_indent = Inches(-0.5)
    r = par.add_run(f"[{i}]   {ref}")
    r.font.name = BODY_FONT
    r.font.size = Pt(12)
para("Note regarding the literature review: the sources above are the verifiable references currently "
     "consolidated for this project. Any additional institutional reference list should be merged into this "
     "chapter before submission.")

# =====================================================================================
# GLOSSARY
# =====================================================================================
chapter_gl = doc.add_paragraph(style="Heading 1")
chapter_gl.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = chapter_gl.add_run("GLOSSARY")
set_font(r)
glossary = [
    ("API", "Application Programming Interface; the set of endpoints through which the client and server communicate."),
    ("RBAC", "Role-Based Access Control; the enforcement of permissions according to a user\u2019s assigned role."),
    ("CRUD", "Create, Read, Update, Delete; the four basic operations on persistent data."),
    ("Redis", "An in-memory data structure store used here for caching, sessions and queues."),
    ("Sanctum", "Laravel\u2019s lightweight token-based authentication package used for API authentication."),
    ("Composite Score", "A weighted combination of academics, attendance and homework used for class ranking under institutional policy."),
    ("Cache-Aside", "A caching pattern in which the application checks the cache, then the source of truth (MySQL) on a miss, and populates the cache."),
    ("REST", "Representational State Transfer; a stateless, resource-oriented architectural style for web services."),
    ("ORM", "Object-Relational Mapping; the technique of mapping database tables to application objects (Eloquent)."),
    ("SPA", "Single-Page Application; a client-side application that updates the view without full page reloads."),
    ("Leaderboard", "A ranked list of students of a class ordered by their overall average percentage."),
    ("Gap Analysis", "The comparison of a student\u2019s subject percentage with the top-three and class averages."),
    ("Head-to-Head", "A per-subject comparison between two students for a chosen semester."),
    ("Semester", "A free-form academic period label attached to score records, used for time-based comparison."),
    ("Pest", "A testing framework built on PHPUnit, used for the automated test suite."),
    ("PHPStan", "A static analysis tool for PHP, configured here at level 7."),
]
for term, definition in glossary:
    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    par.paragraph_format.left_indent = Inches(0.4)
    par.paragraph_format.first_line_indent = Inches(-0.4)
    r = par.add_run(f"{term}: ")
    r.bold = True
    r.font.name = BODY_FONT
    r.font.size = Pt(12)
    r2 = par.add_run(definition)
    r2.font.name = BODY_FONT
    r2.font.size = Pt(12)

# =====================================================================================
# APPENDICES
# =====================================================================================
# --- Heading 1 for appendices (no \c seq, but a new heading page) ---
def appendix_title(text):
    doc.add_page_break()
    h = doc.add_paragraph(style="Heading 1")
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = h.add_run(text)
    set_font(r)

appendix_title("APPENDIX A: ROLE\u2013PERMISSION MATRIX")
para("The table below maps the feature areas to the three roles at the route level, as implemented by the "
     "role middleware groups and object-level guards.")
table_tag("A", 1, "Detailed Role\u2013Permission Matrix")
tbl(["Feature Area / Route Group", "admin", "teacher", "student"], [
    ["Dashboard statistics (/dashboard/stats)", "\u25cf", "\u2014", "\u2014"],
    ["Classes CRUD", "\u25cf", "\u2014", "\u2014"],
    ["Teachers CRUD (+ linked login)", "\u25cf", "\u2014", "\u2014"],
    ["Students CRUD (+ linked login)", "\u25cf", "\u2014", "\u2014"],
    ["Subjects CRUD", "\u25cf", "\u2014", "\u2014"],
    ["Teacher detail / own profile (/teacher/me)", "\u25cf", "\u25cf", "\u2014"],
    ["Teacher subjects", "\u25cf", "\u25cf", "\u2014"],
    ["Subjects of a class", "\u25cf", "\u25cf", "\u2014"],
    ["Attendance - mark / update / view by date", "\u25cf", "\u25cf", "\u2014"],
    ["Homework - create / update / delete", "\u25cf", "\u25cf (own subjects)", "\u2014"],
    ["Scores - record / update / delete", "\u25cf", "\u25cf", "\u2014"],
    ["Announcements - post / update / delete", "\u25cf", "\u25cf", "\u2014"],
    ["Timetable - save / update / delete", "\u25cf", "\u25cf", "\u2014"],
    ["Concerns - manage / respond / delete", "\u25cf", "\u25cf (no delete)", "raise only"],
    ["Student /me identity", "\u25cf", "\u25cf", "\u25cf"],
    ["Student roster of a class", "\u25cf", "\u25cf", "own class only"],
    ["Attendance / homework / scores reads", "\u25cf", "\u25cf", "\u25cf (own / own class)"],
    ["Leaderboard read", "\u25cf", "\u25cf", "\u25cf"],
    ["Comparative performance reads", "\u25cf", "\u25cf", "own + own-class H2H"],
    ["Announcements / timetable reads", "\u25cf", "\u25cf", "\u25cf"],
    ["Dashboard feed (/dashboard/feed)", "\u25cf", "\u25cf", "\u25cf"],
    ["/me and /logout", "\u25cf", "\u25cf", "\u25cf"],
], font_size=9.5)

appendix_title("APPENDIX B: PROJECT VERIFICATION / TESTING SUMMARY")
para("This appendix records the verification stages applied to the project at the time of writing. The full "
     "commands and environment notes are maintained in the project checkpoint documentation.")
table_tag("B", 1, "Full-Stage Verification Summary")
tbl(["Stage", "Result", "Remarks"], [
    ["PHPStan (level 7)", "0 errors", "All historical (pre-existing) errors resolved; relation and typing fixes applied"],
    ["Automated tests (Pest)", "20 passed / 81 assertions", "Auth, RBAC, linked accounts, feed, teacher workflow, leaderboard suites"],
    ["PHP code style (Pint)", "Passed", "Laravel preset, parallel checks"],
    ["JS lint (ESLint)", "Passed", "classEase application only"],
    ["JS format (Prettier)", "Passed", "classEase application only"],
    ["JS type check (tsc)", "Passed", "classEase application only"],
    ["Client production build", "Passed", "TypeScript + Vite build"],
    ["Full-stack smoke test", "Passed", "Register / login / me / classes via nginx; SPA via Vite proxy"],
    ["Docker stack", "Up and serving", "MySQL, Redis, app, queue, client, nginx"],
], font_size=9.5)
para("Test account details and the SQLite in-memory test invocation are described in Chapter 5.")

appendix_title("APPENDIX C: REQUIRED SUBMISSION ATTACHMENTS")
para("The following attachments are required for final submission. They are institution-generated documents "
     "and therefore cannot be produced by this report. Placeholders exist in the front matter of this "
     "document.")
bullets([
    "Institution-approved project proposal (signed) \u2014 see front-matter placeholder.",
    "Plagiarism / similarity report issued by the institution\u2019s approved tool \u2014 see front-matter placeholder.",
    "Completed certificate, declaration and acknowledgement pages with the required signatures and college seal.",
    "Any additional institutional checklists (seminar evaluation, viva voce sheet, CD/journal submission form).",
])

doc.save(OUT)
print("SAVED", OUT)