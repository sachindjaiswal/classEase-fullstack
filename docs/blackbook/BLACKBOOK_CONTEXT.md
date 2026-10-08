# ClassEase Blackbook — Build Context

Status snapshot: last built 2026-09-28 from `build_blackbook.py` (this folder).

## Deliverables (in repo root)
- `ClassEase_Blackbook.docx` — editable Word (0.9 MB)
- `ClassEase_Blackbook.pdf` — 48 pages (0.92 MB)

## Structure (mirrors the scanned `Dastagir Blackbook.pdf` sample)
- Front matter (page i–xii, roman numerals): Cover → CERTIFICATE → DECLARATION → ACKNOWLEDGEMENT → ABSTRACT → LIST OF FIGURES → LIST OF TABLES → INDEX (real Word TOC field) → APPROVED PROJECT PROPOSAL (placeholder) → PLAGIARISM / SIMILARITY REPORT (placeholder)
- Body (page 1–36, arabic, restarts at 1): CHAPTER 1 Project Overview · 2 Introduction and Motivation · 3 Literature Review · 4 Analysis and Design · 5 Implementation · 6 Conclusion and Future Scope · 7 References
- Back matter: GLOSSARY · APPENDIX A Role–Permission Matrix · APPENDIX B Project Verification / Testing Summary · APPENDIX C Required Submission Attachments

## QA facts (verified)
- 12 figures sequential: 4.1–4.9 (diagrams) + 5.1–5.3 (screen placeholder boxes)
- 14 tables sequential: 4.1–4.9, 5.1–5.3, A.1, B.1
- Fonts: Times New Roman (Consolas only in code refs); body 12pt justified; 1.5" binding margin (left)
- No "Dastagir" string anywhere; author name = Shaikh Farhan
- Content facts used: 20 tests / 81 assertions; PHPStan level 7 = 0 errors; composite weights 60/20/20 labelled as institutional policy constants; feedback engine labelled rule-based (not AI/ML)

## Still to be filled by the student (12 placeholders + inserts)
- `[Name of College]`, `[City, State – PIN Code]`, `[20XX – 20XX]`, `[Roll Number]`, `[Seat Number]`, `[Name of Project Guide]`, `[Name of Co-Guide / Mentor]`, `[Name of HOD / Coordinator]`, `[Affix College Seal here]`
- Approved project proposal page — insert signed, institution-approved ClassEase proposal
- Plagiarism / similarity report page — insert genuine report
- Figures 5.1 (login), 5.2 (dashboard), 5.3 (student performance) — replace placeholder boxes with real screenshots
- Chapter 7 references — optional: merge in the institution's required citation list

## How to rebuild after changes
```
python docs/blackbook/build_blackbook.py          # regenerates ClassEase_Blackbook.docx (run from repo root)
```
Then update the TOC and export PDF with Word (pywin32, installed):
```python
import win32com.client as win32
word = win32.DispatchEx("Word.Application"); word.Visible = False; word.DisplayAlerts = 0
doc = word.Documents.Open(r"ClassEase_Blackbook.docx", ReadOnly=False)
for toc in doc.TablesOfContents: toc.Update()
doc.Fields.Update(); doc.Repaginate(); doc.Save()
doc.ExportAsFixedFormat(r"ClassEase_Blackbook.pdf", 17)
doc.Close(False); word.Quit()
```

## Notes / gotchas
- Section break (roman → arabic restart) is inserted in the script just before CHAPTER 1; do not move it to the end of the script.
- `chapter(1, ..., first=True)` omits the leading page break so body page 1 is not blank.
- Diag images live in `docs/diagrams/*.png`; mermaid sources in this folder (`diagram-code.md`). kroki.io fails on these graphs — re-render via mermaid.ink plain base64.