import React, { Component, useState, useCallback, useRef, useEffect } from "react";
import JSZip from "jszip";
import { createGlobalCSS, useScrollReveal, CountUp, GRADE } from '@careerprint/shared';

// ─── Global styles ────────────────────────────────────────────────────────────
const GLOBAL_CSS = createGlobalCSS({
  accent: '#d4a843',
  accentDim: '#8a6a20',
  accentGlow: 'rgba(212,168,67,0.15)',
  accentHover: '#e8c060',
  accentShadow: 'rgba(212,168,67,0.3)',
  hexShadow: 'rgba(212,168,67,0.4)',
  glowPulse50: 'rgba(212,168,67,0.3)',
  extraVars: `--gold: #d4a843; --gold-dim: #8a6a20; --gold-glow: rgba(212,168,67,0.15);`,
  extraKeyframes: `
  @keyframes nodeAppear { from { r: 0; opacity: 0; } to { opacity: 1; } }
  @keyframes slowOrbit { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes fillFromBottom { from { height: 0%; } to { } }
  @keyframes shimmerSkill { 0% { filter: brightness(1); } 50% { filter: brightness(1.6) drop-shadow(0 0 12px rgba(212,168,67,0.6)); } 100% { filter: brightness(1); } }
  .insight-flip-card:hover .insight-flip-inner { transform: rotateY(180deg); }
  @keyframes ambientGlow { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.05); } }
  @keyframes glowPulseStatic { 0%,100% { opacity: 0.2; } 50% { opacity: 0.6; } }
  @keyframes pulseNode { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
  @keyframes electricPulse { 0% { stroke-dashoffset: 0; opacity: 0.6; } 25% { opacity: 0.9; } 50% { stroke-dashoffset: -1000; opacity: 0.6; } 75% { opacity: 0.9; } 100% { stroke-dashoffset: 0; opacity: 0.6; } }
  @keyframes emitFromCenter { 0% { opacity: 0; transform: translate(-50%,-50%) scale(0.3); filter: blur(4px); } 60% { filter: blur(0px); } 100% { opacity: 1; transform: translate(-50%,-50%) scale(1); filter: blur(0px); } }
`,
});

// ─── Platform benchmarks & reference data ─────────────────────────────────────
const BENCHMARKS = {
  connections: { median: 400, mean: 930, p75: 1200, p90: 2500, p95: 5000 },
  execPct: { median: 8, mean: 10, p75: 15, p90: 25 },
  concentration: { median: 45, mean: 42 },  // lower is better
  endorsements: { median: 5, mean: 12, p75: 25, p90: 60 },
  messagesPerYear: { median: 50, mean: 120, p75: 250 },
  coursesCompleted: { median: 3, mean: 5, p75: 12 },
  invitationAcceptRate: { median: 40, mean: 42 },
  industries: { median: 5, mean: 6 },
};

function percentileEstimate(value, benchmarks) {
  const { median, mean, p75, p90, p95 } = benchmarks;
  if (p95 && value >= p95) return 95;
  if (p90 && value >= p90) return 90;
  if (p75 && value >= p75) return 75;
  if (value >= mean) return 50 + Math.round(((value - mean) / ((p75 || mean * 1.5) - mean)) * 25);
  if (value >= median) return 50 + Math.round(((value - median) / (mean - median)) * 10);
  if (value >= median * 0.5) return 25 + Math.round(((value - median * 0.5) / (median * 0.5)) * 25);
  return Math.max(1, Math.round((value / median) * 25));
}

function benchmarkLabel(value, benchmarks) {
  const pct = Math.min(99, percentileEstimate(value, benchmarks));
  if (pct >= 90) return { text: `top ${100 - pct}%`, color: "var(--green)" };
  if (pct >= 75) return { text: `top ${100 - pct}%`, color: "var(--gold)" };
  if (pct >= 50) return { text: `above avg`, color: "var(--text)" };
  return { text: `${Math.round(value / benchmarks.median * 100)}% of avg`, color: "var(--muted)" };
}

const NOTABLE_COMPANIES = new Set([
  // Tech Giants
  "Google","Alphabet","Microsoft","Apple","Amazon","Meta","Netflix","Tesla","NVIDIA","Intel","IBM","Oracle","Salesforce","Adobe","SAP","Cisco","Samsung","Sony","Dell","HP","Hewlett Packard Enterprise",
  // Cloud & SaaS
  "Snowflake","Databricks","Stripe","Palantir","ServiceNow","Workday","HubSpot","Atlassian","Twilio","Shopify","Square","Block","Zoom","Slack","Dropbox","DocuSign","Cloudflare","Datadog","MongoDB","Elastic",
  // AI & Emerging Tech
  "OpenAI","Anthropic","DeepMind","Cohere","Stability AI","Mistral AI","xAI","Scale AI","Hugging Face","Inflection AI",
  // Social & Media
  "LinkedIn","X","Twitter","TikTok","ByteDance","Snap","Pinterest","Reddit","Spotify","Disney","Warner Bros","NBC Universal","Paramount",
  // Finance & Banking
  "JPMorgan Chase","Goldman Sachs","Morgan Stanley","Bank of America","Citigroup","Barclays","HSBC","Deutsche Bank","UBS","Credit Suisse","BNP Paribas","Wells Fargo","Charles Schwab","BlackRock","Vanguard","Fidelity","State Street","Visa","Mastercard","PayPal","American Express","Revolut","Monzo","Wise",
  // Consulting & Professional Services
  "McKinsey & Company","McKinsey","Boston Consulting Group","BCG","Bain & Company","Bain","Deloitte","PwC","PricewaterhouseCoopers","EY","Ernst & Young","KPMG","Accenture","Capgemini","Cognizant","Infosys","Wipro","TCS","Tata Consultancy Services","Oliver Wyman","Roland Berger","A.T. Kearney","Kearney","Mercer","Aon","Willis Towers Watson","Marsh McLennan",
  // Consumer & Retail
  "Procter & Gamble","P&G","Unilever","Nestlé","Coca-Cola","PepsiCo","Nike","Adidas","LVMH","L'Oréal","Walmart","Target","Costco","IKEA","Starbucks","McDonald's","Uber","Airbnb","Booking.com","DoorDash","Deliveroo",
  // Healthcare & Pharma
  "Johnson & Johnson","Pfizer","Roche","Novartis","Merck","AstraZeneca","GSK","GlaxoSmithKline","Sanofi","AbbVie","Eli Lilly","Bayer","Medtronic","Abbott","Thermo Fisher","Moderna","BioNTech",
  // Energy & Industrial
  "Shell","BP","ExxonMobil","Chevron","TotalEnergies","Siemens","GE","General Electric","Honeywell","3M","Caterpillar","Boeing","Airbus","Lockheed Martin","Rolls-Royce","BAE Systems",
  // Automotive
  "Toyota","Volkswagen","BMW","Mercedes-Benz","Ford","General Motors","Rivian","Lucid","BYD","Porsche",
  // Telecom
  "AT&T","Verizon","T-Mobile","Vodafone","BT Group","Deutsche Telekom","Orange","Comcast",
  // UK-specific notable companies
  "Tesco","Sainsbury's","Marks & Spencer","John Lewis","Rolls-Royce","ARM","Dyson","Burberry","Asos","Rightmove","Deliveroo","Revolut","Wise","Monzo","Starling Bank","OakNorth","Checkout.com","Darktrace","Improbable","Sky","BBC","ITV","Channel 4","NHS","Civil Service","Cabinet Office","HM Treasury","Home Office",
  // Top employers / unicorns
  "Canva","Figma","Notion","Airtable","Miro","Vercel","Supabase","Linear","Retool","Rippling","Deel","Remote","Lattice","Culture Amp","BetterUp","Calm","Peloton","Robinhood","Coinbase","Binance","Kraken",
  // Big 4 Accounting alternate names
  "PwC UK","PwC US","Deloitte UK","Deloitte US","EY UK","EY US","KPMG UK","KPMG US",
]);

const COMPANY_DOMAINS = {
  "google":"google.com","alphabet":"abc.xyz","microsoft":"microsoft.com","apple":"apple.com","amazon":"amazon.com","meta":"meta.com","netflix":"netflix.com","tesla":"tesla.com","nvidia":"nvidia.com","intel":"intel.com","ibm":"ibm.com","oracle":"oracle.com","salesforce":"salesforce.com","adobe":"adobe.com","sap":"sap.com","cisco":"cisco.com","samsung":"samsung.com","sony":"sony.com","dell":"dell.com","hp":"hp.com",
  "snowflake":"snowflake.com","databricks":"databricks.com","stripe":"stripe.com","palantir":"palantir.com","servicenow":"servicenow.com","workday":"workday.com","hubspot":"hubspot.com","atlassian":"atlassian.com","twilio":"twilio.com","shopify":"shopify.com","zoom":"zoom.us","slack":"slack.com","dropbox":"dropbox.com","docusign":"docusign.com","cloudflare":"cloudflare.com","datadog":"datadoghq.com","mongodb":"mongodb.com",
  "openai":"openai.com","anthropic":"anthropic.com","deepmind":"deepmind.com","linkedin":"linkedin.com","x":"x.com","twitter":"twitter.com","tiktok":"tiktok.com","bytedance":"bytedance.com","snap":"snap.com","pinterest":"pinterest.com","reddit":"reddit.com","spotify":"spotify.com","disney":"disney.com",
  "jpmorgan chase":"jpmorgan.com","jpmorgan":"jpmorgan.com","goldman sachs":"goldmansachs.com","morgan stanley":"morganstanley.com","bank of america":"bankofamerica.com","citigroup":"citigroup.com","barclays":"barclays.com","hsbc":"hsbc.com","deutsche bank":"db.com","ubs":"ubs.com","blackrock":"blackrock.com","visa":"visa.com","mastercard":"mastercard.com","paypal":"paypal.com","american express":"americanexpress.com","revolut":"revolut.com","monzo":"monzo.com","wise":"wise.com",
  "mckinsey & company":"mckinsey.com","mckinsey":"mckinsey.com","boston consulting group":"bcg.com","bcg":"bcg.com","bain & company":"bain.com","bain":"bain.com","deloitte":"deloitte.com","pwc":"pwc.com","pricewaterhousecoopers":"pwc.com","ey":"ey.com","ernst & young":"ey.com","kpmg":"kpmg.com","accenture":"accenture.com","capgemini":"capgemini.com","cognizant":"cognizant.com","infosys":"infosys.com",
  "procter & gamble":"pg.com","p&g":"pg.com","unilever":"unilever.com","nestlé":"nestle.com","coca-cola":"coca-cola.com","pepsico":"pepsico.com","nike":"nike.com","adidas":"adidas.com","walmart":"walmart.com","starbucks":"starbucks.com","uber":"uber.com","airbnb":"airbnb.com",
  "johnson & johnson":"jnj.com","pfizer":"pfizer.com","roche":"roche.com","novartis":"novartis.com","merck":"merck.com","astrazeneca":"astrazeneca.com","gsk":"gsk.com","glaxosmithkline":"gsk.com","moderna":"moderna.com",
  "shell":"shell.com","bp":"bp.com","exxonmobil":"exxonmobil.com","siemens":"siemens.com","ge":"ge.com","general electric":"ge.com","honeywell":"honeywell.com","boeing":"boeing.com","airbus":"airbus.com",
  "toyota":"toyota.com","volkswagen":"volkswagen.com","bmw":"bmw.com","mercedes-benz":"mercedes-benz.com","ford":"ford.com",
  "at&t":"att.com","verizon":"verizon.com","t-mobile":"t-mobile.com","vodafone":"vodafone.com","bt group":"bt.com","bt":"bt.com",
  "tesco":"tesco.com","bbc":"bbc.co.uk","nhs":"nhs.uk","sky":"sky.com","arm":"arm.com","dyson":"dyson.com","burberry":"burberry.com",
  "canva":"canva.com","figma":"figma.com","notion":"notion.so","airtable":"airtable.com","miro":"miro.com","vercel":"vercel.com","linear":"linear.app","coinbase":"coinbase.com",
  "qualtrics":"qualtrics.com","korn ferry":"kornferry.com","kornferry":"kornferry.com",
};

function companyToDomain(name) {
  const key = name.toLowerCase().trim();
  if (COMPANY_DOMAINS[key]) return COMPANY_DOMAINS[key];
  // Fallback: strip non-alpha, add .com
  const slug = key.replace(/[^a-z0-9]/g, "");
  if (slug.length < 2) return null;
  return slug + ".com";
}

function countNotableCompanies(companies) {
  let count = 0;
  const matched = [];
  for (const [company] of companies) {
    if (NOTABLE_COMPANIES.has(company)) {
      count++;
      matched.push(company);
    }
  }
  return { count, matched };
}

// ─── Data classification ──────────────────────────────────────────────────────
const INDUSTRY_MAP = {
  "Tech & Engineering": ["software","engineer","developer","product manager","cto","technical","data scientist","data engineer","ai ","machine learning","cloud","devops","saas","tech ","digital","cyber","it ","fullstack","frontend","backend","platform","infrastructure","programmer","architect"],
  "HR & People": ["hr ","human resources","people","talent","recruitment","recruiter","culture","l&d","organisational","organizational","wellbeing","people ops","hrbp","chief people","people director"],
  "EX / OD / L&D": ["employee experience","ex ","organisational development","od ","learning","leadership development","executive coach","facilitator","trainer","coach","coaching"],
  "Consulting & Strategy": ["consultant","consulting","strategy","strategist","advisory","advisor","transformation","change management","programme director"],
  "Marketing & Growth": ["marketing","brand","content","social media","communications","pr ","public relations","copywriter","seo","growth","demand gen","cmo"],
  "Finance & Investment": ["finance","financial","cfo","accountant","accounting","investment","banking","analyst","equity","venture","cpa","audit","treasury","risk","compliance"],
  "Sales & Revenue": ["sales","account executive","business development","revenue","account manager","bdr","sdr","commercial","partnerships"],
  "Executive & C-Suite": ["ceo","coo","chief","managing director","chairman","board","non-exec","general manager","country manager","founder","co-founder","president","owner"],
  "Healthcare & Science": ["healthcare","medical","clinical","nurse","doctor","physician","health","pharma","hospital","biotech"],
  "Education & Academia": ["education","teacher","lecturer","professor","academic","university","school","dean","principal"],
};

const SENIORITY_MAP = [
  { label: "C-Suite & Founder", re: /(ceo|coo|cto|cfo|chief|founder|co-founder|president|owner|chairman|managing director)/i },
  { label: "VP & Director",     re: /(vp |vice president|svp|evp|\bdirector\b|head of)/i },
  { label: "Manager & Senior",  re: /(manager|\blead\b|principal|senior|sr\.)/i },
  { label: "Mid-Level",         re: /(specialist|consultant|analyst|engineer|designer|coordinator|advisor)/i },
  { label: "Early Career",      re: /(junior|associate|assistant|intern|graduate|entry|trainee)/i },
];

function classifyIndustry(title = "", company = "") {
  const text = (title + " " + company).toLowerCase();
  for (const [ind, kws] of Object.entries(INDUSTRY_MAP)) {
    if (kws.some(k => text.includes(k))) return ind;
  }
  return "Other";
}

function classifySeniority(title = "") {
  for (const { label, re } of SENIORITY_MAP) {
    if (re.test(title)) return label;
  }
  return "Individual Contributor";
}

function normalizeLinkedInUrl(url = "") {
  return url.trim().toLowerCase()
    .replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headerIdx = lines.findIndex(l => /first.?name|connected.?on|position/i.test(l));
  const start = headerIdx >= 0 ? headerIdx : 0;
  const headers = lines[start].split(",").map(h => h.replace(/"/g, "").trim());
  return lines.slice(start + 1).map(line => {
    const vals = []; let cur = ""; let inQ = false;
    for (const c of line) {
      if (c === '"') inQ = !inQ;
      else if (c === ',' && !inQ) { vals.push(cur.trim()); cur = ""; }
      else cur += c;
    }
    vals.push(cur.trim());
    const o = {};
    headers.forEach((h, i) => o[h] = (vals[i] || "").replace(/"/g, "").trim());
    return o;
  });
}

function analyseConnections(rows) {
  const now = new Date();
  const industries = {}, seniorities = {}, yearMap = {}, monthMap = {}, companies = {};

  rows.forEach(r => {
    const title   = r["Position"] || r["Job Title"] || r["Title"] || "";
    const company = r["Company"]  || r["Organization"] || "";
    const dateStr = r["Connected On"] || r["Date Connected"] || "";

    const ind = classifyIndustry(title, company);
    const sen = classifySeniority(title);
    industries[ind] = (industries[ind] || 0) + 1;
    seniorities[sen] = (seniorities[sen] || 0) + 1;
    if (company) companies[company] = (companies[company] || 0) + 1;

    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d)) {
        const yr = d.getFullYear();
        yearMap[yr] = (yearMap[yr] || 0) + 1;
        const mk = `${yr}-${String(d.getMonth()+1).padStart(2,"0")}`;
        monthMap[mk] = (monthMap[mk] || 0) + 1;
      }
    }
  });

  const total = rows.length;
  const topInd = Object.entries(industries).sort((a,b) => b[1]-a[1]);
  const concentration = topInd[0] ? Math.round((topInd[0][1]/total)*100) : 0;

  // Growth
  const mths = (offset) => Array.from({length:12},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-offset-i, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });
  const recent12 = mths(0).reduce((s,k)=>s+(monthMap[k]||0),0);
  const prev12   = mths(12).reduce((s,k)=>s+(monthMap[k]||0),0);
  const growthPct = prev12>0 ? Math.round(((recent12-prev12)/prev12)*100) : null;

  const execCount  = (seniorities["C-Suite & Founder"]||0) + (seniorities["VP & Director"]||0);
  const execPct    = Math.round((execCount/total)*100);
  const sortedYrs  = Object.keys(yearMap).sort();
  const firstYear  = parseInt(sortedYrs[0]) || now.getFullYear();
  const networkAge = now.getFullYear() - firstYear;
  const topCompanies = Object.entries(companies).sort((a,b)=>b[1]-a[1]).slice(0,8);

  // Timeline last 24 months
  const last24 = [];
  for (let i=23;i>=0;i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    last24.push({ month: k, added: monthMap[k]||0 });
  }

  // Score
  let score = 45;
  if (total>1000) score+=12; else if (total>500) score+=8; else if (total>200) score+=4;
  if (concentration<35) score+=15; else if (concentration<50) score+=8; else if (concentration<65) score+=3;
  if (execPct>25) score+=12; else if (execPct>15) score+=6; else if (execPct>8) score+=3;
  if (recent12>30) score+=10; else if (recent12>15) score+=5;
  if (Object.keys(industries).length>=7) score+=6; else if (Object.keys(industries).length>=5) score+=3;
  score = Math.min(97, Math.max(18, score));

  // Gaps
  const gaps = Object.keys(INDUSTRY_MAP).filter(ind => !industries[ind] || industries[ind]<3);

  // Insights
  const insights = [];
  if (concentration>65) insights.push({type:"warning", headline:"High concentration risk", body:`Your network sits in ${topInd[0][0]}. A single-sector network is fragile — and limits your reach.`, stat: concentration, statSuffix: "%", vizType: "arc", vizMax: 100});
  else if (concentration<35) insights.push({type:"positive", headline:"Well diversified", body:`No single industry dominates. You have genuine cross-sector reach — a real strategic asset.`, stat: concentration, statSuffix: "%", vizType: "arc", vizMax: 100});
  else insights.push({type:"neutral", headline:"Moderate concentration", body:`${topInd[0][0]} leads. Healthy, but worth asking if that's by design or default.`, stat: concentration, statSuffix: "%", vizType: "arc", vizMax: 100});

  if (execPct<10) insights.push({type:"warning", headline:"Thin at the top", body:`C-Suite or VP level. Senior relationships compound — they refer, champion, and open doors disproportionately.`, stat: execPct, statSuffix: "%", vizType: "arc", vizMax: 100});
  else if (execPct>25) insights.push({type:"positive", headline:"Strong senior reach", body:`C-Suite or VP — well above average. You have the relationships that move things.`, stat: execPct, statSuffix: "%", vizType: "arc", vizMax: 100});
  else insights.push({type:"neutral", headline:"Mixed seniority", body:`Executive-level connections. Building more senior relationships would increase leverage.`, stat: execPct, statSuffix: "%", vizType: "arc", vizMax: 100});

  if (growthPct!==null && growthPct<-25) insights.push({type:"warning", headline:"Network momentum stalling", body:`Connection rate down year-on-year. Your network may be plateauing.`, stat: Math.abs(growthPct), statPrefix: "-", statSuffix: "%", subStat: `${recent12} new this year`, vizType: "delta"});
  else if (growthPct!==null && growthPct>30) insights.push({type:"neutral", headline:"Strong momentum", body:`You're in a building phase — the compounding effects will show in 12–18 months.`, stat: growthPct, statPrefix: "+", statSuffix: "%", subStat: `${recent12} new this year`, vizType: "delta"});
  else insights.push({type:"neutral", headline:"Steady growth", body:`${growthPct!==null ? `${growthPct>0?"+":""}${growthPct}% vs the prior year.` : "Consistent networking pace."}`, stat: recent12, statSuffix: "", subStat: "new this year", vizType: "delta", delta: growthPct});


  // Full year-by-year history
  const yearHistory = Object.entries(yearMap).sort((a,b) => parseInt(a[0])-parseInt(b[0]));
  const peakYear = yearHistory.length > 0 ? yearHistory.reduce((a,b) => b[1]>a[1]?b:a) : null;

  // Seasonality — connections by month-of-year
  const monthOfYear = {};
  const dayOfWeek = {};
  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  rows.forEach(r => {
    const dateStr = r["Connected On"] || r["Date Connected"] || "";
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d)) {
        const mName = MONTH_NAMES[d.getMonth()];
        monthOfYear[mName] = (monthOfYear[mName] || 0) + 1;
        const dName = DAY_NAMES[d.getDay()];
        dayOfWeek[dName] = (dayOfWeek[dName] || 0) + 1;
      }
    }
  });
  const seasonality = MONTH_NAMES.map(m => ({ month: m, count: monthOfYear[m] || 0 }));
  const weekdayData = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((short,i) => {
    const full = DAY_NAMES[i === 6 ? 0 : i + 1];
    return { day: short, count: dayOfWeek[full] || 0 };
  });
  // Fix ordering: Mon=1..Sun=0
  const weekdayOrdered = [
    { day: "Mon", count: dayOfWeek["Monday"] || 0 },
    { day: "Tue", count: dayOfWeek["Tuesday"] || 0 },
    { day: "Wed", count: dayOfWeek["Wednesday"] || 0 },
    { day: "Thu", count: dayOfWeek["Thursday"] || 0 },
    { day: "Fri", count: dayOfWeek["Friday"] || 0 },
    { day: "Sat", count: dayOfWeek["Saturday"] || 0 },
    { day: "Sun", count: dayOfWeek["Sunday"] || 0 },
  ];
  const weekdayTotal = weekdayOrdered.slice(0,5).reduce((s,d) => s+d.count, 0);
  const weekdayPct = total > 0 ? Math.round((weekdayTotal/total)*100) : 0;

  // Dormant connections (no company or title)
  const dormant = rows.filter(r => !((r["Company"]||"").trim()) || !((r["Position"]||r["Job Title"]||r["Title"]||"").trim()));

  // Peak year insight
  if (peakYear && peakYear[1] > 200) {
    insights.push({type:"neutral", headline:"Peak networking year", body:`Your biggest year with ${peakYear[1].toLocaleString()} new connections. Understanding what drove that spike could help you replicate it.`, stat: peakYear[0], statIsText: true, vizType: "sparkline", sparkData: yearHistory});
  }

  // Seasonality insight
  const bestMonth = seasonality.reduce((a,b) => b.count>a.count?b:a);
  const worstMonth = seasonality.reduce((a,b) => b.count<a.count?b:a);
  insights.push({type:"neutral", headline:"Seasonal pattern", body:`Fastest in ${bestMonth.month}, slowest in ${worstMonth.month}. ${weekdayPct}% on weekdays.`, stat: bestMonth.month, statIsText: true, vizType: "monthBars", monthData: seasonality});

  // Benchmarks
  const bench = {
    connections: benchmarkLabel(total, BENCHMARKS.connections),
    execReach: benchmarkLabel(execPct, BENCHMARKS.execPct),
    diversity: benchmarkLabel(Object.keys(industries).length, BENCHMARKS.industries),
    connectionsPct: Math.min(99, percentileEstimate(total, BENCHMARKS.connections)),
  };

  // Notable companies
  const allCompanies = Object.entries(companies).sort((a,b) => b[1] - a[1]);
  const notable = countNotableCompanies(allCompanies);

  // Benchmark insights
  if (bench.connectionsPct >= 90) insights.push({type:"gold", headline:"Network size — elite tier", body:`Top ${100 - bench.connectionsPct}% of LinkedIn users. Platform median is just ${BENCHMARKS.connections.median.toLocaleString()}.`, stat: total, statSuffix: "", vizType: "percentile", pct: bench.connectionsPct, median: BENCHMARKS.connections.median});
  else if (bench.connectionsPct >= 75) insights.push({type:"positive", headline:"Network size — above average", body:`Top ${100 - bench.connectionsPct}% of LinkedIn users (median: ${BENCHMARKS.connections.median.toLocaleString()}).`, stat: total, statSuffix: "", vizType: "percentile", pct: bench.connectionsPct, median: BENCHMARKS.connections.median});

  if (notable.count >= 5) insights.push({type:"positive", headline:"Blue-chip network", body:`High-signal relationships at notable companies.`, stat: notable.count, statSuffix: "", subStat: "notable companies", vizType: "pills", pills: notable.matched.slice(0,3)});

  // Sort insights into desired display order and mark Network Size as full-width
  const insightOrder = ["network size", "diversi", "blue-chip", "senior", "peak", "seasonal", "growth", "momentum", "stalling", "concentration", "structural", "thin"];
  insights.sort((a, b) => {
    const aIdx = insightOrder.findIndex(k => a.headline.toLowerCase().includes(k));
    const bIdx = insightOrder.findIndex(k => b.headline.toLowerCase().includes(k));
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });
  insights.forEach(ins => { if (ins.headline.toLowerCase().includes("network size")) ins.fullWidth = true; });

  return { total, industries, seniorities, yearMap, monthMap, last24, topInd, topCompanies, concentration, networkAge, firstYear, execPct, recent12, prev12, growthPct, score, insights, gaps, yearHistory, seasonality, weekdayOrdered, weekdayPct, dormant: dormant.length, peakYear, bench, notable };
}

function analyseMessages(rows) {
  const senders = {};
  const convos = {};
  const yearMap = {};
  let sent = 0, received = 0;

  rows.forEach(r => {
    const f = r["FROM"] || r["Sender"] || "";
    if (f) senders[f] = (senders[f] || 0) + 1;

    const convoId = r["CONVERSATION ID"] || r["Conversation ID"] || "";
    if (convoId) convos[convoId] = (convos[convoId] || 0) + 1;

    // Count sent vs received (heuristic: if FROM contains common owner patterns)
    const folder = (r["FOLDER"] || "").toLowerCase();
    if (folder === "sent" || folder === "outbox") sent++;
    else received++;

    const dateStr = r["DATE"] || r["Date"] || "";
    if (dateStr) {
      // Try to extract year from various formats
      const match = dateStr.match(/(\d{4})/);
      if (match) {
        const yr = match[1];
        yearMap[yr] = (yearMap[yr] || 0) + 1;
      }
    }
  });

  const convoDepths = Object.values(convos).sort((a,b) => b-a);
  const avgDepth = convoDepths.length > 0 ? (rows.length / convoDepths.length) : 0;
  const deepConvos = convoDepths.filter(d => d >= 10).length;
  const yearHistory = Object.entries(yearMap).sort((a,b) => a[0].localeCompare(b[0]));

  return {
    total: rows.length,
    uniquePeople: Object.keys(senders).length,
    topConversations: Object.entries(senders).sort((a,b)=>b[1]-a[1]).slice(0,5),
    uniqueConvos: convoDepths.length,
    avgDepth: Math.round(avgDepth * 10) / 10,
    deepConvos,
    longestConvo: convoDepths[0] || 0,
    yearHistory,
    sent,
    received,
  };
}

function analyseInvitations(rows) {
  let outgoing = 0, incoming = 0, personalised = 0;
  rows.forEach(r => {
    const dir = (r["Direction"] || "").toUpperCase();
    if (dir === "OUTGOING") {
      outgoing++;
      if ((r["Message"] || "").trim()) personalised++;
    } else if (dir === "INCOMING") {
      incoming++;
    }
  });
  const personalisedPct = outgoing > 0 ? Math.round((personalised / outgoing) * 100) : 0;
  return { total: rows.length, outgoing, incoming, personalised, personalisedPct };
}

// ─── Learning topic classification ───────────────────────────────────────────
const LEARNING_TOPICS = {
  "Leadership & Management": ["leader","manage","executive","influence","coach","mentor","team","delegat","supervis"],
  "AI & Technology": ["ai ","artificial intelligence","machine learning","data","python","cloud","tech","software","automat","digital","generative","chatgpt","copilot"],
  "Strategy & Business": ["strateg","business","innovat","entrepreneur","design thinking","agile","project","product","lean","startup"],
  "Communication": ["communicat","present","storytell","writing","public speak","negoti","persuad","feedback","conflict"],
  "Personal Development": ["career","productiv","habit","emotional","mindful","resilience","well-being","happiness","stress","creativ","time manage","focus"],
  "HR & People": ["hr ","human resource","talent","recruit","diversity","inclusion","equity","culture","engagement","employee","workforce","people analytics","onboard","hiring"],
  "Change & Transformation": ["change","transform","transition","restructur","reorgani"],
  "Psychology & Research": ["psych","research","survey","analy","measure","statistic","assess","diagnos","system","think"],
};

function classifyLearningTopic(title = "", description = "") {
  const text = (title + " " + description).toLowerCase();
  for (const [topic, kws] of Object.entries(LEARNING_TOPICS)) {
    if (kws.some(k => text.includes(k))) return topic;
  }
  return "Other";
}

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
      recent.push({ title, topic, date: watched.slice(0, 10) });
    }
  });

  recent.sort((a, b) => b.date.localeCompare(a.date));
  const topTopics = Object.entries(topics).sort((a,b) => b[1]-a[1]);
  const timeline = Object.entries(yearMap).sort((a,b) => a[0].localeCompare(b[0]));
  return { total: rows.length, completed, viewed, topTopics, timeline, recent: recent.slice(0, 10) };
}

// ─── Cross-dataset inference ──────────────────────────────────────────────────

function analyseEndorsementReciprocity(given, received) {
  if (!given || !received) return null;
  const givenByUrl = {};
  given.forEach(r => {
    const url = normalizeLinkedInUrl(r["Endorsee Profile Url"] || r["Profile Url"] || "");
    const name = ((r["Endorsee First Name"]||r["First Name"]||"") + " " + (r["Endorsee Last Name"]||r["Last Name"]||"")).trim();
    if (url) givenByUrl[url] = name || url;
  });
  const receivedByUrl = {};
  received.forEach(r => {
    const url = normalizeLinkedInUrl(r["Endorser Profile Url"] || r["Profile Url"] || "");
    const name = ((r["Endorser First Name"]||"") + " " + (r["Endorser Last Name"]||"")).trim();
    if (url) {
      if (!receivedByUrl[url]) receivedByUrl[url] = { name: name || url, count: 0 };
      receivedByUrl[url].count++;
    }
  });
  const givenUrls = new Set(Object.keys(givenByUrl));
  const receivedUrls = new Set(Object.keys(receivedByUrl));
  const mutualUrls = [...givenUrls].filter(u => receivedUrls.has(u));
  const unreturnedUrls = [...receivedUrls].filter(u => !givenUrls.has(u));
  const unreciprocatedUrls = [...givenUrls].filter(u => !receivedUrls.has(u));

  const mutualChampions = mutualUrls
    .map(u => ({ name: receivedByUrl[u]?.name || givenByUrl[u], count: receivedByUrl[u]?.count || 0 }))
    .sort((a,b) => b.count - a.count).slice(0, 5);
  const unreturned = unreturnedUrls
    .map(u => ({ name: receivedByUrl[u]?.name || u, count: receivedByUrl[u]?.count || 0 }))
    .sort((a,b) => b.count - a.count).slice(0, 10);

  const totalGiven = givenUrls.size;
  const totalReceived = receivedUrls.size;
  const reciprocityRatio = totalReceived > 0 ? Math.round((mutualUrls.length / totalReceived) * 100) : 0;

  return { reciprocityRatio, mutualCount: mutualUrls.length, mutualChampions, unreturned, unreciprocatedCount: unreciprocatedUrls.length, totalGiven, totalReceived };
}

function analyseSilentNetwork(connections, messages) {
  if (!connections || !messages) return null;
  const connectionUrls = new Map();
  connections.forEach(r => {
    const url = normalizeLinkedInUrl(r["URL"] || r["Profile URL"] || "");
    if (url) connectionUrls.set(url, r);
  });

  const messagedUrls = new Set();
  messages.forEach(r => {
    const sUrl = normalizeLinkedInUrl(r["Sender Profile URL"] || r["FROM PROFILE URL"] || "");
    if (sUrl) messagedUrls.add(sUrl);
    const content = r["CONVERSATION ID"] || "";
    // Also check other URL fields
    const rUrl = normalizeLinkedInUrl(r["Recipient Profile URL"] || r["TO PROFILE URL"] || "");
    if (rUrl) messagedUrls.add(rUrl);
  });

  let messagedCount = 0;
  const silentConnections = [];
  for (const [url, row] of connectionUrls) {
    if (messagedUrls.has(url)) {
      messagedCount++;
    } else {
      silentConnections.push(row);
    }
  }

  const silentCount = silentConnections.length;
  const total = connectionUrls.size;
  const messagedPct = total > 0 ? Math.round((messagedCount / total) * 100) : 0;
  const silentPct = total > 0 ? Math.round((silentCount / total) * 100) : 0;

  const seniorLabels = new Set(["C-Suite & Founder", "VP & Director"]);
  const silentSenior = silentConnections
    .filter(r => {
      const title = r["Position"] || r["Job Title"] || r["Title"] || "";
      return seniorLabels.has(classifySeniority(title));
    })
    .map(r => ({
      name: ((r["First Name"]||"") + " " + (r["Last Name"]||"")).trim(),
      title: r["Position"] || r["Job Title"] || r["Title"] || "",
      company: r["Company"] || r["Organization"] || "",
    }))
    .slice(0, 10);

  return { messagedCount, messagedPct, silentCount, silentPct, silentSenior, silentSeniorCount: silentSenior.length, total };
}

const JOB_CATEGORIES = {
  "People & Culture": ["people","culture","hr","human resources","talent","recruitment","wellbeing","diversity","inclusion","employee experience"],
  "L&D / OD": ["learning","development","training","organisational development","l&d","od","coaching","facilitator"],
  "Consulting": ["consultant","consulting","advisory","advisor","strategy","transformation"],
  "Leadership": ["director","head of","vp","chief","ceo","coo","cto","managing director","leader","manager"],
  "Marketing": ["marketing","brand","content","social media","communications","growth"],
  "Technology": ["software","engineer","developer","data","tech","digital","product","ai","machine learning"],
  "Sales": ["sales","business development","account","revenue","partnerships"],
  "Operations": ["operations","project","programme","coordinator","analyst"],
};

function classifyJobCategory(title = "") {
  const text = title.toLowerCase();
  for (const [cat, kws] of Object.entries(JOB_CATEGORIES)) {
    if (kws.some(k => text.includes(k))) return cat;
  }
  return "Other";
}

function analyseCareerIntent(savedJobs, applications, alerts) {
  const savedCount = savedJobs?.length || 0;
  const appliedCount = applications?.length || 0;
  const saveToApplyRatio = savedCount > 0 ? Math.round((appliedCount / savedCount) * 100) : 0;

  const companyCounts = {};
  const roleCategories = {};
  const appliedCompanies = new Set();

  (savedJobs || []).forEach(r => {
    const company = r["Company Name"] || r["Company"] || "";
    const title = r["Job Title"] || r["Title"] || "";
    if (company) companyCounts[company] = (companyCounts[company] || 0) + 1;
    const cat = classifyJobCategory(title);
    roleCategories[cat] = (roleCategories[cat] || 0) + 1;
  });

  (applications || []).forEach(r => {
    const company = r["Company Name"] || r["Company"] || "";
    const title = r["Job Title"] || r["Title"] || "";
    if (company) {
      companyCounts[company] = (companyCounts[company] || 0) + 1;
      appliedCompanies.add(company);
    }
    const cat = classifyJobCategory(title);
    roleCategories[cat] = (roleCategories[cat] || 0) + 1;
  });

  const topCompanies = Object.entries(companyCounts)
    .sort((a,b) => b[1] - a[1]).slice(0, 10)
    .map(([name, count]) => ({ name, count, applied: appliedCompanies.has(name) }));

  const searchKeywords = [];
  (alerts || []).forEach(r => {
    const raw = JSON.stringify(r);
    const match = raw.match(/keywords[=:]([^,}"]+)/gi);
    if (match) match.forEach(m => {
      const kw = m.replace(/keywords[=:]\s*/i, "").trim();
      if (kw && kw.length > 1) searchKeywords.push(kw);
    });
    // Also check direct columns
    const kw = r["Keywords"] || r["Search Query"] || r["Query"] || "";
    if (kw) searchKeywords.push(kw);
  });

  const recentApplications = (applications || [])
    .map(r => ({
      title: r["Job Title"] || r["Title"] || "",
      company: r["Company Name"] || r["Company"] || "",
      date: r["Application Date"] || r["Applied On"] || r["Date"] || "",
    }))
    .filter(a => a.title || a.company)
    .sort((a,b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 10);

  return { savedCount, appliedCount, saveToApplyRatio, topCompanies, roleCategories, searchKeywords: [...new Set(searchKeywords)], recentApplications };
}

function analyseContentCreator(richMedia) {
  if (!richMedia || richMedia.length === 0) return null;
  const byYear = {};
  const byType = {};

  richMedia.forEach(r => {
    const desc = (r["Description"] || r["Type"] || r["Media Type"] || "").toLowerCase();
    const dateStr = r["Date"] || r["Created Date"] || r["Published Date"] || "";
    const yearMatch = dateStr.match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : "Unknown";

    let type = "Other";
    if (desc.includes("document") || desc.includes("pdf") || desc.includes("slide")) type = "Document";
    else if (desc.includes("photo") || desc.includes("image")) type = "Photo";
    else if (desc.includes("video")) type = "Video";
    else if (desc.includes("article") || desc.includes("post")) type = "Article";

    byYear[year] = (byYear[year] || 0) + 1;
    byType[type] = (byType[type] || 0) + 1;
  });

  return {
    totalPieces: richMedia.length,
    byYear: Object.entries(byYear).sort((a,b) => a[0].localeCompare(b[0])),
    byType: Object.entries(byType).sort((a,b) => b[1] - a[1]),
  };
}

function analyseCompanyFollows(follows, savedJobs) {
  if (!follows || follows.length === 0) return null;
  const followedCompanies = {};
  follows.forEach(r => {
    const name = r["Organization"] || r["Company"] || "";
    const date = r["Followed On"] || r["Date"] || "";
    if (name) followedCompanies[name] = date;
  });

  // Cross-reference with saved jobs
  const savedCompanies = new Set();
  (savedJobs || []).forEach(r => {
    const c = r["Company Name"] || r["Company"] || "";
    if (c) savedCompanies.add(c);
  });

  const overlap = Object.keys(followedCompanies).filter(c => savedCompanies.has(c));
  const followOnly = Object.keys(followedCompanies).filter(c => !savedCompanies.has(c));

  // Sort by date, most recent first
  const sorted = Object.entries(followedCompanies)
    .sort((a,b) => (b[1] || "").localeCompare(a[1] || ""))
    .slice(0, 15)
    .map(([name, date]) => ({ name, date, savedJob: savedCompanies.has(name) }));

  return {
    total: follows.length,
    overlap: overlap.length,
    followOnly: followOnly.length,
    recent: sorted,
  };
}

function analyseEvents(events) {
  if (!events || events.length === 0) return null;
  const byYear = {};
  const byStatus = {};
  const recent = [];

  events.forEach(r => {
    const name = r["Event Name"] || r["Name"] || "";
    const dateStr = r["Event Time"] || r["Date"] || "";
    const status = (r["Status"] || "").toLowerCase();

    byStatus[status] = (byStatus[status] || 0) + 1;

    const yearMatch = dateStr.match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : "Unknown";
    byYear[year] = (byYear[year] || 0) + 1;

    recent.push({ name, date: dateStr, status, url: r["External Url"] || "" });
  });

  recent.sort((a,b) => (b.date || "").localeCompare(a.date || ""));

  return {
    total: events.length,
    byYear: Object.entries(byYear).sort((a,b) => a[0].localeCompare(b[0])),
    byStatus: Object.entries(byStatus).sort((a,b) => b[1] - a[1]),
    recent: recent.slice(0, 10),
  };
}

function analyseJobSeekerPrefs(prefs) {
  if (!prefs || prefs.length === 0) return null;
  const p = prefs[0]; // Single row
  return {
    locations: (p["Locations"] || "").split(";").map(s => s.trim()).filter(Boolean),
    industries: (p["Industries"] || "").split(";").map(s => s.trim()).filter(Boolean),
    jobTypes: (p["Preferred Job Types"] || "").split(";").map(s => s.trim()).filter(Boolean),
    jobTitles: (p["Job Titles"] || "").split(";").map(s => s.trim()).filter(Boolean),
    openToRecruiters: p["Open To Recruiters"] || "",
    dreamCompanies: (p["Dream Companies"] || "").split(";").map(s => s.trim()).filter(Boolean),
    activityLevel: p["Job Seeker Activity Level"] || "",
    urgency: p["Job Seeking Urgency Level"] || "",
    companySizes: (p["Company Employee Count"] || "").split(";").map(s => s.trim()).filter(Boolean),
    startTime: p["Preferred Start Time Range"] || "",
    commutePreference: p["Commute Preference Starting Address"] || "",
    maxCommute: p["Maximum Commute Duration"] || "",
  };
}

function analyseArticles(articles) {
  if (!articles || articles.length === 0) return null;
  const totalWords = articles.reduce((s, a) => s + a.wordCount, 0);
  const avgWords = articles.length > 0 ? Math.round(totalWords / articles.length) : 0;

  // Topic classification from article text
  const topics = {};
  articles.forEach(a => {
    const text = (a.title + " " + a.bodyText).toLowerCase();
    let matched = false;
    for (const [topic, kws] of Object.entries(LEARNING_TOPICS)) {
      if (kws.some(k => text.includes(k))) {
        topics[topic] = (topics[topic] || 0) + 1;
        matched = true;
        break;
      }
    }
    if (!matched) topics["Other"] = (topics["Other"] || 0) + 1;
  });

  return {
    total: articles.length,
    totalWords,
    avgWords,
    topics: Object.entries(topics).sort((a,b) => b[1] - a[1]),
    articles: articles.sort((a,b) => (b.date || "").localeCompare(a.date || "")),
  };
}

function analyseVerifications(verifications) {
  if (!verifications || verifications.length === 0) return null;
  return verifications.map(v => ({
    type: v["Verification type"] || v["Type"] || "",
    org: v["Organization name"] || "",
    docType: v["Document type"] || "",
    provider: v["Verification service provider"] || "",
    date: v["Verified date"] || "",
    expiry: v["Expiry date"] || "",
  }));
}

// ─── Colours ──────────────────────────────────────────────────────────────────
const IND_COLORS = ["#d4a843","#3dd6c8","#e86060","#5dd68a","#a8d4e8","#e8a840","#c8a8e8","#e8c8a8","#a8e8c8","#d4d4d4","#888"];
const GRADE_LABEL = s => ({A:"Elite Network",B:"Strong Network",C:"Developing",D:"Needs Work"})[GRADE(s)];
const GRADE_COLOR = s => ({A:"var(--green)",B:"var(--gold)",C:"var(--amber)",D:"var(--rose)"})[GRADE(s)];

// ─── Sub-components ───────────────────────────────────────────────────────────
function SparkBar({ value, max, color="#d4a843", delay=0, label, count, total }) {
  const pct = max>0?(value/max)*100:0;
  const sharePct = total>0?Math.round((value/total)*100):0;
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"baseline"}}>
        <span style={{fontSize: 13,color:"var(--text)"}}>{label}</span>
        <span style={{fontSize: 11,color:"var(--muted)"}}>{count.toLocaleString()} <span style={{color}}>{sharePct}%</span></span>
      </div>
      <div style={{height:3,background:"var(--faint)",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:2,transformOrigin:"left",animation:`barGrowH 0.8s ${delay}s cubic-bezier(0.22,1,0.36,1) forwards`,transform:"scaleX(0)"}} />
      </div>
    </div>
  );
}

function TimelineChart({ data }) {
  if (!data||data.length<2) return null;
  const maxAdded = Math.max(...data.map(d=>d.added),1);
  return (
    <div>
      <svg viewBox={`0 0 ${data.length*10} 60`} style={{width:"100%",height:90,overflow:"visible"}}>
        {[0,0.5,1].map(p=><line key={p} x1={0} y1={60*(1-p)} x2={data.length*10} y2={60*(1-p)} stroke="var(--border)" strokeWidth="0.3"/>)}
        {data.map((d,i)=>{
          const h=(d.added/maxAdded)*54;
          return <rect key={i} x={i*10+1} y={60-h} width={8} height={h} fill="var(--gold)" opacity="0.7" style={{animation:`fadeIn 0.3s ${i*0.02}s ease forwards`,opacity:0}}/>;
        })}
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <span style={{fontSize:9,color:"var(--muted)"}}>{data[0]?.month}</span>
        <span style={{fontSize:9,color:"var(--muted)"}}>{data[data.length-1]?.month}</span>
      </div>
    </div>
  );
}

function RadialSegments({ industries, total }) {
  const topN = Object.entries(industries).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const cx=80,cy=80,r=65,ir=35;
  let angle = -Math.PI/2;
  const segs = topN.map(([label,count],i)=>{
    const frac=count/total, sweep=frac*2*Math.PI;
    const x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
    const x2=cx+r*Math.cos(angle+sweep),y2=cy+r*Math.sin(angle+sweep);
    const ix1=cx+ir*Math.cos(angle),iy1=cy+ir*Math.sin(angle);
    const ix2=cx+ir*Math.cos(angle+sweep),iy2=cy+ir*Math.sin(angle+sweep);
    const lg=sweep>Math.PI?1:0;
    const path=`M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${lg} 0 ${ix1} ${iy1} Z`;
    angle+=sweep+0.02;
    return {path,color:IND_COLORS[i],label,count,frac};
  });
  return (
    <div style={{display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
      <svg width={160} height={160} style={{flexShrink:0}}>
        <defs><filter id="sg"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        {segs.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity="0.85" filter="url(#sg)"/>)}
        <circle cx={cx} cy={cy} r={ir-2} fill="var(--surface)"/>
        <text x={cx} y={cy-4} textAnchor="middle" fill="var(--gold)" fontSize="16" fontFamily="Playfair Display,serif">{Object.keys(industries).length}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="Space Mono" letterSpacing="1">SECTORS</text>
      </svg>
      <div style={{flex:1,minWidth:140}}>
        {segs.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0}}/>
            <div style={{fontSize:11,color:"var(--text)",flex:1}}>{s.label}</div>
            <div style={{fontSize: 11,color:"var(--muted)"}}>{Math.round(s.frac*100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreHex({ score }) {
  const gc = GRADE_COLOR(score), gl = GRADE_LABEL(score), g = GRADE(score);
  const cx=90,cy=90,size=72;
  const pts = Array.from({length:6},(_,i)=>{const a=(Math.PI/3)*i-Math.PI/6;return `${cx+size*Math.cos(a)},${cy+size*Math.sin(a)}`;}).join(" ");
  const ipts = Array.from({length:6},(_,i)=>{const a=(Math.PI/3)*i-Math.PI/6,s2=size*(score/100);return `${cx+s2*Math.cos(a)},${cy+s2*Math.sin(a)}`;}).join(" ");
  return (
    <div style={{textAlign:"center"}}>
      <svg width={180} height={180} className="hex-score">
        <defs><filter id="hg"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <polygon points={pts} fill="none" stroke="var(--border-bright)" strokeWidth="1"/>
        <polygon points={ipts} fill={`${gc.replace("var(--","").replace(")","") === gc ? gc+"22" : "rgba(212,168,67,0.13)"}`} stroke={gc} strokeWidth="1.5" filter="url(#hg)" style={{animation:"glowPulse 3s ease infinite"}}/>
        <text x={cx} y={cy-8} textAnchor="middle" fill={gc} fontSize="36" fontFamily="Playfair Display,serif" fontWeight="700">{g}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fill="var(--muted)" fontSize="10" fontFamily="Space Mono" letterSpacing="2">{score}/100</text>
      </svg>
      <div style={{fontSize: 13,color:gc,letterSpacing:"0.15em",marginTop:-8}}>{gl.toUpperCase()}</div>
    </div>
  );
}

// ─── File processing ──────────────────────────────────────────────────────────
async function processZip(file) {
  const zip = await JSZip.loadAsync(file);
  const find = pat => zip.file(new RegExp(pat,"i"))[0];
  const result = {};
  const cf = find("connections\\.csv"); if(cf) result.connections = parseCSV(await cf.async("string"));
  const mf = find("messages\\.csv");    if(mf) result.messages    = parseCSV(await mf.async("string"));
  const ivf = find("invitations\\.csv");             if(ivf) result.invitations = parseCSV(await ivf.async("string"));
  const sf = find("skills\\.csv");                    if(sf) result.skills = parseCSV(await sf.async("string"));
  const ef = find("endorsement_received_info\\.csv"); if(ef) result.endorsements = parseCSV(await ef.async("string"));
  const pf = find("positions\\.csv");                 if(pf) result.positions = parseCSV(await pf.async("string"));
  const prof = find("profile\\.csv");                 if(prof) result.profile = parseCSV(await prof.async("string"));
  const edf = find("education\\.csv");                if(edf) result.education = parseCSV(await edf.async("string"));
  const cef = find("certifications\\.csv");           if(cef) result.certifications = parseCSV(await cef.async("string"));
  const rrf = find("recommendations_received\\.csv"); if(rrf) result.recsReceived = parseCSV(await rrf.async("string"));
  const rgf = find("recommendations_given\\.csv");    if(rgf) result.recsGiven = parseCSV(await rgf.async("string"));
  const lf = find("learning\\.csv");                  if(lf) result.learning = parseCSV(await lf.async("string"));
  const egf = find("endorsement_given_info\\.csv");    if(egf) result.endorsementsGiven = parseCSV(await egf.async("string"));
  const rmf = find("rich_media\\.csv");                if(rmf) result.richMedia = parseCSV(await rmf.async("string"));
  const regf = find("registration\\.csv");             if(regf) result.registration = parseCSV(await regf.async("string"));
  const sjf = find("saved\\.?jobs\\.csv");             if(sjf) result.savedJobs = parseCSV(await sjf.async("string"));
  const jaf = find("job.?applications?\\.csv");        if(jaf) result.jobApplications = parseCSV(await jaf.async("string"));
  const saf = find("saved.?job.?alerts?\\.csv");       if(saf) result.savedJobAlerts = parseCSV(await saf.async("string"));
  const cff = find("company.?follows\\.csv");          if(cff) result.companyFollows = parseCSV(await cff.async("string"));
  const evf = find("events\\.csv");                    if(evf) result.events = parseCSV(await evf.async("string"));
  const jsp = find("job.?seeker.?preferences\\.csv");  if(jsp) result.jobSeekerPrefs = parseCSV(await jsp.async("string"));
  const jsqr = find("job.?applicant.?saved.?screening\\.csv"); if(jsqr) result.screeningResponses = parseCSV(await jsqr.async("string"));
  const ojp = find("online.?job.?postings\\.csv");     if(ojp) result.jobPostings = parseCSV(await ojp.async("string"));
  const vff = find("verifications\\.csv");             if(vff) result.verifications = parseCSV(await vff.async("string"));
  // Articles (HTML files)
  const articleFiles = zip.file(/articles?\/.*\.html$/i);
  if (articleFiles.length > 0) {
    result.articles = [];
    for (const af2 of articleFiles) {
      const html = await af2.async("string");
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) || html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].trim() : af2.name.replace(/.*\//, "").replace(/\.html$/i, "").replace(/-/g, " ");
      // Extract text content from paragraphs
      const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
      const bodyText = paragraphs.map(p => p.replace(/<[^>]+>/g, "").trim()).filter(t => t.length > 20).join(" ");
      const dateMatch = html.match(/datetime="([^"]+)"/i) || html.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1].slice(0, 10) : "";
      const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
      result.articles.push({ title, bodyText: bodyText.slice(0, 2000), date, wordCount, fileName: af2.name });
    }
  }
  return result;
}

// ─── Shared analysis pipeline ────────────────────────────────────────────────
function analyseAllFiles(files) {
  return {
    connections: analyseConnections(files.connections),
    messages:    files.messages    ? analyseMessages(files.messages)  : null,
    invitations: files.invitations ? analyseInvitations(files.invitations) : null,
    skills:      (files.skills || files.endorsements) ? analyseSkills(files.skills, files.endorsements) : null,
    profile:     files.profile?.[0] || null,
    positions:   files.positions || null,
    education:   files.education || null,
    certifications: files.certifications || null,
    recsReceived: files.recsReceived || null,
    recsGiven:   files.recsGiven || null,
    learning:    files.learning ? analyseLearning(files.learning) : null,
    endorsementReciprocity: analyseEndorsementReciprocity(files.endorsementsGiven, files.endorsements),
    silentNetwork: analyseSilentNetwork(files.connections, files.messages),
    careerIntent: analyseCareerIntent(files.savedJobs, files.jobApplications, files.savedJobAlerts),
    contentCreator: analyseContentCreator(files.richMedia),
    registration: files.registration?.[0] || null,
    companyFollows: analyseCompanyFollows(files.companyFollows, files.savedJobs),
    events: analyseEvents(files.events),
    jobSeekerPrefs: analyseJobSeekerPrefs(files.jobSeekerPrefs),
    articles: analyseArticles(files.articles),
    verifications: analyseVerifications(files.verifications),
    jobPostings: files.jobPostings || null,
    filesFound:  Object.keys(files),
  };
}

// ─── App ──────────────────────────────────────────────────────────────────────
// ─── Error Boundary ──────────────────────────────────────────────────────────
class ReportErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[CareerPrint] Report rendering error:", error);
    console.error("[CareerPrint] Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",maxWidth:560,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:24}}>⚠️</div>
          <h2 className="serif" style={{fontSize:28,fontWeight:400,marginBottom:12}}>Something went wrong</h2>
          <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.8,marginBottom:24}}>
            An error occurred while rendering your analysis report. This is usually caused by unexpected data in your LinkedIn export.
          </p>
          <div style={{padding:"12px 16px",background:"rgba(232,96,96,0.08)",border:"1px solid rgba(232,96,96,0.25)",color:"var(--rose)",fontSize:12,marginBottom:24,lineHeight:1.6,textAlign:"left",maxWidth:"100%",overflow:"auto",borderRadius:4}}>
            {this.state.error?.message || "Unknown error"}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); this.props.onReset?.(); }}
            style={{padding:"12px 32px",background:"var(--gold)",color:"var(--bg)",border:"none",cursor:"pointer",fontSize:13,letterSpacing:"0.1em",fontWeight:600}}
          >
            ↑ TRY ANOTHER FILE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [stage, setStage] = useState("upload");
  const [analysed, setAnalysed] = useState(null);
  const [error, setError]   = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const fileRef = useRef();

  useEffect(()=>{
    const s = document.createElement("style");
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
    return ()=>document.head.removeChild(s);
  },[]);

  const process = useCallback(async (file) => {
    setError(""); setStage("analysing");
    try {
      // File size guard (50 MB)
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 50 MB. Try requesting a smaller export from LinkedIn.`);
      }

      // Helper: wrap a promise with a timeout
      const withTimeout = (promise, ms, label) =>
        Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s. The file may be too large or corrupted.`)), ms)),
        ]);

      let files = {};
      if (file.name.endsWith(".zip")) {
        files = await withTimeout(processZip(file), 30000, "Zip extraction");
        if (!files.connections) throw new Error("Couldn't find Connections.csv in the zip.");
      } else if (file.name.endsWith(".csv")) {
        const text = await withTimeout(file.text(), 10000, "File reading");
        files.connections = parseCSV(text);
      } else {
        throw new Error("Please upload your LinkedIn zip export or Connections.csv");
      }
      if (!files.connections || files.connections.length < 5) throw new Error("Too few connections found. Make sure this is your Connections.csv.");
      await new Promise(r=>setTimeout(r,2000));
      setAnalysed(analyseAllFiles(files));
      setStage("results");
    } catch(e) {
      const msg = e.message || "Unknown error";
      // Provide user-friendly messages for common failure modes
      if (msg.includes("invalid zip") || msg.includes("Corrupted") || msg.includes("End of data")) {
        setError("This file appears to be corrupted or is not a valid zip archive. Please re-download your LinkedIn export and try again.");
      } else if (msg.includes("timed out")) {
        setError(msg);
      } else {
        setError(msg);
      }
      setStage("upload");
    }
  },[]);

  const loadDemo = useCallback(async () => {
    setError(""); setStage("analysing"); setIsDemo(true);
    try {
      const res = await fetch("/demo-data.json");
      if (!res.ok) throw new Error("Could not load demo data.");
      const files = await res.json();
      if (!files.connections || files.connections.length < 5) throw new Error("Demo data is incomplete.");
      await new Promise(r => setTimeout(r, 2000));
      setAnalysed(analyseAllFiles(files));
      setStage("results");
    } catch (e) {
      setError(e.message || "Failed to load demo.");
      setIsDemo(false);
      setStage("upload");
    }
  }, []);

  const onDrop = useCallback(e=>{
    e.preventDefault(); setDragOver(false);
    const f=e.dataTransfer.files[0]; if(f) process(f);
  },[process]);

  const resetToUpload = useCallback(() => { setStage("upload"); setAnalysed(null); setIsDemo(false); }, []);

  // Auto-load demo from URL parameter
  const demoLoaded = useRef(false);
  useEffect(() => {
    if (demoLoaded.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") { demoLoaded.current = true; loadDemo(); }
  }, [loadDemo]);

  return (
    <>
      {stage==="upload"    && <Upload onDrop={onDrop} dragOver={dragOver} setDragOver={setDragOver} fileRef={fileRef} process={process} error={error} loadDemo={loadDemo}/>}
      {stage==="analysing" && <Analysing/>}
      {stage==="results"   && analysed && <ReportErrorBoundary onReset={resetToUpload}><Results data={analysed} onReset={resetToUpload} isDemo={isDemo}/></ReportErrorBoundary>}
    </>
  );
}

// ─── Upload ───────────────────────────────────────────────────────────────────
function Upload({ onDrop, dragOver, setDragOver, fileRef, process, error, loadDemo }) {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"40px 24px",maxWidth:680,margin:"0 auto"}}>
      <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle, rgba(212,168,67,0.04) 0%, transparent 70%)",top:"20%",left:"50%",transform:"translateX(-50%)"}}/>
      </div>
      <div style={{position:"relative",zIndex:1}}>
        <div className="animate-fade-up" style={{marginBottom:8}}>
          <span style={{fontSize: 11,letterSpacing:"0.25em",color:"var(--gold)",borderBottom:"1px solid var(--gold-dim)",paddingBottom:2}}>CAREERPRINT.AI</span>
        </div>
        <h1 className="serif animate-fade-up-1" style={{fontSize:"clamp(32px,5vw,52px)",fontWeight:400,lineHeight:1.1,margin:"16px 0 12px"}}>
          Your career has<br/>a fingerprint.<br/><em style={{color:"var(--gold)"}}>This is yours.</em>
        </h1>
        <p className="animate-fade-up-2" style={{color:"var(--muted)",fontSize: 13,lineHeight:1.8,marginBottom:36,maxWidth:520}}>
          Upload your LinkedIn data export and discover what your network really says about you — your reach, your reputation, your momentum.
        </p>
        <div className={`drop-zone animate-fade-up-3 ${dragOver?"over":""}`}
          style={{padding:"48px 40px",textAlign:"center",marginBottom:16}}
          onDrop={onDrop} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
          onClick={()=>fileRef.current.click()}>
          <div className="upload-icon" style={{fontSize: 32,marginBottom:12}}>↑</div>
          <div className="serif" style={{fontSize: 22,marginBottom:6}}>Drop your export here</div>
          <div style={{fontSize: 11,color:"var(--muted)",letterSpacing:"0.15em"}}>CONNECTIONS.CSV · OR FULL ZIP ARCHIVE</div>
          <input ref={fileRef} type="file" accept=".csv,.zip" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f)process(f);}}/>
        </div>
        <div className="animate-fade-up-3" style={{textAlign:"center",marginBottom:16}}>
          <button onClick={loadDemo} style={{background:"none",border:"1px solid var(--gold-dim)",color:"var(--gold)",padding:"10px 28px",cursor:"pointer",fontSize:12,letterSpacing:"0.12em",fontFamily:"'Space Mono', monospace",transition:"all 0.2s ease"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(212,168,67,0.08)";e.currentTarget.style.borderColor="var(--gold)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.borderColor="var(--gold-dim)";}}>
            SEE A SAMPLE REPORT
          </button>
        </div>
        {error && <div style={{padding:"12px 16px",background:"rgba(232,96,96,0.08)",border:"1px solid rgba(232,96,96,0.25)",color:"var(--rose)",fontSize: 13,marginBottom:16,lineHeight:1.6}}>{error}</div>}
        <div className="card animate-fade-up-4" style={{padding:24,marginBottom:16}}>
          <div style={{fontSize: 11,letterSpacing:"0.2em",color:"var(--gold)",marginBottom:14}}>HOW TO GET YOUR DATA</div>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"10px 16px",fontSize: 13,color:"var(--muted)",lineHeight:1.6}}>
            {[["01","Go to LinkedIn → Settings & Privacy"],["02","Data Privacy → Get a copy of your data"],["03","Select 'Download larger data archive' → Request"],["04","Upload the zip file you receive by email"]].map(([n,t],i)=>(
              <><span key={`n${i}`} style={{color:"var(--gold-dim)",fontWeight:700}}>{n}</span><span key={`t${i}`} style={{color:i===3?"var(--gold)":"var(--text)"}}>{t}</span></>
            ))}
          </div>
        </div>
        <div className="animate-fade-up-5" style={{display:"flex",gap:24,fontSize: 11,color:"var(--muted)",letterSpacing:"0.08em",flexWrap:"wrap"}}>
          <span>🔒 Runs entirely in your browser</span>
          <span>⚡ No data stored or transmitted</span>
          <span>📁 Works with full zip or just Connections.csv</span>
        </div>
      </div>
    </div>
  );
}

// ─── Analysing ────────────────────────────────────────────────────────────────
function Analysing() {
  const steps = ["Parsing connection data...","Classifying industries...","Scoring seniority levels...","Mapping career timeline...","Analysing skills & endorsements...","Cross-referencing endorsement reciprocity...","Scanning message engagement depth...","Analysing career intent signals...","Mapping content footprint...","Benchmarking against platform averages...","Parsing published articles...","Mapping company follows & events...","Cataloguing learning activity...","Calculating network health...","Generating insights..."];
  const [step,setStep] = useState(0);
  useEffect(()=>{const t=setInterval(()=>setStep(s=>Math.min(s+1,steps.length-1)),400);return()=>clearInterval(t);},[]);
  const progress = Math.round(((step + 1) / steps.length) * 100);
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:32}}>
      <div style={{position:"relative"}}>
        <div style={{width:48,height:48,border:"1px solid var(--border)",borderTop:"1px solid var(--gold)",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{position:"absolute",inset:0,border:"1px solid transparent",borderRight:"1px solid var(--gold-dim)",borderRadius:"50%",animation:"spin 2s linear infinite reverse"}}/>
      </div>
      <div style={{textAlign:"center"}}>
        <div className="serif" style={{fontSize: 22,fontWeight:400,marginBottom:8}}>Mapping your network</div>
        <div style={{fontSize:11,color:"var(--gold)",letterSpacing:"0.15em",animation:"pulse 1s ease infinite",marginBottom:12}}>{steps[step]}</div>
        <div style={{width:200,height:2,background:"var(--border)",borderRadius:1,margin:"0 auto"}}>
          <div style={{width:`${progress}%`,height:"100%",background:"var(--gold)",borderRadius:1,transition:"width 0.4s ease"}}/>
        </div>
        <div style={{fontSize:10,color:"var(--muted)",marginTop:6,letterSpacing:"0.1em"}}>{progress}%</div>
      </div>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────
// ─── New SVG Visualisations ──────────────────────────────────────────────────

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const I = (d, vb = "0 0 24 24") => ({ d, vb });
const ICONS = {
  connections: I("M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"),
  sector: I("M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"),
  executive: I("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"),
  growth: I("M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"),
  industry: I("M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"),
  seniority: I("M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"),
  timeline: I("M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z"),
  calendar: I("M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"),
  company: I("M18 15h-2v2h2v-2zm0-4h-2v2h2v-2zm2 8H4V3h7v2H6v12h12v-4h2v6zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"),
  silent: I("M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM5 11a1 1 0 0 0-2 0 9 9 0 0 0 8 8.94V22h-2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.06A9 9 0 0 0 21 11a1 1 0 1 0-2 0 7 7 0 0 1-14 0z"),
  event: I("M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"),
  outreach: I("M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"),
  messages: I("M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"),
  skills: I("M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"),
  reciprocity: I("M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"),
  career: I("M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 0h-4V4h4v2z"),
  education: I("M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"),
  article: I("M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-3-7H9v2h6v-2zm0-2H9v-2h6v2z", "0 0 24 24"),
  recommendation: I("M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9.5 11l-2.5 3h9l-3-4-2.25 3z"),
  learning: I("M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 3l7 4.5-7 4.5V6z"),
  targeting: I("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"),
  ai: I("M21 10.12h-6.78l2.74-2.82-2.2-2.2L8 11.86V17h5.14l6.78-6.78-2.2-2.2 3.28-3.28V10.12zM12.83 15H10v-2.83l6.56-6.56 2.83 2.83L12.83 15z", "0 0 24 24"),
  spend: I("M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"),
  vault: I("M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"),
  content: I("M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 15h14v3H5v-3zm0-4h4v3H5v-3zm6 0h8v3h-8v-3zM5 7h14v3H5V7z"),
  verify: I("M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"),
  services: I("M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z"),
  inference: I("M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"),
  search: I("M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"),
  follow: I("M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"),
  jobseeker: I("M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"),
  roles: I("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"),
  insights: I("M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"),
};

function Icon({ name, size = 14, color, style = {} }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <svg viewBox={icon.vb} width={size} height={size} fill={color || "currentColor"} style={{ flexShrink: 0, verticalAlign: "middle", ...style }}>
      <path d={icon.d} />
    </svg>
  );
}

// ─── Career Journey Map ──────────────────────────────────────────────────────
const CITY_COORDS = {
  "london":[51.5,-0.1],"new york":[40.7,-74],"san francisco":[37.8,-122.4],"los angeles":[34.1,-118.2],"chicago":[41.9,-87.6],"toronto":[43.7,-79.4],"sydney":[-33.9,151.2],"melbourne":[-37.8,145],"singapore":[1.35,103.8],"hong kong":[22.3,114.2],"tokyo":[35.7,139.7],"dubai":[25.2,55.3],"mumbai":[19.1,72.9],"bangalore":[12.97,77.6],"delhi":[28.6,77.2],"shanghai":[31.2,121.5],"beijing":[39.9,116.4],"berlin":[52.5,13.4],"paris":[48.9,2.35],"amsterdam":[52.4,4.9],"dublin":[53.3,-6.3],"manchester":[53.5,-2.2],"birmingham":[52.5,-1.9],"edinburgh":[55.95,-3.2],"glasgow":[55.9,-4.3],"bristol":[51.45,-2.6],"leeds":[53.8,-1.5],"liverpool":[53.4,-3],"cardiff":[51.5,-3.2],"belfast":[54.6,-5.9],"boston":[42.4,-71.1],"seattle":[47.6,-122.3],"austin":[30.3,-97.7],"denver":[39.7,-105],"atlanta":[33.7,-84.4],"miami":[25.8,-80.2],"washington":[38.9,-77],"dallas":[32.8,-96.8],"houston":[29.8,-95.4],"phoenix":[33.4,-112],"philadelphia":[40,-75.2],"munich":[48.1,11.6],"frankfurt":[50.1,8.7],"zurich":[47.4,8.5],"geneva":[46.2,6.1],"milan":[45.5,9.2],"rome":[41.9,12.5],"madrid":[40.4,-3.7],"barcelona":[41.4,2.2],"lisbon":[38.7,-9.1],"stockholm":[59.3,18.1],"copenhagen":[55.7,12.6],"oslo":[59.9,10.8],"helsinki":[60.2,24.9],"vienna":[48.2,16.4],"brussels":[50.8,4.4],"prague":[50.1,14.4],"warsaw":[52.2,21],"budapest":[47.5,19.1],"cape town":[-34,18.4],"johannesburg":[-26.2,28],"nairobi":[-1.3,36.8],"lagos":[6.5,3.4],"cairo":[30,31.2],"sao paulo":[-23.5,-46.6],"buenos aires":[-34.6,-58.4],"mexico city":[19.4,-99.1],"bogota":[4.7,-74.1],"santiago":[-33.4,-70.6],"lima":[-12,-77],"vancouver":[49.3,-123.1],"montreal":[45.5,-73.6],"calgary":[51.1,-114.1],"ottawa":[45.4,-75.7],"auckland":[-36.8,174.8],"perth":[-31.95,115.9],"brisbane":[-27.5,153],"kuala lumpur":[3.1,101.7],"bangkok":[13.8,100.5],"jakarta":[-6.2,106.8],"manila":[14.6,121],"seoul":[37.6,127],"taipei":[25,121.5],"tel aviv":[32.1,34.8],"riyadh":[24.7,46.7],"doha":[25.3,51.5],"abu dhabi":[24.45,54.65],
  // UK specific
  "greater london":[51.5,-0.1],"london area":[51.5,-0.1],"greater manchester":[53.5,-2.2],"west midlands":[52.5,-1.9],"west yorkshire":[53.8,-1.5],"south east england":[51.2,-0.5],"south west england":[51,-2.5],"east midlands":[52.8,-1.2],"north west england":[53.8,-2.6],"north east england":[54.9,-1.6],"scotland":[56,-4],"wales":[52.1,-3.6],"northern ireland":[54.6,-6.5],
  "surrey":[51.3,-0.4],"kent":[51.2,0.7],"essex":[51.7,0.5],"hertfordshire":[51.8,-0.2],"berkshire":[51.4,-1.1],"oxfordshire":[51.8,-1.3],"cambridgeshire":[52.2,0.1],"norfolk":[52.6,1.2],"suffolk":[52.2,1.1],"devon":[50.7,-3.5],"cornwall":[50.3,-5],"somerset":[51.1,-2.9],"hampshire":[51.1,-1.3],"dorset":[50.7,-2.3],"wiltshire":[51.3,-1.9],"gloucestershire":[51.8,-2.2],
  // France
  "fontainebleau":[48.4,2.7],"île-de-france":[48.8,2.3],"ile-de-france":[48.8,2.3],"lyon":[45.8,4.8],"marseille":[43.3,5.4],"toulouse":[43.6,1.4],"nice":[43.7,7.3],"nantes":[47.2,-1.6],"strasbourg":[48.6,7.8],"bordeaux":[44.8,-0.6],"lille":[50.6,3.1],
  // Australia
  "perth":[-31.95,115.9],"adelaide":[-34.9,138.6],"canberra":[-35.3,149.1],"hobart":[-42.9,147.3],"gold coast":[-28,153.4],"newcastle":[-32.9,151.8],
};

function geocodeLocation(loc) {
  if (!loc) return null;
  const lower = loc.toLowerCase().replace(/,?\s*(united kingdom|uk|england|usa|us|united states|australia|canada)$/i, "").trim();
  // Try exact match
  if (CITY_COORDS[lower]) return CITY_COORDS[lower];
  // Try partial — check if any key is contained in the location or vice versa
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }
  // Try splitting on comma and matching first part
  const parts = lower.split(",").map(s => s.trim());
  for (const part of parts) {
    if (CITY_COORDS[part]) return CITY_COORDS[part];
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (part.includes(key) || key.includes(part)) return coords;
    }
  }
  return null;
}

// Mercator projection
function project(lat, lon, w, h, padX = 40, padY = 40) {
  const x = padX + ((lon + 180) / 360) * (w - 2 * padX);
  const latRad = (lat * Math.PI) / 180;
  const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = padY + (0.5 - mercY / (2 * Math.PI)) * (h - 2 * padY);
  return [x, y];
}

function CareerMap({ positions }) {
  if (!positions || positions.length === 0) return null;

  // Build all stops chronologically (positions are newest-first)
  const allStops = [];
  for (let i = positions.length - 1; i >= 0; i--) {
    const p = positions[i];
    const loc = p["Location"] || "";
    const coords = loc && loc.toLowerCase() !== "global" ? geocodeLocation(loc) : null;
    const started = p["Started On"] || "";
    const finished = p["Finished On"] || "Present";
    const startYear = started ? parseInt(started.split(" ").pop()) || 0 : 0;
    allStops.push({
      lat: coords ? coords[0] : null, lon: coords ? coords[1] : null,
      title: p["Title"] || "", company: p["Company Name"] || "",
      location: loc || "—", started, finished, startYear,
      isGlobal: loc.toLowerCase() === "global",
      hasCoords: !!coords,
    });
  }
  if (allStops.length === 0) return null;

  // Compute bounding box from geocoded points
  const geoStops = allStops.filter(s => s.hasCoords);
  const W = 900, H = 450;
  const pad = 60;

  // Custom projection that fits to data bounds (or falls back to Europe-centered)
  let projectFn;
  // Start from data points, add generous padding so continent outlines are visible
  const baseBounds = geoStops.length > 0
    ? { minLat: Math.min(...geoStops.map(s => s.lat)), maxLat: Math.max(...geoStops.map(s => s.lat)),
        minLon: Math.min(...geoStops.map(s => s.lon)), maxLon: Math.max(...geoStops.map(s => s.lon)) }
    : { minLat: 35, maxLat: 62, minLon: -12, maxLon: 20 }; // fallback: Western Europe
  // Add padding — more generous for wider spreads
  const latSpan = baseBounds.maxLat - baseBounds.minLat;
  const lonSpan = baseBounds.maxLon - baseBounds.minLon;
  const latPad = Math.max(12, latSpan * 0.35);
  const lonPad = Math.max(20, lonSpan * 0.25);
  baseBounds.minLat -= latPad;
  baseBounds.maxLat += latPad;
  baseBounds.minLon -= lonPad;
  baseBounds.maxLon += lonPad;
  projectFn = (lat, lon) => {
    const x = pad + ((lon - baseBounds.minLon) / (baseBounds.maxLon - baseBounds.minLon)) * (W - 2 * pad);
    const y = pad + ((baseBounds.maxLat - lat) / (baseBounds.maxLat - baseBounds.minLat)) * (H - 2 * pad);
    return [x, y];
  };

  // Simplified world continent outlines (lat/lon pairs) for background map
  const coastlines = [
    // North America
    [[60,-140],[64,-139],[70,-140],[72,-120],[70,-100],[65,-85],[60,-78],[52,-67],[47,-60],[44,-66],[42,-70],[40,-74],[30,-81],[25,-80],[25,-97],[20,-105],[15,-92],[15,-87],[18,-88],[21,-87],[21,-90],[30,-90],[29,-95],[26,-97],[32,-117],[34,-120],[37,-122],[40,-124],[48,-124],[50,-128],[55,-133],[60,-140]],
    // South America
    [[-5,-80],[-2,-80],[7,-77],[12,-72],[12,-62],[8,-60],[7,-52],[2,-50],[-2,-44],[-8,-35],[-13,-39],[-18,-40],[-23,-41],[-28,-49],[-34,-53],[-36,-57],[-40,-62],[-42,-64],[-46,-67],[-50,-68],[-53,-70],[-55,-68],[-54,-64],[-48,-65],[-42,-63],[-38,-57],[-33,-52],[-23,-43],[-22,-40],[-17,-36],[-12,-37],[-5,-35],[-1,-50],[2,-53],[6,-57],[8,-60],[12,-68],[10,-72],[7,-77],[-5,-80]],
    // Europe
    [[36,-6],[37,-2],[38,0],[40,0],[42,3],[43,5],[44,8],[44,12],[41,13],[40,15],[38,16],[37,15],[36,13],[35,24],[38,24],[38,27],[40,26],[41,29],[43,28],[45,14],[46,14],[47,7],[48,8],[50,4],[51,2],[51,4],[53,5],[54,9],[55,9],[56,8],[57,10],[58,12],[60,5],[62,5],[65,14],[69,16],[71,25],[70,28],[65,30],[60,28],[60,30],[59,18],[56,13],[55,13],[54,14],[54,20],[55,24],[56,21],[58,28],[56,28],[55,27],[54,23],[54,14],[50,14],[48,17],[47,19],[44,15],[42,19],[40,20],[40,23],[38,24]],
    // Africa
    [[36,10],[37,10],[37,11],[35,0],[36,-6],[33,-8],[28,-13],[22,-17],[15,-17],[12,-16],[5,-5],[5,2],[4,10],[6,2],[2,10],[4,10],[0,10],[-5,12],[-6,39],[-11,40],[-15,41],[-25,35],[-34,18],[-34,26],[-30,31],[-26,33],[-15,41],[-11,40],[-6,39],[-1,42],[2,45],[10,45],[12,51],[15,42],[12,44],[11,42],[13,48],[15,40],[20,37],[22,37],[25,34],[30,33],[32,32],[33,35],[35,36],[37,11],[37,10]],
    // Asia
    [[42,29],[41,36],[37,36],[33,35],[30,33],[25,34],[20,38],[13,45],[12,51],[10,52],[2,45],[-1,42],[-6,39],[-5,12],[0,10],[2,10],[4,10],[6,2],[5,-5],[5,2],[4,10],[8,0],[5,10],[10,10],[5,40],[8,45],[10,52],[15,55],[22,59],[25,62],[25,66],[22,70],[21,73],[18,73],[17,78],[8,77],[6,80],[1,104],[2,106],[5,105],[10,106],[12,109],[20,106],[22,114],[26,120],[30,122],[35,129],[38,125],[35,127],[34,130],[38,130],[40,130],[42,132],[44,135],[46,143],[51,141],[54,137],[53,140],[60,163],[65,170],[68,180],[72,180],[72,130],[70,135],[65,140],[60,160],[58,163],[56,160],[60,145],[60,130],[55,135],[50,130],[47,140],[45,133],[40,130],[35,120],[30,105],[28,95],[28,85],[30,80],[23,70],[25,63],[25,55],[30,48],[35,36],[40,44],[40,50],[45,52],[52,55],[55,55],[55,68],[62,70],[65,68],[65,75],[68,70],[70,60],[72,55],[67,50],[60,42],[57,38],[54,30],[43,28],[42,29]],
    // Australia
    [[-12,131],[-12,136],[-15,136],[-14,141],[-18,140],[-17,146],[-20,149],[-24,152],[-28,153],[-33,152],[-37,150],[-39,146],[-39,144],[-37,140],[-35,137],[-35,135],[-32,133],[-32,131],[-31,115],[-22,114],[-20,119],[-15,129],[-12,131]],
    // Great Britain (small but iconic)
    [[50,-5],[50.5,-3.5],[51,1],[52,2],[53,0],[54,-1],[55,-2],[56,-3],[57,-2],[58,-3],[58,-5],[57,-6],[56,-5.5],[55,-5],[54,-5],[54,-3],[53,-3],[52.5,-4.5],[51.5,-5],[50.5,-5],[50,-5]],
    // Japan
    [[31,131],[33,130],[34,132],[35,135],[35,137],[36,140],[38,140],[40,140],[41,140],[43,145],[45,142],[43,141],[40,140],[36,140],[35,137],[35,135],[34,132],[33,131],[31,131]],
    // Indonesia / SE Asia islands
    [[-6,106],[-7,106],[-8,110],[-8,114],[-7,115],[-6,110],[-6,106]],
    [[-2,100],[-1,104],[1,104],[2,106],[1,109],[0,109],[-1,104],[-2,100]],
    // New Zealand
    [[-35,174],[-37,175],[-38,177],[-41,175],[-42,172],[-44,169],[-46,167],[-46,170],[-44,172],[-42,174],[-39,178],[-37,176],[-35,174]],
  ];

  // Compute unique geocoded locations for dots
  const seen = new Set();
  const uniqueGeo = [];
  for (const s of allStops) {
    if (!s.hasCoords) continue;
    const key = `${s.lat},${s.lon}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const xy = projectFn(s.lat, s.lon);
    // Collect all roles at this location
    const roles = allStops.filter(r => r.hasCoords && r.lat === s.lat && r.lon === s.lon);
    uniqueGeo.push({ ...s, xy, roles });
  }

  // Timeline layout: all positions as a horizontal journey
  const minYear = Math.min(...allStops.filter(s => s.startYear).map(s => s.startYear));
  const maxYear = Math.max(...allStops.filter(s => s.startYear).map(s => s.startYear), new Date().getFullYear());
  const yearSpan = maxYear - minYear || 1;

  return (
    <div className="scroll-reveal" style={{ marginBottom: 64 }}>
      <SectionLabel icon="career">CAREER JOURNEY MAP</SectionLabel>
      <div className="card" style={{ padding: 32, overflow: "hidden" }}>
        {/* Map section — only if we have geocoded points */}
        {uniqueGeo.length > 0 && (
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", marginBottom: 24 }}>
            <defs>
              <radialGradient id="mapDotGrad"><stop offset="0%" stopColor="var(--gold)" stopOpacity="0.5" /><stop offset="100%" stopColor="var(--gold)" stopOpacity="0" /></radialGradient>
              <filter id="mapGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            {/* Coastline outlines */}
            {coastlines.map((coast, ci) => {
              const d = coast.map((c, j) => {
                const [x, y] = projectFn(c[0], c[1]);
                return `${j === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
              }).join(" ");
              return <path key={`coast${ci}`} d={d} fill="rgba(212,168,67,0.03)" stroke="rgba(212,168,67,0.25)" strokeWidth="1" strokeLinejoin="round" />;
            })}
            {/* Journey paths */}
            {uniqueGeo.map((p, i) => {
              if (i === 0) return null;
              const prev = uniqueGeo[i - 1];
              const dx = p.xy[0] - prev.xy[0], dy = p.xy[1] - prev.xy[1];
              const dist = Math.sqrt(dx * dx + dy * dy);
              const cpx = (prev.xy[0] + p.xy[0]) / 2 - dy * 0.3;
              const cpy = (prev.xy[1] + p.xy[1]) / 2 + dx * 0.3;
              return (
                <path key={`jp${i}`} d={`M ${prev.xy[0]} ${prev.xy[1]} Q ${cpx} ${cpy} ${p.xy[0]} ${p.xy[1]}`}
                  fill="none" stroke="var(--gold)" strokeWidth="1.5" opacity="0.35"
                  strokeDasharray={dist} strokeDashoffset={dist}
                  style={{ animation: `drawIn 1.5s ${0.3 + i * 0.4}s ease forwards` }} />
              );
            })}
            {/* Location dots */}
            {uniqueGeo.map((p, i) => {
              const isCurrent = i === uniqueGeo.length - 1;
              const roleCount = p.roles.length;
              const dotR = Math.min(8 + roleCount * 3, 18);
              const label = p.location.split(",")[0].trim();
              return (
                <g key={`md${i}`} style={{ animation: `floatIn 0.6s ${0.2 + i * 0.3}s ease forwards`, opacity: 0 }}>
                  {/* Glow halo */}
                  <circle cx={p.xy[0]} cy={p.xy[1]} r={dotR * 3} fill="url(#mapDotGrad)" />
                  {/* Main dot */}
                  <circle cx={p.xy[0]} cy={p.xy[1]} r={dotR} fill="var(--gold)" opacity={isCurrent ? 0.85 : 0.5} filter="url(#mapGlow)"
                    style={isCurrent ? { animation: "pulseNode 2.5s ease infinite" } : {}} />
                  <circle cx={p.xy[0]} cy={p.xy[1]} r={dotR * 0.4} fill="var(--bg)" />
                  {/* Role count badge */}
                  {roleCount > 1 && (
                    <text x={p.xy[0]} y={p.xy[1] + 3.5} textAnchor="middle" fill="var(--gold)" fontSize="9" fontFamily="Space Mono" fontWeight="700">{roleCount}</text>
                  )}
                  {/* Location label */}
                  <text x={p.xy[0]} y={p.xy[1] - dotR - 8} textAnchor="middle" fill={isCurrent ? "var(--gold)" : "var(--text)"} fontSize="11" fontFamily="Space Mono" fontWeight={isCurrent ? "700" : "400"}
                    style={{ animation: `fadeIn 0.5s ${0.6 + i * 0.3}s forwards`, opacity: 0 }}>
                    {label}
                  </text>
                  {/* Roles under the dot */}
                  {p.roles.map((r, ri) => (
                    <text key={ri} x={p.xy[0]} y={p.xy[1] + dotR + 14 + ri * 13} textAnchor="middle" fill="var(--muted)" fontSize="8" fontFamily="Space Mono"
                      style={{ animation: `fadeIn 0.4s ${0.8 + i * 0.3 + ri * 0.1}s forwards`, opacity: 0 }}>
                      {r.company.length > 28 ? r.company.slice(0, 26) + "…" : r.company}{r.started ? ` (${r.started.split(" ").pop()})` : ""}
                    </text>
                  ))}
                  {isCurrent && <text x={p.xy[0]} y={p.xy[1] - dotR - 20} textAnchor="middle" fill="var(--gold)" fontSize="7" fontFamily="Space Mono" letterSpacing="2"
                    style={{ animation: `fadeIn 0.5s ${0.8 + i * 0.3}s forwards`, opacity: 0 }}>CURRENT</text>}
                </g>
              );
            })}
          </svg>
        )}

        {/* Horizontal timeline — all positions */}
        <div style={{ position: "relative", padding: "24px 0 8px" }}>
          {/* Timeline line */}
          <div style={{ position: "absolute", top: 24, left: 0, right: 0, height: 2, background: "var(--border)", opacity: 0.3 }} />
          {/* Year markers */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, position: "relative" }}>
            {Array.from({ length: Math.min(yearSpan + 1, 12) }, (_, i) => {
              const year = minYear + Math.round(i * yearSpan / Math.min(yearSpan, 11));
              return <span key={year} style={{ fontSize: 9, color: "var(--muted)", fontFamily: "Space Mono", opacity: 0.5 }}>{year}</span>;
            })}
          </div>
          {/* Position nodes — oldest first (left) to newest (right) */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
            {[...allStops].sort((a, b) => a.startYear - b.startYear).map((s, i, arr) => {
              const isCurrent = !s.finished || s.finished === "Present";
              return (
                <div key={i} className="scroll-reveal" style={{
                  flex: "1 1 160px", maxWidth: 220, padding: "12px 14px",
                  background: isCurrent ? "rgba(212,168,67,0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isCurrent ? "rgba(212,168,67,0.3)" : "var(--border)"}`,
                  borderRadius: 8, position: "relative",
                  animation: `floatIn 0.5s ${0.1 + i * 0.08}s ease forwards`, opacity: 0,
                }}>
                  {isCurrent && <div style={{ position: "absolute", top: -6, right: 8, fontSize: 7, fontFamily: "Space Mono", color: "var(--gold)", letterSpacing: 1.5, background: "var(--bg)", padding: "0 4px" }}>NOW</div>}
                  <div style={{ fontSize: 9, color: "var(--gold)", fontFamily: "Space Mono", letterSpacing: "0.05em", marginBottom: 4 }}>
                    {s.started}{s.finished !== "Present" ? ` → ${s.finished}` : ""}{s.isGlobal ? " · GLOBAL" : ""}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginBottom: 2, lineHeight: 1.3 }}>{s.title}</div>
                  <div style={{ fontSize: 9, color: "var(--muted)" }}>{s.company}</div>
                  {s.location !== "—" && !s.isGlobal && (
                    <div style={{ fontSize: 9, color: "var(--gold-dim)", marginTop: 4 }}>
                      <span style={{ opacity: 0.6 }}>📍</span> {s.location.split(",")[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillsConstellation({ skills: sk }) {
  if (!sk || sk.totalEndorsements === 0) return null;
  const allSkills = sk.topSkills.length > 0 ? sk.topSkills.slice(0, 24) : [];
  if (allSkills.length === 0) return null;
  const cx = 600, cy = 450;
  const maxEnd = allSkills[0][1] || 1;
  const golden = 2.39996323;
  const nodes = allSkills.map(([name, count], i) => {
    const r = 160 + Math.sqrt(i) * 80;
    const angle = i * golden;
    const size = 16 + (count / maxEnd) * 48;
    return { name, count, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), size, i };
  });
  const rings = [160, 260, 360, 450];
  const [hoveredNode, setHoveredNode] = useState(null);

  return (
    <div style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "40px 0" }}>
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,168,67,0.08) 0%, transparent 70%)", animation: "ambientGlow 6s ease infinite", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      <svg data-share-constellation viewBox="0 0 1200 900" style={{ width: "100%", maxHeight: "90vh", height: "auto", position: "relative", zIndex: 1 }}>
        <defs>
          <filter id="skillGlow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="skillGlowStrong"><feGaussianBlur stdDeviation="10" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="shimmer"><feGaussianBlur stdDeviation="3" result="b" /><feSpecularLighting in="b" surfaceScale="3" specularConstant="0.8" specularExponent="20" result="s"><fePointLight x="600" y="450" z="200" /></feSpecularLighting><feComposite in="SourceGraphic" in2="s" operator="arithmetic" k1="0" k2="1" k3="0.4" k4="0" /></filter>
          <radialGradient id="skillNodeGrad"><stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4" /><stop offset="100%" stopColor="var(--gold)" stopOpacity="0.05" /></radialGradient>
          <radialGradient id="skillNodeHoverGrad"><stop offset="0%" stopColor="var(--gold)" stopOpacity="0.7" /><stop offset="100%" stopColor="var(--gold)" stopOpacity="0.15" /></radialGradient>
        </defs>
        {rings.map((r, i) => (
          <circle key={`ring${i}`} cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="0.3" opacity={0.3 - i * 0.05} strokeDasharray="4 8" />
        ))}
        {nodes.map((n, i) => {
          if (i === 0) return null;
          const prev = nodes[i - 1];
          const avgSize = (prev.size + n.size) / 2;
          const lineW = 0.5 + (avgSize / 64) * 4;
          const len = Math.hypot(n.x - prev.x, n.y - prev.y);
          const isActive = hoveredNode === i || hoveredNode === i - 1;
          return (
            <g key={`l${i}`}>
              <line x1={prev.x} y1={prev.y} x2={n.x} y2={n.y} stroke="var(--gold-dim)" strokeWidth={lineW} opacity={isActive ? "0.5" : "0.2"}
                strokeDasharray="1000" strokeDashoffset="1000" style={{ animation: `drawIn 2s ${i * 0.1}s ease forwards`, transition: "opacity 0.3s" }} />
              {isActive && (
                <line x1={prev.x} y1={prev.y} x2={n.x} y2={n.y} stroke="var(--gold)" strokeWidth={lineW * 0.8}
                  strokeDasharray={`${len * 0.08} ${len * 0.92}`} strokeLinecap="round"
                  style={{ animation: `electricPulse 4.8s linear infinite` }} />
              )}
            </g>
          );
        })}
        {nodes.map((n) => {
          const isHovered = hoveredNode === n.i;
          return (
            <g key={n.i}
              style={{ animation: `floatIn 0.8s ${n.i * 0.08}s ease forwards`, opacity: 0, cursor: "pointer", transition: "filter 0.3s" }}
              onMouseEnter={() => setHoveredNode(n.i)} onMouseLeave={() => setHoveredNode(null)}>
              {/* Shimmer glow on hover */}
              {isHovered && <circle cx={n.x} cy={n.y} r={n.size * 2} fill="var(--gold)" opacity="0.08" style={{ animation: "shimmerSkill 0.8s ease" }} />}
              {n.i < 5 && <circle cx={n.x} cy={n.y} r={n.size * 1.6} fill="var(--gold)" opacity={isHovered ? 0.12 : 0.04} filter="url(#skillGlowStrong)" style={{ animation: isHovered ? "shimmerSkill 0.8s ease" : `pulseNode 3s ${n.i * 0.5}s ease infinite`, transition: "opacity 0.3s" }} />}
              <circle cx={n.x} cy={n.y} r={isHovered ? n.size * 1.15 : n.size} fill={isHovered ? "url(#skillNodeHoverGrad)" : "url(#skillNodeGrad)"} stroke="var(--gold)" strokeWidth={isHovered ? 2.5 : n.i < 3 ? 2 : n.i < 8 ? 1 : 0.5} opacity={isHovered ? 1 : n.i < 5 ? 1 : 0.7} filter={isHovered ? "url(#skillGlowStrong)" : n.i < 3 ? "url(#skillGlow)" : undefined} style={{ transition: "r 0.3s, opacity 0.3s, stroke-width 0.3s" }} />
              <circle cx={n.x} cy={n.y} r={n.size * 0.4} fill="var(--gold)" opacity={isHovered ? 0.8 : 0.2 + (n.count / maxEnd) * 0.4} style={{ transition: "opacity 0.3s" }} />
              {/* Skill name — always show on hover */}
              {(n.size > 24 || isHovered) && (
                <text x={n.x} y={n.y - (isHovered ? n.size * 1.15 + 10 : n.size > 24 ? -4 : -2)} textAnchor="middle" fill={isHovered ? "var(--gold)" : "var(--text)"} fontSize={isHovered ? "10" : n.size > 24 ? "9" : "7"} fontFamily="Space Mono" fontWeight="700" style={{ transition: "fill 0.3s" }}>{isHovered ? n.name : n.name.length > 18 ? n.name.slice(0, 16) + ".." : n.name}</text>
              )}
              {!isHovered && n.size <= 24 && n.size > 18 && (
                <text x={n.x} y={n.y - n.size - 6} textAnchor="middle" fill="var(--text)" fontSize="7" fontFamily="Space Mono">{n.name.length > 14 ? n.name.slice(0, 12) + ".." : n.name}</text>
              )}
              {/* Endorsement count — show below on hover */}
              {isHovered && <text x={n.x} y={n.y + 4} textAnchor="middle" fill="var(--gold)" fontSize="11" fontFamily="Space Mono" fontWeight="700">{n.count}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CompanyBubbles({ companies, total }) {
  if (!companies || companies.length === 0) return null;
  const items = companies.slice(0, 20);
  const maxCount = items[0][1];
  const W = 900, H = 600;
  const minR = 28, maxR = 100;

  // Size bubbles by sqrt of count for area-proportional scaling
  const bubbles = items.map(([name, count], i) => {
    const skip = /freelance|self.?employed|independent|consultant/i.test(name);
    const domain = skip ? null : companyToDomain(name);
    const r = minR + Math.sqrt(count / maxCount) * (maxR - minR);
    const isNotable = NOTABLE_COMPANIES.has(name);
    return { name, count, r, domain, isNotable, i };
  });

  // Simple circle packing via simulation (greedy placement)
  const placed = [];
  const cx = W / 2, cy = H / 2;
  for (const b of bubbles) {
    if (placed.length === 0) {
      b.x = cx; b.y = cy;
      placed.push(b);
      continue;
    }
    // Try placing at angle spiraling outward
    let bestDist = Infinity, bestX = cx, bestY = cy;
    for (let angle = 0; angle < Math.PI * 20; angle += 0.15) {
      const dist = 2 + angle * 6;
      const tx = cx + Math.cos(angle) * dist;
      const ty = cy + Math.sin(angle) * dist;
      // Check overlap with all placed
      let overlap = false;
      for (const p of placed) {
        const dx = tx - p.x, dy = ty - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < b.r + p.r + 4) { overlap = true; break; }
      }
      if (!overlap) {
        const d = Math.sqrt((tx - cx) ** 2 + (ty - cy) ** 2);
        if (d < bestDist) { bestDist = d; bestX = tx; bestY = ty; }
        break;
      }
    }
    b.x = bestX; b.y = bestY;
    placed.push(b);
  }

  // Auto-fit viewBox to placed bubbles
  let vMinX = Infinity, vMaxX = -Infinity, vMinY = Infinity, vMaxY = -Infinity;
  for (const b of placed) {
    vMinX = Math.min(vMinX, b.x - b.r - 10);
    vMaxX = Math.max(vMaxX, b.x + b.r + 10);
    vMinY = Math.min(vMinY, b.y - b.r - 10);
    vMaxY = Math.max(vMaxY, b.y + b.r + 10);
  }
  const vW = vMaxX - vMinX, vH = vMaxY - vMinY;

  // Color palette — warm tones for light theme
  const colors = [
    "rgba(212,168,67,0.55)", "rgba(61,214,200,0.45)", "rgba(212,104,74,0.45)",
    "rgba(180,140,60,0.4)", "rgba(80,180,170,0.35)", "rgba(200,120,80,0.35)",
    "rgba(160,130,70,0.35)", "rgba(100,190,180,0.3)", "rgba(190,100,70,0.3)",
    "rgba(140,120,80,0.3)", "rgba(120,180,170,0.25)", "rgba(170,90,70,0.25)",
  ];

  return (
    <svg viewBox={`${vMinX} ${vMinY} ${vW} ${vH}`} style={{ width: "100%", height: "auto", maxHeight: 550 }}>
      {placed.map((b, i) => {
        const fontSize = b.r > 60 ? 11 : b.r > 40 ? 9 : 7;
        const countSize = b.r > 60 ? 13 : b.r > 40 ? 11 : 8;
        const showLabel = b.r >= 24;
        const color = colors[i % colors.length];
        const maxChars = Math.floor(b.r / (fontSize * 0.35));
        const label = b.name.length > maxChars ? b.name.slice(0, maxChars - 1) + "…" : b.name;
        return (
          <g key={b.name} style={{ animation: `floatIn 0.5s ${0.1 + i * 0.06}s ease forwards`, opacity: 0 }}>
            <circle cx={b.x} cy={b.y} r={b.r} fill={color} stroke={b.isNotable ? "var(--teal)" : "rgba(0,0,0,0.08)"} strokeWidth={b.isNotable ? 1.5 : 0.5} />
            {showLabel && (
              <>
                <text x={b.x} y={b.y - 2} textAnchor="middle" fill="var(--cream-text)" fontSize={fontSize} fontFamily="Space Mono" fontWeight="700">
                  {label}
                </text>
                <text x={b.x} y={b.y + countSize + 2} textAnchor="middle" fill="var(--cream-muted)" fontSize={countSize - 2} fontFamily="Space Mono">
                  {b.count}
                </text>
              </>
            )}
            {b.isNotable && showLabel && (
              <g>
                <rect x={b.x - 22} y={b.y + countSize + 6} width={44} height={12} rx={2} fill="var(--teal)" opacity="0.85" />
                <text x={b.x} y={b.y + countSize + 15} textAnchor="middle" fill="#fff" fontSize="6" fontFamily="Space Mono" fontWeight="700" letterSpacing="0.8">NOTABLE</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function CompanyBubbleChart({ companies, applied }) {
  if (!companies || companies.length === 0) return null;
  const maxCount = Math.max(...companies.map(c => c.count || 1));
  const width = 700, height = 280;
  // Pack bubbles in a more organic layout
  const bubbles = companies.slice(0, 12).map((c, i) => {
    const r = 18 + ((c.count || 1) / maxCount) * 40;
    const cols = Math.min(companies.length, 6);
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = 60 + col * ((width - 120) / Math.max(cols - 1, 1)) + (row % 2 === 1 ? 30 : 0);
    const y = 80 + row * 90;
    const isApplied = c.applied || (applied && applied.has && applied.has(c.name));
    return { ...c, x, y, r, isApplied, i };
  });
  const svgHeight = Math.max(height, 80 + Math.ceil(bubbles.length / 6) * 90 + 40);
  return (
    <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "20px 0" }}>
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)", animation: "ambientGlow 8s ease infinite", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      <svg viewBox={`0 0 ${width} ${svgHeight}`} style={{ width: "100%", maxWidth: 700, height: "auto", overflow: "visible", position: "relative", zIndex: 1 }}>
        <defs>
          <filter id="bubbleGlow"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bubbleGlowTeal"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {bubbles.map(b => (
          <g key={b.i} style={{ animation: `floatIn 0.7s ${b.i * 0.1}s ease forwards`, opacity: 0 }}>
            {/* Outer glow */}
            <circle cx={b.x} cy={b.y} r={b.r * 1.5} fill={b.isApplied ? "var(--gold)" : "var(--teal)"} opacity="0.03" filter={b.isApplied ? "url(#bubbleGlow)" : "url(#bubbleGlowTeal)"} />
            {/* Main bubble */}
            <circle cx={b.x} cy={b.y} r={b.r} fill={b.isApplied ? "rgba(212,168,67,0.12)" : "rgba(61,214,200,0.08)"} stroke={b.isApplied ? "var(--gold)" : "var(--teal)"} strokeWidth={b.isApplied ? 1.5 : 0.8} />
            {/* Inner core */}
            <circle cx={b.x} cy={b.y} r={b.r * 0.3} fill={b.isApplied ? "var(--gold)" : "var(--teal)"} opacity={b.isApplied ? 0.25 : 0.15} />
            <text x={b.x} y={b.y + (b.r > 30 ? -5 : 3)} textAnchor="middle" fill={b.isApplied ? "var(--gold)" : "var(--teal)"} fontSize={b.r > 35 ? "8" : b.r > 25 ? "6.5" : "5"} fontFamily="Space Mono" fontWeight="700">{b.name.length > 16 ? b.name.slice(0, 14) + ".." : b.name}</text>
            {b.r > 30 && <text x={b.x} y={b.y + 10} textAnchor="middle" fill="var(--muted)" fontSize="5.5" fontFamily="Space Mono">{b.count} interactions</text>}
            {b.isApplied && <text x={b.x} y={b.y + b.r + 14} textAnchor="middle" fill="var(--gold)" fontSize="6" fontFamily="Space Mono" letterSpacing="1" fontWeight="700">APPLIED</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── New Visualisations ──────────────────────────────────────────────────────

function IndustryTreemap({ industries, total }) {
  if (!industries || total === 0) return null;
  const sorted = Object.entries(industries).sort((a, b) => b[1] - a[1]);
  // Squarified treemap: slice-and-dice with aspect ratio optimization
  const W = 800, H = 400;
  const rects = [];
  let items = sorted.map(([label, count], i) => ({ label, count, color: IND_COLORS[i % IND_COLORS.length], pct: Math.round((count / total) * 100) }));
  // Simple strip layout: alternate horizontal/vertical splits
  function layout(items, x, y, w, h) {
    if (items.length === 0) return;
    if (items.length === 1) { rects.push({ ...items[0], x, y, w, h }); return; }
    const totalVal = items.reduce((s, it) => s + it.count, 0);
    // Find best split point
    let sum = 0, splitIdx = 0;
    for (let i = 0; i < items.length - 1; i++) {
      sum += items[i].count;
      if (sum >= totalVal / 2) { splitIdx = i + 1; break; }
    }
    if (splitIdx === 0) splitIdx = 1;
    const left = items.slice(0, splitIdx);
    const right = items.slice(splitIdx);
    const leftVal = left.reduce((s, it) => s + it.count, 0);
    const ratio = leftVal / totalVal;
    if (w >= h) {
      layout(left, x, y, w * ratio, h);
      layout(right, x + w * ratio, y, w * (1 - ratio), h);
    } else {
      layout(left, x, y, w, h * ratio);
      layout(right, x, y + h * ratio, w, h * (1 - ratio));
    }
  }
  layout(items, 0, 0, W, H);

  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ position: "relative" }}>
      {hovered !== null && (() => {
        const r = rects[hovered];
        return (
          <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 10, padding: "6px 14px", background: "var(--cream-surface)", border: "1px solid var(--cream-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 13, color: "var(--cream-text)", fontFamily: "Space Mono", pointerEvents: "none", whiteSpace: "nowrap" }}>
            <span style={{ color: r.color, fontWeight: 700 }}>{r.label}</span> — {r.count.toLocaleString()} connections ({r.pct}%)
          </div>
        );
      })()}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        {rects.map((r, i) => {
          const minDim = Math.min(r.w, r.h);
          const showLabel = minDim > 50;
          const showPct = minDim > 35;
          const maxChars = Math.floor(r.w / 9);
          const truncLabel = r.label.length > maxChars ? r.label.slice(0, maxChars - 1) + ".." : r.label;
          const fontSize = Math.min(Math.max(r.w / 10, 8), 16);
          const pctSize = Math.min(Math.max(r.w / 14, 7), 12);
          return (
            <g key={i} style={{ animation: `floatIn 0.4s ${i * 0.06}s ease forwards`, opacity: 0, cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <rect x={r.x + 2} y={r.y + 2} width={Math.max(r.w - 4, 0)} height={Math.max(r.h - 4, 0)} fill={r.color} opacity={hovered === i ? 0.35 : 0.2} rx={4} />
              <rect x={r.x + 2} y={r.y + 2} width={Math.max(r.w - 4, 0)} height={Math.max(r.h - 4, 0)} fill="none" stroke={r.color} strokeWidth={hovered === i ? 2.5 : 1.5} opacity={hovered === i ? 0.8 : 0.5} rx={4} />
              {showLabel && (
                <text x={r.x + r.w / 2} y={r.y + r.h / 2 - (showPct ? 6 : 0)} textAnchor="middle" fill="var(--text)" fontSize={fontSize} fontFamily="Space Mono">
                  {truncLabel}
                </text>
              )}
              {showPct && (
                <text x={r.x + r.w / 2} y={r.y + r.h / 2 + (showLabel ? fontSize : 0)} textAnchor="middle" fill={r.color} fontSize={pctSize} fontFamily="Space Mono" opacity="0.8">{r.pct}%</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MonthGrid({ data }) {
  if (!data || data.length === 0) return null;
  const maxAdded = Math.max(...data.map(d => d.added), 1);
  const totalAdded = data.reduce((s, d) => s + d.added, 0);
  const cols = 6;
  const [visible, setVisible] = useState(false);
  const gridRef = useRef();
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
      {data.map((d, i) => {
        const fillPct = maxAdded > 0 ? (d.added / maxAdded) * 100 : 0;
        const pct = totalAdded > 0 ? Math.round((d.added / totalAdded) * 100) : 0;
        const isTop = d.added === maxAdded;
        const intensity = d.added > 0 ? 0.18 + (d.added / maxAdded) * 0.35 : 0;
        const [year, month] = d.month.split("-");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const label = `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`;
        return (
          <div key={i} style={{
            padding: "10px 8px",
            position: "relative",
            overflow: "hidden",
            background: "var(--cream)",
            border: isTop ? "1.5px solid var(--gold)" : "1px solid var(--cream-border)",
            textAlign: "center",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: `opacity 0.3s ${i * 0.03}s, transform 0.3s ${i * 0.03}s`,
          }}>
            {/* Gold fill animates from bottom on scroll into view */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              height: visible && d.added > 0 ? `${fillPct}%` : "0%",
              background: `linear-gradient(to top, rgba(212,168,67,${intensity}), rgba(212,168,67,${intensity * 0.3}))`,
              transition: visible ? `height 0.8s ${0.2 + i * 0.04}s cubic-bezier(0.22,1,0.36,1)` : "none",
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 9, color: "var(--cream-muted)", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
              <div className="serif" style={{ fontSize: 22, color: isTop ? "var(--gold)" : "var(--cream-text)", lineHeight: 1, marginBottom: 2, fontWeight: isTop ? 700 : 400 }}>{d.added}</div>
              {pct > 0 && <div style={{ fontSize: 9, color: isTop ? "var(--gold)" : "var(--cream-muted)" }}>{pct}%</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NetworkRadar({ c, silentNetwork, articles, contentCreator }) {
  const axes = [
    { label: "Size", value: Math.min(c.bench.connectionsPct || 50, 100), icon: "M6 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5 2a2.5 2.5 0 1 1 0 5M1 12c0-2 2-3 5-3s5 1 5 3m1-3c2 0 3.5.8 3.5 2.5" }, // people
    { label: "Diversity", value: Math.min(100 - c.concentration + 10, 100), icon: "M2 2h4v4H2zm6 0h4v4H8zm-6 6h4v4H2zm6 0h4v4H8z" }, // grid
    { label: "Seniority", value: Math.min(c.execPct * 4, 100), icon: "M7 1l3 5H4zM3 8h8v5H3z" }, // pyramid
    { label: "Engagement", value: silentNetwork ? silentNetwork.messagedPct : 50, icon: "M2 4h10v7H6l-3 2v-2H2z" }, // chat
    { label: "Growth", value: Math.min((c.recent12 / 120) * 100, 100), icon: "M2 12L6 6l3 3 4-7" }, // trend up
    { label: "Content", value: Math.min(((articles?.total || 0) + (contentCreator?.totalPieces || 0)) * 3, 100), icon: "M3 1h8v12H3zM5 4h4M5 6h4M5 8h2" }, // doc
  ];
  const cx = 200, cy = 200, maxR = 140;
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;
  const gridLevels = [25, 50, 75, 100];

  const points = axes.map((a, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = (a.value / 100) * maxR;
    const ax = cx + maxR * Math.cos(angle), ay = cy + maxR * Math.sin(angle); // axis tip for icon
    return { ...a, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), ax, ay, lx: cx + (maxR + 60) * Math.cos(angle), ly: cy + (maxR + 60) * Math.sin(angle), angle };
  });
  // Smooth closed cardinal spline helper
  const smoothClosed = (pts, t = 0.18) => {
    const n2 = pts.length;
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < n2; i++) {
      const p0 = pts[(i - 1 + n2) % n2];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n2];
      const p3 = pts[(i + 2) % n2];
      d += ` C ${p1.x + (p2.x - p0.x) * t},${p1.y + (p2.y - p0.y) * t} ${p2.x - (p3.x - p1.x) * t},${p2.y - (p3.y - p1.y) * t} ${p2.x},${p2.y}`;
    }
    return d;
  };
  const smoothPathD = smoothClosed(points);
  const totalLen = points.reduce((s, p, i) => {
    const next = points[(i + 1) % points.length];
    return s + Math.hypot(next.x - p.x, next.y - p.y);
  }, 0) * 1.2;

  return (
    <div className="scroll-reveal" style={{ display: "flex", justifyContent: "center", padding: "24px 0", marginBottom: 64 }}>
      <svg viewBox="-20 -40 440 480" style={{ width: "100%", maxWidth: 800, height: "auto" }}>
        <defs>
          <radialGradient id="radarFill"><stop offset="0%" stopColor="var(--gold)" stopOpacity="0.25" /><stop offset="100%" stopColor="var(--gold)" stopOpacity="0.03" /></radialGradient>
          <filter id="radarGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {/* Smoothed grid rings */}
        {gridLevels.map(level => {
          const r = (level / 100) * maxR;
          const gridPts = Array.from({ length: n }, (_, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
          });
          return <path key={level} d={smoothClosed(gridPts)} fill="none" stroke="var(--gold-dim)" strokeWidth="0.65" opacity="0.2" />;
        })}
        {/* Axis spokes */}
        {axes.map((_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          return <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)} stroke="var(--gold-dim)" strokeWidth="0.65" opacity="0.2" />;
        })}
        <path d={smoothPathD} fill="url(#radarFill)" stroke="var(--gold)" strokeWidth="1" filter="url(#radarGlow)" strokeDasharray={totalLen} strokeDashoffset={totalLen} style={{ animation: `drawIn 2s 0.3s ease forwards` }} />
        <path d={smoothPathD} fill="url(#radarFill)" stroke="none" opacity="0" style={{ animation: `fadeIn 1s 1.5s ease forwards` }} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="var(--gold)" opacity="0" style={{ animation: `floatIn 0.5s ${1 + i * 0.1}s ease forwards` }} />
            <circle cx={p.x} cy={p.y} r={1.5} fill="var(--bg)" opacity="0" style={{ animation: `floatIn 0.5s ${1 + i * 0.1}s ease forwards` }} />
            {/* Icon at axis tip */}
            <g opacity="0" style={{ animation: `floatIn 0.4s ${0.8 + i * 0.08}s ease forwards` }}>
              {(() => { const ix = (p.ax + p.lx) / 2, iy = (p.ay + p.ly) / 2; return (<>
                <circle cx={ix} cy={iy} r={10} fill="var(--bg)" opacity="0.7" />
                <path d={p.icon} transform={`translate(${ix - 7},${iy - 7}) scale(0.9)`} fill="none" stroke="var(--gold)" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              </>); })()}
            </g>
            {/* Label + value outside */}
            <g opacity="0" style={{ animation: `floatIn 0.5s ${1.2 + i * 0.05}s ease forwards` }}>
              <text x={p.lx} y={p.ly + 2} textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="Space Mono" letterSpacing="0.5">{p.label.toUpperCase()}</text>
              <text x={p.lx} y={p.ly + 14} textAnchor="middle" fill="var(--gold)" fontSize="11" fontFamily="Playfair Display,serif" fontWeight="700">{Math.round(p.value)}</text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}

function GrowthAreaChart({ monthMap, firstYear, total }) {
  if (!monthMap || Object.keys(monthMap).length === 0) return null;
  const now = new Date();
  const startYear = firstYear || parseInt(Object.keys(monthMap).sort()[0]?.split("-")[0]) || 2010;
  const endYear = now.getFullYear();
  const endMonth = now.getMonth();

  // Build cumulative monthly data
  const points = [];
  let cumulative = 0;
  for (let y = startYear; y <= endYear; y++) {
    const mEnd = y === endYear ? endMonth : 11;
    for (let m = 0; m <= mEnd; m++) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      cumulative += (monthMap[key] || 0);
      points.push({ year: y, month: m, total: cumulative, key });
    }
  }
  if (points.length < 2) return null;

  const maxVal = Math.max(...points.map(p => p.total), 1);
  const W = 900, H = 380, padL = 50, padR = 20, padT = 55, padB = 40;
  const chartW = W - padL - padR, chartH = H - padT - padB;

  const xOf = (i) => padL + (i / (points.length - 1)) * chartW;
  const yOf = (v) => padT + chartH - (v / maxVal) * chartH;

  // Build the area path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)} ${yOf(p.total).toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L ${xOf(points.length - 1).toFixed(1)} ${(padT + chartH).toFixed(1)} L ${xOf(0).toFixed(1)} ${(padT + chartH).toFixed(1)} Z`;

  // Year tick positions
  const yearTicks = [];
  for (let y = startYear; y <= endYear; y++) {
    const idx = points.findIndex(p => p.year === y && p.month === 0);
    if (idx >= 0) yearTicks.push({ year: y, x: xOf(idx) });
  }

  // Value gridlines
  const gridLines = [];
  const step = maxVal > 1000 ? 500 : maxVal > 500 ? 200 : maxVal > 200 ? 100 : maxVal > 50 ? 25 : 10;
  for (let v = step; v < maxVal; v += step) {
    gridLines.push({ v, y: yOf(v) });
  }

  // Find milestone points (25%, 50%, 75%, 100%)
  const milestones = [0.25, 0.5, 0.75].map(pct => {
    const target = Math.round(maxVal * pct);
    const idx = points.findIndex(p => p.total >= target);
    if (idx < 0) return null;
    const p = points[idx];
    return { pct, x: xOf(idx), y: yOf(p.total), total: p.total, label: `${p.year}` };
  }).filter(Boolean);

  return (
    <div className="scroll-reveal" style={{ marginBottom: 64 }}>
      <SectionLabel icon="connections">NETWORK GROWTH</SectionLabel>
      <div className="card" style={{ padding: 24, overflow: "hidden" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
          <defs>
            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#d4684a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3dd6c8" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="growthLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.9" />
            </linearGradient>
            <clipPath id="growthClip"><rect x={padL} y={padT} width={chartW} height={chartH} /></clipPath>
            <clipPath id="growthReveal">
              <rect x={padL} y={0} width={0} height={H}>
                <animate attributeName="width" from="0" to={chartW + padR} dur="2s" begin="0.2s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1" keyTimes="0;1" />
              </rect>
            </clipPath>
          </defs>

          {/* Grid lines */}
          {gridLines.map(g => (
            <g key={`gl${g.v}`}>
              <line x1={padL} y1={g.y} x2={padL + chartW} y2={g.y} stroke="var(--border)" strokeWidth="0.5" opacity="0.15" />
              <text x={padL - 8} y={g.y + 3} textAnchor="end" fill="var(--muted)" fontSize="8" fontFamily="Space Mono" opacity="0.5">{g.v.toLocaleString()}</text>
            </g>
          ))}

          {/* Year ticks */}
          {yearTicks.filter((_, i) => {
            const totalYears = endYear - startYear;
            if (totalYears <= 15) return true;
            return i % Math.ceil(totalYears / 12) === 0;
          }).map(t => (
            <g key={`yt${t.year}`}>
              <line x1={t.x} y1={padT + chartH} x2={t.x} y2={padT + chartH + 6} stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
              <text x={t.x} y={padT + chartH + 18} textAnchor="middle" fill="var(--muted)" fontSize="9" fontFamily="Space Mono" opacity="0.5">{t.year}</text>
            </g>
          ))}

          {/* Area fill + line — reveal left to right */}
          <g clipPath="url(#growthReveal)">
            <g clipPath="url(#growthClip)">
              <path d={areaPath} fill="url(#growthGrad)" />
            </g>
            <path d={linePath} fill="none" stroke="url(#growthLineGrad)" strokeWidth="2" strokeLinejoin="round" />
          </g>

          {/* Milestone markers */}
          {milestones.map((m, i) => (
            <g key={`ms${i}`} style={{ animation: `floatIn 0.4s ${1 + i * 0.3}s ease forwards`, opacity: 0 }}>
              <line x1={m.x} y1={m.y} x2={m.x} y2={padT + chartH} stroke="var(--gold)" strokeWidth="0.5" opacity="0.2" strokeDasharray="3 3" />
              <circle cx={m.x} cy={m.y} r="3" fill="var(--gold)" opacity="0.7" />
              <text x={m.x} y={m.y - 10} textAnchor="middle" fill="var(--gold)" fontSize="8" fontFamily="Space Mono" fontWeight="700" opacity="0.7">
                {Math.round(m.pct * 100)}%
              </text>
            </g>
          ))}

          {/* Current total endpoint */}
          <g style={{ animation: "floatIn 0.5s 1.5s ease forwards", opacity: 0 }}>
            <circle cx={xOf(points.length - 1)} cy={yOf(maxVal)} r="5" fill="var(--gold)" filter="url(#mapGlow)" style={{ animation: "pulseNode 2.5s ease infinite" }} />
            <text x={xOf(points.length - 1) - 8} y={yOf(maxVal) - 14} textAnchor="end" fill="var(--gold)" fontSize="13" fontFamily="Space Mono" fontWeight="700">
              {maxVal.toLocaleString()}
            </text>
            <text x={xOf(points.length - 1) - 8} y={yOf(maxVal) - 28} textAnchor="end" fill="var(--muted)" fontSize="9" fontFamily="Space Mono">
              connections
            </text>
          </g>

          {/* Baseline */}
          <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
        </svg>
      </div>
    </div>
  );
}

function ConnectionHeatmap({ monthMap, firstYear }) {
  if (!monthMap || Object.keys(monthMap).length === 0) return null;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const years = [];
  for (let y = firstYear; y <= currentYear; y++) years.push(y);
  if (years.length < 2) return null;
  const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const maxCount = Math.max(...Object.values(monthMap), 1);
  const cellW = 28, cellH = 10, gap = 5;
  const labelW = 40;
  const width = labelW + 12 * (cellW + gap);
  const height = 20 + years.length * (cellH + gap);

  return (
    <div className="scroll-reveal" style={{ marginBottom: 64 }}>
      <SectionLabel color="var(--cream-muted)" icon="calendar">NETWORK GROWTH HEATMAP</SectionLabel>
      <div className="card" style={{ padding: 24, overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
          {MONTHS.map((m, i) => (
            <text key={m + i} x={labelW + i * (cellW + gap) + cellW / 2} y={10} textAnchor="middle" fill="var(--muted)" fontSize="6" fontFamily="Space Mono">{m}</text>
          ))}
          {years.map((year, yi) => (
            <g key={year}>
              <text x={labelW - 6} y={20 + yi * (cellH + gap) + cellH / 2 + 3} textAnchor="end" fill="var(--muted)" fontSize="6" fontFamily="Space Mono">{year}</text>
              {Array.from({ length: 12 }, (_, mi) => {
                const key = `${year}-${String(mi + 1).padStart(2, "0")}`;
                const isFuture = year === currentYear && mi > currentMonth;
                const count = monthMap[key] || 0;
                const intensity = isFuture ? 0 : count > 0 ? 0.12 + (count / maxCount) * 0.88 : 0.03;
                const fill = count === maxCount ? "var(--gold)" : count > maxCount * 0.6 ? "var(--gold)" : "var(--teal)";
                return (
                  <rect
                    key={key}
                    x={labelW + mi * (cellW + gap)}
                    y={20 + yi * (cellH + gap)}
                    width={cellW}
                    height={cellH}
                    rx={2}
                    fill={isFuture ? "transparent" : fill}
                    stroke={isFuture ? "var(--faint)" : "none"}
                    strokeWidth={isFuture ? 0.3 : 0}
                    strokeDasharray={isFuture ? "2 2" : "none"}
                    opacity={intensity}
                    style={!isFuture ? { animation: `floatIn 0.2s ${(yi * 12 + mi) * 0.008}s ease forwards`, opacity: 0 } : undefined}
                  />
                );
              })}
            </g>
          ))}
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 10 }}>
          <span style={{ fontSize: 9, color: "var(--muted)" }}>Less</span>
          {[0.05, 0.2, 0.4, 0.6, 0.9].map((o, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: "var(--gold)", opacity: o }} />
          ))}
          <span style={{ fontSize: 9, color: "var(--muted)" }}>More</span>
        </div>
      </div>
    </div>
  );
}

function WaffleChart({ filledPct, filledColor = "var(--gold)", emptyColor = "var(--faint)", filledLabel = "Messaged", emptyLabel = "Silent" }) {
  const filled = Math.round(filledPct);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5 }}>
        {Array.from({ length: 100 }, (_, i) => {
          const isFilled = i < filled;
          return (
            <div
              key={i}
              style={{
                aspectRatio: "2/1", borderRadius: 3,
                background: isFilled ? filledColor : emptyColor,
                opacity: isFilled ? 0.75 : 0.12,
                animation: `floatIn 0.15s ${i * 0.008}s ease forwards`,
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, justifyContent: "center", marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: filledColor, opacity: 0.75 }} />
          <span style={{ fontSize: 11, color: "var(--text)" }}><strong>{filled}%</strong> {filledLabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: emptyColor, opacity: 0.12 }} />
          <span style={{ fontSize: 11, color: "var(--text)" }}><strong>{100 - filled}%</strong> {emptyLabel}</span>
        </div>
      </div>
    </div>
  );
}

function SeniorityPyramid({ data, total }) {
  if (!data || data.length === 0) return null;
  const maxCount = Math.max(...data.map(([, c]) => c), 1);
  const barH = 26, gap = 5;
  const height = data.length * (barH + gap);
  const maxBarW = 240;
  const cx = 280;
  const colors = ["var(--gold)", "var(--teal)", "#5dd68a", "#a8d4e8", "var(--muted)", "var(--faint)"];
  return (
    <svg viewBox={`0 0 560 ${height}`} style={{ width: "100%", height: "auto" }}>
      {data.map(([label, count], i) => {
        const w = (count / maxCount) * maxBarW;
        const pct = Math.round((count / total) * 100);
        return (
          <g key={label} style={{ animation: `floatIn 0.4s ${i * 0.08}s ease forwards`, opacity: 0 }}>
            <rect x={cx - w / 2} y={i * (barH + gap)} width={w} height={barH} fill={colors[i] || "var(--gold-dim)"} opacity={0.65} rx={3}
              style={{ transformOrigin: `${cx}px ${i * (barH + gap) + barH / 2}px`, animation: `barGrowH 0.7s ${i * 0.1}s cubic-bezier(0.22,1,0.36,1) forwards`, transform: "scaleX(0)" }} />
            <text x={cx - maxBarW / 2 - 10} y={i * (barH + gap) + barH / 2 + 3} textAnchor="end" fill="var(--text)" fontSize="8" fontFamily="Space Mono">{label}</text>
            <text x={cx + maxBarW / 2 + 10} y={i * (barH + gap) + barH / 2 + 3} textAnchor="start" fill="var(--muted)" fontSize="8" fontFamily="Space Mono">{count.toLocaleString()} <tspan fill={colors[i] || "var(--gold-dim)"}>{pct}%</tspan></text>
          </g>
        );
      })}
    </svg>
  );
}

function ReciprocityArcs({ data }) {
  if (!data || data.mutualChampions.length === 0) return null;
  const mutual = data.mutualChampions;
  const unreturned = data.unreturned.slice(0, 5);
  const all = [...mutual.map(p => ({ ...p, type: "m" })), ...unreturned.map(p => ({ ...p, type: "u" }))];
  if (all.length === 0) return null;
  const width = Math.max(all.length * 70, 400);
  const baseline = 140;
  const maxCount = Math.max(...all.map(p => p.count), 1);
  const spacing = width / (all.length + 1);

  return (
    <div className="scroll-reveal" style={{ marginBottom: 24 }}>
      <svg viewBox={`0 0 ${width} 200`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        <line x1={20} y1={baseline} x2={width - 20} y2={baseline} stroke="var(--border)" strokeWidth="0.5" opacity="0.2" />
        {mutual.length > 1 && mutual.map((_, i) => {
          if (i === 0) return null;
          const x1 = (i) * spacing;
          const x2 = (i + 1) * spacing;
          const midX = (x1 + x2) / 2;
          const arcH = 25 + (mutual.length - i) * 12;
          return (
            <path key={`arc${i}`} d={`M${x1},${baseline} Q${midX},${baseline - arcH} ${x2},${baseline}`} fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.3"
              strokeDasharray="500" strokeDashoffset="500" style={{ animation: `drawIn 1.2s ${0.5 + i * 0.15}s ease forwards` }} />
          );
        })}
        {mutual.length > 2 && (() => {
          const x1 = spacing;
          const x2 = mutual.length * spacing;
          const midX = (x1 + x2) / 2;
          const arcH = 35 + mutual.length * 14;
          return <path d={`M${x1},${baseline} Q${midX},${baseline - arcH} ${x2},${baseline}`} fill="none" stroke="var(--gold)" strokeWidth="0.8" opacity="0.15" strokeDasharray="500" strokeDashoffset="500" style={{ animation: `drawIn 2s 1s ease forwards` }} />;
        })()}
        {all.map((p, i) => {
          const x = (i + 1) * spacing;
          const r = 6 + (p.count / maxCount) * 12;
          const color = p.type === "m" ? "var(--gold)" : "var(--teal)";
          const firstName = p.name.split(" ")[0];
          return (
            <g key={i} style={{ animation: `floatIn 0.5s ${i * 0.08}s ease forwards`, opacity: 0 }}>
              <circle cx={x} cy={baseline} r={r * 1.4} fill={color} opacity="0.06" />
              <circle cx={x} cy={baseline} r={r} fill={color} opacity="0.15" stroke={color} strokeWidth="1" />
              <circle cx={x} cy={baseline} r={r * 0.4} fill={color} opacity="0.5" />
              <text x={x} y={baseline + r + 14} textAnchor="middle" fill="var(--text)" fontSize="7" fontFamily="Space Mono">{firstName}</text>
              <text x={x} y={baseline + r + 24} textAnchor="middle" fill="var(--muted)" fontSize="5.5" fontFamily="Space Mono">{p.count} endorsements</text>
              <text x={x} y={baseline - r - 6} textAnchor="middle" fill={color} fontSize="6" fontFamily="Space Mono" letterSpacing="0.5" fontWeight="700">{p.type === "m" ? "MUTUAL" : "UNRETURNED"}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SkillsRadialBar({ skills: topSkills, total }) {
  if (!topSkills || topSkills.length === 0) return null;
  const [hovered, setHovered] = useState(null);
  const cx = 400, cy = 400;
  const maxEnd = topSkills[0][1] || 1;
  const innerR = 90, outerR = 340;
  const n = topSkills.length;
  const angleGap = 0.02;
  const anglePerSkill = (2 * Math.PI - n * angleGap) / n;
  const startAngle = -Math.PI / 2;

  return (
    <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)", animation: "ambientGlow 8s ease infinite", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      <svg viewBox="0 0 800 800" style={{ width: "100%", maxWidth: 700, height: "auto", position: "relative", zIndex: 1 }}>
        <defs>
          <filter id="radialBarGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {/* Background track rings */}
        {topSkills.map(([, ], i) => {
          const a1 = startAngle + i * (anglePerSkill + angleGap);
          const a2 = a1 + anglePerSkill;
          const track = describeArc(cx, cy, innerR, outerR, a1, a2);
          return <path key={`bg${i}`} d={track} fill="var(--faint)" opacity="0.3" />;
        })}
        {/* Filled arcs */}
        {topSkills.map(([skill, count], i) => {
          const a1 = startAngle + i * (anglePerSkill + angleGap);
          const fillPct = count / maxEnd;
          const barR = innerR + (outerR - innerR) * fillPct;
          const a2 = a1 + anglePerSkill;
          const arc = describeArc(cx, cy, innerR, barR, a1, a2);
          const isHov = hovered === i;
          const isTop3 = i < 3;
          const opacity = isHov ? 0.95 : isTop3 ? 0.75 : 0.55;
          const color = isTop3 ? "var(--gold)" : "var(--gold-dim)";

          // Label position — at the midpoint of the arc, outside
          const midAngle = (a1 + a2) / 2;
          const labelR = outerR + 30;
          const lx = cx + labelR * Math.cos(midAngle);
          const ly = cy + labelR * Math.sin(midAngle);
          const isRight = Math.cos(midAngle) >= 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
              <path d={arc} fill={color} opacity={opacity} filter={isHov ? "url(#radialBarGlow)" : undefined}
                style={{ animation: `barGrow 1s ${0.1 + i * 0.06}s cubic-bezier(0.22,1,0.36,1) forwards`, transformOrigin: `${cx}px ${cy}px`, transform: "scaleY(0)", transition: "opacity 0.2s" }} />
              {/* Skill label radiating outward */}
              <text x={lx} y={ly} textAnchor={isRight ? "start" : "end"} fill={isHov ? "var(--gold)" : "var(--text)"} fontSize={isHov ? "13" : "11"} fontFamily="Space Mono" fontWeight={isTop3 ? "700" : "400"} dominantBaseline="middle"
                style={{ animation: `fadeIn 0.5s ${0.5 + i * 0.06}s forwards`, opacity: 0, transition: "fill 0.2s, font-size 0.2s" }}>
                {skill}{isHov ? ` — ${count}` : ""}
              </text>
              {/* Percentage inside the arc for bigger ones */}
              {fillPct > 0.3 && (() => {
                const textR = innerR + (barR - innerR) * 0.5;
                const tx = cx + textR * Math.cos(midAngle);
                const ty = cy + textR * Math.sin(midAngle);
                return <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="var(--bg)" fontSize="13" fontFamily="Space Mono" fontWeight="700" style={{ animation: `fadeIn 0.5s ${0.8 + i * 0.06}s forwards`, opacity: 0 }}>{pct}%</text>;
              })()}
            </g>
          );
        })}
        {/* Center circle */}
        <circle cx={cx} cy={cy} r={innerR - 5} fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={innerR - 8} fill="var(--bg)" />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--gold)" fontSize="32" fontFamily="Playfair Display,serif" fontWeight="700">{topSkills.length}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--muted)" fontSize="9" fontFamily="Space Mono" letterSpacing="2">SKILLS</text>
      </svg>
    </div>
  );
}

// SVG arc path helper for radial bar chart
function describeArc(cx, cy, innerR, outerR, startAngle, endAngle) {
  const ix1 = cx + innerR * Math.cos(startAngle);
  const iy1 = cy + innerR * Math.sin(startAngle);
  const ix2 = cx + innerR * Math.cos(endAngle);
  const iy2 = cy + innerR * Math.sin(endAngle);
  const ox1 = cx + outerR * Math.cos(startAngle);
  const oy1 = cy + outerR * Math.sin(startAngle);
  const ox2 = cx + outerR * Math.cos(endAngle);
  const oy2 = cy + outerR * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${ix1},${iy1} A${innerR},${innerR} 0 ${largeArc} 1 ${ix2},${iy2} L${ox2},${oy2} A${outerR},${outerR} 0 ${largeArc} 0 ${ox1},${oy1} Z`;
}

function NetworkDNA({ industries, total }) {
  if (!industries || total < 10) return null;
  const sorted = Object.entries(industries).sort((a, b) => b[1] - a[1]);
  const queues = sorted.map(([, count], ci) => Array.from({ length: count }, () => IND_COLORS[ci % IND_COLORS.length]));
  const bars = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    for (const q of queues) { if (q.length > 0) { bars.push(q.shift()); remaining = true; } }
  }
  const barW = 3, gap = 1, height = 120, pad = 100;
  const svgW = bars.length * (barW + gap);
  const viewH = height + pad * 2;
  const containerRef = useRef(null);
  const spotlightRef = useRef(null);
  const lensWrapRef = useRef(null);
  const lensGroupRef = useRef(null);
  const lensMaskPathRef = useRef(null);
  const lensGradRef = useRef(null);
  const svgWRef = useRef(svgW);
  svgWRef.current = svgW;
  const ZOOM_Y = 1.4;
  const barTop = pad + 6, barBot = pad + height - 6;
  const barMid = (barTop + barBot) / 2;
  const scaledHalf = ((barBot - barTop) / 2) * ZOOM_Y;
  const scaledTop = barMid - scaledHalf;
  const scaledBot = barMid + scaledHalf;

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || !spotlightRef.current) return;
    const cRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - cRect.left;
    const w = svgWRef.current;
    const svgX = (x / cRect.width) * w;
    const lensW = 250 * (barW + gap);  // grow only ~250 bars near cursor
    const left = svgX - lensW / 2;
    const right = svgX + lensW / 2;
    spotlightRef.current.style.left = `${x}px`;
    spotlightRef.current.style.opacity = "1";
    if (lensWrapRef.current) lensWrapRef.current.style.opacity = "1";
    if (lensGradRef.current) {
      lensGradRef.current.setAttribute("x1", String(left));
      lensGradRef.current.setAttribute("x2", String(right));
    }
    if (lensMaskPathRef.current) {
      // Leptokurtic: flat tails, sharp central spike using cubic beziers
      const hw = lensW / 2;
      const peakTop = scaledTop - 16;
      const peakBot = scaledBot + 16;
      // Top edge: flat from left, then sharp spike at center, flat to right
      // C control points hug barTop until very close to svgX, then jump to peak
      lensMaskPathRef.current.setAttribute("d",
        `M ${left} ${barTop} ` +
        `C ${left + hw * 0.7} ${barTop}, ${svgX - hw * 0.12} ${barTop}, ${svgX} ${peakTop} ` +
        `C ${svgX + hw * 0.12} ${barTop}, ${right - hw * 0.7} ${barTop}, ${right} ${barTop} ` +
        `L ${right} ${barBot} ` +
        `C ${right - hw * 0.7} ${barBot}, ${svgX + hw * 0.12} ${barBot}, ${svgX} ${peakBot} ` +
        `C ${svgX - hw * 0.12} ${barBot}, ${left + hw * 0.7} ${barBot}, ${left} ${barBot} Z`);
    }
  }, [scaledTop, scaledBot, barTop, barBot]);

  const handleMouseLeave = useCallback(() => {
    if (spotlightRef.current) spotlightRef.current.style.opacity = "0";
    if (lensWrapRef.current) lensWrapRef.current.style.opacity = "0";
  }, []);

  return (
    <div className="scroll-reveal" ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", overflowX: "hidden", overflowY: "visible", marginBottom: 80, marginTop: 40, position: "relative", minHeight: "50vh", cursor: "crosshair" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, var(--bg) 0%, transparent 5%, transparent 95%, var(--bg) 100%)", zIndex: 2, pointerEvents: "none" }} />
      {/* CSS-only spotlight — no re-renders */}
      <div ref={spotlightRef} style={{
        position: "absolute", top: 0, width: 120, height: "100%", pointerEvents: "none", zIndex: 1, opacity: 0,
        transform: "translateX(-50%)",
        background: "radial-gradient(ellipse 60px 200px at center, rgba(255,255,255,0.15) 0%, rgba(212,168,67,0.06) 40%, transparent 70%)",
        transition: "opacity 0.15s",
        mixBlendMode: "screen",
      }} />
      <svg viewBox={`0 0 ${svgW} ${viewH}`} preserveAspectRatio="none" style={{ width: "100%", height: "50vh", display: "block" }}>
        <defs>
          <linearGradient ref={lensGradRef} id="dnaLensGrad" x1="-9999" x2="-9999" y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="black" />
            <stop offset="35%" stopColor="rgba(80,80,80,1)" />
            <stop offset="50%" stopColor="white" />
            <stop offset="65%" stopColor="rgba(80,80,80,1)" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>
          <mask id="dnaLensMask">
            <path ref={lensMaskPathRef} d={`M -9999 ${barTop} Q -9999 ${barTop} -9999 ${barTop} Z`} fill="url(#dnaLensGrad)" />
          </mask>
        </defs>
        {/* Normal bars */}
        {bars.map((color, i) => (
          <rect key={i} x={i * (barW + gap)} y={barTop} width={barW} height={barBot - barTop} fill={color} opacity="0.65" rx={1}
            style={{ animation: `barGrow 0.3s ${i * 0.002}s ease forwards`, transformOrigin: `${i * (barW + gap) + barW / 2}px ${barMid}px`, transform: "scaleY(0)" }} />
        ))}
        {/* Lens layer — vertical-only scale, bell-curve mask tapers height from cursor */}
        <g ref={lensWrapRef} mask="url(#dnaLensMask)" style={{ opacity: 0, transition: "opacity 0.2s" }}>
          <g ref={lensGroupRef} transform={`translate(0,${barMid}) scale(1,${ZOOM_Y}) translate(0,${-barMid})`}>
            {bars.map((color, i) => (
              <rect key={`z${i}`} x={i * (barW + gap)} y={barTop} width={barW} height={barBot - barTop} fill={color} opacity="0.8" rx={1} />
            ))}
          </g>
        </g>
      </svg>
      <div style={{ textAlign: "center", marginTop: 8, fontSize: 9, color: "var(--muted)", letterSpacing: "0.2em", position: "relative", zIndex: 3 }}>NETWORK DNA — EACH BAR IS ONE CONNECTION, COLOURED BY INDUSTRY</div>
    </div>
  );
}

// ─── Chapter helpers ─────────────────────────────────────────────────────────

function ChapterOpener({ number, title, subtitle, light }) {
  return (
    <div className="chapter-opener" style={{ position: "relative", minHeight: "85vh" }}>
      {/* Ambient radial glow */}
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: light ? "radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)" : "radial-gradient(circle, rgba(212,168,67,0.08) 0%, transparent 70%)", animation: "ambientGlow 8s ease infinite", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="scroll-reveal" style={{ fontSize: 11, letterSpacing: "0.35em", color: "var(--gold)", marginBottom: 24, opacity: 0.7 }}>CHAPTER {number}</div>
        <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{ fontSize: "clamp(32px, 6vw, 58px)", fontWeight: 400, lineHeight: 1.1, marginBottom: 20, maxWidth: 600 }}>{title}</h2>
        {subtitle && <p className="scroll-reveal scroll-reveal-delay-2" style={{ fontSize: 13, lineHeight: 1.9, maxWidth: 520, color: light ? "var(--cream-muted)" : "var(--muted)", letterSpacing: "0.02em" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function ChapterDivider() {
  return <div className="chapter-divider" />;
}

function SectionLabel({ children, color, icon }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: "0.2em", color: color || "var(--muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      {icon && <Icon name={icon} size={13} color={color || "var(--muted)"} style={{ opacity: 0.7 }} />}
      {children}
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function Results({ data, onReset, isDemo }) {
  const { connections: c, messages, invitations, skills, profile, positions, education, certifications, recsReceived, recsGiven, learning, endorsementReciprocity, silentNetwork, careerIntent, contentCreator, registration, companyFollows, events, jobSeekerPrefs, articles, verifications, filesFound } = data;
  const hasCareerIntel = (careerIntent && (careerIntent.savedCount > 0 || careerIntent.appliedCount > 0)) || jobSeekerPrefs || companyFollows;

  // Scroll progress bar
  const progressRef = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      if (!progressRef.current) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) * 100 : 0;
      progressRef.current.style.width = `${pct}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ch1Ref = useScrollReveal();
  const ch2Ref = useScrollReveal();
  const ch3Ref = useScrollReveal();
  const ch4Ref = useScrollReveal();
  const finaleRef = useScrollReveal();

  // Precompute shared values
  const senOrder = ["C-Suite & Founder", "VP & Director", "Manager & Senior", "Individual Contributor", "Mid-Level", "Early Career"];
  const sortedSen = senOrder.map(l => [l, c.seniorities[l] || 0]).filter(([, v]) => v > 0);
  const maxSen = Math.max(...sortedSen.map(([, v]) => v), 1);
  const maxYearHist = c.yearHistory.length > 0 ? Math.max(...c.yearHistory.map(([, v]) => v)) : 1;
  const maxSeason = Math.max(...c.seasonality.map(s => s.count), 1);
  const maxWeekday = Math.max(...c.weekdayOrdered.map(d => d.count), 1);

  const [expanded, setExpanded] = useState({});
  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  // ─── Share Card Generator ──────────────────────────────────────────────────
  const generateShareCard = useCallback(async () => {
    await document.fonts.ready;
    const W = 1200, H = 627;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, W, H);

    // Draw skills constellation directly on canvas
    const hasSkills = skills && skills.totalEndorsements > 0 && skills.topSkills.length > 0;
    if (hasSkills) {
      const allSkills = skills.topSkills.slice(0, 24);
      const maxEnd = allSkills[0][1] || 1;
      const golden = 2.39996323;
      // Map from SVG viewBox (1200x900) to canvas (1200x627)
      const scX = W / 1200, scY = H / 900;
      const svgCx = 600, svgCy = 450;
      const nodes = allSkills.map(([name, count], i) => {
        const r = 160 + Math.sqrt(i) * 80;
        const angle = i * golden;
        const size = 16 + (count / maxEnd) * 48;
        return { name, count, x: (svgCx + r * Math.cos(angle)) * scX, y: (svgCy + r * Math.sin(angle)) * scY, size: size * Math.min(scX, scY) };
      });

      // Ambient glow
      const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 350);
      glow.addColorStop(0, "rgba(212,168,67,0.08)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Orbit rings
      [160, 260, 360, 450].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(svgCx * scX, svgCy * scY, r * Math.min(scX, scY), 0, Math.PI * 2);
        ctx.strokeStyle = "#1a1a2e";
        ctx.lineWidth = 0.3;
        ctx.globalAlpha = 0.3 - i * 0.05;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      });

      // Connection lines
      nodes.forEach((n, i) => {
        if (i === 0) return;
        const prev = nodes[i - 1];
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = "#8a6a20";
        ctx.lineWidth = 0.5 + ((prev.size + n.size) / 2 / 64) * 3;
        ctx.globalAlpha = 0.2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Nodes
      nodes.forEach((n, i) => {
        // Outer glow for top nodes
        if (i < 5) {
          const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.size * 1.6);
          ng.addColorStop(0, "rgba(212,168,67,0.12)");
          ng.addColorStop(1, "transparent");
          ctx.fillStyle = ng;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.size * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Main circle
        const ng2 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.size);
        ng2.addColorStop(0, "rgba(212,168,67,0.4)");
        ng2.addColorStop(1, "rgba(212,168,67,0.05)");
        ctx.fillStyle = ng2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.strokeStyle = "#d4a843";
        ctx.lineWidth = i < 3 ? 2 : i < 8 ? 1 : 0.5;
        ctx.globalAlpha = i < 5 ? 1 : 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Inner dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "#d4a843";
        ctx.globalAlpha = 0.2 + (n.count / maxEnd) * 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label
        if (n.size > 16) {
          const label = n.name.length > 18 ? n.name.slice(0, 16) + ".." : n.name;
          ctx.font = `${n.size > 24 ? 9 : 7}px 'Space Mono', monospace`;
          ctx.fillStyle = "#e2ddd6";
          ctx.textAlign = "center";
          ctx.fillText(label, n.x, n.size > 24 ? n.y + 3 : n.y - n.size - 5);
        }
      });
    } else {
      // Fallback: radial glow
      const grad = ctx.createRadialGradient(600, 300, 0, 600, 300, 400);
      grad.addColorStop(0, "rgba(212,168,67,0.08)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Top/bottom fade for text readability
    const topGrad = ctx.createLinearGradient(0, 0, 0, 80);
    topGrad.addColorStop(0, "rgba(5,5,8,0.9)");
    topGrad.addColorStop(1, "rgba(5,5,8,0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, 80);
    const botGrad = ctx.createLinearGradient(0, H - 80, 0, H);
    botGrad.addColorStop(0, "rgba(5,5,8,0)");
    botGrad.addColorStop(1, "rgba(5,5,8,0.9)");
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, H - 80, W, 80);

    // Border
    ctx.strokeStyle = "rgba(212,168,67,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // Branding top-left
    ctx.font = "11px 'Space Mono', monospace";
    ctx.fillStyle = "#d4a843";
    ctx.letterSpacing = "4px";
    ctx.textAlign = "left";
    ctx.fillText("CAREERPRINT.AI", 48, 40);
    ctx.letterSpacing = "0px";

    // Tagline top-right
    ctx.font = "italic 12px 'Playfair Display', serif";
    ctx.fillStyle = "#6b6580";
    ctx.textAlign = "right";
    ctx.fillText("Your career — as unique as your fingerprint", W - 48, 40);

    // Bottom bar
    const grade = GRADE(c.score);
    const gradeColor = { A: "#4caf50", B: "#d4a843", C: "#ff9800", D: "#e86060" }[grade];
    const profileName = (profile && (profile["First Name"] || "")) ? `${profile["First Name"]} ${profile["Last Name"] || ""}`.trim() : "";

    if (profileName) {
      ctx.textAlign = "left";
      ctx.font = "400 18px 'Playfair Display', serif";
      ctx.fillStyle = "#e2ddd6";
      ctx.fillText(profileName, 48, H - 34);
    }

    ctx.textAlign = "center";
    ctx.font = "700 14px 'Space Mono', monospace";
    ctx.fillStyle = gradeColor;
    ctx.fillText(`${grade} \u00B7 ${GRADE_LABEL(c.score)} \u00B7 ${c.total.toLocaleString("en-US")} connections`, 600, H - 34);

    ctx.textAlign = "right";
    ctx.font = "11px 'Space Mono', monospace";
    ctx.fillStyle = "#d4a843";
    ctx.letterSpacing = "2px";
    ctx.fillText("careerprint.ai", W - 48, H - 34);
    ctx.letterSpacing = "0px";

    // Download
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CareerPrint_${grade}_${c.total}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [c, skills, profile]);

  return (
    <div>
      {/* Top navbar + reading progress */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999 }} data-navbar>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "6px 20px", background: "rgba(5,5,8,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
          {/* Fingerprint icon */}
          <svg width={16} height={16} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
            <path d="M16 6 Q8 11 8 18 Q8 26 16 28" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 6 Q24 11 24 18 Q24 26 16 28" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <path d="M16 10 Q11.5 14 11.5 18 Q11.5 23 16 25" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <path d="M16 10 Q20.5 14 20.5 18 Q20.5 23 16 25" fill="none" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
            <line x1="16" y1="9" x2="16" y2="26" stroke="var(--gold)" strokeWidth="1" opacity="0.3"/>
          </svg>
          <span style={{ fontSize: 9, letterSpacing: "0.3em", color: "var(--gold)", fontFamily: "'Space Mono', monospace" }}>CAREERPRINT.AI</span>
          <span style={{ fontSize: 9, color: "var(--muted)", marginLeft: 4 }}>Your career — as unique as your fingerprint</span>
          <button
            onClick={generateShareCard}
            style={{
              position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "1px solid var(--border-bright)", borderRadius: 4,
              padding: "4px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 9, letterSpacing: "0.15em", color: "var(--gold)",
              fontFamily: "'Space Mono', monospace", opacity: 0.8,
              transition: "opacity 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "var(--gold)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "0.8"; e.currentTarget.style.borderColor = "var(--border-bright)"; }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
            </svg>
            SHARE CARD
          </button>
        </div>
        <div style={{ height: 2, background: "transparent" }}>
          <div ref={progressRef} style={{ height: "100%", width: "0%", background: "linear-gradient(90deg, var(--gold), var(--teal))", transition: "width 0.1s linear" }} />
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div style={{ position: "fixed", top: 38, left: 0, right: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "8px 20px", background: "rgba(212,168,67,0.1)", borderBottom: "1px solid rgba(212,168,67,0.2)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <span style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.08em", fontFamily: "'Space Mono', monospace" }}>This is a sample report — upload your own data to see yours.</span>
          <button onClick={onReset} style={{ background: "var(--gold)", color: "var(--bg)", border: "none", padding: "4px 14px", cursor: "pointer", fontSize: 10, letterSpacing: "0.1em", fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>UPLOAD YOUR DATA</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          CHAPTER 1 — YOUR NETWORK AT A GLANCE (DARK)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="chapter chapter-dark" ref={ch1Ref} style={{ paddingTop: isDemo ? 72 : 40 }}>
        <ChapterOpener number="01" title={<>Your Network at a <em style={{ color: "var(--gold)" }}>Glance</em></>} subtitle={`${c.total.toLocaleString()} connections across ${c.networkAge} year${c.networkAge !== 1 ? "s" : ""} — ${filesFound.length} file${filesFound.length !== 1 ? "s" : ""} analysed`} />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", boxSizing: "border-box" }}>
          {/* Stat cards */}
          <div className="scroll-reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 80 }}>
            {[
              { n: c.total, suf: "", l: "Total Connections", s: `since ${c.firstYear}`, b: c.bench.connections, ic: "connections" },
              { n: c.concentration, suf: "%", l: "Top Sector Share", s: c.topInd[0]?.[0] || "---", warn: c.concentration > 60, ic: "sector" },
              { n: c.execPct, suf: "%", l: "C-Suite & VP", s: "executive reach", b: c.bench.execReach, ic: "executive" },
              { n: c.recent12, suf: "", l: "Added This Year", s: c.growthPct !== null ? `${c.growthPct > 0 ? "+" : ""}${c.growthPct}% vs last year` : "12-month total", ic: "growth" },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: "18px 16px" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Icon name={s.ic} size={12} color="var(--muted)" style={{ opacity: 0.6 }} />{s.l.toUpperCase()}</div>
                <div className="serif" style={{ fontSize: 32, fontWeight: 400, color: s.warn ? "var(--amber)" : "var(--gold)", lineHeight: 1, marginBottom: 4 }}><CountUp value={s.n} suffix={s.suf} /></div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.s}</div>
                {s.b && <div style={{ fontSize: 9, color: s.b.color, marginTop: 4, letterSpacing: "0.08em" }}>{s.b.text}</div>}
              </div>
            ))}
          </div>

          {/* Hero Score — below stat cards */}
          <div className="scroll-reveal scroll-reveal-delay-1" style={{ textAlign: "center", marginBottom: 120 }}>
            <ScoreHex score={c.score} />
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 12, letterSpacing: "0.1em" }}>
              <span style={{ color: c.bench.connections.color }}>Larger than ~{c.bench.connectionsPct}% of LinkedIn users</span>
              {c.notable.count > 0 && <span> · <span style={{ color: "var(--teal)" }}>{c.notable.count} notable companies</span></span>}
            </div>
          </div>

          {/* Network Radar */}
          <SectionLabel icon="targeting">NETWORK HEALTH RADAR</SectionLabel>
          <div className="card" style={{ padding: 24, marginBottom: 64 }}>
            <NetworkRadar c={c} silentNetwork={silentNetwork} articles={articles} contentCreator={contentCreator} />
          </div>

          {/* Network DNA strip */}
          <NetworkDNA industries={c.industries} total={c.total} />

          {/* Insights — flip cards */}
          <SectionLabel icon="insights">KEY INSIGHTS</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 64 }}>
            {c.insights.map((ins, i) => {
              const accentColor = ins.type === "gold" ? "var(--gold)" : ins.type === "positive" ? "var(--green)" : ins.type === "warning" ? "var(--amber)" : "var(--muted)";
              const bgTint = ins.type === "gold" ? "rgba(212,168,67,0.1)" : ins.type === "positive" ? "rgba(76,175,80,0.08)" : ins.type === "warning" ? "rgba(255,152,0,0.08)" : "rgba(255,255,255,0.03)";
              const bgTintBack = ins.type === "gold" ? "rgba(212,168,67,0.05)" : ins.type === "positive" ? "rgba(76,175,80,0.04)" : ins.type === "warning" ? "rgba(255,152,0,0.04)" : "rgba(255,255,255,0.02)";
              return (
                <div key={i} className="scroll-reveal insight-flip-card" style={{ perspective: 800, height: 180, gridColumn: ins.fullWidth ? "1 / -1" : "auto" }}>
                  <div className="insight-flip-inner" style={{ position: "relative", width: "100%", height: "100%", transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)", transformStyle: "preserve-3d" }}>

                    {/* FRONT — hero number + headline */}
                    <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                      background: bgTint, border: `1px solid ${accentColor}33`, padding: "28px 24px",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 8 }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
                      {ins.statIsText ? (
                        <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: accentColor, lineHeight: 1.1 }}>{ins.stat}</div>
                      ) : (
                        <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: accentColor, lineHeight: 1.1 }}>
                          {ins.statPrefix || ""}<CountUp value={ins.stat} suffix={ins.statSuffix || ""} />
                        </div>
                      )}
                      {ins.subStat && <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--muted)" }}>{ins.subStat}</div>}

                      {/* Front micro-viz */}
                      {ins.vizType === "arc" && (() => {
                        const pct = Math.min(ins.stat / (ins.vizMax || 100), 1);
                        const r = 24, cxA = 28, cyA = 28, stroke = 3;
                        const circumference = Math.PI * r;
                        return (
                          <svg width={56} height={32} style={{ display: "block", margin: "4px auto 0" }}>
                            <path d={`M ${cxA - r} ${cyA} A ${r} ${r} 0 0 1 ${cxA + r} ${cyA}`} fill="none" stroke="var(--border)" strokeWidth={stroke} />
                            <path d={`M ${cxA - r} ${cyA} A ${r} ${r} 0 0 1 ${cxA + r} ${cyA}`} fill="none" stroke={accentColor} strokeWidth={stroke}
                              strokeDasharray={`${circumference * pct} ${circumference}`} strokeLinecap="round" />
                          </svg>
                        );
                      })()}
                      {ins.vizType === "sparkline" && ins.sparkData && (() => {
                        const vals = ins.sparkData.map(d => d[1]);
                        const max = Math.max(...vals);
                        const w = 100, h = 20;
                        const step = w / (vals.length - 1 || 1);
                        const pts = vals.map((v, j) => `${j * step},${h - (v / max) * h}`).join(" ");
                        return (
                          <svg width={w} height={h} style={{ display: "block", margin: "4px auto 0" }}>
                            <polyline points={pts} fill="none" stroke={accentColor} strokeWidth={1.5} opacity={0.6} />
                            {(() => { const pi = vals.indexOf(max); return <circle cx={pi * step} cy={0} r={2} fill={accentColor} />; })()}
                          </svg>
                        );
                      })()}
                      {ins.vizType === "monthBars" && ins.monthData && (() => {
                        const max = Math.max(...ins.monthData.map(m => m.count));
                        const mLabels = ["J","F","M","A","M","J","J","A","S","O","N","D"];
                        return (
                          <div style={{ margin: "4px auto 0" }}>
                            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 16 }}>
                              {ins.monthData.map((m, j) => (
                                <div key={j} style={{ width: 5, height: Math.max(2, (m.count / max) * 16), background: accentColor, opacity: 0.4 + (m.count / max) * 0.6, borderRadius: 1 }} />
                              ))}
                            </div>
                            <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                              {mLabels.map((l, j) => (
                                <div key={j} style={{ width: 5, textAlign: "center", fontSize: 5, color: "var(--muted)", opacity: 0.5, fontFamily: "Space Mono" }}>{l}</div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                      {ins.vizType === "percentile" && (() => {
                        const pct = ins.pct || 50;
                        return (
                          <div style={{ position: "relative", height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden", width: 100, margin: "6px auto 0" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, var(--border), ${accentColor})`, borderRadius: 2 }} />
                          </div>
                        );
                      })()}
                      {ins.vizType === "pills" && ins.pills && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
                          {ins.pills.map((p, j) => (
                            <span key={j} style={{ padding: "1px 8px", borderRadius: 10, fontSize: 9, letterSpacing: "0.06em", border: `1px solid ${accentColor}55`, color: accentColor, opacity: 0.7 }}>{p}</span>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: accentColor, marginTop: 4 }}>{ins.headline.toUpperCase()}</div>
                    </div>

                    {/* BACK — full details + micro-viz */}
                    <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)", background: bgTintBack, border: `1px solid ${accentColor}33`,
                      padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: accentColor, marginBottom: 8 }}>{ins.headline.toUpperCase()}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text)", marginBottom: 12 }}>{ins.body}</div>

                      {/* Micro-viz: Sparkline */}

                      {/* Micro-viz: Month bars */}
                      {ins.vizType === "monthBars" && ins.monthData && (() => {
                        const max = Math.max(...ins.monthData.map(m => m.count));
                        const mLabels = ["J","F","M","A","M","J","J","A","S","O","N","D"];
                        return (
                          <div>
                            <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 22 }}>
                              {ins.monthData.map((m, j) => (
                                <div key={j} style={{ flex: 1, height: Math.max(2, (m.count / max) * 22), background: accentColor, opacity: 0.5 + (m.count / max) * 0.5, borderRadius: 1 }} title={`${m.month}: ${m.count}`} />
                              ))}
                            </div>
                            <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                              {mLabels.map((l, j) => (
                                <div key={j} style={{ flex: 1, textAlign: "center", fontSize: 7, color: "var(--muted)", opacity: 0.5, fontFamily: "Space Mono" }}>{l}</div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Micro-viz: Percentile bar */}
                      {ins.vizType === "percentile" && (() => {
                        const pct = ins.pct || 50;
                        return (
                          <div style={{ position: "relative", height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, var(--border), ${accentColor})`, borderRadius: 3 }} />
                            <div style={{ position: "absolute", top: -2, left: `${pct}%`, width: 2, height: 10, background: accentColor, borderRadius: 1, transform: "translateX(-50%)" }} />
                          </div>
                        );
                      })()}

                      {/* Micro-viz: Pills */}
                      {ins.vizType === "pills" && ins.pills && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {ins.pills.map((p, j) => (
                            <span key={j} style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 9, letterSpacing: "0.08em", border: `1px solid ${accentColor}`, color: accentColor, opacity: 0.8 }}>{p}</span>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ChapterDivider />

      {/* ═══════════════════════════════════════════════════════════════════════
          CHAPTER 2 — WHO YOU KNOW (LIGHT/CREAM)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="chapter chapter-light" ref={ch2Ref}>
        <ChapterOpener number="02" title={<>Who You <em style={{ color: "var(--gold)" }}>Know</em></>} subtitle="Industry distribution, seniority profile, growth patterns, and the companies that define your network." />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", boxSizing: "border-box", color: "var(--cream-text)" }}>
          {/* Industry Treemap */}
          <div className="scroll-reveal" style={{ marginBottom: 64 }}>
            <SectionLabel color="var(--cream-muted)" icon="industry">INDUSTRY DISTRIBUTION</SectionLabel>
            <div className="card" style={{ padding: 24 }}>
              <IndustryTreemap industries={c.industries} total={c.total} />
            </div>
          </div>

          {/* Seniority pyramid */}
          <div className="scroll-reveal scroll-reveal-delay-1" style={{ marginBottom: 64 }}>
            <SectionLabel color="var(--cream-muted)" icon="seniority">SENIORITY PROFILE</SectionLabel>
            <div className="card" style={{ padding: 24, display: "flex", justifyContent: "center" }}>
              <SeniorityPyramid data={sortedSen} total={c.total} />
            </div>
          </div>

          {/* Growth Timeline 24 months — month grid */}
          <div className="scroll-reveal scroll-reveal-delay-2" style={{ marginBottom: 64 }}>
            <SectionLabel color="var(--cream-muted)" icon="growth">GROWTH TIMELINE (24 MONTHS)</SectionLabel>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: "var(--cream-muted)", marginBottom: 12 }}>Connections added per month — gold border = peak month</div>
              <MonthGrid data={c.last24} />
            </div>
          </div>

          {/* Year-by-year history */}
          {c.yearHistory.length > 0 && (
            <div className="scroll-reveal scroll-reveal-delay-3" style={{ marginBottom: 64 }}>
              <SectionLabel color="var(--cream-muted)" icon="timeline">CONNECTION HISTORY</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 11, color: "var(--cream-muted)", marginBottom: 16 }}>Connections added per year{c.peakYear ? ` · Peak: ${c.peakYear[0]}` : ""}</div>
                <svg viewBox={`0 0 ${c.yearHistory.length * 36} 80`} style={{ width: "100%", height: 100, overflow: "visible" }}>
                  {c.yearHistory.map(([year, count], i) => {
                    const h = (count / maxYearHist) * 54;
                    const isPeak = c.peakYear && year === c.peakYear[0];
                    return (
                      <g key={i}>
                        <rect x={i * 36 + 2} y={60 - h} width={28} height={h} fill={isPeak ? "var(--gold)" : "var(--gold-dim)"} opacity={isPeak ? 0.9 : 0.6} style={{ transformOrigin: `${i * 36 + 16}px 60px`, animation: `barGrow 0.6s ${i * 0.05}s cubic-bezier(0.22,1,0.36,1) forwards`, transform: "scaleY(0)" }} />
                        <text x={i * 36 + 16} y={74} textAnchor="middle" fill="var(--cream-muted)" fontSize="6" fontFamily="Space Mono">{year.slice(2)}</text>
                        {count > maxYearHist * 0.15 && <text x={i * 36 + 16} y={60 - h - 4} textAnchor="middle" fill={isPeak ? "var(--gold)" : "var(--cream-muted)"} fontSize="6" fontFamily="Space Mono">{count}</text>}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Seasonality & Day-of-Week */}
          <div className="scroll-reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 64 }}>
            <div className="card" style={{ padding: 24 }}>
              <SectionLabel color="var(--cream-muted)" icon="calendar">SEASONALITY</SectionLabel>
              <svg viewBox={`0 0 ${12 * 24} 70`} style={{ width: "100%", height: 80, overflow: "visible" }}>
                {c.seasonality.map((s, i) => {
                  const h = (s.count / maxSeason) * 48;
                  return (
                    <g key={i}>
                      <rect x={i * 24 + 2} y={54 - h} width={18} height={h} fill="var(--teal)" opacity="0.6" style={{ transformOrigin: `${i * 24 + 11}px 54px`, animation: `barGrow 0.6s ${i * 0.05}s cubic-bezier(0.22,1,0.36,1) forwards`, transform: "scaleY(0)" }} />
                      <text x={i * 24 + 11} y={66} textAnchor="middle" fill="var(--cream-muted)" fontSize="6" fontFamily="Space Mono">{s.month}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <SectionLabel color="var(--cream-muted)" icon="calendar">DAY OF WEEK</SectionLabel>
              <div style={{ fontSize: 11, color: "var(--cream-muted)", marginBottom: 12 }}>{c.weekdayPct}% weekday</div>
              <svg viewBox={`0 0 ${7 * 28} 70`} style={{ width: "100%", height: 72, overflow: "visible" }}>
                {c.weekdayOrdered.map((d, i) => {
                  const h = (d.count / maxWeekday) * 48;
                  const isWeekend = i >= 5;
                  return (
                    <g key={i}>
                      <rect x={i * 28 + 4} y={54 - h} width={18} height={h} fill={isWeekend ? "var(--cream-muted)" : "var(--gold)"} opacity={isWeekend ? 0.4 : 0.6} style={{ transformOrigin: `${i * 28 + 13}px 54px`, animation: `barGrow 0.6s ${i * 0.06}s cubic-bezier(0.22,1,0.36,1) forwards`, transform: "scaleY(0)" }} />
                      <text x={i * 28 + 13} y={66} textAnchor="middle" fill="var(--cream-muted)" fontSize="6" fontFamily="Space Mono">{d.day}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Network Growth Area Chart */}
          <GrowthAreaChart monthMap={c.monthMap} firstYear={c.firstYear} total={c.total} />

          {/* Connection Heatmap */}
          <ConnectionHeatmap monthMap={c.monthMap} firstYear={c.firstYear} />

          {/* Top Companies — Packed Bubble Chart */}
          {c.topCompanies.length > 0 && (
            <div className="scroll-reveal scroll-reveal-delay-1" style={{ marginBottom: 64 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <SectionLabel color="var(--cream-muted)" icon="company">TOP COMPANIES IN YOUR NETWORK</SectionLabel>
                {c.notable.count > 0 && <span style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.1em" }}>{c.notable.count} NOTABLE</span>}
              </div>
              <div className="card" style={{ padding: 24, overflow: "hidden" }}>
                <CompanyBubbles companies={c.topCompanies} total={c.total} />
              </div>
            </div>
          )}

          {/* Silent Network */}
          {silentNetwork && (
            <div className="scroll-reveal scroll-reveal-delay-2" style={{ marginBottom: 64 }}>
              <SectionLabel color="var(--cream-muted)" icon="silent">SILENT NETWORK</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { v: silentNetwork.messagedCount, l: "Messaged", c: "var(--green)" },
                    { v: silentNetwork.silentCount, l: "Never messaged", c: silentNetwork.silentPct > 70 ? "var(--amber)" : "var(--cream-muted)" },
                    { v: silentNetwork.silentSeniorCount, l: "Silent & senior", c: "var(--rose)" },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: "12px 10px", background: "var(--cream)", border: "1px solid var(--cream-border)", textAlign: "center" }}>
                      <div className="serif" style={{ fontSize: 22, color: s.c, lineHeight: 1, marginBottom: 4 }}>{s.v}</div>
                      <div style={{ fontSize: 9, color: "var(--cream-muted)", letterSpacing: "0.1em" }}>{s.l.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid var(--cream-border)", paddingTop: 20 }}>
                  <WaffleChart filledPct={silentNetwork.messagedPct} filledColor="var(--gold)" emptyColor="var(--cream-border)" filledLabel="Messaged" emptyLabel="Silent" />
                </div>
              </div>
              <div className="card" style={{ padding: 24 }}>
                {silentNetwork.silentPct > 70 && (
                  <div style={{ padding: "12px 16px", background: "rgba(232,160,64,0.06)", border: "1px solid rgba(232,160,64,0.2)", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", letterSpacing: "0.1em", marginBottom: 4 }}>HIGH SILENT RATIO</div>
                    <div style={{ fontSize: 13, color: "var(--cream-text)", lineHeight: 1.7 }}>{silentNetwork.silentPct}% of your connections have never exchanged a message with you.</div>
                  </div>
                )}
                {silentNetwork.silentSenior.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 16 }}>SENIOR CONNECTIONS YOU'VE NEVER MESSAGED</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                      {silentNetwork.silentSenior.map((p, i) => {
                        const initials = p.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
                        const domain = p.company ? companyToDomain(p.company) : null;
                        const hues = ["var(--gold)", "var(--teal)", "var(--rose)", "var(--amber)", "#6b8aed", "#9b6bed"];
                        const accent = hues[i % hues.length];
                        return (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "14px 16px",
                            background: "var(--cream)",
                            border: "1px solid var(--cream-border)",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 2px 12px ${accent}22`; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--cream-border)"; e.currentTarget.style.boxShadow = "none"; }}
                          >
                            <div style={{
                              width: 40, height: 40, borderRadius: "50%",
                              background: `linear-gradient(135deg, ${accent}33, ${accent}11)`,
                              border: `1.5px solid ${accent}55`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 700, color: accent,
                              fontFamily: "'Space Mono', monospace",
                              flexShrink: 0,
                            }}>
                              {initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, color: "var(--cream-text)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: "var(--cream-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{p.title}</div>
                              {p.company && (
                                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                                  {domain && <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`} width={12} height={12} alt="" style={{ opacity: 0.7 }} />}
                                  <span style={{ fontSize: 10, color: accent, letterSpacing: "0.05em", fontWeight: 600 }}>{p.company}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                <div style={{ fontSize: 13, color: "var(--cream-muted)", lineHeight: 1.7, marginTop: 16 }}>
                  You've messaged {silentNetwork.messagedPct}% of your {silentNetwork.total} connections. The rest are latent ties.
                </div>
              </div>
            </div>
          )}

          {/* Events */}
          {events && (
            <div className="scroll-reveal scroll-reveal-delay-3" style={{ marginBottom: 64 }}>
              <SectionLabel color="var(--cream-muted)" icon="event">LINKEDIN EVENTS</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(events.byStatus.length + 1, 4)},1fr)`, gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: "12px 10px", background: "var(--cream)", border: "1px solid var(--cream-border)", textAlign: "center" }}>
                    <div className="serif" style={{ fontSize: 22, color: "var(--gold)", lineHeight: 1, marginBottom: 4 }}><CountUp value={events.total} /></div>
                    <div style={{ fontSize: 9, color: "var(--cream-muted)", letterSpacing: "0.1em" }}>TOTAL</div>
                  </div>
                  {events.byStatus.map(([status, count], i) => (
                    <div key={i} style={{ padding: "12px 10px", background: "var(--cream)", border: "1px solid var(--cream-border)", textAlign: "center" }}>
                      <div className="serif" style={{ fontSize: 22, color: status === "approved" ? "var(--green)" : "var(--cream-muted)", lineHeight: 1, marginBottom: 4 }}>{count}</div>
                      <div style={{ fontSize: 9, color: "var(--cream-muted)", letterSpacing: "0.1em" }}>{status.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                {events.recent.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 12 }}>RECENT EVENTS</div>
                    {events.recent.map((e, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: i < events.recent.length - 1 ? "1px solid var(--cream-border)" : "none", gap: 16 }}>
                        <div style={{ flex: 1, fontSize: 13, color: "var(--cream-text)" }}>{e.name}</div>
                        <span style={{ fontSize: 9, padding: "2px 6px", border: `1px solid ${e.status === "approved" ? "var(--green)" : "var(--cream-border)"}`, color: e.status === "approved" ? "var(--green)" : "var(--cream-muted)", letterSpacing: "0.08em" }}>{e.status.toUpperCase()}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Invitations */}
          {invitations && (
            <div className="scroll-reveal" style={{ marginBottom: 64 }}>
              <SectionLabel color="var(--cream-muted)" icon="outreach">OUTREACH STYLE</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { n: invitations.outgoing, suf: "", l: "Sent", color: "var(--gold)" },
                    { n: invitations.personalisedPct, suf: "%", l: "With a note", color: "var(--gold)" },
                    { n: invitations.incoming, suf: "", l: "Received", color: "var(--teal)" },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: "12px 10px", background: "var(--cream)", border: "1px solid var(--cream-border)", textAlign: "center" }}>
                      <div className="serif" style={{ fontSize: 22, color: s.color, lineHeight: 1, marginBottom: 4 }}><CountUp value={s.n} suffix={s.suf} /></div>
                      <div style={{ fontSize: 9, color: "var(--cream-muted)", letterSpacing: "0.1em" }}>{s.l.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                {/* Outgoing vs Incoming — flowing ribbon fans */}
                {(() => {
                  const total = invitations.outgoing + invitations.incoming;
                  if (total === 0) return null;
                  const outPct = Math.round((invitations.outgoing / total) * 100);
                  const inPct = 100 - outPct;
                  const sentCount = Math.max(Math.round(outPct / 4), 6);
                  const recCount = Math.max(Math.round(inPct / 4), 6);
                  const makeFan = (n, originY, dir) => {
                    const lines = [];
                    for (let i = 0; i < n; i++) {
                      const t = n > 1 ? i / (n - 1) : 0.5;
                      const angle = -80 + t * 160;
                      const rad = (angle * Math.PI) / 180;
                      const len = 160 + (1 - Math.abs(t - 0.5) * 2) * 40;
                      const endX = 200 + Math.sin(rad) * len;
                      const endY = originY + dir * Math.cos(rad) * len;
                      const cp1x = 200 + Math.sin(rad) * 40;
                      const cp1y = originY + dir * 60;
                      const cp2x = 200 + Math.sin(rad) * (len * 0.65);
                      const cp2y = originY + dir * Math.cos(rad) * (len * 0.75);
                      const closeness = 1 - Math.abs(t - 0.5) * 2;
                      const sw = 3 + closeness * 8;
                      const op = 0.2 + closeness * 0.6;
                      lines.push({ d: `M 200 ${originY} C ${cp1x.toFixed(0)} ${cp1y.toFixed(0)}, ${cp2x.toFixed(0)} ${cp2y.toFixed(0)}, ${endX.toFixed(0)} ${endY.toFixed(0)}`, sw, op, delay: i * 0.04 });
                    }
                    return lines;
                  };
                  const sentLines = makeFan(sentCount, 280, -1);
                  const recLines = makeFan(recCount, 20, 1);
                  return (
                    <div style={{ display: "flex", gap: 12, margin: "48px 0 48px", alignItems: "center" }}>
                      {/* SENT fan — gold ribbons growing upward from bottom */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <svg viewBox="0 0 400 300" style={{ width: "100%", height: "auto", display: "block", minHeight: 400 }}>
                          <defs>
                            <linearGradient id="sentFanG" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0%" stopColor="var(--gold)" stopOpacity="0.9" /><stop offset="100%" stopColor="var(--gold)" stopOpacity="0.25" /></linearGradient>
                          </defs>
                          {sentLines.map((l, i) => (
                            <path key={i} d={l.d} fill="none" stroke="url(#sentFanG)" strokeWidth={l.sw} strokeLinecap="round" opacity={l.op}
                              strokeDasharray="500" strokeDashoffset="500"
                              style={{ animation: `drawIn 1.4s ${0.2 + l.delay}s cubic-bezier(0.22,1,0.36,1) forwards` }} />
                          ))}
                          <circle cx="200" cy="280" r="8" fill="var(--gold)" opacity="0.3" style={{ animation: "glowPulseStatic 3s ease infinite" }} />
                          <circle cx="200" cy="280" r="4" fill="var(--gold)" opacity="0.7" />
                        </svg>
                        <div style={{ fontSize: 11, fontFamily: "Space Mono", fontWeight: 700, letterSpacing: "0.12em", color: "var(--gold)", marginTop: -4,
                          animation: "fadeIn 0.5s 1s forwards", opacity: 0 }}>SENT {outPct}%</div>
                      </div>

                      {/* Divider */}
                      <div style={{ width: 1, height: 300, background: "var(--cream-border)", opacity: 0.3, flexShrink: 0, alignSelf: "center" }} />

                      {/* RECEIVED fan — teal ribbons growing downward from top */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 11, fontFamily: "Space Mono", fontWeight: 700, letterSpacing: "0.12em", color: "var(--teal)", marginBottom: -4,
                          animation: "fadeIn 0.5s 1.2s forwards", opacity: 0 }}>RECEIVED {inPct}%</div>
                        <svg viewBox="0 0 400 300" style={{ width: "100%", height: "auto", display: "block", minHeight: 400 }}>
                          <defs>
                            <linearGradient id="recFanG" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="var(--teal)" stopOpacity="0.8" /><stop offset="100%" stopColor="var(--teal)" stopOpacity="0.2" /></linearGradient>
                          </defs>
                          {recLines.map((l, i) => (
                            <path key={i} d={l.d} fill="none" stroke="url(#recFanG)" strokeWidth={l.sw} strokeLinecap="round" opacity={l.op}
                              strokeDasharray="500" strokeDashoffset="500"
                              style={{ animation: `drawIn 1.4s ${0.4 + l.delay}s cubic-bezier(0.22,1,0.36,1) forwards` }} />
                          ))}
                          <circle cx="200" cy="20" r="8" fill="var(--teal)" opacity="0.25" style={{ animation: "glowPulseStatic 3s ease infinite" }} />
                          <circle cx="200" cy="20" r="4" fill="var(--teal)" opacity="0.6" />
                        </svg>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ fontSize: 13, color: "var(--cream-muted)", lineHeight: 1.7 }}>
                  {invitations.outgoing > invitations.incoming
                    ? `You're a deliberate builder --- ${invitations.outgoing} outbound invitations vs ${invitations.incoming} inbound. ${invitations.personalisedPct > 50 ? "And you personalise most of your outreach --- that matters." : "Consider adding a personal note to more requests."}`
                    : `People are finding you --- ${invitations.incoming} inbound invitations vs ${invitations.outgoing} outbound. Your profile is doing the work.`}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages && (
            <div className="scroll-reveal scroll-reveal-delay-1" style={{ marginBottom: 64 }}>
              <SectionLabel color="var(--cream-muted)" icon="messages">MESSAGES</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                {/* Stat grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
                  {[
                    { n: messages.total, l: "Total messages", color: "gold" },
                    { n: messages.uniqueConvos, l: "Conversations", color: "teal" },
                    { n: messages.avgDepth, l: "Avg msgs/thread", color: "gold" },
                    { n: messages.deepConvos, l: "Deep threads (10+)", color: "teal" },
                    { n: messages.longestConvo, l: "Longest thread", color: "gold" },
                  ].map((s, i) => {
                    const numColor = s.color === "gold" ? "var(--gold)" : "var(--teal)";
                    return (
                      <div key={i} style={{
                        padding: "12px 10px", textAlign: "center",
                        background: s.color === "gold" ? "rgba(212,168,67,0.06)" : "rgba(61,214,200,0.04)",
                        border: `1px solid ${s.color === "gold" ? "rgba(212,168,67,0.15)" : "rgba(61,214,200,0.12)"}`,
                        borderRadius: 6,
                        animation: `floatIn 0.3s ${i * 0.08}s ease forwards`, opacity: 0,
                      }}>
                        <span className="serif" style={{ fontSize: 22, color: numColor, lineHeight: 1, display: "block", marginBottom: 4 }}><CountUp value={s.n} /></span>
                        <span style={{ fontSize: 9, color: "var(--cream-muted)", letterSpacing: "0.08em" }}>{s.l.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Sent vs Received — chat bubbles */}
                {messages.sent > 0 && messages.received > 0 && (() => {
                  const sentPct = Math.round((messages.sent / messages.total) * 100);
                  const recPct = 100 - sentPct;
                  return (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 12 }}>SENT vs RECEIVED</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {/* Sent bubble */}
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <div style={{
                            width: `${Math.max(sentPct, 20)}%`, padding: "10px 16px",
                            background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.25)",
                            borderRadius: "12px 12px 4px 12px",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            transformOrigin: "right", animation: "barGrowH 0.8s 0.2s cubic-bezier(0.22,1,0.36,1) forwards", transform: "scaleX(0)",
                          }}>
                            <span style={{ fontSize: 9, fontFamily: "Space Mono", color: "var(--cream-muted)", letterSpacing: "0.05em" }}>SENT</span>
                            <span style={{ fontSize: 13, fontFamily: "Space Mono", color: "var(--gold)", fontWeight: 700 }}>{messages.sent.toLocaleString()} ({sentPct}%)</span>
                          </div>
                        </div>
                        {/* Received bubble */}
                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                          <div style={{
                            width: `${Math.max(recPct, 20)}%`, padding: "10px 16px",
                            background: "rgba(61,214,200,0.08)", border: "1px solid rgba(61,214,200,0.2)",
                            borderRadius: "12px 12px 12px 4px",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            transformOrigin: "left", animation: "barGrowH 0.8s 0.4s cubic-bezier(0.22,1,0.36,1) forwards", transform: "scaleX(0)",
                          }}>
                            <span style={{ fontSize: 13, fontFamily: "Space Mono", color: "var(--teal)", fontWeight: 700 }}>{messages.received.toLocaleString()} ({recPct}%)</span>
                            <span style={{ fontSize: 9, fontFamily: "Space Mono", color: "var(--cream-muted)", letterSpacing: "0.05em" }}>RECEIVED</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {messages.yearHistory.length > 0 && (() => {
                  const maxYearMsg = Math.max(...messages.yearHistory.map(([, ct]) => ct), 1);
                  return (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 12 }}>MESSAGE ACTIVITY BY YEAR</div>
                      <svg viewBox={`0 0 ${messages.yearHistory.length * 36} 80`} style={{ width: "100%", height: 100, overflow: "visible" }}>
                        {messages.yearHistory.map(([year, count], i) => {
                          const h = (count / maxYearMsg) * 54;
                          return (
                            <g key={i}>
                              <rect x={i * 36 + 2} y={60 - h} width={28} height={h} rx="6" ry="6" fill="var(--teal)" opacity="0.55"
                                style={{ transformOrigin: `${i * 36 + 16}px 60px`, animation: `barGrow 0.6s ${i * 0.05}s cubic-bezier(0.22,1,0.36,1) forwards`, transform: "scaleY(0)" }} />
                              <text x={i * 36 + 16} y={74} textAnchor="middle" fill="var(--cream-muted)" fontSize="6" fontFamily="Space Mono">{year.slice(2)}</text>
                              {count > maxYearMsg * 0.15 && <text x={i * 36 + 16} y={60 - h - 4} textAnchor="middle" fill="var(--teal)" fontSize="6" fontFamily="Space Mono">{count}</text>}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  );
                })()}

                {messages.topConversations.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 12 }}>MOST ACTIVE CONVERSATIONS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {messages.topConversations.map(([name, count], i) => {
                        const isRight = i % 2 === 0;
                        const bg = isRight ? "rgba(212,168,67,0.10)" : "rgba(61,214,200,0.08)";
                        const color = isRight ? "var(--gold)" : "var(--teal)";
                        const initials = name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: isRight ? "flex-end" : "flex-start",
                            animation: `floatIn 0.3s ${0.1 * i}s ease forwards`, opacity: 0 }}>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, maxWidth: "75%",
                              flexDirection: isRight ? "row" : "row" }}>
                              {/* Avatar — left side only */}
                              {!isRight && (
                                <div style={{
                                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                                  background: "rgba(61,214,200,0.1)", border: "1px solid rgba(61,214,200,0.25)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 9, fontWeight: 700, color: "var(--teal)", fontFamily: "Space Mono",
                                }}>{initials}</div>
                              )}
                              {/* Bubble */}
                              <div style={{
                                padding: "8px 14px", position: "relative", flex: 1,
                                background: bg, textAlign: isRight ? "right" : "left",
                                borderRadius: isRight ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                              }}>
                                <div style={{ fontSize: 12, color: "var(--cream-text)", fontWeight: 600, lineHeight: 1.3 }}>{name}</div>
                                <div style={{ fontSize: 9, color, fontFamily: "Space Mono", marginTop: 2, opacity: 0.8 }}>{count} messages</div>
                              </div>
                              {/* Avatar — right side only */}
                              {isRight && (
                                <div style={{
                                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                                  background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.3)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 9, fontWeight: 700, color: "var(--gold)", fontFamily: "Space Mono",
                                }}>{initials}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dormant Connections */}
          {c.dormant > 0 && (
            <div className="scroll-reveal scroll-reveal-delay-2" style={{ marginBottom: 64 }}>
              <div className="card" style={{ padding: "16px 20px", display: "flex", gap: 16 }}>
                <div style={{ width: 3, background: "var(--amber)", flexShrink: 0, borderRadius: 2 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--amber)", marginBottom: 4 }}>DORMANT CONNECTIONS</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--cream-text)" }}>{c.dormant} connections have no company or title listed. These are potential re-engagement opportunities.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChapterDivider />

      {/* ═══════════════════════════════════════════════════════════════════════
          CHAPTER 3 — YOUR REPUTATION (DARK)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="chapter chapter-dark" ref={ch3Ref}>
        <ChapterOpener number="03" title={<>Your <em style={{ color: "var(--gold)" }}>Reputation</em></>} subtitle="Skills, endorsements, career history, recommendations, and how the professional world sees you." />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", boxSizing: "border-box" }}>
          {/* Skills stat cards — moved to top of chapter */}
          {skills && (
            <div className="scroll-reveal" style={{ marginBottom: 64 }}>
              <SectionLabel icon="skills">SKILLS & ENDORSEMENTS</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { v: skills.skillCount, l: "Skills listed" },
                  { v: skills.totalEndorsements, l: "Endorsements" },
                  { v: skills.uniqueEndorsers, l: "Unique endorsers" },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ padding: "12px 10px", textAlign: "center" }}>
                    <div className="serif" style={{ fontSize: 22, color: "var(--gold)", lineHeight: 1, marginBottom: 4 }}><CountUp value={s.v} /></div>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>{s.l.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Constellation */}
          {skills && skills.totalEndorsements > 0 && (
            <div className="scroll-reveal scroll-reveal-delay-1" style={{ textAlign: "center", marginBottom: 80 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--muted)", marginBottom: 8 }}>ENDORSEMENTS</div>
              <SkillsConstellation skills={skills} />
            </div>
          )}

          {/* Top Endorsed Skills — Radial Bar */}
          {skills && skills.topSkills.length > 0 && (
            <div className="scroll-reveal scroll-reveal-delay-2" style={{ marginBottom: 64 }}>
              <div style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", padding: "40px 0", position: "relative" }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--muted)", marginBottom: 8 }}>TOP ENDORSED SKILLS</div>
                </div>
                <SkillsRadialBar skills={skills.topSkills} total={skills.totalEndorsements} />
              </div>
            </div>
          )}

          {/* Endorsement Reciprocity */}
          {endorsementReciprocity && (
            <div className="scroll-reveal scroll-reveal-delay-2" style={{ marginBottom: 64 }}>
              <SectionLabel icon="reciprocity">ENDORSEMENT RECIPROCITY</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { v: `${endorsementReciprocity.reciprocityRatio}%`, l: "Reciprocity rate", c: "var(--gold)" },
                    { v: endorsementReciprocity.mutualCount, l: "Mutual endorsers", c: "var(--green)" },
                    { v: endorsementReciprocity.unreturned.length, l: "Haven't returned", c: "var(--amber)" },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: "12px 10px", background: "var(--bg)", border: "1px solid var(--border)", textAlign: "center" }}>
                      <div className="serif" style={{ fontSize: 22, color: s.c, lineHeight: 1, marginBottom: 4 }}>{s.v}</div>
                      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>{s.l.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
                <ReciprocityArcs data={endorsementReciprocity} />
                {endorsementReciprocity.mutualChampions.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 12 }}>MUTUAL CHAMPIONS</div>
                    {endorsementReciprocity.mutualChampions.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < endorsementReciprocity.mutualChampions.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <span style={{ fontSize: 13, color: "var(--text)" }}>{p.name}</span>
                        <span style={{ fontSize: 11, color: "var(--green)" }}>{p.count} endorsements</span>
                      </div>
                    ))}
                  </div>
                )}
                {endorsementReciprocity.unreturned.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 12 }}>ENDORSED YOU --- HAVEN'T ENDORSED BACK</div>
                    {endorsementReciprocity.unreturned.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < endorsementReciprocity.unreturned.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <span style={{ fontSize: 13, color: "var(--text)" }}>{p.name}</span>
                        <span style={{ fontSize: 11, color: "var(--amber)" }}>{p.count} given to you</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Career Timeline — Lollipop Chart */}
          {positions && positions.length > 0 && (() => {
            const now = new Date();
            const parseDate = (s) => {
              if (!s) return now;
              const parts = s.split(" ");
              const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
              return new Date(parseInt(parts[1]) || now.getFullYear(), months[parts[0]] ?? 0);
            };
            const roles = positions.map((p, i) => {
              const start = parseDate(p["Started On"]);
              const end = p["Finished On"] ? parseDate(p["Finished On"]) : now;
              const months = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44)));
              return { title: p["Title"] || "", company: p["Company Name"] || "", location: p["Location"] || "", started: p["Started On"] || "", finished: p["Finished On"] || "Present", months, isCurrent: !p["Finished On"], startDate: start, i };
            }).sort((a, b) => a.startDate - b.startDate); // earliest on left
            const maxMonths = Math.max(...roles.map(r => r.months));
            const minR = 18, maxR = 52;
            const W = 900, baseY = 500, topPad = 120, stemMin = 80;
            const colW = W / roles.length;

            return (
              <div className="scroll-reveal scroll-reveal-delay-3" style={{ marginBottom: 64 }}>
                <SectionLabel icon="career">CAREER TIMELINE</SectionLabel>
                <div className="card" style={{ padding: "32px 16px 24px", overflow: "hidden" }}>
                  <svg viewBox={`0 0 ${W} ${baseY + 30}`} style={{ width: "100%", height: "auto" }}>
                    <defs>
                      <radialGradient id="lolliGrad"><stop offset="0%" stopColor="var(--gold)" stopOpacity="0.35" /><stop offset="100%" stopColor="var(--gold)" stopOpacity="0.08" /></radialGradient>
                      <filter id="lolliGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    </defs>
                    {/* Baseline */}
                    <line x1={20} y1={baseY} x2={W - 20} y2={baseY} stroke="var(--border)" strokeWidth="1" opacity="0.2" />
                    {/* Lollipop stems and bubbles */}
                    {roles.map((r, i) => {
                      const cx = colW * i + colW / 2;
                      const bubbleR = minR + (r.months / maxMonths) * (maxR - minR);
                      const stemH = stemMin + (r.months / maxMonths) * (baseY - topPad - stemMin - maxR);
                      const bubbleY = baseY - stemH;
                      const years = (r.months / 12).toFixed(1).replace(/\.0$/, "");
                      const yearsLabel = r.months >= 12 ? `${years}y` : `${r.months}m`;
                      return (
                        <g key={i} style={{ animation: `floatIn 0.6s ${0.1 + i * 0.08}s ease forwards`, opacity: 0 }}>
                          {/* Stem */}
                          <line x1={cx} y1={baseY} x2={cx} y2={bubbleY + bubbleR} stroke="var(--gold-dim)" strokeWidth="2" opacity="0.3"
                            strokeDasharray={stemH} strokeDashoffset={stemH}
                            style={{ animation: `drawIn 0.8s ${0.2 + i * 0.08}s ease forwards` }} />
                          {/* Bubble */}
                          <circle cx={cx} cy={bubbleY} r={bubbleR} fill="url(#lolliGrad)" stroke={r.isCurrent ? "var(--gold)" : "var(--gold-dim)"} strokeWidth={r.isCurrent ? 1.5 : 0.5}
                            filter={r.isCurrent ? "url(#lolliGlow)" : "none"} />
                          {r.isCurrent && <circle cx={cx} cy={bubbleY} r={bubbleR} fill="none" stroke="var(--gold)" strokeWidth="0.5" opacity="0.3"
                            style={{ animation: "pulseNode 3s ease infinite" }} />}
                          {/* Tenure inside bubble */}
                          <text x={cx} y={bubbleY + 3} textAnchor="middle" fill="var(--gold)" fontSize={bubbleR > 35 ? 13 : 11} fontFamily="Space Mono" fontWeight="700">{yearsLabel}</text>
                          {/* Role labels above bubble */}
                          {r.isCurrent && (
                            <text x={cx} y={bubbleY - bubbleR - 38} textAnchor="middle" fill="var(--gold)" fontSize="7" fontFamily="Space Mono" letterSpacing="1.5">NOW</text>
                          )}
                          <text x={cx} y={bubbleY - bubbleR - 24} textAnchor="middle" fill="var(--text)" fontSize="8" fontFamily="Space Mono" fontWeight="700">
                            {r.company.length > 16 ? r.company.slice(0, 15) + "…" : r.company}
                          </text>
                          <text x={cx} y={bubbleY - bubbleR - 12} textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="Space Mono">
                            {r.title.length > 20 ? r.title.slice(0, 19) + "…" : r.title}
                          </text>
                          {/* Year on baseline */}
                          <text x={cx} y={baseY + 14} textAnchor="middle" fill="var(--gold)" fontSize="8" fontFamily="Space Mono" opacity="0.6">
                            {r.started.split(" ").pop() || ""}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            );
          })()}

          {/* Career Journey Map */}
          {positions && positions.length > 0 && (
            <CareerMap positions={positions} />
          )}

          {/* Education & Certifications */}
          {((education && education.length > 0) || (certifications && certifications.length > 0)) && (
            <div className="scroll-reveal" style={{ marginBottom: 64 }}>
              <SectionLabel icon="education">EDUCATION & CREDENTIALS</SectionLabel>

              {/* Degrees — upward arc */}
              {education && education.length > 0 && (() => {
                const sorted = [...education].sort((a, b) => {
                  const ya = parseInt(a["Start Date"]) || 0, yb = parseInt(b["Start Date"]) || 0;
                  return ya - yb;
                });
                const n = sorted.length;
                const W = 800, H = 300, padL = 50, padR = 50, padTop = 70, padBot = 40;
                const baselineY = H - padBot;
                const arcH = H - padTop - padBot;
                const chartW = W - padL - padR;

                // Parse years, use midpoint of each degree for node placement
                const items = sorted.map(e => {
                  const s = parseInt(e["Start Date"]) || 0;
                  const eEnd = parseInt(e["End Date"]) || new Date().getFullYear();
                  return { ...e, startYr: s, endYr: eEnd, midYr: (s + eEnd) / 2 };
                });
                const allYears = items.flatMap(d => [d.startYr, d.endYr]);
                const minYear = Math.min(...allYears);
                const maxYear = Math.max(...allYears);
                const yearSpan = maxYear - minYear || 1;
                const xOfYear = (yr) => padL + ((yr - minYear) / yearSpan) * chartW;

                // Arc nodes placed at midpoint of each degree's duration
                const pts = items.map((d, i) => {
                  const t = (d.midYr - minYear) / yearSpan;
                  const x = padL + t * chartW;
                  const arcY = padTop + arcH * (1 - (0.1 + 0.9 * (i / Math.max(n - 1, 1))));
                  return { x, y: arcY };
                });

                // Smooth curve
                let curvePath = `M ${pts[0].x} ${pts[0].y}`;
                if (pts.length === 2) {
                  curvePath += ` L ${pts[1].x} ${pts[1].y}`;
                } else {
                  for (let i = 0; i < pts.length - 1; i++) {
                    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
                    curvePath += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
                  }
                }

                // Year scale — show every 5 years + first and last
                const tickInterval = yearSpan > 20 ? 5 : yearSpan > 10 ? 5 : yearSpan > 5 ? 2 : 1;
                const scaleTicks = [];
                const firstTick = Math.ceil(minYear / tickInterval) * tickInterval;
                for (let y = firstTick; y <= maxYear; y += tickInterval) scaleTicks.push(y);
                if (!scaleTicks.includes(minYear)) scaleTicks.unshift(minYear);
                if (!scaleTicks.includes(maxYear)) scaleTicks.push(maxYear);

                const hues = ["var(--gold)", "var(--teal)", "#d4684a", "#6b8aed", "#9b6bed"];

                return (
                  <div className="card" style={{ padding: "28px 24px 16px", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 8 }}>ACADEMIC JOURNEY</div>
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
                      <defs>
                        <linearGradient id="arcGrad" x1="0" y1="1" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.5" />
                        </linearGradient>
                      </defs>

                      {/* Duration bars with degree labels */}
                      {items.map((d, i) => {
                        const x1 = xOfYear(d.startYr), x2 = xOfYear(d.endYr);
                        const barH = 14;
                        const yPos = baselineY - barH - i * (barH + 3);
                        const barWidth = Math.max(x2 - x1, 6);
                        const color = hues[i % hues.length];
                        const degree = d["Degree Name"] || "";
                        const school = d["School Name"] || "";
                        const label = degree ? (degree.length > 20 ? degree.slice(0, 18) + "…" : degree) : (school.length > 20 ? school.slice(0, 18) + "…" : school);
                        return (
                          <g key={`dur${i}`} style={{ animation: `fadeIn 0.6s ${0.4 + i * 0.15}s ease forwards`, opacity: 0 }}>
                            <rect x={x1} y={yPos} width={barWidth} height={barH}
                              fill={color} opacity="0.15" rx="2" />
                            <rect x={x1} y={yPos} width={barWidth} height={barH}
                              fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" rx="2" />
                            {barWidth > 40 && (
                              <text x={x1 + 4} y={yPos + barH / 2 + 3} fill={color} fontSize="6" fontFamily="'Space Mono', monospace" opacity="0.7">
                                {label}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Baseline */}
                      <line x1={padL} y1={baselineY} x2={padL + chartW} y2={baselineY} stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />

                      {/* Year scale ticks */}
                      {scaleTicks.map(yr => (
                        <g key={`tick${yr}`}>
                          <line x1={xOfYear(yr)} y1={baselineY} x2={xOfYear(yr)} y2={baselineY + 5} stroke="var(--border)" strokeWidth="0.5" opacity="0.4" />
                          <text x={xOfYear(yr)} y={baselineY + 16} textAnchor="middle" fill="var(--muted)" fontSize="8" fontFamily="'Space Mono', monospace" opacity="0.6">{yr}</text>
                        </g>
                      ))}

                      {/* Arc path */}
                      <path d={curvePath} fill="none" stroke="url(#arcGrad)" strokeWidth="2.5" strokeLinecap="round"
                        strokeDasharray="2000" strokeDashoffset="2000"
                        style={{ animation: "drawIn 2s 0.3s ease forwards" }} />

                      {/* Waypoint nodes + labels */}
                      {items.map((d, i) => {
                        const { x, y } = pts[i];
                        const degree = d["Degree Name"] || "";
                        const school = d["School Name"] || "";
                        // All labels above the node on the arc
                        const anchor = x < W * 0.25 ? "start" : x > W * 0.75 ? "end" : "middle";
                        return (
                          <g key={`ed${i}`} style={{ animation: `floatIn 0.4s ${0.8 + i * 0.3}s ease forwards`, opacity: 0 }}>
                            {/* Node */}
                            <circle cx={x} cy={y} r="6" fill="var(--bg)" stroke={hues[i % hues.length]} strokeWidth="2" />
                            <circle cx={x} cy={y} r="2.5" fill={hues[i % hues.length]} opacity="0.8" />
                            {/* Labels above */}
                            <text x={x} y={y - 16} textAnchor={anchor} fill="var(--text)" fontSize="10" fontFamily="'Playfair Display', serif" fontWeight="700">
                              {degree.length > 32 ? degree.slice(0, 30) + "…" : degree}
                            </text>
                            {school && (
                              <text x={x} y={y - 4} textAnchor={anchor} fill="var(--muted)" fontSize="8" fontFamily="'Space Mono', monospace">
                                {school.length > 28 ? school.slice(0, 26) + "…" : school}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}

              {/* Certifications — badge grid */}
              {certifications && certifications.length > 0 && (
                <div className="card" style={{ padding: "28px 24px" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 16 }}>CERTIFICATIONS & FELLOWSHIPS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                    {certifications.map((cert, i) => {
                      const name = cert["Name"] || "";
                      const authority = cert["Authority"] || "";
                      const date = cert["Started On"] || "";
                      const domain = authority ? companyToDomain(authority) : null;
                      return (
                        <div key={`cert${i}`} style={{
                          padding: "14px 16px",
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderLeft: "3px solid var(--teal)",
                          transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--teal)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(61,214,200,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.borderLeftColor = "var(--teal)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="8" r="6" />
                              <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
                            </svg>
                            <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 700, lineHeight: 1.3, flex: 1 }}>{name}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {domain && <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`} width={12} height={12} alt="" style={{ opacity: 0.6 }} />}
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{authority}</span>
                          </div>
                          {date && <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em", marginTop: 6, fontFamily: "'Space Mono', monospace" }}>{date}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Published Articles */}
          {articles && (
            <div className="scroll-reveal scroll-reveal-delay-1" style={{ marginBottom: 64 }}>
              <SectionLabel icon="article">PUBLISHED ARTICLES</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                {/* Summary stats inline */}
                <div style={{ display: "flex", gap: 24, alignItems: "baseline", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span className="serif" style={{ fontSize: 28, color: "var(--gold)", lineHeight: 1 }}><CountUp value={articles.total} /></span>
                    <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>ARTICLES</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span className="serif" style={{ fontSize: 28, color: "var(--teal)", lineHeight: 1 }}>{articles.avgWords}</span>
                    <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>AVG WORDS</span>
                  </div>
                  {articles.topics.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginLeft: "auto" }}>
                      {articles.topics.map(([topic, count], i) => (
                        <span key={i} style={{ padding: "3px 10px", border: "1px solid var(--gold-dim)", fontSize: 10, color: "var(--gold)", borderRadius: 2 }}>{topic} ({count})</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Article stack — overlapping paper cards */}
                {(() => {
                  const total = articles.articles.length;
                  const maxWords = Math.max(...articles.articles.map(x => x.wordCount), 1);
                  const rotations = [-0.8, 0.5, -0.3, 0.7, -0.6, 0.4, -0.9, 0.2];
                  const offsets = [3, -2, 5, -4, 2, -3, 6, -1];
                  return (
                    <div style={{ position: "relative", perspective: 800 }}>
                      {articles.articles.map((a, i) => {
                        const rot = rotations[i % rotations.length];
                        const offX = offsets[i % offsets.length];
                        const wordBar = Math.round((a.wordCount / maxWords) * 100);
                        const lineCount = Math.max(2, Math.min(5, Math.round(a.wordCount / 250)));
                        return (
                          <div key={i} style={{
                            position: "relative",
                            marginBottom: i < total - 1 ? -18 : 0,
                            zIndex: total - i,
                            transform: `rotate(${rot}deg) translateX(${offX}px)`,
                            transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, margin-bottom 0.35s ease",
                            animation: `floatIn 0.4s ${i * 0.12}s ease forwards`, opacity: 0,
                            cursor: "default",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = "rotate(0deg) translateX(0) translateY(-6px)";
                            e.currentTarget.style.zIndex = 100;
                            e.currentTarget.style.marginBottom = i < total - 1 ? "4px" : "0";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = `rotate(${rot}deg) translateX(${offX}px)`;
                            e.currentTarget.style.zIndex = total - i;
                            e.currentTarget.style.marginBottom = i < total - 1 ? "-18px" : "0";
                          }}
                          >
                            <div style={{
                              padding: "20px 24px 16px",
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                            }}>
                              {/* Top edge — gold rule like a document header */}
                              <div style={{ height: 2, background: "var(--gold)", opacity: 0.3, marginBottom: 14, width: 40 }} />
                              <div className="serif" style={{ fontSize: 15, color: "var(--text)", fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>{a.title}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                <div style={{ display: "flex", gap: 12, fontSize: 10, color: "var(--muted)", fontFamily: "'Space Mono', monospace" }}>
                                  {a.date && <span>{a.date}</span>}
                                  <span>{a.wordCount.toLocaleString()} words</span>
                                </div>
                                {/* Word count sparkbar */}
                                <div style={{ flex: 1, maxWidth: 100, height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ width: `${wordBar}%`, height: "100%", background: "var(--gold)", opacity: 0.45, borderRadius: 2 }} />
                                </div>
                              </div>
                              {/* Faux body text lines */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                {Array.from({ length: lineCount }, (_, j) => (
                                  <div key={j} style={{
                                    height: 2,
                                    background: "var(--border)",
                                    opacity: 0.15 + 0.1 * (1 - j / lineCount),
                                    width: j === lineCount - 1 ? `${35 + (i * 13 + j * 17) % 40}%` : `${85 + (j * 7) % 15}%`,
                                  }} />
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recsReceived && recsReceived.length > 0 && (
            <div className="scroll-reveal scroll-reveal-delay-2" style={{ marginBottom: 64 }}>
              <SectionLabel icon="recommendation">RECOMMENDATIONS</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {recsReceived.map((r, i) => (
                  <div key={i} className="card" style={{ padding: "28px 24px" }}>
                    <div className="serif" style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text)", fontStyle: "italic", marginBottom: 16, borderLeft: "2px solid var(--gold-dim)", paddingLeft: 20 }}>
                      &ldquo;{r["Text"] || ""}&rdquo;
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gold-glow)", border: "1px solid var(--gold-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--gold)", fontWeight: 700 }}>
                        {(r["First Name"] || "?")[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{r["First Name"] || ""} {r["Last Name"] || ""}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{r["Job Title"] || ""}{r["Company"] ? ` · ${r["Company"]}` : ""}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning */}
          {learning && (
            <div className="scroll-reveal scroll-reveal-delay-3" style={{ marginBottom: 64 }}>
              <SectionLabel icon="learning">LEARNING</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { v: learning.total, l: "Courses explored" },
                    { v: learning.viewed, l: "Courses viewed" },
                    { v: learning.completed, l: "Completed" },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: "12px 10px", background: "var(--bg)", border: "1px solid var(--border)", textAlign: "center" }}>
                      <div className="serif" style={{ fontSize: 22, color: "var(--gold)", lineHeight: 1, marginBottom: 4 }}>{s.v}</div>
                      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>{s.l.toUpperCase()}</div>
                    </div>
                  ))}
                </div>

                {learning.topTopics.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 16 }}>TOPICS YOU STUDY</div>
                    <RadialSegments industries={Object.fromEntries(learning.topTopics)} total={learning.total} />
                  </div>
                )}

                {learning.timeline.length > 0 && (() => {
                  const maxYearL = Math.max(...learning.timeline.map(([, ct]) => ct), 1);
                  return (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 12 }}>LEARNING ACTIVITY BY YEAR</div>
                      <svg viewBox={`0 0 ${learning.timeline.length * 40} 80`} style={{ width: "100%", height: 100, overflow: "visible" }}>
                        {learning.timeline.map(([year, count], i) => {
                          const h = (count / maxYearL) * 54;
                          return (
                            <g key={i}>
                              <rect x={i * 40 + 4} y={60 - h} width={32} height={h} fill="var(--teal)" opacity="0.7" style={{ transformOrigin: `${i * 40 + 20}px 60px`, animation: `barGrow 0.6s ${i * 0.05}s cubic-bezier(0.22,1,0.36,1) forwards`, transform: "scaleY(0)" }} />
                              <text x={i * 40 + 20} y={74} textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="Space Mono">{year}</text>
                              <text x={i * 40 + 20} y={60 - h - 4} textAnchor="middle" fill="var(--teal)" fontSize="7" fontFamily="Space Mono">{count}</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  );
                })()}

                {learning.recent.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 12 }}>RECENTLY VIEWED</div>
                    {learning.recent.map((course, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: i < learning.recent.length - 1 ? "1px solid var(--border)" : "none", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 4 }}>{course.title}</div>
                          <span style={{ fontSize: 9, padding: "2px 8px", border: "1px solid var(--border-bright)", color: "var(--muted)", letterSpacing: "0.08em" }}>{course.topic}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{course.date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ── Account Age — Timeline Ruler ───────────────────────── */}
          {registration && (() => {
            const dateStr = registration["Registered At"] || registration["Registration Date"] || registration["Date"] || "";
            const regDate = new Date(dateStr);
            const isValid = !isNaN(regDate);
            const years = isValid ? Math.floor((Date.now() - regDate) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
            const startYear = isValid ? regDate.getFullYear() : 2020;
            const endYear = new Date().getFullYear();
            const yearSpan = endYear - startYear || 1;
            const W = 700, H = 60, padL = 10, padR = 10;
            const chartW = W - padL - padR;
            return (
              <div className="scroll-reveal scroll-reveal-delay-1" style={{ marginBottom: 64 }}>
                <div className="card" style={{ padding: "20px 24px", borderColor: "rgba(212,168,67,0.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="calendar" size={12} color="var(--muted)" />ACCOUNT AGE
                    </div>
                    <div className="serif" style={{ fontSize: 36, color: "var(--gold)", lineHeight: 1 }}>
                      <CountUp value={years} /><span style={{ fontSize: 16, opacity: 0.6 }}>yr</span>
                    </div>
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
                    <line x1={padL} y1={25} x2={padL + chartW} y2={25} stroke="var(--border)" strokeWidth="1" />
                    <line x1={padL} y1={25} x2={padL + chartW} y2={25} stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"
                      strokeDasharray={chartW} strokeDashoffset={chartW}
                      style={{ animation: "drawIn 1.5s 0.3s ease forwards" }} />
                    {Array.from({ length: yearSpan + 1 }, (_, i) => {
                      const yr = startYear + i;
                      const x = padL + (i / yearSpan) * chartW;
                      const show = yearSpan <= 8 || i % Math.ceil(yearSpan / 8) === 0 || i === yearSpan;
                      return show ? (
                        <g key={yr}>
                          <line x1={x} y1={20} x2={x} y2={30} stroke="var(--border)" strokeWidth="0.5" />
                          <text x={x} y={45} textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="'Space Mono', monospace" opacity="0.6">{yr}</text>
                        </g>
                      ) : null;
                    })}
                    <circle cx={padL} cy={25} r="4" fill="var(--surface)" stroke="var(--gold)" strokeWidth="1.5"
                      style={{ animation: "floatIn 0.4s 0.3s ease forwards", opacity: 0 }} />
                    <circle cx={padL + chartW} cy={25} r="4" fill="var(--gold)"
                      style={{ animation: "floatIn 0.4s 1.5s ease forwards", opacity: 0 }} />
                  </svg>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    Registered <strong style={{ color: "var(--gold)" }}>{dateStr || "Unknown"}</strong>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Content Creator — Type bars + year chart ────────────── */}
          {contentCreator && (
            <div className="scroll-reveal scroll-reveal-delay-1" style={{ marginBottom: 64 }}>
              <SectionLabel icon="content">CONTENT CREATOR</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
                  <span className="serif" style={{ fontSize: 28, color: "var(--teal)", lineHeight: 1 }}>{contentCreator.totalPieces}</span>
                  <span style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>MEDIA ITEMS PUBLISHED</span>
                </div>

                {contentCreator.byType.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    {contentCreator.byType.map(([type, count], i) => {
                      const max = Math.max(...contentCreator.byType.map(([, c]) => c), 1);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                          <span style={{ fontSize: 10, color: "var(--text)", width: 80, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{type}</span>
                          <div style={{ flex: 1, height: 6, background: "var(--surface)", border: "1px solid var(--border)", overflow: "hidden" }}>
                            <div style={{ width: `${(count / max) * 100}%`, height: "100%", background: "var(--teal)", opacity: 0.5, transformOrigin: "left", animation: `barGrowH 0.6s ${i * 0.1}s ease forwards`, transform: "scaleX(0)" }} />
                          </div>
                          <span className="serif" style={{ fontSize: 16, color: "var(--teal)", width: 30, textAlign: "right" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {contentCreator.byYear.length > 1 && (() => {
                  const data = contentCreator.byYear;
                  const maxY = Math.max(...data.map(([, c]) => c), 1);
                  const W = 600, H = 80, pad = 10;
                  const chartW = W - pad * 2;
                  return (
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 8 }}>PUBLISHED BY YEAR</div>
                      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
                        {data.map(([year, count], i) => {
                          const x = pad + (i / (data.length - 1 || 1)) * chartW;
                          const h = (count / maxY) * 50;
                          return (
                            <g key={i}>
                              <rect x={x - 12} y={60 - h} width={24} height={h} rx={4} fill="var(--teal)" opacity="0.4"
                                style={{ transformOrigin: `${x}px 60px`, animation: `barGrow 0.5s ${i * 0.08}s ease forwards`, transform: "scaleY(0)" }} />
                              <text x={x} y={74} textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="'Space Mono', monospace">{year.toString().slice(2)}</text>
                              {count > 0 && <text x={x} y={60 - h - 4} textAnchor="middle" fill="var(--teal)" fontSize="7" fontFamily="'Space Mono', monospace">{count}</text>}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ── Verifications — Badge Cards ─────────────────────────── */}
          {verifications && verifications.length > 0 && (
            <div className="scroll-reveal scroll-reveal-delay-2" style={{ marginBottom: 64 }}>
              <SectionLabel icon="verify">IDENTITY VERIFICATIONS</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {verifications.map((v, i) => {
                  const isExpired = v.expiry && new Date(v.expiry) < new Date();
                  const accent = isExpired ? "var(--rose)" : "var(--green)";
                  return (
                    <div key={i} className="card" style={{
                      padding: "16px 20px", borderLeft: `4px solid ${accent}`,
                      display: "flex", alignItems: "center", gap: 14,
                      animation: `floatIn 0.4s ${i * 0.1}s ease forwards`, opacity: 0,
                    }}>
                      <svg width="24" height="28" viewBox="0 0 24 28" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M12 2L2 7v7c0 6.55 4.27 12.68 10 14.16C17.73 26.68 22 20.55 22 14V7L12 2z" fill={`${accent}11`} stroke={accent} strokeWidth="1.2" />
                        {!isExpired && <path d="M8 14l3 3 5-5" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
                        {isExpired && <><line x1="9" y1="11" x2="15" y2="17" stroke={accent} strokeWidth="1.5" /><line x1="15" y1="11" x2="9" y2="17" stroke={accent} strokeWidth="1.5" /></>}
                      </svg>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 700 }}>{v.type || "Identity Verification"}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{[v.docType, v.provider, v.org].filter(Boolean).join(" · ")}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: accent, fontFamily: "'Space Mono', monospace" }}>{isExpired ? "EXPIRED" : "VERIFIED"}</div>
                        <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{v.date}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      <ChapterDivider />

      {/* ═══════════════════════════════════════════════════════════════════════
          CHAPTER 4 — YOUR CAREER INTENT (DARK)
          ═══════════════════════════════════════════════════════════════════════ */}
      {hasCareerIntel && (
        <div className="chapter chapter-dark" ref={ch4Ref}>
          <ChapterOpener number="04" title={<>Your Career <em style={{ color: "var(--gold)" }}>Intent</em></>} subtitle="Saved jobs, applications, search patterns, and the signals that reveal your next move." />

          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", boxSizing: "border-box" }}>
            {/* Company Bubble Chart */}
            {careerIntent && careerIntent.topCompanies.length > 0 && (
              <div className="scroll-reveal" style={{ textAlign: "center", marginBottom: 80 }}>
                <CompanyBubbleChart companies={careerIntent.topCompanies} />
              </div>
            )}

            {/* Stat cards */}
            {careerIntent && (
              <div className="scroll-reveal scroll-reveal-delay-1" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 64 }}>
                {[
                  { n: careerIntent.savedCount, suf: "", l: "Jobs saved" },
                  { n: careerIntent.appliedCount, suf: "", l: "Applied to" },
                  { n: careerIntent.saveToApplyRatio, suf: "%", l: "Save-to-apply ratio" },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ padding: 20, textAlign: "center" }}>
                    <div className="serif" style={{ fontSize: 32, color: i === 2 ? "var(--teal)" : "var(--gold)", lineHeight: 1, marginBottom: 6 }}><CountUp value={s.n} suffix={s.suf} /></div>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>{s.l.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Job Seeker Preferences */}
            {jobSeekerPrefs && (
              <div className="scroll-reveal scroll-reveal-delay-2" style={{ marginBottom: 64 }}>
                <div className="card" style={{ padding: 24, borderColor: "rgba(232,96,96,0.2)" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--rose)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><Icon name="jobseeker" size={13} color="var(--rose)" />YOUR JOB SEEKER PREFERENCES</div>
                  <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.8, marginBottom: 16 }}>
                    LinkedIn stores your job search configuration --- what you're looking for, where, and how urgently.
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { l: "ACTIVITY LEVEL", v: jobSeekerPrefs.activityLevel.replace(/_/g, " ") },
                      { l: "OPEN TO RECRUITERS", v: jobSeekerPrefs.openToRecruiters },
                      { l: "URGENCY", v: jobSeekerPrefs.urgency.replace(/_/g, " ") || "Not set" },
                      { l: "START TIME", v: jobSeekerPrefs.startTime.replace(/_/g, " ") || "Not set" },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 4 }}>{item.l}</div>
                        <div style={{ fontSize: 13, color: "var(--gold)", textTransform: "capitalize" }}>{item.v.toLowerCase()}</div>
                      </div>
                    ))}
                  </div>
                  {jobSeekerPrefs.locations.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 8 }}>PREFERRED LOCATIONS</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {jobSeekerPrefs.locations.map((loc, i) => (
                          <span key={i} style={{ padding: "4px 10px", border: "1px solid var(--border-bright)", fontSize: 11, color: "var(--text)" }}>{loc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {jobSeekerPrefs.jobTypes.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 8 }}>JOB TYPES</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {jobSeekerPrefs.jobTypes.map((jt, i) => (
                          <span key={i} style={{ padding: "4px 10px", border: "1px solid var(--teal-dim)", fontSize: 11, color: "var(--teal)", textTransform: "capitalize" }}>{jt.toLowerCase().replace(/_/g, " ")}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {jobSeekerPrefs.jobTitles.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 8 }}>TARGET JOB TITLES</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {jobSeekerPrefs.jobTitles.map((jt, i) => (
                          <span key={i} style={{ padding: "4px 10px", border: "1px solid var(--gold-dim)", fontSize: 11, color: "var(--gold)" }}>{jt}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {jobSeekerPrefs.dreamCompanies.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 8 }}>DREAM COMPANIES</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {jobSeekerPrefs.dreamCompanies.map((dc, i) => (
                          <span key={i} style={{ padding: "4px 10px", border: "1px solid var(--gold)", fontSize: 11, color: "var(--gold)", background: "rgba(212,168,67,0.08)" }}>{dc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Role Categories */}
            {careerIntent && Object.keys(careerIntent.roleCategories).length > 0 && (() => {
              const roleEntries = Object.entries(careerIntent.roleCategories).sort((a, b) => b[1] - a[1]);
              const totalRoles = roleEntries.reduce((s, [, ct]) => s + ct, 0);
              return (
                <div className="scroll-reveal scroll-reveal-delay-3" style={{ marginBottom: 64 }}>
                  <SectionLabel icon="roles">ROLE CATEGORIES</SectionLabel>
                  <div className="card" style={{ padding: 24 }}>
                    <RadialSegments industries={Object.fromEntries(roleEntries)} total={totalRoles} />
                  </div>
                </div>
              );
            })()}

            {/* Search Keywords */}
            {careerIntent && careerIntent.searchKeywords.length > 0 && (
              <div className="scroll-reveal" style={{ marginBottom: 64 }}>
                <SectionLabel icon="search">JOB ALERT KEYWORDS</SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                  {careerIntent.searchKeywords.map((kw, i) => (
                    <span key={i} style={{ padding: "8px 18px", border: "1px solid var(--teal-dim)", color: "var(--teal)", fontSize: 13, background: "rgba(61,214,200,0.05)", animation: `floatIn 0.5s ${i * 0.06}s cubic-bezier(0.22,1,0.36,1) forwards`, opacity: 0 }}>{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Applications */}
            {careerIntent && careerIntent.recentApplications.length > 0 && (
              <div className="scroll-reveal scroll-reveal-delay-1" style={{ marginBottom: 64 }}>
                <SectionLabel icon="career">RECENT APPLICATIONS</SectionLabel>
                <div className="card" style={{ padding: 24 }}>
                  {careerIntent.recentApplications.map((app, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: i < careerIntent.recentApplications.length - 1 ? "1px solid var(--border)" : "none", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 700, marginBottom: 2 }}>{app.title}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{app.company}</div>
                      </div>
                      {app.date && <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{app.date}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company Follows */}
            {companyFollows && (
              <div className="scroll-reveal scroll-reveal-delay-2" style={{ marginBottom: 64 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <SectionLabel icon="follow">COMPANIES YOU FOLLOW</SectionLabel>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{companyFollows.total} companies</span>
                </div>
                <div className="card" style={{ padding: 24 }}>
                  {companyFollows.overlap > 0 && (
                    <div style={{ padding: "10px 14px", background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.2)", marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: "var(--gold)", lineHeight: 1.7 }}>
                        {companyFollows.overlap} of the companies you follow also appear in your saved jobs --- a strong intent signal.
                      </div>
                    </div>
                  )}
                  {companyFollows.recent.map((co, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < companyFollows.recent.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontSize: 13, color: "var(--text)" }}>
                        {co.name}
                        {co.savedJob && <span style={{ fontSize: 9, marginLeft: 8, padding: "2px 6px", background: "rgba(212,168,67,0.15)", border: "1px solid var(--gold-dim)", color: "var(--gold)", letterSpacing: "0.1em" }}>SAVED JOB</span>}
                        {NOTABLE_COMPANIES.has(co.name) && <span style={{ fontSize: 9, marginLeft: 4, padding: "2px 6px", background: "rgba(61,214,200,0.1)", border: "1px solid var(--teal-dim)", color: "var(--teal)", letterSpacing: "0.08em" }}>NOTABLE</span>}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{co.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {hasCareerIntel && <ChapterDivider />}

      {/* ═══════════════════════════════════════════════════════════════════════
          FINALE (DARK)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="chapter chapter-dark" ref={finaleRef} style={{ paddingBottom: 120 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", boxSizing: "border-box" }}>
          <div className="scroll-reveal" style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ width: 40, height: 1, background: "var(--gold)", margin: "0 auto 32px" }} />
            <h2 className="serif" style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 400, marginBottom: 14 }}>Surprised by anything?</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.9, maxWidth: 480, margin: "0 auto 32px" }}>
              I built this because most professionals have no idea what's actually inside their LinkedIn data. If your results revealed something interesting --- connect and let me know.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="https://www.linkedin.com/in/robertbrowton" target="_blank" rel="noopener noreferrer" className="btn-primary">
                CONNECT WITH ROB ON LINKEDIN
              </a>
              <button onClick={generateShareCard} className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                </svg>
                SHARE YOUR CAREERPRINT
              </button>
            </div>
            <div style={{ marginTop: 16 }}>
              <button onClick={onReset} className="btn-ghost">RUN ANOTHER ANALYSIS</button>
            </div>
            <div style={{ marginTop: 32, fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em" }}>
              Runs entirely in your browser --- nothing stored or transmitted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
