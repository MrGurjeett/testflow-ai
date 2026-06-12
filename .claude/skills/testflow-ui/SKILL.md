---
name: testflow-ui
description: Conventions and gotchas for the TestFlow AI dashboard UI (Next.js 16 + React 19 + Tailwind v4). Use when editing anything under src/components or src/app — covers required custom Tailwind tokens, the light/dark theme mechanism, preventing text overlap/truncation in cards & headers, and mapping the Azure Foundry agent response to UI state.
---

# TestFlow AI — UI conventions

Stack: Next.js 16, React 19, Tailwind CSS v4 (no `tailwind.config`; theme lives in `src/app/globals.css`). Dark-first dashboard. The whole UI is built on hardcoded `zinc-*` utilities with **no `dark:` variants**.

## 1. Custom Tailwind tokens MUST be declared in globals.css

Tailwind v4 has a dynamic scale only for *spacing* (so `h-4.5`, `w-22` work). Font sizes and colors do **not** auto-generate — an undefined class emits **no CSS at all** and fails silently (text falls back to 16px and overflows its box; borders/colors disappear).

These custom tokens are defined in the `@theme` block of `src/app/globals.css` and are the only non-standard ones allowed:

- Font sizes: `text-2xs` (11px), `text-3xs` (10px), `text-4xs` (9px)
- Colors: `zinc-350`, `zinc-850`, `indigo-550`, `cyan-450`

**Rule:** before using any new `text-*` size or custom color step, add it to `@theme` in globals.css — or don't use it. Don't introduce ad-hoc shades like `zinc-750`.

## 2. Light / dark theme

There are no `dark:` variants. Theming works by **overriding the color CSS variables** that Tailwind v4 compiles colors into (`bg-zinc-950` → `background-color: var(--color-zinc-950)`):

- `globals.css` has a `:root.light { ... }` block (unlayered, so it beats Tailwind's layered theme) that **inverts the zinc ramp** (surfaces → light, text → dark) and remaps `--color-white` to near-black.
- The `.light` class is toggled on `<html>` by `src/app/page.tsx` (state + `localStorage`) and pre-applied before paint by an inline script in `src/app/layout.tsx` (prevents FOUC).

**Rules:**
- To add a theme-aware color, use the existing `zinc-*` / `white` utilities — they flip automatically. Don't hardcode hex in `style={}`.
- An element that must **stay white on a saturated accent background** (e.g. text/icon on an indigo/gradient button) must use literal `text-[#fff]`, NOT `text-white` (which becomes dark in light mode). Existing examples: Run button, sidebar logo, header avatar.
- Keep both palettes in mind — test every change in light *and* dark.

## 3. Preventing text overlap / truncation (the #1 recurring bug)

Cards sit in narrow grids (up to 4 across), so headers and labels are space-constrained. Follow these patterns:

**Card header = icon + status badge, then full-width title below** (see `AgentCard.tsx`). Do NOT put a long title on the same row as the icon and badge — in a narrow card the title gets squeezed into a few characters per line and collides with the badge. Instead stack:
```jsx
<div className="p-5">
  {/* row 1: icon left, status right */}
  <div className="flex items-center justify-between gap-2">
    <div className="... flex-shrink-0">{icon}</div>
    <span className="... flex-shrink-0 whitespace-nowrap">{status}</span>
  </div>
  {/* row 2: title spans the full card width */}
  <div className="mt-3 min-w-0">
    <h3 className="... leading-tight break-words">{title}</h3>
    <span className="... block break-words">{role}</span>
  </div>
</div>
```
The badge still needs `flex-shrink-0 whitespace-nowrap`. Giving the title the full card width is what lets it read on one or two clean lines.

**Grid cells overflow if you forget `min-w-0`.** CSS grid/flex items default to `min-width: auto`, so a long unbreakable label (e.g. "ASSUMPTIONS") pushes past the box edge. Every metric cell AND the label inside get **`min-w-0`** so `break-words` can actually wrap. This was the cause of text spilling out of metric boxes.

**Narrow metric labels** (see `MetricsCard.tsx`): do **not** `truncate` — let them wrap. Use `break-words leading-tight min-w-0` (drop `tracking-wide` to save width) and reserve `min-h-[28px]` so values stay aligned across the 2-col grid.

**Metric values** that can be strings (not just numbers, e.g. a framework name): add `break-words` so long values don't overflow the box.

**Label + small badge rows** (e.g. "User Story" + "121 characters"): label gets `min-w-0`, the trailing badge gets `flex-shrink-0 whitespace-nowrap`.

General rule of thumb: in any flexbox where one side can be long, the **flexible** side gets `min-w-0` (+ wrapping), the **fixed** side gets `flex-shrink-0`. Prefer wrapping over `truncate` unless space is truly fixed.

## 4. Azure Foundry agent response mapping

`/api/orchestrate` (→ `src/services/foundry.ts`) returns the agents' raw JSON cast to TS types that **do not match reality** — the actual payload is **snake_case and nested**. The mapping happens in `src/app/page.tsx` `runRealWorkflow`. Real shape:

- **requirements**: `business_rules` (array of `{id, description, traceability}`), `edge_cases[]`, `risk_areas[]`, `assumptions[]`
- **testDesign**: `functional_tests[]`, `bdd_scenarios[]` (each `{bdd_id, tags, scenario_name, given[], when[], then[]}` — given/when/then are ARRAYS, join them), `coverage_summary{}`, `traceability{}`
- **automation**: `framework`, `generated_artifacts.{page_objects[], test_scripts[], ...}` (each `{name|id, code}`), `automation_summary.{total_test_cases_automated, automation_readiness ("100%" string), framework_used}`
- **qualityAssessment**: only `{ rawResponse }` — section-tagged TEXT, parsed by `parseQualityResponse` (extracts `Decision:`, `Pass Rate:`, `[DEFECT_REPORT]`)

When wiring new fields, read the actual key from the payload (snake_case), normalize in the mapping, and don't trust the camelCase interfaces in `src/types/`.

## 5. Verifying

`node_modules` may not be installed. To run:
```
npm install
npm run dev
```
Auth: the API needs an Azure credential (`az login`, or `AZURE_TENANT_ID`/`AZURE_CLIENT_ID`/`AZURE_CLIENT_SECRET` in `.env.local`) or every agent call 500s with `CredentialUnavailableError`. After a change, hard-refresh (Ctrl+Shift+R) to clear the cached CSS, toggle the theme, and run the "E-Commerce Product Search" preset to exercise real data.
