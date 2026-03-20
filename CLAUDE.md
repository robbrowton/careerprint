# CareerPrint — Claude Code Handoff

> **Shared memory**: Read `~/Projects/mission/claude-memory/GLOBAL.md` and `~/Projects/mission/claude-memory/projects/brand.md` for cross-session context.

## What this is
A pnpm workspace monorepo containing 3 social data intelligence apps (LinkedIn, Facebook, X/Twitter). Each analyses a user's data export entirely in the browser. No backend, no database, no auth. Shared UI components and styles live in `packages/shared`.

## Repo
https://github.com/robbrowton/careerprint.git

## Deployment
- **LinkedIn (CareerPrint):** Vercel project `careerprint` on team `pwl`, root directory `apps/linkedin/`
- **Facebook:** Vercel root directory `apps/facebook/`
- **X:** Vercel root directory `apps/x/`
- Auto-deploys on push to `main`

## Stack
- pnpm workspaces monorepo
- React 18 + Vite
- JSZip (npm package) for reading zip files in the browser
- Pure CSS-in-JS (no Tailwind, no component library)
- Google Fonts: Playfair Display + Space Mono
- All SVG hand-crafted (no chart library)

## Dev setup
```bash
pnpm install
pnpm dev:linkedin    # localhost:5173
pnpm dev:facebook    # localhost:5173
pnpm dev:x           # localhost:5173
```

## File structure
```
careerprint/
├── pnpm-workspace.yaml
├── package.json                    # root workspace config + dev scripts
├── packages/
│   └── shared/                     # @careerprint/shared
│       ├── package.json
│       ├── index.js                # barrel export
│       ├── styles.js               # createGlobalCSS(theme) — parameterized CSS
│       ├── components.jsx          # CountUp, SectionLabel
│       ├── hooks.js                # useScrollReveal
│       └── utils.js                # GRADE
├── apps/
│   ├── linkedin/                   # CareerPrint (gold theme)
│   │   ├── package.json
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   ├── vercel.json
│   │   └── src/
│   │       ├── main.jsx
│   │       └── App.jsx
│   ├── facebook/                   # Facebook Intelligence (blue theme)
│   │   ├── package.json
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   ├── vercel.json
│   │   └── src/
│   │       ├── main.jsx
│   │       └── App.jsx
│   └── x/                          # X Intelligence (silver theme)
│       ├── package.json
│       ├── index.html
│       ├── vite.config.js
│       ├── vercel.json
│       └── src/
│           ├── main.jsx
│           └── App.jsx
├── scripts/
│   └── generate-test-data.js
├── test-data/
└── docs/
```

## Shared package (`@careerprint/shared`)
- `createGlobalCSS(theme)` — generates the full CSS string, parameterized by accent colors
- `useScrollReveal()` — intersection observer hook for scroll animations
- `CountUp` — animated number counter component
- `SectionLabel` — label component (used by Facebook & X; LinkedIn has its own with Icon support)
- `GRADE(score)` — letter grade from score (A/B/C/D thresholds shared, labels per-app)

## Key design decisions
- **All analysis runs client-side** — nothing is sent to a server
- **Single file per app** — each App.jsx contains platform-specific styles, data logic, and components
- **No external UI library** — all styles are inline or injected via a global CSS string
- **JSZip handles zip/archive parsing** — extracts platform-specific data files automatically
- **5-chapter continuous scroll** — dark/light alternating chapters with hand-crafted SVG visualizations
- **Pure DOM perf** — mousemove-heavy components use refs + setAttribute, no React state

## If something breaks
- If the radial chart looks wrong: check the SVG path calculations in `RadialSegments` (LinkedIn)
- If CSV parsing fails: check the `parseCSV` function's header detection regex
- If zip parsing fails: check the `processZip` function's file pattern matching
- If the dossier reveal doesn't animate: check `dossierOpen` / `sealAnimating` state and `sealBreak` keyframe
- Each app gracefully handles missing files — only shows sections for data that exists in the upload

## Do not change
- The LinkedIn CTA URL: `https://www.linkedin.com/in/robertbrowton`
- The privacy statement: "Runs entirely in your browser — nothing stored or transmitted"
- The per-platform aesthetics: gold (LinkedIn), blue (Facebook), silver (X)
