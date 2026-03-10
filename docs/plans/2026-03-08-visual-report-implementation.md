# Visual Report Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the tab-based results UI with a single continuous visual narrative — 5 chapters alternating dark/light, editorial typography, hero visualisations, IntersectionObserver scroll animations.

**Architecture:** The data pipeline (lines 1–1010 of App.jsx) is untouched. We replace the Results component and all 6 tab components (lines ~1305–2418) with a single `VisualReport` component containing 5 chapter sub-components. A shared `useScrollReveal` hook powers fade-in animations. New CSS variables handle the light-section palette.

**Tech Stack:** React 18, inline styles + GLOBAL_CSS, hand-crafted SVG, IntersectionObserver API.

**File:** `src/App.jsx` — single file, all changes here.

---

### Task 1: CSS Foundation + Scroll Animation Hook

**What:** Add light-section CSS variables, chapter layout classes, scroll-reveal animation, and the `useScrollReveal` hook. Remove tab-related CSS.

**Step 1: Update GLOBAL_CSS**

Add to `:root` (after existing vars):
```css
--cream: #f5f0e8;
--cream-surface: #ede6d8;
--cream-border: #d5cdb8;
--cream-text: #1a1a1a;
--cream-muted: #6b6560;
```

Add new classes:
```css
.chapter { position: relative; padding: 100px 0; }
.chapter-dark { background: var(--bg); color: var(--text); }
.chapter-light { background: var(--cream); color: var(--cream-text); }
.chapter-light .card { background: var(--cream-surface); border-color: var(--cream-border); }
.chapter-light .card::before { background: linear-gradient(90deg,transparent,var(--gold-dim),transparent); }

.chapter-opener { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 80px 24px; }

.chapter-divider { width: 60px; height: 1px; background: var(--gold); margin: 0 auto; }

.scroll-reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s ease; }
.scroll-reveal.visible { opacity: 1; transform: translateY(0); }
.scroll-reveal-delay-1 { transition-delay: 0.1s; }
.scroll-reveal-delay-2 { transition-delay: 0.2s; }
.scroll-reveal-delay-3 { transition-delay: 0.3s; }
.scroll-reveal-delay-4 { transition-delay: 0.4s; }
```

Remove `.tab` classes (lines 65-67) since tabs are no longer used.

**Step 2: Add useScrollReveal hook**

Add after the GLOBAL_CSS constant, before the data classification section:
```javascript
function useScrollReveal() {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    el.querySelectorAll(".scroll-reveal").forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

---

### Task 2: Chapter Opener + Divider Components

**What:** Create reusable `ChapterOpener` and `ChapterDivider` components that establish the editorial feel.

**Step 1: Add ChapterOpener component**

Add after `ScoreHex` component (after line ~1100):
```javascript
function ChapterOpener({ number, title, subtitle, light }) {
  return (
    <div className="chapter-opener">
      <div className="scroll-reveal" style={{marginBottom:16}}>
        <span style={{fontSize:10,letterSpacing:"0.3em",color:light?"var(--gold-dim)":"var(--gold)",opacity:0.7}}>CHAPTER {number}</span>
      </div>
      <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{fontSize:"clamp(36px,5vw,56px)",fontWeight:400,lineHeight:1.1,marginBottom:16,maxWidth:600}}>
        {title}
      </h2>
      {subtitle && (
        <p className="scroll-reveal scroll-reveal-delay-2" style={{fontSize:13,color:light?"var(--cream-muted)":"var(--muted)",letterSpacing:"0.08em",maxWidth:500,lineHeight:1.8}}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ChapterDivider() {
  return <div className="scroll-reveal" style={{padding:"40px 0"}}><div className="chapter-divider"/></div>;
}

function Section({ children, delay=0 }) {
  return <div className={`scroll-reveal${delay?` scroll-reveal-delay-${delay}`:""}`}>{children}</div>;
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build. Components are unused until Task 3 but should compile.

---

### Task 3: VisualReport Shell + Chapter 1 (Network at a Glance)

**What:** Replace the `Results` component with `VisualReport`. Build Chapter 1 with the hero score hex, stat cards with benchmarks, and editorial insight callouts.

**Step 1: Replace Results component**

Delete the entire `Results` function (lines ~1305-1370 approximately — everything from `function Results` through its closing `}`).

Replace with:
```javascript
function Results({ data, onReset }) {
  const { connections:c, messages, adTargeting, inferences, invitations, skills, profile, positions, education, certifications, recsReceived, recsGiven, learning, endorsementReciprocity, silentNetwork, careerIntent, privateAssets, spending, contentCreator, registration, companyFollows, events, aiCoach, jobSeekerPrefs, articles, verifications, providers, savedAnswers, jobPostings, filesFound } = data;
  const hasProfile = profile || positions || skills || recsReceived;
  const hasCareerIntel = careerIntent && (careerIntent.savedCount > 0 || careerIntent.appliedCount > 0) || jobSeekerPrefs || companyFollows;

  return (
    <div>
      <Chapter1 c={c} filesFound={filesFound} />
      <ChapterDivider />
      <Chapter2 c={c} invitations={invitations} silentNetwork={silentNetwork} events={events} />
      <ChapterDivider />
      <Chapter3 skills={skills} endorsementReciprocity={endorsementReciprocity} positions={positions} profile={profile} education={education} certifications={certifications} recsReceived={recsReceived} recsGiven={recsGiven} articles={articles} />
      <ChapterDivider />
      <Chapter4 adTargeting={adTargeting} inferences={inferences} privateAssets={privateAssets} spending={spending} contentCreator={contentCreator} registration={registration} aiCoach={aiCoach} verifications={verifications} providers={providers} />
      <ChapterDivider />
      {hasCareerIntel && <Chapter5 careerIntent={careerIntent} companyFollows={companyFollows} jobSeekerPrefs={jobSeekerPrefs} savedAnswers={savedAnswers} />}
      <Finale onReset={onReset} />
    </div>
  );
}
```

**Step 2: Build Chapter 1**

```javascript
function Chapter1({ c, filesFound }) {
  const ref = useScrollReveal();
  return (
    <div className="chapter chapter-dark" ref={ref}>
      <ChapterOpener number="I" title={<>Your Network<br/><em style={{color:"var(--gold)"}}>at a Glance</em></>} subtitle={`${c.total.toLocaleString()} connections · ${c.networkAge} years · ${filesFound.length} files analysed`} />

      {/* Hero: Giant Score Hex */}
      <div className="scroll-reveal" style={{textAlign:"center",padding:"0 24px 60px"}}>
        <ScoreHex score={c.score} />
        <div style={{fontSize:12,color:"var(--muted)",marginTop:16,letterSpacing:"0.1em"}}>
          <span style={{color:c.bench.connections.color}}>Larger than ~{c.bench.connectionsPct}% of LinkedIn users</span>
          {c.notable.count > 0 && <span> · {c.notable.count} notable companies</span>}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{maxWidth:780,margin:"0 auto",padding:"0 24px"}}>
        <div className="scroll-reveal scroll-reveal-delay-1" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:48}}>
          {[
            {v:c.total.toLocaleString(),l:"Total Connections",s:`since ${c.firstYear}`,b:c.bench.connections},
            {v:`${c.concentration}%`,l:"Top Sector Share",s:c.topInd[0]?.[0]||"—",warn:c.concentration>60},
            {v:`${c.execPct}%`,l:"C-Suite & VP",s:"executive reach",b:c.bench.execReach},
            {v:c.recent12,l:"Added This Year",s:c.growthPct!==null?`${c.growthPct>0?"+":""}${c.growthPct}% vs last year`:"12-month total"},
          ].map((s,i)=>(
            <div key={i} className="card" style={{padding:"20px 18px"}}>
              <div style={{fontSize:10,color:"var(--muted)",letterSpacing:"0.12em",marginBottom:10}}>{s.l.toUpperCase()}</div>
              <div className="serif" style={{fontSize:32,fontWeight:400,color:s.warn?"var(--amber)":"var(--gold)",lineHeight:1,marginBottom:6}}>{s.v}</div>
              <div style={{fontSize:10,color:"var(--muted)"}}>{s.s}</div>
              {s.b && <div style={{fontSize:9,color:s.b.color,marginTop:6,letterSpacing:"0.08em"}}>{s.b.text}</div>}
            </div>
          ))}
        </div>

        {/* Editorial Insights */}
        <div className="scroll-reveal scroll-reveal-delay-2" style={{display:"flex",flexDirection:"column",gap:12,marginBottom:40}}>
          {c.insights.map((ins,i)=>(
            <div key={i} style={{display:"flex",gap:20,padding:"20px 0",borderBottom:"1px solid var(--border)"}}>
              <div style={{width:3,background:ins.type==="positive"?"var(--green)":ins.type==="warning"?"var(--amber)":"var(--border-bright)",flexShrink:0,borderRadius:2}}/>
              <div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:ins.type==="positive"?"var(--green)":ins.type==="warning"?"var(--amber)":"var(--muted)",marginBottom:6}}>{ins.headline.toUpperCase()}</div>
                <div style={{fontSize:13,lineHeight:1.8,color:"var(--text)"}}>{ins.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Add Finale component**

```javascript
function Finale({ onReset }) {
  const ref = useScrollReveal();
  return (
    <div className="chapter chapter-dark" ref={ref} style={{textAlign:"center",padding:"120px 24px"}}>
      <div className="scroll-reveal">
        <div className="chapter-divider" style={{marginBottom:48}}/>
        <h2 className="serif" style={{fontSize:"clamp(28px,4vw,40px)",fontWeight:400,marginBottom:16}}>Surprised by anything?</h2>
        <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.9,maxWidth:480,margin:"0 auto 32px"}}>
          I built this because most professionals have no idea what's actually inside their LinkedIn data. If your results revealed something interesting — connect and let me know.
        </p>
        <a href="https://www.linkedin.com/in/robertbrowton" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{marginBottom:16}}>
          CONNECT WITH ROB ON LINKEDIN →
        </a>
        <div style={{marginTop:20}}>
          <button onClick={onReset} className="btn-ghost">RUN ANOTHER ANALYSIS</button>
        </div>
        <div style={{marginTop:40,fontSize:10,color:"var(--muted)",letterSpacing:"0.1em"}}>
          🔒 Runs entirely in your browser — nothing stored or transmitted
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build will warn about missing Chapter2-5 components. That's expected — they'll be built in subsequent tasks.

**Step 5: Add stub chapter components**

Add temporary stubs so the build passes:
```javascript
function Chapter2(props) { return null; }
function Chapter3(props) { return null; }
function Chapter4(props) { return null; }
function Chapter5(props) { return null; }
```

**Step 6: Verify build and test**

Run: `npm run build`
Expected: Clean build. Upload test zip → should see Chapter 1 rendering with score hex, stat cards, insights, then blank for chapters 2-5, then the finale CTA.

---

### Task 4: Chapter 2 — "Who You Know" (Light Section)

**What:** Light/cream section with enhanced radial chart, full-width seniority bars, top companies with notable badges, silent network, events. This is the first light section — a major visual shift.

**Step 1: Build Chapter2 component**

Replace the `Chapter2` stub. This is a light section so all text colors adapt.

Key visual elements:
- Enhanced `RadialSegments` at larger size (SVG 220x220 vs current 160x160)
- Full-width seniority bars with cream-adapted colors
- Top companies with NOTABLE badges
- Silent network section
- Events section
- Growth timeline and year-by-year history
- Seasonality and day-of-week charts

The component uses `useScrollReveal()` and wraps each sub-section in `<Section>` or `.scroll-reveal` divs.

For the light section, use inline color overrides on text elements:
- Main text: `var(--cream-text)` (#1a1a1a)
- Muted text: `var(--cream-muted)` (#6b6560)
- Card backgrounds: handled by `.chapter-light .card` CSS

The content structure mirrors the old `NetworkTab` but with:
- More generous padding (32px instead of 24px)
- Larger gap between sections (32px instead of 16px)
- Section headers at 11px instead of 10px
- The radial chart centered and given its own full-width card

**Step 2: Verify build and visual test**

Run: `npm run build && npm run dev`
Upload zip, scroll past Chapter 1 → should see cream-colored Chapter 2 with all network data.

---

### Task 5: Chapter 3 — "Your Reputation" (Dark Section)

**What:** Dark section with skills constellation (new hero viz), career timeline, endorsement reciprocity, articles, recommendations.

**Step 1: Build SkillsConstellation component**

New SVG visualisation — skills as circles sized by endorsement count, positioned in a force-directed-ish layout (pre-computed positions using golden angle spiral), with glow effects on highly endorsed skills.

```javascript
function SkillsConstellation({ skills, endorsementReciprocity }) {
  if (!skills || skills.topSkills.length === 0) return null;
  const cx = 200, cy = 200, maxR = 170;
  const maxCount = skills.topSkills[0][1];

  // Golden angle spiral layout
  const nodes = skills.topSkills.map(([name, count], i) => {
    const angle = i * 2.399963; // golden angle in radians
    const radius = 40 + (i / skills.topSkills.length) * (maxR - 50);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    const r = 8 + (count / maxCount) * 20;
    return { name, count, x, y, r };
  });

  return (
    <svg viewBox="0 0 400 400" style={{width:"100%",maxWidth:500,margin:"0 auto",display:"block"}}>
      <defs>
        <filter id="skillGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="skillGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="var(--gold)" stopOpacity="0.3"/><stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/></radialGradient>
      </defs>
      {/* Connection lines between adjacent nodes */}
      {nodes.map((n, i) => i > 0 && (
        <line key={`l${i}`} x1={nodes[i-1].x} y1={nodes[i-1].y} x2={n.x} y2={n.y} stroke="var(--gold-dim)" strokeWidth="0.5" opacity="0.3"/>
      ))}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r} fill="var(--gold)" opacity={0.15 + (n.count/maxCount)*0.6} filter={n.count > maxCount*0.5 ? "url(#skillGlow)" : undefined}/>
          <circle cx={n.x} cy={n.y} r={n.r * 0.6} fill="var(--gold)" opacity={0.3 + (n.count/maxCount)*0.4}/>
          {n.r > 14 && <text x={n.x} y={n.y + 3} textAnchor="middle" fill="var(--text)" fontSize="6" fontFamily="Space Mono">{n.name.length > 12 ? n.name.slice(0,10)+"..." : n.name}</text>}
        </g>
      ))}
      <text x={cx} y={cy} textAnchor="middle" fill="var(--gold)" fontSize="20" fontFamily="Playfair Display,serif">{skills.totalEndorsements}</text>
      <text x={cx} y={cy+16} textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="Space Mono" letterSpacing="1">ENDORSEMENTS</text>
    </svg>
  );
}
```

**Step 2: Build Chapter3 component**

Replace stub. Contains:
- `ChapterOpener` with number "III"
- `SkillsConstellation` as hero
- Skills stat cards (skill count, endorsements, unique endorsers) + benchmark
- Endorsement reciprocity section (mutual champions, unreturned)
- Career timeline (positions, vertical layout)
- Education & certifications
- Published articles section
- Recommendations as large pull-quotes

**Step 3: Verify build and visual test**

Run: `npm run build`
Expected: Clean build. Dark chapter 3 appears after cream chapter 2.

---

### Task 6: Chapter 4 — "What LinkedIn Knows" (Light Section, Rose Accents)

**What:** Light section with targeting mosaic (new hero viz), CV vault, AI interactions, premium spend, content creator, verifications.

**Step 1: Build TargetingMosaic component**

New visualisation — structured grid of label tiles where each category gets a row, items are tag pills, coloured by category type. Larger than the old tag layout, with more visual weight.

```javascript
function TargetingMosaic({ adTargeting }) {
  if (!adTargeting || adTargeting.length === 0) return null;
  const TAG_COLORS = {
    "Job Seniorities": { border: "var(--gold)", color: "var(--gold)", bg: "rgba(212,168,67,0.12)" },
    "Job Functions": { border: "var(--gold-dim)", color: "var(--cream-text)", bg: "rgba(212,168,67,0.06)" },
    "Member Interests": { border: "var(--teal-dim)", color: "var(--teal-dim)", bg: "rgba(61,214,200,0.06)" },
    "Buyer Groups": { border: "rgba(232,96,96,0.5)", color: "var(--rose)", bg: "rgba(232,96,96,0.08)" },
    "High Value Audience Segments": { border: "var(--gold)", color: "var(--gold)", bg: "rgba(212,168,67,0.12)" },
  };
  const defaultTag = { border: "var(--cream-border)", color: "var(--cream-muted)", bg: "transparent" };

  return (
    <div>
      {adTargeting.map((cat, ci) => {
        const colors = TAG_COLORS[cat.key] || defaultTag;
        return (
          <div key={ci} style={{marginBottom:24}}>
            <div style={{fontSize:10,letterSpacing:"0.2em",color:"var(--cream-muted)",marginBottom:10}}>
              <span style={{marginRight:8}}>{cat.icon}</span>{cat.label}
              <span style={{marginLeft:8,fontSize:9,opacity:0.6}}>{cat.items.length}</span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {cat.items.map((item, i) => (
                <span key={i} style={{padding:"5px 14px",border:`1px solid ${colors.border}`,fontSize:11,color:colors.color,background:colors.bg}}>{item}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Build Chapter4 component**

Replace stub. Light section with rose privacy accents. Contains:
- `ChapterOpener` with number "IV", light=true
- Account age card
- Targeting mosaic as hero
- CV vault warning (rose border, strong privacy language)
- LinkedIn AI interactions
- Premium spend with yearly breakdown
- Content creator stats
- Identity verifications
- Services marketplace
- Inferences

**Step 3: Verify build and visual test**

Run: `npm run build`

---

### Task 7: Chapter 5 — "Your Career Intent" (Dark Section)

**What:** Dark closing chapter with company bubble chart (new hero viz), job seeker preferences, role categories, search keywords, applications.

**Step 1: Build CompanyBubbleChart component**

New SVG — companies as circles sized by interaction count. Gold fill if applied, teal if followed only. Positioned in a horizontal layout.

```javascript
function CompanyBubbleChart({ companies }) {
  if (!companies || companies.length === 0) return null;
  const maxCount = Math.max(...companies.map(c => c.count));
  const totalWidth = 600;
  const cy = 80;

  let cx = 40;
  const bubbles = companies.map(c => {
    const r = 15 + (c.count / maxCount) * 35;
    const bubble = { ...c, cx, cy, r };
    cx += r * 2 + 12;
    return bubble;
  });

  const svgWidth = cx + 20;

  return (
    <svg viewBox={`0 0 ${svgWidth} 160`} style={{width:"100%",overflow:"visible"}}>
      <defs><filter id="bubbleGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      {bubbles.map((b,i) => (
        <g key={i}>
          <circle cx={b.cx} cy={b.cy} r={b.r} fill={b.applied?"var(--gold)":"var(--teal)"} opacity={b.applied?0.25:0.15} filter="url(#bubbleGlow)"/>
          <circle cx={b.cx} cy={b.cy} r={b.r*0.7} fill={b.applied?"var(--gold)":"var(--teal)"} opacity={b.applied?0.4:0.25}/>
          <text x={b.cx} y={b.cy+3} textAnchor="middle" fill="var(--text)" fontSize={b.r > 25 ? "7" : "5"} fontFamily="Space Mono">
            {b.name.length > 10 ? b.name.slice(0,8)+"..." : b.name}
          </text>
          {b.applied && <text x={b.cx} y={b.cy+b.r+12} textAnchor="middle" fill="var(--gold)" fontSize="6" fontFamily="Space Mono" letterSpacing="0.5">APPLIED</text>}
        </g>
      ))}
    </svg>
  );
}
```

**Step 2: Build Chapter5 component**

Replace stub. Contains:
- `ChapterOpener` with number "V"
- Stat cards: saved, applied, save-to-apply ratio
- `CompanyBubbleChart` as hero
- Job seeker preferences (exposed settings)
- Role categories radial
- Search keywords as floating pills
- Recent applications
- Company follows with notable badges
- Saved application answers

**Step 3: Verify build and visual test**

Run: `npm run build`

---

### Task 8: Delete Old Tab Components + Clean Up

**What:** Remove all old tab components that are no longer referenced: `NetworkTab`, `MessagesTab`, `TargetingTab`, `ProfileTab`, `LearningTab`, `CareerIntelTab`. Fold any messages/learning data into the appropriate chapters.

**Step 1: Integrate messages data**

Add messages stats to Chapter 2 (Who You Know) — message activity by year chart, top conversations, deep thread count. This data was previously in its own tab.

**Step 2: Integrate learning data**

Add learning stats to Chapter 3 (Your Reputation) — courses completed, topic breakdown, recent courses. This data was previously in its own tab.

**Step 3: Delete old components**

Remove the following functions entirely:
- `NetworkTab`
- `MessagesTab`
- `TargetingTab`
- `ProfileTab`
- `LearningTab`
- `CareerIntelTab`

**Step 4: Update Results props**

Update the `Results` component to pass `messages` and `learning` to the appropriate chapters:
- `Chapter2` gets `messages` prop
- `Chapter3` gets `learning` prop

**Step 5: Clean up unused CSS**

Remove `.tab` styles from GLOBAL_CSS if not already removed.

**Step 6: Final build and test**

Run: `npm run build`
Expected: Clean build, no warnings about unused components.
Upload test zip → all 5 chapters render in a continuous scroll.
Check: insights display, charts render, light/dark alternation works, scroll animations fire.

---

### Task 9: Visual Polish + Spacing

**What:** Final pass on typography, spacing, and visual rhythm. Ensure consistent padding, font sizes, and the editorial "breathing room" that makes it feel premium.

**Step 1: Audit spacing**

- Chapter padding: 100px top/bottom
- Section gaps within chapters: 32px minimum
- Card padding: 24-32px
- Text line-height: 1.8 for body, 1.1 for titles

**Step 2: Audit typography**

- Chapter titles: Playfair Display, clamp(36px, 5vw, 56px)
- Section headers: Space Mono, 11px, 0.2em letter-spacing
- Body: Space Mono, 13px
- Labels: Space Mono, 9-10px, uppercase

**Step 3: Audit colour**

- Light sections: all text uses cream-* variants
- Rose accents only in Chapter 4 (privacy)
- Gold for primary data, teal for secondary
- Green for positive benchmarks

**Step 4: Test responsive**

Resize browser to mobile widths. Ensure:
- Charts scale via viewBox
- Grid cards stack properly
- Chapter openers remain readable
- Bubble chart scrolls horizontally if needed

**Step 5: Final build and comprehensive test**

Run: `npm run build`
Upload test zip and scroll through entire report. Verify all 5 chapters, all visualisations, all data sections, and the finale CTA.
