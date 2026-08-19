# 370R JEE Advanced Tracker

GitHub Pages-ready static website.

## Files
- `index.html` — page structure, dashboard and 15-day tracker
- `style.css` — all styling and responsive layout
- `script.js` — tracker logic, save/load, dates, subject-wise question stats and PDF export
- `tracker-template.png` — original supplied tracker template (kept for reference)

## Columns
The tracker now records these separately:
- Physics HW / Class Illustration / DPP / PYQ
- Chemistry HW / Class Illustration / DPP / PYQ
- Mathematics HW / Class Illustration / DPP / PYQ
- Lectures

Numeric entries such as `18Q` or `12/15` are counted from their first number. `done` is treated as 0 because it has no numeric question count.

## Dashboard
The dashboard automatically shows:
- total lectures
- total questions done
- total PYQs
- average questions per filled day
- Physics, Chemistry and Maths breakdown for HW, Class Illustration, DPP and PYQ
- subject totals and overall total

## Save / Load
Progress is stored in browser localStorage. The script also attempts to migrate data from the previous tracker version so existing dates/lectures and old combined numeric fields are not simply discarded.

## GitHub Pages
Upload all four files to the root of a GitHub repository. Then: Settings → Pages → Deploy from branch → `main` → `/ (root)` → Save.
