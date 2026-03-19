# Family CFO Report — Project Notes

## Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Recharts for charts, Framer Motion for animations
- PapaParse for CSV parsing, Dexie.js (IndexedDB) for local persistence
- Claude API (claude-sonnet-4-6) via Anthropic SDK for categorization + narratives

## Key Files
- `models/types.ts` — all core TypeScript interfaces
- `lib/categories.ts` — canonical category list with colors/icons
- `lib/csv/` — CSV parsing and normalization
- `lib/ai/` — merchant lookup table, prompt templates, batch categorization
- `lib/analysis/` — aggregation, gamification scoring
- `app/api/categorize/` — Claude batch categorization endpoint
- `app/api/narrative/` — Claude narrative + habit detection endpoint
- `hooks/useAnalysis.ts` — main analysis orchestration hook
- `components/slides/` — slide engine + all 11 slide components

## Flow
1. User uploads CSV → column mapping → options (family name, net worth)
2. `useAnalysis` runs: local merchant lookup → AI batch categorization → aggregation → gamification → AI narrative
3. Report stored in `sessionStorage` → redirect to `/presentation`
4. `/presentation` renders full-screen slide deck via `SlideEngine`

## Environment
- Requires `ANTHROPIC_API_KEY` in `.env.local`
- No database needed — all data stored client-side in IndexedDB + sessionStorage

## Planned Future Features
- Plaid API integration (replace CSV upload)
- Amazon order history CSV parser
- Venmo transaction parser
- Multi-period comparison (YoY)
- Sharable report links
