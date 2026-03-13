# CareerPrint — Claude Code Handoff

## What this is
A single-page React app that analyses a user's LinkedIn data export entirely in the browser. No backend, no database, no auth. Users upload their LinkedIn zip or Connections.csv and get an instant 5-chapter visual report.

## Repo
https://github.com/robbrowton/careerprint.git

## Deployment
- **Vercel project:** `careerprint` on team `pwl`
- Auto-deploys on push to `main`

## Stack
- React 18 + Vite
- JSZip (npm package) for reading zip files in the browser
- Pure CSS-in-JS (no Tailwind, no component library)
- Google Fonts: Playfair Display + Space Mono
- All SVG hand-crafted (no chart library)

## Dev setup
```bash
npm install
npm run dev
```
Open http://localhost:5173 and confirm the upload screen loads.

## File structure
```
careerprint/
├── index.html          # Entry point
├── vite.config.js      # Vite config
├── vercel.json         # Vercel deployment config
├── package.json        # Dependencies
├── .gitignore
├── public/
│   └── favicon.svg     # Hexagonal N logo
├── src/
│   ├── main.jsx        # React root
│   └── App.jsx         # Entire app (4,754 lines, single file)
├── scripts/
│   └── generate-test-data.js  # Generates 3 synthetic LinkedIn exports
├── test-data/                 # 3 career-stage test zips
└── docs/plans/                # Design docs and session handovers
```

## Key design decisions
- **All analysis runs client-side** — nothing is sent to a server
- **Single file app** — App.jsx contains everything: styles, data logic, all 20+ components
- **No external UI library** — all styles are inline or injected via a global CSS string
- **JSZip handles zip parsing** — extracts all 33 LinkedIn CSV types + HTML articles automatically
- **5-chapter continuous scroll** — dark/light alternating chapters with hand-crafted SVG visualizations
- **Pure DOM perf** — mousemove-heavy components (NetworkDNA lens, spotlight) use refs + setAttribute, no React state

## If something breaks
- If the radial chart looks wrong: check the SVG path calculations in `RadialSegments`
- If CSV parsing fails: check the `parseCSV` function's header detection regex
- If zip parsing fails: check the `processZip` function's file pattern matching
- If the dossier reveal doesn't animate: check `dossierOpen` / `sealAnimating` state and `sealBreak` keyframe
- The app gracefully handles missing files — only shows sections for data that exists in the upload

## Do not change
- The LinkedIn CTA URL: `https://www.linkedin.com/in/robertbrowton`
- The privacy statement: "Runs entirely in your browser — nothing stored or transmitted"
- The overall dark gold aesthetic
