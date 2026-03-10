# Visual Report — "Information is Beautiful" Overhaul

**Date:** 2026-03-08
**Status:** Approved

## Context

The Network Intelligence app currently has 6 tabs extracting all 33 CSVs from a LinkedIn export, with platform benchmarks and notable company tagging. The UI is functional but card-and-list heavy. This design replaces the tab-based results with a single continuous visual narrative — editorial, immersive, inspired by Information is Beautiful / Pudding.cool / NYT interactive features.

## Decisions

- **Full replacement** — ditch tabs entirely, one continuous scroll
- **Dark/gold aesthetic stays** but alternates with light/cream sections for chapter contrast
- **Single file** — everything remains in App.jsx
- **Chapter structure** — 5 thematic chapters, each with a hero visualisation and supporting sections
- **No external libraries** — all SVG hand-crafted, animations via IntersectionObserver

## Structure: 5 Chapters

### Chapter 1: "Your Network at a Glance" (dark, gold glow)
- **Hero:** Score hex, massively scaled, centered, percentile benchmark orbiting it. Animated on scroll-entry.
- **Supporting:** Four stat cards with benchmark labels, key findings insights as editorial callouts with coloured side-bars

### Chapter 2: "Who You Know" (light/cream section)
- **Hero:** Large radial industry chart — bigger, segment labels radiating outward, sunburst feel.
- **Supporting:** Full-width seniority bars, top companies with notable badges, silent network stats, events timeline

### Chapter 3: "Your Reputation" (dark section)
- **Hero:** Skills constellation — top endorsed skills as sized/glowing dots connected by faint lines, endorsement reciprocity as directional flows
- **Supporting:** Career timeline (vertical, editorial), published articles, recommendations as pull-quotes, mutual champions list

### Chapter 4: "What LinkedIn Knows About You" (light, rose accents for privacy tension)
- **Hero:** Dense grid/mosaic of all ad targeting labels — sized by category, coloured by type. Structured word-cloud.
- **Supporting:** CV vault warning (rose border), AI interactions summary, premium spend sparkline, content creator stats, identity verifications, account age

### Chapter 5: "Your Career Intent" (dark, closing section)
- **Hero:** Companies tracked as horizontal bubble chart — size = interaction count, gold if applied, teal if followed
- **Supporting:** Job seeker preferences exposed, role categories radial, search keywords as floating pills, recent applications, save-to-apply ratio

### Finale
LinkedIn CTA with generous breathing room.

## Visual Language

| Element | Treatment |
|---|---|
| Chapter openers | Full viewport height, centered headline (Playfair Display 48-64px), one-line subtitle, hero viz below |
| Dark sections | `--bg` (#050508), gold/teal glows, subtle noise texture |
| Light sections | Warm cream (#f5f0e8), dark text (#1a1a1a), thin precise lines, gold accents |
| Typography | Chapter titles: Playfair 48-64px. Body: Space Mono 12-13px. Labels: Space Mono 9-10px caps |
| Transitions | Thin gold horizontal rule between chapters, 80px+ padding |
| Animation | Fade-up on scroll entry via IntersectionObserver, no scroll-jacking |
| Visualisations | All SVG, hand-crafted, generous sizing, hover states where meaningful |

## New Visualisations

1. **Skills constellation** — SVG node graph, skills as circles sized by endorsement count, lines connecting mutual endorsers
2. **Targeting mosaic** — structured grid of label tiles, sized by category, coloured by type
3. **Company bubble chart** — horizontal scatter, sized by interaction count, coloured by relationship type
4. **Full-width seniority bars** — horizontal bars spanning cream section, minimal chrome
5. **Enhanced radial chart** — larger, radiating labels, percentage arcs

## Unchanged

- Single App.jsx file
- No external chart libraries
- Client-side only, no backend
- Data pipeline (parseCSV, processZip, all analysis functions)
- Upload and analysing screens
- LinkedIn CTA URL: https://www.linkedin.com/in/robertbrowton
- Privacy statement: "Runs entirely in your browser — nothing stored or transmitted"
