# Attendance Calculator — Placement Excusals

Local-first Next.js app for NMIMS students: parse the hour-wise SAP attendance
PDF, excuse absent hours as placement drives (company + drive description), and
print a course-wise attendance report in the official `sheet.PDF` format with a
placement annexure.

## Usage

```bash
npm install        # also copies the pdf.js worker into public/
npm run dev        # http://localhost:3000
```

1. Drop your hour-wise attendance PDF (SAP export) on the upload screen.
2. Tick absent hours (optionally "Select all" per date).
3. Enter company + drive description → Save drive.
4. Watch per-subject original vs corrected % (80% line marked).
5. "View report" → "Download PDF" (browser print → Save as PDF).

## Rules

| Status | Conducted | Attended |
|---|---|---|
| P / L | yes | yes |
| A | yes | only if tagged to a placement drive |
| NU / E | no | no |

## Data & privacy

Everything runs in the browser — PDFs are parsed locally and never uploaded or stored. Attendance
history and drive assignments auto-save in localStorage, keyed by SAP student number.

## Tests

```bash
npm test
```
