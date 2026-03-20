import { useState, useCallback, useRef, useEffect } from "react";
import JSZip from "jszip";
import { createGlobalCSS, useScrollReveal, CountUp, SectionLabel, GRADE } from '@careerprint/shared';

// ─── Global styles ────────────────────────────────────────────────────────────
const GLOBAL_CSS = createGlobalCSS({
  accent: '#e0e0e0',
  accentDim: '#8a8a9a',
  accentGlow: 'rgba(224,224,224,0.12)',
  accentHover: '#ffffff',
  accentShadow: 'rgba(224,224,224,0.3)',
  ghostAccent: '#1d9bf0',
  hexShadow: 'rgba(224,224,224,0.3)',
  glowPulse50: 'rgba(224,224,224,0.25)',
  extraVars: `--silver: #e0e0e0; --silver-dim: #8a8a9a; --silver-glow: rgba(224,224,224,0.12); --xblue: #1d9bf0; --xblue-dim: #0d5a8a; --xblue-glow: rgba(29,155,240,0.15);`,
  extraKeyframes: `
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`,
  extraCSS: `
  .btn-demo { background: transparent; color: #1d9bf0; border: 1px solid #0d5a8a; padding: 14px 40px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; cursor: pointer; transition: all 0.2s; margin-top: 16px; }
  .btn-demo:hover { background: rgba(29,155,240,0.15); border-color: #1d9bf0; transform: translateY(-1px); }`,
});

// ─── Parse X/Twitter .js files ───────────────────────────────────────────────
function parseTwitterJS(text) {
  const cleaned = text.replace(/^window\.YTD\.\w+\.part\d+\s*=\s*/, "");
  try { return JSON.parse(cleaned); }
  catch (e) { console.warn("Failed to parse X JS file:", e.message); return []; }
}

function parseTwitterDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (!isNaN(d)) return d;
  const m = str.match(/\w+ (\w+) (\d+) (\d+):(\d+):(\d+) \+\d+ (\d+)/);
  if (m) {
    const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    return new Date(parseInt(m[6]), months[m[1]]||0, parseInt(m[2]), parseInt(m[3]), parseInt(m[4]), parseInt(m[5]));
  }
  return null;
}

function extractSource(html) {
  if (!html) return "Unknown";
  const m = html.match(/>([^<]+)</);
  if (m) {
    const s = m[1].toLowerCase();
    if (s.includes("iphone")) return "iPhone";
    if (s.includes("android")) return "Android";
    if (s.includes("web")) return "Web";
    if (s.includes("tweetdeck") || s.includes("deck")) return "TweetDeck";
    if (s.includes("ipad")) return "iPad";
    if (s.includes("mac")) return "Mac";
    return m[1];
  }
  return "Unknown";
}

// ─── Score / grade helpers ───────────────────────────────────────────────────
const GRADE_LABEL = s => ({ A: "Power User", B: "Active Presence", C: "Moderate User", D: "Light User" })[GRADE(s)];
const GRADE_COLOR = s => ({ A: "var(--xblue)", B: "var(--teal)", C: "var(--amber)", D: "var(--green)" })[GRADE(s)];
const SEGMENT_COLORS = ["#1d9bf0", "#3dd6c8", "#e86060", "#5dd68a", "#e8a840", "#a8d4e8", "#c8a8e8", "#e8c8a8", "#a8e8c8", "#d4d4d4", "#888"];

// ─── Synthetic demo data ─────────────────────────────────────────────────────
function generateSyntheticData() {
  const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const handles = ["@techguru","@designpro","@startuplife","@codingwiz","@datanerd","@uxcraft","@airesearcher","@devops_daily","@cloudengineer","@productmgr","@growthacker","@webdev101","@mobilefirst","@cryptotrader","@blockchaindev","@mlops","@frontendlove","@backendking","@fullstackdev","@opensourcefan","@rustlang_fan","@pythonista","@jsdev","@reactninja","@vuejs_dev","@svelte_fan","@nextjs_dev","@tailwindcss","@figma_design","@notionhq_fan","@linearapp","@vercel_fan","@supabase_fan","@prisma_dev","@docker_fan","@k8s_admin","@awscloud","@gcpdev","@azure_dev","@netlify_fan","@github_fan","@vscode_fan","@neovim_user","@tmux_user","@linux_admin","@macos_fan","@ios_dev","@android_dev","@flutter_dev","@swiftui_fan"];

  // Posts (~3200)
  const postTexts = [
    "Just shipped a new feature. Feels good.", "Thread on what I learned building at scale this year...",
    "Hot take: most startups don't need microservices.", "The best code is the code you don't write.",
    "Anyone else think AI will change everything about how we code?", "Just hit 1000 followers. Thank you all!",
    "Debugging at 2am hits different.", "Open source is the way forward.",
    "Learning Rust this weekend. Wish me luck.", "Great conversations at the meetup tonight.",
    "My take on the future of web development.", "Simplicity is the ultimate sophistication.",
    "New blog post is live! Link in bio.", "The tech industry needs more diversity. Full stop.",
    "Just deployed to production with zero downtime.", "Reading list for the weekend: 5 papers on LLMs.",
    "Coffee, code, repeat.", "Excited to announce I'm joining an amazing team!",
    "Unpopular opinion: tabs > spaces.", "Just finished a 30-day coding challenge. Here's what I learned.",
  ];
  const hashtags = ["#tech","#AI","#startup","#design","#coding","#webdev","#javascript","#python","#rust","#machinelearning","#devops","#cloud","#react","#typescript","#opensource","#buildinpublic","#indiehacker","#saas","#programming","#data"];

  const posts = [];
  for (let i = 0; i < 3200; i++) {
    const year = rng(2019, 2025);
    const month = rng(1, 12);
    const day = rng(1, 28);
    const hour = rng(0, 23);
    const text = pick(postTexts) + (Math.random() > 0.6 ? " " + pick(hashtags) + (Math.random() > 0.5 ? " " + pick(hashtags) : "") : "");
    const isRepost = Math.random() > 0.75;
    const sources = ['<a href="https://mobile.twitter.com" rel="nofollow">Twitter for iPhone</a>','<a href="https://twitter.com" rel="nofollow">Twitter Web App</a>','<a href="https://play.google.com" rel="nofollow">Twitter for Android</a>','<a href="https://about.twitter.com/products/tweetdeck" rel="nofollow">TweetDeck</a>'];
    posts.push({
      tweet: {
        id: String(1000000000 + i),
        full_text: isRepost ? "RT @" + pick(handles).slice(1) + ": " + pick(postTexts) : text,
        created_at: `${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][rng(0,6)]} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][month-1]} ${String(day).padStart(2,"0")} ${String(hour).padStart(2,"0")}:${String(rng(0,59)).padStart(2,"0")}:${String(rng(0,59)).padStart(2,"0")} +0000 ${year}`,
        source: pick(sources),
        retweet_count: String(rng(0, 50)),
        favorite_count: String(rng(0, 200)),
        entities: { hashtags: text.match(/#\w+/g)?.map(h => ({ text: h.slice(1) })) || [] },
      }
    });
  }

  // Following (~850)
  const following = Array.from({ length: 850 }, (_, i) => ({
    following: { accountId: String(100000 + i), userLink: `https://x.com/${pick(handles).slice(1)}${i}` }
  }));

  // Followers (~1400)
  const followers = Array.from({ length: 1400 }, (_, i) => ({
    follower: { accountId: String(200000 + i), userLink: `https://x.com/follower_${i}` }
  }));

  // Likes (~12000)
  const likes = Array.from({ length: 12000 }, (_, i) => ({
    like: { tweetId: String(3000000 + i), fullText: pick(postTexts), expandedUrl: `https://x.com/user/status/${3000000 + i}` }
  }));

  // DM conversations (~200 conversations)
  const dmConversations = [];
  for (let c = 0; c < 200; c++) {
    const msgCount = rng(2, 40);
    const messages = [];
    const dmTexts = ["Hey!", "How's it going?", "Did you see that thread?", "Great post today!", "Let's chat sometime", "Thanks for the follow!", "Check out this project", "Interesting point!", "Agreed!", "Let me know what you think"];
    for (let m = 0; m < msgCount; m++) {
      messages.push({
        messageCreate: {
          senderId: Math.random() > 0.5 ? "self" : String(100000 + c),
          text: pick(dmTexts),
          createdAt: String(new Date(rng(2020, 2025), rng(0, 11), rng(1, 28)).getTime()),
        }
      });
    }
    dmConversations.push({ dmConversation: { conversationId: `conv_${c}`, messages } });
  }

  // Ad interests (~45)
  const adInterests = ["Technology","Startups","Software Development","Cloud Computing","Artificial Intelligence","Machine Learning","Data Science","Cybersecurity","Mobile Apps","Web Design","UX Design","Product Management","Venture Capital","Cryptocurrency","Blockchain","Digital Marketing","Social Media","E-commerce","SaaS","Remote Work","Productivity","Podcasts","Newsletter Writing","Content Creation","Video Production","Photography","Travel","Fitness","Coffee","Electric Vehicles","Sustainability","Space Exploration","Gaming","Esports","Music","Film","Books","Cooking","Investing","Real Estate","Personal Finance","Mental Health","Education","Open Source","Developer Tools"];

  // Personalization data
  const personalization = {
    demographics: {
      languages: ["English","Spanish"],
      genderInfo: { gender: "male" },
    },
    interests: {
      interests: adInterests.map(name => ({ name, isDisabled: false })),
    },
    inferredAgeInfo: { age: ["25-34"] },
    locationHistory: ["San Francisco, CA","New York, NY","Austin, TX","London, UK"],
  };

  // Account info
  const account = {
    account: {
      createdAt: "2019-04-15T10:23:45.000Z",
      accountDisplayName: "Jordan Chen",
      username: "jordanchen_dev",
      accountId: "1234567890",
    }
  };

  return { posts, following, followers, likes, dmConversations, adInterests, personalization, account };
}

// ─── Analysis functions ──────────────────────────────────────────────────────
function analysePosts(posts) {
  const yearMap = {};
  const monthMap = {};
  const hourMap = {};
  const dayMap = {};
  const sourceMap = {};
  const hashtagMap = {};
  let reposts = 0;
  let originals = 0;
  let totalRepostCount = 0;
  let totalLikeCount = 0;

  posts.forEach(p => {
    const tw = p.tweet || p;
    const d = parseTwitterDate(tw.created_at);
    const text = tw.full_text || "";
    const isRepost = text.startsWith("RT @");

    if (isRepost) reposts++; else originals++;
    totalRepostCount += parseInt(tw.retweet_count || "0");
    totalLikeCount += parseInt(tw.favorite_count || "0");

    if (d) {
      const yr = d.getFullYear();
      yearMap[yr] = (yearMap[yr] || 0) + 1;
      const mk = `${yr}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[mk] = (monthMap[mk] || 0) + 1;
      hourMap[d.getHours()] = (hourMap[d.getHours()] || 0) + 1;
      dayMap[d.getDay()] = (dayMap[d.getDay()] || 0) + 1;
    }

    const src = extractSource(tw.source);
    sourceMap[src] = (sourceMap[src] || 0) + 1;

    (tw.entities?.hashtags || []).forEach(h => {
      const tag = (h.text || "").toLowerCase();
      if (tag) hashtagMap[tag] = (hashtagMap[tag] || 0) + 1;
    });
  });

  const yearHistory = Object.entries(yearMap).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  const topHashtags = Object.entries(hashtagMap).sort((a, b) => b[1] - a[1]).slice(0, 20);
  const sources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);
  const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const peakDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];

  return {
    total: posts.length, originals, reposts, yearHistory, monthMap,
    topHashtags, sources, hourMap, dayMap, peakHour, peakDay,
    totalRepostCount, totalLikeCount, dayNames,
    avgLikesPerPost: originals > 0 ? Math.round(totalLikeCount / originals) : 0,
    avgRepostsPerPost: originals > 0 ? Math.round(totalRepostCount / originals) : 0,
  };
}

function analyseNetwork(following, followers) {
  const ratio = followers.length > 0 && following.length > 0
    ? (followers.length / following.length).toFixed(2)
    : "N/A";
  return {
    followingCount: following.length,
    followersCount: followers.length,
    ratio,
  };
}

function analyseDMs(dmConversations) {
  let totalMessages = 0;
  const convoCounts = [];
  dmConversations.forEach(c => {
    const convo = c.dmConversation || c;
    const msgs = convo.messages || [];
    totalMessages += msgs.length;
    convoCounts.push({ id: convo.conversationId, count: msgs.length });
  });
  convoCounts.sort((a, b) => b.count - a.count);
  return { totalMessages, totalConversations: dmConversations.length, topConversations: convoCounts.slice(0, 10) };
}

function computeScore(data) {
  let score = 30;
  const { posts, following, followers, likes, dmConversations, adInterests } = data;
  if (posts.length > 2000) score += 15; else if (posts.length > 500) score += 10; else if (posts.length > 100) score += 5;
  if (followers.length > 1000) score += 10; else if (followers.length > 200) score += 5;
  if (likes.length > 5000) score += 10; else if (likes.length > 1000) score += 5;
  if (dmConversations.length > 100) score += 10; else if (dmConversations.length > 30) score += 5;
  if (adInterests.length > 30) score += 8; else if (adInterests.length > 15) score += 4;
  if (following.length > 500) score += 7; else if (following.length > 100) score += 3;
  return Math.min(score, 100);
}

// ─── HexScore SVG ────────────────────────────────────────────────────────────
function HexScore({ score, size = 180 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");

  return (
    <svg width={size} height={size} className="hex-score" viewBox={`0 0 ${size} ${size}`}>
      <polygon points={points} fill="none" stroke="var(--silver)" strokeWidth="1.5" opacity="0.3" />
      <polygon points={points} fill="var(--surface)" fillOpacity="0.8" stroke="var(--silver)" strokeWidth="2" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontFamily="'Playfair Display', serif" fontSize={size * 0.28} fill="var(--silver)" fontWeight="700">
        {score}
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontFamily="'Space Mono', monospace" fontSize={9} fill="var(--muted)" letterSpacing="0.15em">
        X SCORE
      </text>
    </svg>
  );
}

// ─── RadialSegments SVG ──────────────────────────────────────────────────────
function RadialSegments({ data, size = 260 }) {
  const cx = size / 2, cy = size / 2, radius = size * 0.38;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return <path key={i} d={path} fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]} opacity={0.85} stroke="var(--bg)" strokeWidth="1.5" />;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments}
      <circle cx={cx} cy={cy} r={radius * 0.4} fill="var(--bg)" />
    </svg>
  );
}

// ─── ZIP processing ──────────────────────────────────────────────────────────
async function processZip(file) {
  const zip = await JSZip.loadAsync(file);
  const findFile = (pattern) => {
    const regex = new RegExp(pattern, "i");
    for (const path of Object.keys(zip.files)) {
      if (regex.test(path) && !zip.files[path].dir) return zip.files[path];
    }
    return null;
  };

  const readJS = async (pattern) => {
    const f = findFile(pattern);
    if (!f) return [];
    const text = await f.async("text");
    return parseTwitterJS(text);
  };

  const posts = await readJS("tweets?\\.js$");
  const following = await readJS("following\\.js$");
  const followers = await readJS("follower\\.js$");
  const likes = await readJS("like\\.js$");

  // DMs
  let dmConversations = [];
  const dmFile = findFile("direct-messages?\\.js$");
  if (dmFile) {
    const raw = await dmFile.async("text");
    dmConversations = parseTwitterJS(raw);
  }

  // Personalization
  let personalization = {};
  const persFile = findFile("personalization\\.js$");
  if (persFile) {
    const raw = await persFile.async("text");
    const parsed = parseTwitterJS(raw);
    personalization = (parsed[0]?.p13nData) || parsed[0] || {};
  }

  // Ad impressions
  let adImpressions = [];
  const adFile = findFile("ad.impressions?\\.js$");
  if (adFile) {
    const raw = await adFile.async("text");
    adImpressions = parseTwitterJS(raw);
  }

  // Account
  let account = {};
  const acctFile = findFile("account\\.js$");
  if (acctFile) {
    const raw = await acctFile.async("text");
    const parsed = parseTwitterJS(raw);
    account = parsed[0] || {};
  }

  // Extract ad interests from personalization
  const adInterests = personalization?.interests?.interests?.map(i => i.name) ||
    personalization?.interests?.map(i => i.name) || [];

  return { posts, following, followers, likes, dmConversations, adInterests, personalization, account };
}

// ─── Upload Screen ───────────────────────────────────────────────────────────
function UploadScreen({ onFile, onDemo }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback(e => {
    e.preventDefault(); setOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  const handleChange = useCallback(e => {
    const f = e.target.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{GLOBAL_CSS}</style>
      <div className="animate-fade-up" style={{ marginBottom: 48, textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--muted)", marginBottom: 12 }}>INTELLIGENCE REPORT</div>
        <h1 className="serif" style={{ fontSize: 42, fontWeight: 700, color: "var(--silver)", lineHeight: 1.1 }}>
          X <span style={{ color: "var(--xblue)" }}>Intelligence</span>
        </h1>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12, maxWidth: 400 }}>
          Upload your X data export to reveal your digital presence, engagement patterns, and what the platform knows about you.
        </p>
      </div>

      <div
        className={`drop-zone animate-fade-up-2 ${over ? "over" : ""}`}
        style={{ padding: "60px 48px", maxWidth: 480, width: "100%", textAlign: "center" }}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="upload-icon" style={{ fontSize: 32, marginBottom: 16 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        </div>
        <div style={{ fontSize: 12, marginBottom: 8 }}>Drop your X data export here</div>
        <div style={{ fontSize: 10, color: "var(--muted)" }}>ZIP file from X / Twitter data export</div>
        <input ref={inputRef} type="file" accept=".zip" style={{ display: "none" }} onChange={handleChange} />
      </div>

      <button className="btn-demo animate-fade-up-3" onClick={onDemo}>TRY DEMO</button>

      <div className="animate-fade-up-4" style={{ fontSize: 10, color: "var(--muted)", marginTop: 32, textAlign: "center", maxWidth: 340 }}>
        Runs entirely in your browser — nothing stored or transmitted.
      </div>
    </div>
  );
}

// ─── Analysing Screen ────────────────────────────────────────────────────────
function AnalysingScreen() {
  const [step, setStep] = useState(0);
  const steps = ["Parsing X data archive...", "Analysing posts and engagement...", "Mapping your network...", "Decoding platform knowledge...", "Building your report..."];
  useEffect(() => {
    const timer = setInterval(() => setStep(s => s < steps.length - 1 ? s + 1 : s), 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ width: 48, height: 48, border: "2px solid var(--border-bright)", borderTopColor: "var(--silver)", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 32 }} />
      <div className="serif" style={{ fontSize: 24, color: "var(--silver)", marginBottom: 24 }}>Analysing...</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ fontSize: 11, color: i <= step ? "var(--silver)" : "var(--muted)", opacity: i <= step ? 1 : 0.3, transition: "all 0.3s", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: i < step ? "var(--green)" : i === step ? "var(--xblue)" : "var(--muted)", fontSize: 12 }}>
              {i < step ? "\u2713" : i === step ? "\u25CB" : "\u00B7"}
            </span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Results Screen ──────────────────────────────────────────────────────────
function ResultsScreen({ data }) {
  const revealRef = useScrollReveal();
  const score = computeScore(data);
  const postStats = analysePosts(data.posts);
  const network = analyseNetwork(data.following, data.followers);
  const dmStats = analyseDMs(data.dmConversations);
  const accountCreated = data.account?.account?.createdAt ? new Date(data.account.account.createdAt) : null;
  const accountAge = accountCreated ? Math.floor((Date.now() - accountCreated.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
  const displayName = data.account?.account?.accountDisplayName || "Your";
  const username = data.account?.account?.username || "";

  const insights = [];
  if (postStats.total > 1000) insights.push(`You've posted ${postStats.total.toLocaleString()} times — you're a prolific voice on the platform.`);
  else if (postStats.total > 0) insights.push(`With ${postStats.total.toLocaleString()} posts, you have a measured approach to sharing.`);
  if (postStats.reposts > postStats.originals) insights.push("You repost more than you compose — you're a curator of ideas.");
  else if (postStats.originals > 0) insights.push(`${Math.round((postStats.originals / postStats.total) * 100)}% of your posts are original content — you're a creator, not just a consumer.`);
  if (network.ratio !== "N/A" && parseFloat(network.ratio) > 1.5) insights.push(`Your follower-to-following ratio of ${network.ratio} signals strong influence.`);
  if (postStats.peakHour) {
    const h = parseInt(postStats.peakHour[0]);
    const label = h === 0 ? "12am" : h < 12 ? h + "am" : h === 12 ? "12pm" : (h - 12) + "pm";
    insights.push(`Your peak posting hour is ${label} — that's when your thoughts flow.`);
  }
  if (data.adInterests.length > 30) insights.push(`X has tagged you with ${data.adInterests.length} ad interest categories.`);
  if (accountAge && accountAge > 3) insights.push(`${accountAge} years on the platform — you're a veteran.`);

  const formatHour = h => { const hr = parseInt(h); if (hr === 0) return "12a"; if (hr < 12) return hr + "a"; if (hr === 12) return "12p"; return (hr - 12) + "p"; };

  return (
    <div ref={revealRef}>
      <style>{GLOBAL_CSS}</style>

      {/* ═══ Chapter 1: Your X Footprint (dark) ═══ */}
      <div className="chapter chapter-dark">
        <div className="chapter-opener">
          <div className="scroll-reveal" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--muted)", marginBottom: 8 }}>CHAPTER ONE</div>
          <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{ fontSize: 36, color: "var(--silver)", marginBottom: 16 }}>
            Your X Footprint
          </h2>
          <div className="chapter-divider scroll-reveal scroll-reveal-delay-2" />
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Score hex */}
          <div className="scroll-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <HexScore score={score} />
            <div style={{ fontSize: 13, color: GRADE_COLOR(score), marginTop: 16, letterSpacing: "0.1em" }}>{GRADE_LABEL(score)}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
              {displayName}{username ? ` (@${username})` : ""}
            </div>
          </div>

          {/* 4 stat cards */}
          <div className="scroll-reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 48 }}>
            {[
              { label: "POSTS", value: postStats.total, color: "var(--xblue)" },
              { label: "FOLLOWING", value: network.followingCount, color: "var(--teal)" },
              { label: "FOLLOWERS", value: network.followersCount, color: "var(--green)" },
              { label: "LIKES", value: data.likes.length, color: "var(--amber)" },
            ].map((c, i) => (
              <div key={i} className={`card scroll-reveal scroll-reveal-delay-${i + 1}`} style={{ padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 8 }}>{c.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}><CountUp value={c.value} /></div>
              </div>
            ))}
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--xblue)">KEY INSIGHTS</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {insights.slice(0, 5).map((ins, i) => (
                  <div key={i} className={`card scroll-reveal scroll-reveal-delay-${i + 1}`} style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--xblue)", fontSize: 14, marginTop: 1 }}>{"\u25C6"}</span>
                    <span style={{ fontSize: 12, lineHeight: 1.6 }}>{ins}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source breakdown radial */}
          {postStats.sources.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--xblue)">POSTING SOURCES</SectionLabel>
              <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                <RadialSegments data={postStats.sources.slice(0, 8).map(([name, value]) => ({ label: name, value }))} size={200} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {postStats.sources.slice(0, 6).map(([name, count], i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                      <div style={{ width: 10, height: 10, background: SEGMENT_COLORS[i], borderRadius: 1 }} />
                      <span style={{ color: "var(--muted)" }}>{name}</span>
                      <span style={{ marginLeft: "auto", color: "var(--silver)" }}>{Math.round((count / postStats.total) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Chapter 2: Your Voice (light) ═══ */}
      <div className="chapter chapter-light">
        <div className="chapter-opener">
          <div className="scroll-reveal" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--cream-muted)", marginBottom: 8 }}>CHAPTER TWO</div>
          <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{ fontSize: 36, color: "var(--cream-text)", marginBottom: 16 }}>
            Your Voice
          </h2>
          <div className="chapter-divider scroll-reveal scroll-reveal-delay-2" style={{ background: "var(--cream-border)" }} />
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Post timeline */}
          {postStats.yearHistory.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--cream-muted)">POST ACTIVITY BY YEAR</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160 }}>
                  {postStats.yearHistory.map(([year, count], i) => {
                    const max = Math.max(...postStats.yearHistory.map(y => y[1]));
                    const h = max > 0 ? (count / max) * 140 : 0;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ fontSize: 9, color: "var(--cream-muted)" }}>{count}</div>
                        <div style={{ width: "100%", maxWidth: 32, height: h, background: "var(--xblue)", opacity: 0.8, borderRadius: "2px 2px 0 0", animation: `barGrow 0.6s ${i * 0.05}s ease forwards`, transformOrigin: "bottom" }} />
                        <div style={{ fontSize: 9, color: "var(--cream-muted)" }}>{year.toString().slice(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Original vs Repost */}
          <div className="scroll-reveal" style={{ marginBottom: 48 }}>
            <SectionLabel color="var(--cream-muted)">CONTENT MIX</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 8 }}>ORIGINAL</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--xblue)" }}><CountUp value={postStats.originals} /></div>
                <div style={{ fontSize: 10, color: "var(--cream-muted)", marginTop: 4 }}>
                  {postStats.total > 0 ? Math.round((postStats.originals / postStats.total) * 100) : 0}%
                </div>
              </div>
              <div className="card" style={{ padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 8 }}>REPOSTS</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--teal)" }}><CountUp value={postStats.reposts} /></div>
                <div style={{ fontSize: 10, color: "var(--cream-muted)", marginTop: 4 }}>
                  {postStats.total > 0 ? Math.round((postStats.reposts / postStats.total) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Top hashtags */}
          {postStats.topHashtags.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--cream-muted)">TOP HASHTAGS</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {postStats.topHashtags.map(([tag, count], i) => {
                    const max = postStats.topHashtags[0][1];
                    const opacity = 0.4 + (count / max) * 0.6;
                    const size = 10 + Math.round((count / max) * 6);
                    return (
                      <span key={i} style={{
                        fontSize: size, padding: "4px 10px", background: "var(--xblue-glow)",
                        color: "var(--xblue)", borderRadius: 2, opacity, border: "1px solid var(--xblue-dim)",
                        animation: `floatIn 0.4s ${i * 0.03}s ease forwards`,
                      }}>
                        #{tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Posting heatmap by hour */}
          <div className="scroll-reveal" style={{ marginBottom: 48 }}>
            <SectionLabel color="var(--cream-muted)">POSTING HOURS</SectionLabel>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4 }}>
                {Array.from({ length: 24 }, (_, h) => {
                  const count = postStats.hourMap[h] || 0;
                  const maxH = Math.max(...Object.values(postStats.hourMap || { 0: 1 }));
                  const intensity = maxH > 0 ? count / maxH : 0;
                  return (
                    <div key={h} style={{ textAlign: "center" }}>
                      <div style={{
                        width: "100%", paddingBottom: "100%", borderRadius: 2,
                        background: intensity > 0 ? `rgba(29,155,240,${0.15 + intensity * 0.7})` : "var(--cream-border)",
                      }} />
                      <div style={{ fontSize: 8, color: "var(--cream-muted)", marginTop: 2 }}>{formatHour(h)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Chapter 3: Your Network (dark) ═══ */}
      <div className="chapter chapter-dark">
        <div className="chapter-opener">
          <div className="scroll-reveal" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--muted)", marginBottom: 8 }}>CHAPTER THREE</div>
          <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{ fontSize: 36, color: "var(--silver)", marginBottom: 16 }}>
            Your Network
          </h2>
          <div className="chapter-divider scroll-reveal scroll-reveal-delay-2" />
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Network stats */}
          <div className="scroll-reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 48 }}>
            <div className="card" style={{ padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 8 }}>FOLLOWING</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--teal)" }}><CountUp value={network.followingCount} /></div>
            </div>
            <div className="card" style={{ padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 8 }}>FOLLOWERS</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--green)" }}><CountUp value={network.followersCount} /></div>
            </div>
            <div className="card" style={{ padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 8 }}>RATIO</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--xblue)" }}>{network.ratio}</div>
            </div>
          </div>

          {/* DM stats */}
          {dmStats.totalMessages > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--xblue)">DIRECT MESSAGES</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ padding: 24, textAlign: "center" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 8 }}>TOTAL MESSAGES</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "var(--silver)" }}><CountUp value={dmStats.totalMessages} /></div>
                </div>
                <div className="card" style={{ padding: 24, textAlign: "center" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 8 }}>CONVERSATIONS</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "var(--silver)" }}><CountUp value={dmStats.totalConversations} /></div>
                </div>
              </div>

              {/* Top conversations bar chart */}
              {dmStats.topConversations.length > 0 && (
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 16 }}>MOST ACTIVE CONVERSATIONS</div>
                  {dmStats.topConversations.slice(0, 8).map((c, i) => {
                    const max = dmStats.topConversations[0].count;
                    const w = max > 0 ? (c.count / max) * 100 : 0;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "var(--muted)", minWidth: 60, textAlign: "right" }}>Conv {i + 1}</div>
                        <div style={{ flex: 1, height: 16, background: "var(--faint)", borderRadius: 1, overflow: "hidden" }}>
                          <div style={{ width: `${w}%`, height: "100%", background: `linear-gradient(90deg, var(--xblue), var(--teal))`, animation: `barGrowH 0.6s ${i * 0.05}s ease forwards`, transformOrigin: "left" }} />
                        </div>
                        <div style={{ fontSize: 10, color: "var(--silver)", minWidth: 30 }}>{c.count}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Engagement stats */}
          <div className="scroll-reveal" style={{ marginBottom: 48 }}>
            <SectionLabel color="var(--xblue)">ENGAGEMENT RECEIVED</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 8 }}>AVG LIKES / POST</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--amber)" }}><CountUp value={postStats.avgLikesPerPost} /></div>
              </div>
              <div className="card" style={{ padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 8 }}>AVG REPOSTS / POST</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--teal)" }}><CountUp value={postStats.avgRepostsPerPost} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Chapter 4: What X Knows (light) ═══ */}
      <div className="chapter chapter-light">
        <div className="chapter-opener">
          <div className="scroll-reveal" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--cream-muted)", marginBottom: 8 }}>CHAPTER FOUR</div>
          <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{ fontSize: 36, color: "var(--cream-text)", marginBottom: 16 }}>
            What X Knows
          </h2>
          <div className="chapter-divider scroll-reveal scroll-reveal-delay-2" style={{ background: "var(--cream-border)" }} />
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Ad interests */}
          {data.adInterests.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--cream-muted)">AD INTEREST CATEGORIES ({data.adInterests.length})</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {data.adInterests.map((interest, i) => (
                    <span key={i} style={{
                      fontSize: 11, padding: "6px 12px", background: "rgba(29,155,240,0.08)",
                      color: "#1d6fb0", borderRadius: 2, border: "1px solid rgba(29,155,240,0.2)",
                      animation: `floatIn 0.3s ${i * 0.02}s ease forwards`, opacity: 0,
                    }}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Personalization demographics */}
          {data.personalization && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--cream-muted)">INFERRED DEMOGRAPHICS</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
                {data.personalization.demographics?.languages && (
                  <div className="card" style={{ padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 8 }}>LANGUAGES</div>
                    <div style={{ fontSize: 14, color: "var(--cream-text)" }}>
                      {(Array.isArray(data.personalization.demographics.languages) ? data.personalization.demographics.languages : []).join(", ") || "—"}
                    </div>
                  </div>
                )}
                {data.personalization.inferredAgeInfo?.age && (
                  <div className="card" style={{ padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 8 }}>AGE RANGE</div>
                    <div style={{ fontSize: 14, color: "var(--cream-text)" }}>
                      {Array.isArray(data.personalization.inferredAgeInfo.age) ? data.personalization.inferredAgeInfo.age.join(", ") : data.personalization.inferredAgeInfo.age}
                    </div>
                  </div>
                )}
                {data.personalization.demographics?.genderInfo?.gender && (
                  <div className="card" style={{ padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 8 }}>GENDER</div>
                    <div style={{ fontSize: 14, color: "var(--cream-text)", textTransform: "capitalize" }}>
                      {data.personalization.demographics.genderInfo.gender}
                    </div>
                  </div>
                )}
                {data.personalization.locationHistory && (
                  <div className="card" style={{ padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 8 }}>LOCATIONS</div>
                    <div style={{ fontSize: 11, color: "var(--cream-text)", lineHeight: 1.6 }}>
                      {(Array.isArray(data.personalization.locationHistory) ? data.personalization.locationHistory.slice(0, 3) : []).join(", ") || "—"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity by day of week */}
          <div className="scroll-reveal" style={{ marginBottom: 48 }}>
            <SectionLabel color="var(--cream-muted)">POSTING PATTERN BY DAY</SectionLabel>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                {postStats.dayNames.map((name, d) => {
                  const count = postStats.dayMap[d] || 0;
                  const max = Math.max(...Object.values(postStats.dayMap || { 0: 1 }));
                  const h = max > 0 ? (count / max) * 120 : 0;
                  return (
                    <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 9, color: "var(--cream-muted)" }}>{count}</div>
                      <div style={{ width: "100%", maxWidth: 40, height: h, background: d === parseInt(postStats.peakDay?.[0] || -1) ? "var(--xblue)" : "rgba(29,155,240,0.4)", borderRadius: "2px 2px 0 0", animation: `barGrow 0.5s ${d * 0.05}s ease forwards`, transformOrigin: "bottom" }} />
                      <div style={{ fontSize: 10, color: "var(--cream-muted)" }}>{name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Chapter 5: Your Digital Presence (dark) ═══ */}
      <div className="chapter chapter-dark">
        <div className="chapter-opener">
          <div className="scroll-reveal" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--muted)", marginBottom: 8 }}>CHAPTER FIVE</div>
          <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{ fontSize: 36, color: "var(--silver)", marginBottom: 16 }}>
            Your Digital Presence
          </h2>
          <div className="chapter-divider scroll-reveal scroll-reveal-delay-2" />
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Account age */}
          {accountAge !== null && (
            <div className="scroll-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 8 }}>ACCOUNT AGE</div>
              <div style={{ fontSize: 48, fontWeight: 700, color: "var(--xblue)" }}><CountUp value={accountAge} /></div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>years on X</div>
              {accountCreated && (
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 8 }}>
                  Joined {accountCreated.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              )}
            </div>
          )}

          {/* Score breakdown */}
          <div className="scroll-reveal" style={{ marginBottom: 48 }}>
            <SectionLabel color="var(--xblue)">SCORE BREAKDOWN</SectionLabel>
            <div className="card" style={{ padding: 24 }}>
              {[
                { label: "Post Volume", value: data.posts.length > 2000 ? 15 : data.posts.length > 500 ? 10 : data.posts.length > 100 ? 5 : 0, max: 15, color: "var(--xblue)" },
                { label: "Follower Reach", value: data.followers.length > 1000 ? 10 : data.followers.length > 200 ? 5 : 0, max: 10, color: "var(--green)" },
                { label: "Engagement (Likes)", value: data.likes.length > 5000 ? 10 : data.likes.length > 1000 ? 5 : 0, max: 10, color: "var(--amber)" },
                { label: "DM Activity", value: data.dmConversations.length > 100 ? 10 : data.dmConversations.length > 30 ? 5 : 0, max: 10, color: "var(--teal)" },
                { label: "Ad Profile Depth", value: data.adInterests.length > 30 ? 8 : data.adInterests.length > 15 ? 4 : 0, max: 8, color: "var(--rose)" },
                { label: "Network Size", value: data.following.length > 500 ? 7 : data.following.length > 100 ? 3 : 0, max: 7, color: "var(--silver)" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", minWidth: 120, textAlign: "right" }}>{item.label}</div>
                  <div style={{ flex: 1, height: 12, background: "var(--faint)", borderRadius: 1, overflow: "hidden" }}>
                    <div style={{ width: `${(item.value / item.max) * 100}%`, height: "100%", background: item.color, animation: `barGrowH 0.6s ${i * 0.08}s ease forwards`, transformOrigin: "left" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--silver)", minWidth: 40 }}>{item.value}/{item.max}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Final summary */}
          <div className="scroll-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="card" style={{ padding: 40, background: "linear-gradient(135deg, var(--surface), rgba(29,155,240,0.05))" }}>
              <HexScore score={score} size={140} />
              <div className="serif" style={{ fontSize: 20, color: "var(--silver)", marginTop: 16 }}>
                {displayName}'s X Intelligence Score
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, maxWidth: 400, margin: "8px auto 0" }}>
                Based on {postStats.total.toLocaleString()} posts, {network.followersCount.toLocaleString()} followers,
                {data.likes.length > 0 ? ` ${data.likes.length.toLocaleString()} likes,` : ""} and {data.adInterests.length} tracked interests.
              </div>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="scroll-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>
              Runs entirely in your browser — nothing stored or transmitted.
            </div>
          </div>

          {/* LinkedIn CTA */}
          <div className="scroll-reveal" style={{ textAlign: "center", padding: "40px 0 60px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--muted)", marginBottom: 16 }}>BUILT BY</div>
            <a href="https://www.linkedin.com/in/robertbrowton" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: "none" }}>
              CONNECT ON LINKEDIN
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("upload"); // upload | analysing | results
  const [data, setData] = useState(null);

  const handleFile = useCallback(async (file) => {
    setScreen("analysing");
    try {
      const result = await processZip(file);
      setData(result);
      setTimeout(() => setScreen("results"), 2200);
    } catch (err) {
      console.error("Error processing file:", err);
      alert("Could not process file. Please upload a valid X data export ZIP.");
      setScreen("upload");
    }
  }, []);

  const handleDemo = useCallback(() => {
    setScreen("analysing");
    const synthetic = generateSyntheticData();
    setData(synthetic);
    setTimeout(() => setScreen("results"), 2200);
  }, []);

  const handleReset = useCallback(() => {
    setScreen("upload");
    setData(null);
  }, []);

  if (screen === "upload") return <UploadScreen onFile={handleFile} onDemo={handleDemo} />;
  if (screen === "analysing") return <AnalysingScreen />;
  if (screen === "results" && data) return <ResultsScreen data={data} />;
  return null;
}
