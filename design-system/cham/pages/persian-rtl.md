# Override: Persian RTL (all pages)

Overrides MASTER.md for every page of CHAM Store OS.

- **Body font:** Vazirmatn replaces Montserrat (Montserrat has no Persian glyphs). Self-hosted via `@fontsource/vazirmatn`.
- **Display font:** Cormorant kept for Latin wordmark only (`CHAM`, `FJCOD`).
- **Direction:** `dir="rtl"`; charts render time right→left; numbers are tabular and Persian-digit.
- **Accent:** `#A16207` on light, `#D4A84B` on dark (validated ≥3:1 against chart surfaces).
- **Authentic motif:** khatam (8-point star) girih pattern at ≤22% opacity on dark surfaces only.
- **Density:** dashboard density (7/10) — tables 11px vertical cell padding, 40px min control height (52px for primary register actions).
