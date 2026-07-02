# Wire Bundle Estimator — Agarwal Enterprises

Internal web tool for building a wire order across sizes and instantly
comparing what it would cost from every competing brand, with live discount
control and GST, plus clean image / PDF / WhatsApp / print export.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + shadcn/ui-style components (navy + amber palette)
- **SheetJS (xlsx)** — parses the uploaded rate list client-side
- **Zustand** (+ `persist`) — global state in memory and `localStorage`
- **html2canvas + jsPDF** — image / PDF export
- No backend, no auth. All data lives in the browser.

## How it works

1. **Upload Rate List (.xlsx)** — brands, wire types and coil lengths are
   auto-detected from the file. Only the six sizes (0.75, 1, 1.5, 2.5, 4, 6
   sq mm) are fixed. Banner/section rows are ignored, and discounts stored as
   fractions (`0.41`) or whole percents (`41`) are both handled.
2. **Estimator** — enter quantities in 90 m-equivalent units (10 = 900 m), add
   sizes to the cart.
3. **Comparison** — every brand priced for the full cart, cheapest coil length
   per brand by default, expandable to compare lengths and pin a pack size.
4. **Discounts** — per-brand extra discount (−20% to +20%), applied additively
   on MRP, live into the comparison.
5. **GST** — 0% or 18% (shown as CGST 9% + SGST 9%).
6. **Export** — Image (PNG), PDF (letterhead), WhatsApp (Web Share API with a
   desktop download + `wa.me` fallback), and Print.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploy (Vercel, no backend)

```bash
npm run build    # confirm a clean build first
npm i -g vercel
vercel login     # interactive — complete this once
vercel --prod    # returns a public *.vercel.app URL
```

No environment variables are required for this phase.

## Data model (rate list columns)

| Column | Notes |
|---|---|
| Brand | auto-detected |
| Wire Type | auto-detected (e.g. "Standard") |
| Size (sq mm) | one of the six fixed sizes |
| Length (m) | coil length, varies by brand |
| MRP Rate (Rs) | printed/list price |
| Discount (%) | base discount (fraction or percent) |
| Net Rate (Rs) | recomputed as MRP × (1 − discount) |

> Phase 2: a Supabase persistence layer will replace `localStorage`. The stub
> is marked in `app/discounts/page.tsx`.
