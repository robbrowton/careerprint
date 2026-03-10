# New Tabs: Your Profile + Learning — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add two new tabs ("Your Profile" and "Learning") to the Network Intelligence app, extracting 8 additional CSV files from LinkedIn exports.

**Architecture:** Extend the single-file App.jsx pattern — add new CSV extraction in `processZip`, new analysis functions, and two new tab components. All inline styles, same dark gold aesthetic.

**Tech Stack:** React 18, JSZip, CSS-in-JS (existing stack, no new deps)

---

### Task 1: Extend processZip to extract new CSV files

**Files:**
- Modify: `src/App.jsx:327-336` (processZip function)

**Step 1: Add extraction of 8 new CSV files after the existing 4**

Add after line 334:
```javascript
const sf = find("skills\\.csv");                    if(sf) result.skills = parseCSV(await sf.async("string"));
const ef = find("endorsement_received_info\\.csv"); if(ef) result.endorsements = parseCSV(await ef.async("string"));
const pf = find("positions\\.csv");                 if(pf) result.positions = parseCSV(await pf.async("string"));
const prof = find("profile\\.csv");                 if(prof) result.profile = parseCSV(await prof.async("string"));
const edf = find("education\\.csv");                if(edf) result.education = parseCSV(await edf.async("string"));
const cef = find("certifications\\.csv");           if(cef) result.certifications = parseCSV(await cef.async("string"));
const rrf = find("recommendations_received\\.csv"); if(rrf) result.recsReceived = parseCSV(await rrf.async("string"));
const rgf = find("recommendations_given\\.csv");    if(rgf) result.recsGiven = parseCSV(await rgf.async("string"));
const lf = find("learning\\.csv");                  if(lf) result.learning = parseCSV(await lf.async("string"));
```

**Step 2: Verify** — Upload test zip in browser, confirm no errors in console.

---

### Task 2: Add analyseSkills function

**Files:**
- Modify: `src/App.jsx` — add after `analyseMessages` function (line ~225)

**Implementation:**

```javascript
function analyseSkills(skills, endorsements) {
  const skillCounts = {};
  const endorserCounts = {};
  (endorsements || []).forEach(r => {
    const s = r["Skill Name"] || "";
    const endorser = ((r["Endorser First Name"]||"") + " " + (r["Endorser Last Name"]||"")).trim();
    if (s) skillCounts[s] = (skillCounts[s] || 0) + 1;
    if (endorser) endorserCounts[endorser] = (endorserCounts[endorser] || 0) + 1;
  });
  const totalEndorsements = Object.values(skillCounts).reduce((a,b) => a+b, 0);
  const uniqueEndorsers = Object.keys(endorserCounts).length;
  const topSkills = Object.entries(skillCounts).sort((a,b) => b[1]-a[1]).slice(0, 15);
  const topEndorsers = Object.entries(endorserCounts).sort((a,b) => b[1]-a[1]).slice(0, 5);
  const allSkills = (skills || []).map(r => r["Name"]).filter(Boolean);
  const unendorsed = allSkills.filter(s => !skillCounts[s]);
  return { totalEndorsements, uniqueEndorsers, topSkills, topEndorsers, allSkills, unendorsed, skillCount: allSkills.length };
}
```

---

### Task 3: Add analyseLearning function

**Files:**
- Modify: `src/App.jsx` — add after analyseSkills

**Implementation:**

Learning CSV headers: `Content Title, Content Description, Content Type, Content Last Watched Date (if viewed), Content Completed At (if completed), Content Saved, Notes taken on videos (if taken)`

```javascript
const LEARNING_TOPICS = {
  "Leadership & Management": ["leader","manage","executive","influence","coach","mentor","team","delegat"],
  "AI & Technology": ["ai ","artificial intelligence","machine learning","data","python","cloud","tech","software","automat","digital","generative"],
  "Strategy & Business": ["strateg","business","innovat","entrepreneur","design thinking","agile","project","product","lean"],
  "Communication": ["communicat","present","storytell","writing","public speak","negoti","persuad","feedback"],
  "Personal Development": ["career","productiv","habit","emotional","mindful","resilience","well-being","happiness","stress","creativ"],
  "HR & People": ["hr ","human resource","talent","recruit","diversity","inclusion","equity","culture","engagement","employee","workforce","people analytics","onboard"],
  "Change & Transformation": ["change","transform","transition","restructur","reorgani"],
  "Psychology & Research": ["psych","research","survey","analy","measure","statistic","assess","diagnos"],
};

function classifyLearningTopic(title = "", description = "") {
  const text = (title + " " + description).toLowerCase();
  for (const [topic, kws] of Object.entries(LEARNING_TOPICS)) {
    if (kws.some(k => text.includes(k))) return topic;
  }
  return "Other";
}

function analyseLearning(rows) {
  const topics = {};
  const yearMap = {};
  let completed = 0, viewed = 0;
  const recent = [];

  rows.forEach(r => {
    const title = r["Content Title"] || "";
    const desc = r["Content Description"] || "";
    const watched = r["Content Last Watched Date (if viewed)"] || "";
    const comp = r["Content Completed At (if completed)"] || "";
    const topic = classifyLearningTopic(title, desc);
    topics[topic] = (topics[topic] || 0) + 1;
    if (comp && comp !== "N/A") completed++;
    if (watched && watched !== "N/A") {
      viewed++;
      const yr = watched.slice(0, 4);
      if (yr) yearMap[yr] = (yearMap[yr] || 0) + 1;
    }
    if (watched && watched !== "N/A") {
      recent.push({ title, topic, date: watched.slice(0, 10) });
    }
  });

  recent.sort((a, b) => b.date.localeCompare(a.date));
  const topTopics = Object.entries(topics).sort((a,b) => b[1]-a[1]);
  const timeline = Object.entries(yearMap).sort((a,b) => a[0].localeCompare(b[0]));
  return { total: rows.length, completed, viewed, topTopics, timeline, recent: recent.slice(0, 10) };
}
```

---

### Task 4: Wire up new data in the process callback

**Files:**
- Modify: `src/App.jsx:367-373` (the setAnalysed call in process callback)

**Step 1:** Expand the setAnalysed call to include new analysis results:

```javascript
setAnalysed({
  connections: analyseConnections(files.connections),
  messages:    files.messages    ? analyseMessages(files.messages)  : null,
  adTargeting: files.adTargeting ? analyseAds(files.adTargeting)    : null,
  inferences:  files.inferences  ? analyseAds(files.inferences)     : null,
  skills:      (files.skills || files.endorsements) ? analyseSkills(files.skills, files.endorsements) : null,
  profile:     files.profile?.[0] || null,
  positions:   files.positions || null,
  education:   files.education || null,
  certifications: files.certifications || null,
  recsReceived: files.recsReceived || null,
  recsGiven:   files.recsGiven || null,
  learning:    files.learning ? analyseLearning(files.learning) : null,
  filesFound:  Object.keys(files),
});
```

---

### Task 5: Update Results component — add new tabs + destructure new data

**Files:**
- Modify: `src/App.jsx:457-506` (Results component)

**Step 1:** Add new data destructuring and tabs:

```javascript
function Results({ data, onReset }) {
  const [tab,setTab] = useState("network");
  const { connections:c, messages, adTargeting, inferences, skills, profile, positions, education, certifications, recsReceived, recsGiven, learning, filesFound } = data;
  const hasProfile = profile || positions || skills || recsReceived;
  const tabs = [
    {id:"network",label:"NETWORK"},
    ...(messages?[{id:"messages",label:"MESSAGES"}]:[]),
    ...((adTargeting||inferences)?[{id:"targeting",label:"HOW LINKEDIN SEES YOU"}]:[]),
    ...(hasProfile?[{id:"profile",label:"YOUR PROFILE"}]:[]),
    ...(learning?[{id:"learning",label:"LEARNING"}]:[]),
  ];
```

**Step 2:** Add tab rendering below existing tabs:

```javascript
{tab==="profile"   && hasProfile && <ProfileTab profile={profile} positions={positions} education={education} certifications={certifications} skills={skills} recsReceived={recsReceived} recsGiven={recsGiven}/>}
{tab==="learning"  && learning && <LearningTab l={learning}/>}
```

---

### Task 6: Build ProfileTab component

**Files:**
- Modify: `src/App.jsx` — add before the closing export or after TargetingTab

**Three sections:** Profile header + Career Timeline, Skills & Endorsements, Recommendations.

```jsx
function ProfileTab({ profile, positions, education, certifications, skills, recsReceived, recsGiven }) {
  return (
    <div className="animate-fade-up-2">
      {/* Profile Header */}
      {profile && (
        <div className="card" style={{padding:24,marginBottom:16}}>
          <div style={{fontSize:10,letterSpacing:"0.2em",color:"var(--muted)",marginBottom:14}}>PROFILE SUMMARY</div>
          <div className="serif" style={{fontSize:20,color:"var(--gold)",marginBottom:8}}>{profile["Headline"]||""}</div>
          {profile["Geo Location"] && <div style={{fontSize:11,color:"var(--muted)",marginBottom:12}}>{profile["Geo Location"]}</div>}
          {profile["Summary"] && <div style={{fontSize:12,lineHeight:1.8,color:"var(--text)",maxHeight:200,overflow:"hidden",maskImage:"linear-gradient(to bottom, black 70%, transparent)"}}>{profile["Summary"]}</div>}
        </div>
      )}

      {/* Career Timeline */}
      {positions && positions.length > 0 && (
        <div className="card" style={{padding:24,marginBottom:16}}>
          <div style={{fontSize:10,letterSpacing:"0.2em",color:"var(--muted)",marginBottom:20}}>CAREER TIMELINE</div>
          <div style={{borderLeft:"2px solid var(--gold-dim)",marginLeft:8,paddingLeft:24}}>
            {positions.map((p, i) => {
              const started = p["Started On"] || "";
              const finished = p["Finished On"] || "Present";
              return (
                <div key={i} style={{marginBottom:24,position:"relative"}}>
                  <div style={{position:"absolute",left:-33,top:4,width:12,height:12,borderRadius:"50%",background:i===0?"var(--gold)":"var(--surface)",border:`2px solid ${i===0?"var(--gold)":"var(--gold-dim)"}`}}/>
                  <div style={{fontSize:10,color:"var(--gold)",letterSpacing:"0.1em",marginBottom:4}}>{started} — {finished}</div>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:2}}>{p["Title"]||""}</div>
                  <div style={{fontSize:12,color:"var(--muted)"}}>{p["Company Name"]||""}{p["Location"]?` · ${p["Location"]}`:""}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Education & Certifications */}
      {((education && education.length > 0) || (certifications && certifications.length > 0)) && (
        <div className="card" style={{padding:24,marginBottom:16}}>
          <div style={{fontSize:10,letterSpacing:"0.2em",color:"var(--muted)",marginBottom:20}}>EDUCATION & CREDENTIALS</div>
          {education && education.map((e, i) => (
            <div key={`ed${i}`} style={{marginBottom:14,paddingBottom:14,borderBottom:i<education.length-1?"1px solid var(--border)":"none"}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{e["Degree Name"]||""}</div>
              <div style={{fontSize:11,color:"var(--muted)"}}>{e["School Name"]||""}{e["Start Date"]?` · ${e["Start Date"]}–${e["End Date"]||""}`:""}</div>
            </div>
          ))}
          {certifications && certifications.map((c, i) => (
            <div key={`cert${i}`} style={{marginBottom:14,paddingBottom:14,borderBottom:i<certifications.length-1?"1px solid var(--border)":"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,padding:"2px 8px",border:"1px solid var(--teal-dim)",color:"var(--teal)",letterSpacing:"0.08em"}}>CERT</span>
                <span style={{fontSize:13,color:"var(--text)"}}>{c["Name"]||""}</span>
              </div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>{c["Authority"]||""}{c["Started On"]?` · ${c["Started On"]}`:""}</div>
            </div>
          ))}
        </div>
      )}

      {/* Skills & Endorsements */}
      {skills && (
        <div className="card" style={{padding:24,marginBottom:16}}>
          <div style={{fontSize:10,letterSpacing:"0.2em",color:"var(--muted)",marginBottom:14}}>SKILLS & ENDORSEMENTS</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
            {[
              {v:skills.skillCount,l:"Skills listed"},
              {v:skills.totalEndorsements,l:"Endorsements"},
              {v:skills.uniqueEndorsers,l:"Unique endorsers"},
            ].map((s,i)=>(
              <div key={i} style={{padding:"12px 10px",background:"var(--bg)",border:"1px solid var(--border)",textAlign:"center"}}>
                <div className="serif" style={{fontSize:24,color:"var(--gold)",lineHeight:1,marginBottom:4}}>{s.v}</div>
                <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.1em"}}>{s.l.toUpperCase()}</div>
              </div>
            ))}
          </div>
          {skills.topSkills.length > 0 && (
            <>
              <div style={{fontSize:10,letterSpacing:"0.15em",color:"var(--muted)",marginBottom:12}}>TOP ENDORSED SKILLS</div>
              {skills.topSkills.map(([skill,count],i)=>(
                <SparkBar key={skill} label={skill} value={count} max={skills.topSkills[0][1]} count={count} total={skills.totalEndorsements} color={i<3?"var(--gold)":"var(--gold-dim)"} delay={i*0.05}/>
              ))}
            </>
          )}
          {skills.topEndorsers.length > 0 && (
            <div style={{marginTop:20}}>
              <div style={{fontSize:10,letterSpacing:"0.15em",color:"var(--muted)",marginBottom:12}}>YOUR CHAMPIONS</div>
              {skills.topEndorsers.map(([name,count],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<skills.topEndorsers.length-1?"1px solid var(--border)":"none"}}>
                  <span style={{fontSize:12,color:"var(--text)"}}>{name}</span>
                  <span style={{fontSize:11,color:"var(--teal)"}}>{count} endorsements</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {(recsReceived || recsGiven) && (
        <div className="card" style={{padding:24,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontSize:10,letterSpacing:"0.2em",color:"var(--muted)"}}>RECOMMENDATIONS</div>
            <div style={{fontSize:10,color:"var(--muted)"}}>{recsReceived?.length||0} received · {recsGiven?.length||0} given</div>
          </div>
          {recsReceived && recsReceived.map((r, i) => (
            <div key={i} style={{marginBottom:20,paddingBottom:20,borderBottom:i<recsReceived.length-1?"1px solid var(--border)":"none"}}>
              <div style={{fontSize:13,lineHeight:1.8,color:"var(--text)",fontStyle:"italic",marginBottom:10,borderLeft:"2px solid var(--gold-dim)",paddingLeft:16}}>
                "{r["Text"]||""}"
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"var(--gold-glow)",border:"1px solid var(--gold-dim)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"var(--gold)",fontWeight:700}}>
                  {(r["First Name"]||"?")[0]}
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>{r["First Name"]||""} {r["Last Name"]||""}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>{r["Job Title"]||""}{r["Company"]?` · ${r["Company"]}`:""}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Task 7: Build LearningTab component

**Files:**
- Modify: `src/App.jsx` — add after ProfileTab

```jsx
function LearningTab({ l }) {
  const maxYear = Math.max(...l.timeline.map(([,c]) => c), 1);
  return (
    <div className="animate-fade-up-2">
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        {[
          {v:l.total,l:"Courses explored"},
          {v:l.viewed,l:"Courses viewed"},
          {v:l.completed,l:"Completed"},
        ].map((s,i)=>(
          <div key={i} className="card" style={{padding:20,textAlign:"center"}}>
            <div className="serif" style={{fontSize:28,color:"var(--gold)",lineHeight:1,marginBottom:6}}>{s.v}</div>
            <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.1em"}}>{s.l.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Topic Breakdown */}
      {l.topTopics.length > 0 && (
        <div className="card" style={{padding:24,marginBottom:16}}>
          <div style={{fontSize:10,letterSpacing:"0.2em",color:"var(--muted)",marginBottom:20}}>TOPICS YOU STUDY</div>
          <RadialSegments industries={Object.fromEntries(l.topTopics)} total={l.total}/>
        </div>
      )}

      {/* Learning Timeline */}
      {l.timeline.length > 0 && (
        <div className="card" style={{padding:24,marginBottom:16}}>
          <div style={{fontSize:10,letterSpacing:"0.2em",color:"var(--muted)",marginBottom:4}}>LEARNING ACTIVITY BY YEAR</div>
          <div style={{fontSize:11,color:"var(--muted)",marginBottom:16}}>Courses viewed per year</div>
          <svg viewBox={`0 0 ${l.timeline.length * 40} 60`} style={{width:"100%",height:90,overflow:"visible"}}>
            {l.timeline.map(([year, count], i) => {
              const h = (count / maxYear) * 54;
              return (
                <g key={i}>
                  <rect x={i*40+4} y={60-h} width={32} height={h} fill="var(--teal)" opacity="0.7" style={{animation:`fadeIn 0.3s ${i*0.05}s ease forwards`,opacity:0}}/>
                  <text x={i*40+20} y={72} textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="Space Mono">{year}</text>
                  <text x={i*40+20} y={60-h-4} textAnchor="middle" fill="var(--teal)" fontSize="7" fontFamily="Space Mono">{count}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Recent Courses */}
      {l.recent.length > 0 && (
        <div className="card" style={{padding:24,marginBottom:16}}>
          <div style={{fontSize:10,letterSpacing:"0.2em",color:"var(--muted)",marginBottom:16}}>RECENTLY VIEWED</div>
          {l.recent.map((course, i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:i<l.recent.length-1?"1px solid var(--border)":"none",gap:16}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:"var(--text)",marginBottom:2}}>{course.title}</div>
                <span style={{fontSize:9,padding:"2px 8px",border:"1px solid var(--border-bright)",color:"var(--muted)",letterSpacing:"0.08em"}}>{course.topic}</span>
              </div>
              <div style={{fontSize:10,color:"var(--muted)",whiteSpace:"nowrap"}}>{course.date}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{padding:20,borderColor:"rgba(61,214,200,0.2)"}}>
        <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.8}}>
          💡 <strong style={{color:"var(--text)"}}>What this reveals:</strong> LinkedIn tracks every course you view, when, and for how long. Your learning patterns reveal professional interests and career trajectory signals.
        </div>
      </div>
    </div>
  );
}
```

---

### Task 8: Update filesFound count and analysing steps

**Files:**
- Modify: `src/App.jsx:439` (Analysing steps array)

Add new steps to the analysing animation:
```javascript
const steps = ["Parsing connection data...","Classifying industries...","Scoring seniority levels...","Mapping career timeline...","Analysing skills & endorsements...","Cataloguing learning activity...","Calculating network health...","Generating insights..."];
```

---

### Task 9: Manual testing & commit

- Upload the test zip at `Basic_LinkedInDataExport_03-08-2026.zip`
- Verify all 5 tabs render correctly
- Check that the app still works with a plain Connections.csv (no new tabs shown)
- Commit all changes
