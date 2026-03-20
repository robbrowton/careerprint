import { useState, useCallback, useRef, useEffect } from "react";
import JSZip from "jszip";
import { createGlobalCSS, useScrollReveal, CountUp, SectionLabel, GRADE } from '@careerprint/shared';

// ─── Global styles ────────────────────────────────────────────────────────────
const GLOBAL_CSS = createGlobalCSS({
  accent: '#4a90d9',
  accentDim: '#2a5a8a',
  accentGlow: 'rgba(74,144,217,0.15)',
  accentHover: '#5da0e9',
  accentShadow: 'rgba(74,144,217,0.3)',
  btnTextColor: '#fff',
  hexShadow: 'rgba(74,144,217,0.4)',
  glowPulse50: 'rgba(74,144,217,0.3)',
  extraVars: `--blue: #4a90d9; --blue-dim: #2a5a8a; --blue-glow: rgba(74,144,217,0.15);`,
  extraKeyframes: `
  @keyframes ambientGlow { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.05); } }
  @keyframes pulseNode { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
  @keyframes shimmerSkill { 0% { filter: brightness(1); } 50% { filter: brightness(1.6) drop-shadow(0 0 12px rgba(74,144,217,0.6)); } 100% { filter: brightness(1); } }`,
});

// ─── Score helpers ────────────────────────────────────────────────────────────
const GRADE_LABEL = s => ({ A: "Deep Digital Shadow", B: "Significant Footprint", C: "Moderate Presence", D: "Light Footprint" })[GRADE(s)];
const GRADE_COLOR = s => ({ A: "var(--rose)", B: "var(--amber)", C: "var(--blue)", D: "var(--green)" })[GRADE(s)];

const SEGMENT_COLORS = ["#4a90d9", "#3dd6c8", "#e86060", "#5dd68a", "#a8d4e8", "#e8a840", "#c8a8e8", "#e8c8a8", "#a8e8c8", "#d4d4d4", "#888"];


// ─── Synthetic data generator ────────────────────────────────────────────────
function generateSyntheticData() {
  const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const ts = (year, month, day) => Math.floor(new Date(year, month - 1, day || rng(1, 28)).getTime() / 1000);
  const tsMs = (year, month, day) => new Date(year, month - 1, day || rng(1, 28)).getTime();

  const firstNames = ["Emma","Liam","Olivia","Noah","Ava","Ethan","Sophia","Mason","Isabella","William","Mia","James","Charlotte","Benjamin","Amelia","Lucas","Harper","Henry","Evelyn","Alexander","Abigail","Daniel","Emily","Matthew","Elizabeth","Jackson","Sofia","Sebastian","Victoria","Aiden","Grace","Owen","Chloe","Samuel","Penelope","Ryan","Layla","Nathan","Riley","Dylan","Zoey","Caleb","Nora","Luke","Lily","Andrew","Eleanor","Jack","Hannah","Wyatt","Addison","Leo","Aubrey","David","Stella","Joseph","Natalie","Gabriel","Zoe","Julian","Leah","Jayden","Hazel","Carter","Violet","Lincoln","Aurora","Isaiah","Savannah","Anthony","Audrey","Christian","Brooklyn","Joshua","Bella","Jaxon","Claire","Maverick","Skylar","Easton","Lucy","Miles","Paisley","Eli","Everly","Theodore","Anna","Grayson","Caroline","Thomas","Nova","Adrian","Genesis","Colton","Emilia"];
  const lastNames = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Turner","Phillips","Evans","Collins","Edwards","Stewart","Morris","Murphy","Cook","Rogers","Morgan","Peterson","Cooper","Reed","Bailey","Bell","Howard","Ward","Sullivan","Foster","Sanders","Bennett","Wood","Ross","Kelly","Price","Watson","Brooks","Gray","James","Myers","Long","Hughes","Fisher","Kim","Barnes","Stone","Cole","Hunt","Fox","Warren","Shaw","Hart","Marshall","Silva","Patel","Chen","Burns","Olson","Webb"];
  const randName = () => pick(firstNames) + " " + pick(lastNames);

  // Friends (~420, spanning 2010-2025)
  const friends = [];
  for (let i = 0; i < 420; i++) {
    const year = rng(2010, 2025);
    const month = rng(1, 12);
    friends.push({ name: randName(), timestamp: ts(year, month) });
  }

  // Messages (~2000 across ~50 conversations)
  const conversations = [];
  const convoNames = Array.from({ length: 50 }, () => randName());
  for (let c = 0; c < 50; c++) {
    const msgCount = rng(10, 80);
    const participants = [{ name: "Alex Morgan" }, { name: convoNames[c] }];
    const messages = [];
    for (let m = 0; m < msgCount; m++) {
      const year = rng(2015, 2025);
      const sampleTexts = ["Hey, how are you?", "Did you see the news?", "Let's catch up soon!", "Happy birthday!", "Thanks for sharing that", "LOL that's hilarious", "Can you send me the details?", "Sounds good!", "Miss you!", "What are you up to this weekend?", "Check out this article", "Congrats on the new job!", "That's amazing!", "I'll be there", "See you tomorrow"];
      messages.push({
        sender_name: pick([participants[0].name, participants[1].name]),
        timestamp_ms: tsMs(year, rng(1, 12), rng(1, 28)),
        content: pick(sampleTexts),
      });
    }
    conversations.push({
      participants,
      messages,
      title: convoNames[c],
      thread_type: "Regular",
    });
  }

  // Advertisers (~60)
  const advertiserNames = ["Nike","Adidas","Amazon","Google","Netflix","Spotify","Apple","Samsung","Target","Walmart","Disney","Uber","Lyft","DoorDash","Airbnb","Coca-Cola","PepsiCo","Starbucks","McDonald's","Subway","LinkedIn","Twitter","TikTok","Snap Inc","Pinterest","Reddit","Shopify","Etsy","eBay","PayPal","Venmo","Square","Stripe","Salesforce","HubSpot","Zoom","Slack","Microsoft","Adobe","Oracle","IBM","Intel","NVIDIA","Tesla","Ford","Toyota","BMW","Honda","Delta Airlines","United Airlines","Hilton Hotels","Marriott","Expedia","Booking.com","Hulu","HBO","Paramount","Warner Bros","Peloton","Calm"];
  const advertisers = advertiserNames.map(name => ({
    advertiser_name: name,
    has_data_file_custom_audience: Math.random() > 0.3,
    has_remarketing_custom_audience: Math.random() > 0.5,
    has_in_person_store_visit: Math.random() > 0.8,
  }));

  // Off-Facebook Activity (~35)
  const offFbNames = ["Amazon","Google","Netflix","Spotify","Instagram","WhatsApp","YouTube","TikTok","Snapchat","LinkedIn","Twitter","Reddit","Pinterest","eBay","Etsy","Walmart","Target","Best Buy","Home Depot","Lowe's","CVS","Walgreens","Uber","Lyft","DoorDash","Grubhub","Airbnb","Booking.com","Expedia","Zillow","Redfin","Mint","Credit Karma","NerdWallet","Robinhood"];
  const eventTypes = ["PURCHASE", "CUSTOM", "PAGE_VIEW", "VIEW_CONTENT", "ADD_TO_CART", "SEARCH", "COMPLETE_REGISTRATION", "LEAD"];
  const offFacebookActivity = offFbNames.map(name => {
    const eventCount = rng(3, 40);
    const events = Array.from({ length: eventCount }, () => ({
      type: pick(eventTypes),
      timestamp: ts(rng(2020, 2025), rng(1, 12)),
    }));
    return { name, events };
  });

  // Ad interests (~45)
  const adInterests = ["Technology","Travel","Cooking","Photography","Fitness","Music","Movies","Books","Gaming","Fashion","Art","Science","Politics","Sports","Nature","Dogs","Cats","Coffee","Wine","Hiking","Yoga","Meditation","Entrepreneurship","Marketing","Design","Architecture","History","Psychology","Philosophy","Sustainability","Electric vehicles","Artificial intelligence","Cryptocurrency","Podcasts","Streaming services","Online shopping","Home decor","Gardening","Running","Swimming","Cycling","Board games","Craft beer","Sushi","Italian food","Jazz music"];

  // Groups (~15)
  const groupNames = ["React Developers","Photography Enthusiasts","Local Foodies","Book Club: Sci-Fi & Fantasy","Startup Founders Network","Hiking & Outdoor Adventures","Mindfulness & Meditation","Home Cooking Tips","Travel Hacks","UX Design Community","AI & Machine Learning","Remote Workers Hub","Sustainable Living","Vinyl Collectors","Film Buffs Society"];
  const groups = groupNames.map(name => ({
    name,
    timestamp: ts(rng(2014, 2024), rng(1, 12)),
  }));

  // Pages liked (~80)
  const pageNames = ["TechCrunch","The Verge","National Geographic","NASA","BBC News","The New York Times","Humans of New York","UNILAD","LADBible","9GAG","BuzzFeed","Tasty","NowThis","Vice","Vox","The Guardian","Reuters","Bloomberg","Forbes","Inc. Magazine","Fast Company","Wired","Ars Technica","Mashable","The Onion","McSweeney's","Saturday Night Live","Jimmy Fallon","Stephen Colbert","Netflix","HBO","Disney","Marvel","Star Wars","SpaceX","Tesla","Apple","Google","Microsoft","Amazon","Patagonia","REI","Nike","Adidas","National Parks","Lonely Planet","Anthony Bourdain","Gordon Ramsay","Jamie Oliver","Bon Appetit","Food Network","NPR","KEXP","Pitchfork","Rolling Stone","Spotify","SoundCloud","TED","Big Think","Kurzgesagt","Veritasium","Vsauce","Mark Rober","MKBHD","Linus Tech Tips","The Minimalists","Brene Brown","Adam Grant","Simon Sinek","Cal Newport","Tim Ferriss","Joe Rogan","Lex Fridman","The Daily Stoic","Brain Pickings","Wait But Why","XKCD","The Oatmeal","Dilbert"];
  const pages = pageNames.slice(0, 80).map(name => ({
    name,
    timestamp: ts(rng(2011, 2024), rng(1, 12)),
  }));

  // Posts (~150)
  const postTexts = ["What a beautiful day!","Just finished reading an amazing book","Can't believe it's already Friday","Grateful for all the wonderful people in my life","Check out this sunset","New adventure begins today","Life is good","Thinking about the future of technology","Had the best coffee today","Throwback to an incredible trip","Monday motivation","Weekend vibes","So proud of my team","Learning something new every day","This made my day","Food for thought","Exciting news coming soon","Reflecting on how far we've come","Nature never disappoints","Trying out a new recipe tonight"];
  const posts = Array.from({ length: 150 }, (_, i) => ({
    timestamp: ts(rng(2012, 2025), rng(1, 12)),
    data: [{ post: pick(postTexts) }],
    title: "Alex Morgan updated status",
  }));

  // Comments (~200)
  const commentTexts = ["Great post!","Couldn't agree more","This is so true","Love this!","Thanks for sharing","Well said","Interesting perspective","So cool!","Amazing!","Congratulations!","This is hilarious","You're the best","Couldn't have said it better","So inspiring","Nice one!","This made my day","Totally relate to this","Spot on","Brilliant","Keep it up!"];
  const comments = Array.from({ length: 200 }, () => ({
    timestamp: ts(rng(2012, 2025), rng(1, 12)),
    data: [{ comment: { body: pick(commentTexts) } }],
    title: "Alex Morgan commented on a post",
  }));

  // Search history (~100)
  const searchTexts = ["restaurant near me","best hiking trails","react tutorial","how to cook pasta","weather today","funny cat videos","best books 2024","coffee shops nearby","yoga for beginners","home workout","travel destinations","birthday gift ideas","new movies","podcast recommendations","healthy recipes","python programming","job openings","music festivals","camping gear","meditation apps","best laptops 2024","stock market today","cryptocurrency news","electric cars","plant care tips","diy home projects","online courses","photography tips","running shoes","budget travel","meal prep ideas","sleep better tips","productivity hacks","time management","stress relief","apartment decorating","sustainable fashion","investment strategies","freelancing tips","remote work tools","language learning","digital art","video editing","web development","machine learning","data science","cloud computing","cybersecurity","blockchain","virtual reality","augmented reality","3d printing","robotics","space exploration","climate change","renewable energy","mental health","nutrition tips","strength training","yoga poses","cycling routes","kayaking spots","surfing lessons","rock climbing","skiing resorts","camping sites","national parks","road trip ideas","city guides","food trucks","craft cocktails","wine tasting","beer brewing","sourdough recipe","sushi making","italian cooking","thai cuisine","indian recipes","mexican food","vegan meals","keto diet","intermittent fasting","smoothie recipes","juice cleanse","protein shakes","workout plans","marathon training","triathlon prep","crossfit","pilates","dance classes","swimming laps","tennis courts","golf courses","basketball leagues","soccer clubs","volleyball teams","baseball games","football scores","hockey playoffs","boxing gym"];
  const searches = searchTexts.slice(0, 100).map(text => ({
    timestamp: ts(rng(2018, 2025), rng(1, 12)),
    data: [{ text }],
  }));

  // Profile
  const profile = {
    name: { full_name: "Alex Morgan" },
    emails: { emails: [{ value: "alex.morgan@email.com" }] },
    birthday: { year: 1992, month: 6, day: 15 },
    gender: { gender_option: "Female" },
    registration_timestamp: ts(2010, 3, 12),
  };

  // Logins (~500)
  const userAgents = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Mozilla/5.0 (Linux; Android 14)",
    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
  ];
  const ipPrefixes = ["192.168.1.", "10.0.0.", "172.16.0.", "74.125.", "208.67.", "98.137.", "151.101."];
  const logins = Array.from({ length: 500 }, () => ({
    action: pick(["Login", "Login", "Login", "Logout"]),
    timestamp: ts(rng(2010, 2025), rng(1, 12)),
    ip_address: pick(ipPrefixes) + rng(1, 254),
    user_agent: pick(userAgents),
  }));

  // Recently viewed
  const recentlyViewed = Array.from({ length: 60 }, () => ({
    name: randName() + "'s profile",
    description: "Visited profile",
    timestamp: ts(rng(2023, 2025), rng(1, 12)),
  }));

  return {
    friends,
    conversations,
    advertisers,
    offFacebookActivity,
    adInterests,
    groups,
    pages,
    posts,
    comments,
    searches,
    profile,
    logins,
    recentlyViewed,
  };
}

// ─── Data analysis functions ─────────────────────────────────────────────────
function analyseFriends(friends) {
  const yearMap = {};
  const monthMap = {};
  const now = new Date();

  friends.forEach(f => {
    const d = new Date(f.timestamp * 1000);
    if (isNaN(d)) return;
    const yr = d.getFullYear();
    yearMap[yr] = (yearMap[yr] || 0) + 1;
    const mk = `${yr}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[mk] = (monthMap[mk] || 0) + 1;
  });

  const total = friends.length;
  const sortedYrs = Object.keys(yearMap).sort();
  const firstYear = parseInt(sortedYrs[0]) || now.getFullYear();
  const yearsOnPlatform = now.getFullYear() - firstYear;
  const yearHistory = Object.entries(yearMap).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  const peakYear = yearHistory.length > 0 ? yearHistory.reduce((a, b) => b[1] > a[1] ? b : a) : null;

  // Last 24 months
  const last24 = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    last24.push({ month: k, added: monthMap[k] || 0 });
  }

  // Growth
  const mths = (offset) => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const recent12 = mths(0).reduce((s, k) => s + (monthMap[k] || 0), 0);
  const prev12 = mths(12).reduce((s, k) => s + (monthMap[k] || 0), 0);
  const growthPct = prev12 > 0 ? Math.round(((recent12 - prev12) / prev12) * 100) : null;

  return { total, yearMap, monthMap, firstYear, yearsOnPlatform, yearHistory, last24, peakYear, recent12, growthPct };
}

function analyseMessages(conversations) {
  let totalMessages = 0;
  const contactCounts = {};
  const yearMap = {};
  const hourMap = {};

  conversations.forEach(convo => {
    const otherParticipants = convo.participants.filter(p => p.name !== "Alex Morgan");
    const otherName = otherParticipants.length > 0 ? otherParticipants[0].name : convo.title;

    convo.messages.forEach(msg => {
      totalMessages++;
      const d = new Date(msg.timestamp_ms);
      if (!isNaN(d)) {
        const yr = d.getFullYear();
        yearMap[yr] = (yearMap[yr] || 0) + 1;
        const hr = d.getHours();
        hourMap[hr] = (hourMap[hr] || 0) + 1;
      }
    });

    contactCounts[otherName] = (contactCounts[otherName] || 0) + convo.messages.length;
  });

  const topContacts = Object.entries(contactCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const yearHistory = Object.entries(yearMap).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  const uniqueConversations = conversations.length;

  // Peak hour
  const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];
  const formatHour = h => {
    const hr = parseInt(h);
    if (hr === 0) return "12am";
    if (hr < 12) return hr + "am";
    if (hr === 12) return "12pm";
    return (hr - 12) + "pm";
  };

  return { totalMessages, topContacts, yearHistory, uniqueConversations, peakHour: peakHour ? formatHour(peakHour[0]) : null, hourMap };
}

function analyseAdvertisers(advertisers) {
  const withData = advertisers.filter(a => a.has_data_file_custom_audience);
  const withRemarketing = advertisers.filter(a => a.has_remarketing_custom_audience);
  const withStoreVisit = advertisers.filter(a => a.has_in_person_store_visit);
  const sorted = [...advertisers].sort((a, b) => {
    const scoreA = (a.has_data_file_custom_audience ? 3 : 0) + (a.has_remarketing_custom_audience ? 2 : 0) + (a.has_in_person_store_visit ? 1 : 0);
    const scoreB = (b.has_data_file_custom_audience ? 3 : 0) + (b.has_remarketing_custom_audience ? 2 : 0) + (b.has_in_person_store_visit ? 1 : 0);
    return scoreB - scoreA;
  });

  return {
    total: advertisers.length,
    withData: withData.length,
    withRemarketing: withRemarketing.length,
    withStoreVisit: withStoreVisit.length,
    top15: sorted.slice(0, 15),
  };
}

function analyseOffFacebook(activities) {
  const sorted = [...activities].sort((a, b) => b.events.length - a.events.length);
  const totalEvents = activities.reduce((s, a) => s + a.events.length, 0);
  const eventTypes = {};
  activities.forEach(a => {
    a.events.forEach(e => {
      eventTypes[e.type] = (eventTypes[e.type] || 0) + 1;
    });
  });
  return { total: activities.length, totalEvents, top15: sorted.slice(0, 15), eventTypes };
}

function analyseActivity(posts, comments) {
  const postYearMap = {};
  const commentYearMap = {};

  (posts || []).forEach(p => {
    const d = new Date(p.timestamp * 1000);
    if (!isNaN(d)) {
      const yr = d.getFullYear();
      postYearMap[yr] = (postYearMap[yr] || 0) + 1;
    }
  });

  (comments || []).forEach(c => {
    const d = new Date(c.timestamp * 1000);
    if (!isNaN(d)) {
      const yr = d.getFullYear();
      commentYearMap[yr] = (commentYearMap[yr] || 0) + 1;
    }
  });

  const allYears = new Set([...Object.keys(postYearMap), ...Object.keys(commentYearMap)]);
  const timeline = [...allYears].sort().map(yr => ({
    year: yr,
    posts: postYearMap[yr] || 0,
    comments: commentYearMap[yr] || 0,
  }));

  return {
    totalPosts: (posts || []).length,
    totalComments: (comments || []).length,
    timeline,
  };
}

function analyseSearches(searches) {
  const wordFreq = {};
  (searches || []).forEach(s => {
    const text = (s.data && s.data[0] && s.data[0].text) || "";
    text.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 3 && !["the", "and", "for", "that", "this", "with", "from", "your", "have", "been", "what", "when", "where", "how", "near"].includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
  });
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 30);
  const yearMap = {};
  (searches || []).forEach(s => {
    const d = new Date(s.timestamp * 1000);
    if (!isNaN(d)) {
      const yr = d.getFullYear();
      yearMap[yr] = (yearMap[yr] || 0) + 1;
    }
  });
  return { total: (searches || []).length, topWords, yearHistory: Object.entries(yearMap).sort((a, b) => parseInt(a[0]) - parseInt(b[0])) };
}

function analyseLogins(logins) {
  const deviceMap = {};
  const yearMap = {};
  const hourMap = {};

  (logins || []).forEach(l => {
    const ua = l.user_agent || "";
    let device = "Other";
    if (ua.includes("iPhone")) device = "iPhone";
    else if (ua.includes("iPad")) device = "iPad";
    else if (ua.includes("Android")) device = "Android";
    else if (ua.includes("Macintosh")) device = "Mac";
    else if (ua.includes("Windows")) device = "Windows";
    else if (ua.includes("Linux")) device = "Linux";
    deviceMap[device] = (deviceMap[device] || 0) + 1;

    const d = new Date(l.timestamp * 1000);
    if (!isNaN(d)) {
      const yr = d.getFullYear();
      yearMap[yr] = (yearMap[yr] || 0) + 1;
      const hr = d.getHours();
      hourMap[hr] = (hourMap[hr] || 0) + 1;
    }
  });

  const uniqueIPs = new Set((logins || []).map(l => l.ip_address).filter(Boolean)).size;
  const devices = Object.entries(deviceMap).sort((a, b) => b[1] - a[1]);
  const yearHistory = Object.entries(yearMap).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

  return { total: (logins || []).length, uniqueIPs, devices, yearHistory, hourMap };
}

function categorizePages(pages) {
  const categories = {
    "News & Media": ["news", "times", "guardian", "reuters", "bloomberg", "bbc", "npr", "vice", "vox", "forbes", "wired"],
    "Tech": ["tech", "verge", "ars", "mashable", "mkbhd", "linus", "wired"],
    "Entertainment": ["netflix", "hbo", "disney", "marvel", "star wars", "snl", "fallon", "colbert", "paramount", "warner"],
    "Science & Education": ["nasa", "geographic", "ted", "kurzgesagt", "veritasium", "vsauce", "mark rober", "big think"],
    "Food & Drink": ["tasty", "bon appetit", "food network", "gordon ramsay", "jamie oliver", "anthony bourdain"],
    "Comedy & Culture": ["9gag", "buzzfeed", "onion", "oatmeal", "xkcd", "dilbert", "unilad", "ladbible"],
    "Business & Self-Help": ["inc", "fast company", "brene brown", "adam grant", "simon sinek", "cal newport", "tim ferriss", "minimalists", "daily stoic"],
    "Sports & Outdoors": ["patagonia", "rei", "nike", "adidas", "national parks", "lonely planet"],
    "Music": ["spotify", "soundcloud", "pitchfork", "rolling stone", "kexp"],
    "Brands": ["apple", "google", "microsoft", "amazon", "tesla", "spacex"],
  };

  const catCounts = {};
  (pages || []).forEach(p => {
    const name = p.name.toLowerCase();
    let found = false;
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(k => name.includes(k))) {
        catCounts[cat] = (catCounts[cat] || 0) + 1;
        found = true;
        break;
      }
    }
    if (!found) catCounts["Other"] = (catCounts["Other"] || 0) + 1;
  });

  return Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
}

function calculateScore(data) {
  let score = 30;
  const { friends, advertisers, offFacebookActivity, posts, comments, searches, logins, groups, pages, conversations } = data;

  // Friends
  if (friends && friends.length > 500) score += 10;
  else if (friends && friends.length > 200) score += 6;
  else if (friends && friends.length > 50) score += 3;

  // Advertisers tracking
  if (advertisers && advertisers.length > 50) score += 15;
  else if (advertisers && advertisers.length > 20) score += 10;
  else if (advertisers && advertisers.length > 10) score += 5;

  // Off-Facebook activity
  if (offFacebookActivity && offFacebookActivity.length > 30) score += 12;
  else if (offFacebookActivity && offFacebookActivity.length > 15) score += 8;
  else if (offFacebookActivity && offFacebookActivity.length > 5) score += 4;

  // Activity level
  const totalActivity = (posts || []).length + (comments || []).length;
  if (totalActivity > 500) score += 10;
  else if (totalActivity > 200) score += 6;
  else if (totalActivity > 50) score += 3;

  // Messaging
  if (conversations && conversations.length > 40) score += 8;
  else if (conversations && conversations.length > 15) score += 4;

  // Search history
  if (searches && searches.length > 80) score += 8;
  else if (searches && searches.length > 30) score += 4;

  // Logins
  if (logins && logins.length > 300) score += 7;
  else if (logins && logins.length > 100) score += 4;

  // Groups and pages
  if (groups && groups.length > 10) score += 5;
  if (pages && pages.length > 50) score += 5;

  return Math.min(97, Math.max(15, score));
}

// ─── Zip processing ──────────────────────────────────────────────────────────
async function processZip(file) {
  const zip = await JSZip.loadAsync(file);
  const findJson = (pattern) => {
    const files = zip.file(new RegExp(pattern, "i"));
    return files.length > 0 ? files[0] : null;
  };
  const readJson = async (f) => {
    if (!f) return null;
    try {
      const text = await f.async("string");
      return JSON.parse(text);
    } catch { return null; }
  };

  const result = {};

  // Friends
  const friendsFile = findJson("friends/friends\\.json") || findJson("friends_v2.*\\.json") || findJson("friends\\.json");
  const friendsData = await readJson(friendsFile);
  if (friendsData) {
    result.friends = friendsData.friends_v2 || friendsData.friends || friendsData;
  }

  // Messages — scan inbox folders
  const msgFiles = zip.file(/messages\/inbox\/.*message.*\.json$/i);
  if (msgFiles.length > 0) {
    result.conversations = [];
    for (const mf of msgFiles) {
      const data = await readJson(mf);
      if (data && data.messages) result.conversations.push(data);
    }
  }

  // Advertisers
  const adFile = findJson("advertisers.*contact.*list.*\\.json") || findJson("custom_audiences.*\\.json");
  const adData = await readJson(adFile);
  if (adData) {
    result.advertisers = adData.custom_audiences_all_types_v2 || adData.custom_audiences || adData;
  }

  // Off-Facebook Activity
  const offFbFile = findJson("off.facebook.activity.*\\.json") || findJson("your_off.facebook.*\\.json");
  const offFbData = await readJson(offFbFile);
  if (offFbData) {
    result.offFacebookActivity = offFbData.off_facebook_activity_v2 || offFbData.off_facebook_activity || offFbData;
  }

  // Ad interests
  const interestsFile = findJson("ads.interests\\.json") || findJson("ads_interests\\.json");
  const interestsData = await readJson(interestsFile);
  if (interestsData) {
    result.adInterests = interestsData.topics_v2 || interestsData.topics || interestsData;
  }

  // Groups
  const groupsFile = findJson("group.*membership.*\\.json") || findJson("your_group.*\\.json") || findJson("groups_joined.*\\.json");
  const groupsData = await readJson(groupsFile);
  if (groupsData) {
    result.groups = groupsData.groups_joined_v2 || groupsData.groups_joined || groupsData;
  }

  // Pages liked
  const pagesFile = findJson("pages.*liked\\.json") || findJson("page_likes.*\\.json") || findJson("pages_you.*\\.json");
  const pagesData = await readJson(pagesFile);
  if (pagesData) {
    result.pages = pagesData.page_likes_v2 || pagesData.page_likes || pagesData;
  }

  // Posts
  const postsFile = findJson("your_posts.*\\.json") || findJson("status_updates.*\\.json");
  const postsData = await readJson(postsFile);
  if (postsData) {
    const raw = postsData.status_updates_v2 || postsData.status_updates || postsData;
    result.posts = Array.isArray(raw) ? raw : [];
  }

  // Comments
  const commentsFile = findJson("comments\\.json") || findJson("comments_v2.*\\.json");
  const commentsData = await readJson(commentsFile);
  if (commentsData) {
    result.comments = commentsData.comments_v2 || commentsData.comments || commentsData;
  }

  // Search history
  const searchFile = findJson("your_search_history\\.json") || findJson("search.*history.*\\.json");
  const searchData = await readJson(searchFile);
  if (searchData) {
    result.searches = searchData.searches_v2 || searchData.searches || searchData;
  }

  // Profile
  const profileFile = findJson("profile_information\\.json") || findJson("profile_v2.*\\.json");
  const profileData = await readJson(profileFile);
  if (profileData) {
    result.profile = profileData.profile_v2 || profileData.profile || profileData;
  }

  // Logins
  const loginsFile = findJson("logins_and_logouts\\.json") || findJson("account_accesses.*\\.json");
  const loginsData = await readJson(loginsFile);
  if (loginsData) {
    result.logins = loginsData.account_accesses_v2 || loginsData.account_accesses || loginsData;
  }

  // Recently viewed
  const viewedFile = findJson("recently_viewed\\.json");
  const viewedData = await readJson(viewedFile);
  if (viewedData) {
    result.recentlyViewed = viewedData.recently_viewed || viewedData;
  }

  return result;
}

// ─── Generate insights ───────────────────────────────────────────────────────
function generateInsights(data) {
  const insights = [];
  const { friendsAnalysis, advertisersAnalysis, offFacebookAnalysis, activityAnalysis, messagesAnalysis, searchesAnalysis, loginsAnalysis, score } = data;

  // Friends insights
  if (friendsAnalysis) {
    if (friendsAnalysis.total > 500) {
      insights.push({ type: "neutral", headline: "Large social circle", body: `With ${friendsAnalysis.total.toLocaleString()} friends, you have a substantial Facebook network. The average user has around 338 friends.` });
    } else if (friendsAnalysis.total > 200) {
      insights.push({ type: "neutral", headline: "Moderate network", body: `${friendsAnalysis.total.toLocaleString()} friends puts you in a healthy range. Your network has grown over ${friendsAnalysis.yearsOnPlatform} years.` });
    } else {
      insights.push({ type: "positive", headline: "Curated network", body: `${friendsAnalysis.total.toLocaleString()} friends suggests you keep a tight, intentional social circle. Quality over quantity.` });
    }

    if (friendsAnalysis.peakYear) {
      insights.push({ type: "neutral", headline: "Peak social year", body: `${friendsAnalysis.peakYear[0]} was your biggest year for adding friends, with ${friendsAnalysis.peakYear[1]} new connections.` });
    }
  }

  // Advertiser insights
  if (advertisersAnalysis) {
    if (advertisersAnalysis.total > 40) {
      insights.push({ type: "warning", headline: "Heavy advertiser tracking", body: `${advertisersAnalysis.total} advertisers have uploaded your contact information to target you. ${advertisersAnalysis.withData} of them matched your data directly.` });
    } else if (advertisersAnalysis.total > 15) {
      insights.push({ type: "warning", headline: "Moderate ad targeting", body: `${advertisersAnalysis.total} advertisers are using your information for targeting. This is typical for active Facebook users.` });
    }
  }

  // Off-Facebook
  if (offFacebookAnalysis) {
    insights.push({ type: "warning", headline: "Off-Facebook tracking", body: `${offFacebookAnalysis.total} companies are sending your activity data back to Facebook, totalling ${offFacebookAnalysis.totalEvents.toLocaleString()} tracked events. This happens even when you're not on Facebook.` });
  }

  // Activity
  if (activityAnalysis) {
    const totalActivity = activityAnalysis.totalPosts + activityAnalysis.totalComments;
    if (totalActivity > 300) {
      insights.push({ type: "neutral", headline: "Active contributor", body: `With ${activityAnalysis.totalPosts} posts and ${activityAnalysis.totalComments} comments, you've contributed significantly to the platform's content.` });
    } else {
      insights.push({ type: "positive", headline: "Light contributor", body: `${activityAnalysis.totalPosts} posts and ${activityAnalysis.totalComments} comments suggests you're more of a consumer than a creator on the platform.` });
    }
  }

  // Messages
  if (messagesAnalysis) {
    insights.push({ type: "neutral", headline: "Messaging activity", body: `${messagesAnalysis.totalMessages.toLocaleString()} messages across ${messagesAnalysis.uniqueConversations} conversations. ${messagesAnalysis.peakHour ? `You message most around ${messagesAnalysis.peakHour}.` : ""}` });
  }

  // Search
  if (searchesAnalysis && searchesAnalysis.total > 50) {
    insights.push({ type: "warning", headline: "Search history retained", body: `Facebook has stored ${searchesAnalysis.total} of your searches. These are used to build your interest profile for ad targeting.` });
  }

  // Score-based
  if (score >= 80) {
    insights.push({ type: "warning", headline: "Deep digital footprint", body: "Your Facebook data profile is extensive. Consider reviewing your privacy settings and limiting off-Facebook activity tracking." });
  } else if (score >= 60) {
    insights.push({ type: "neutral", headline: "Significant data presence", body: "Facebook has a substantial amount of your data. Regular privacy checkups are recommended." });
  }

  return insights;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function SparkBar({ value, max, color = "#4a90d9", delay = 0, label, count, total }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const sharePct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "baseline" }}>
        <span style={{ fontSize: 12, color: "var(--text)" }}>{label}</span>
        <span style={{ fontSize: 10, color: "var(--muted)" }}>{count.toLocaleString()} <span style={{ color }}>{sharePct}%</span></span>
      </div>
      <div style={{ height: 3, background: "var(--faint)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transformOrigin: "left", animation: `barGrowH 0.8s ${delay}s cubic-bezier(0.22,1,0.36,1) forwards`, transform: "scaleX(0)" }} />
      </div>
    </div>
  );
}

function TimelineChart({ data, color = "var(--blue)" }) {
  if (!data || data.length < 2) return null;
  const maxVal = Math.max(...data.map(d => d[1]), 1);
  return (
    <div>
      <svg viewBox={`0 0 ${data.length * 10} 60`} style={{ width: "100%", height: 90, overflow: "visible" }}>
        {[0, 0.5, 1].map(p => <line key={p} x1={0} y1={60 * (1 - p)} x2={data.length * 10} y2={60 * (1 - p)} stroke="var(--border)" strokeWidth="0.3" />)}
        {data.map((d, i) => {
          const h = (d[1] / maxVal) * 54;
          return <rect key={i} x={i * 10 + 1} y={60 - h} width={8} height={h} fill={color} opacity="0.7" style={{ animation: `fadeIn 0.3s ${i * 0.02}s ease forwards`, opacity: 0 }} />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: "var(--muted)" }}>{data[0]?.[0]}</span>
        <span style={{ fontSize: 9, color: "var(--muted)" }}>{data[data.length - 1]?.[0]}</span>
      </div>
    </div>
  );
}

function ScoreHex({ score }) {
  const gc = GRADE_COLOR(score), gl = GRADE_LABEL(score), g = GRADE(score);
  const cx = 90, cy = 90, size = 72;
  const pts = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 6; return `${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`; }).join(" ");
  const fillSize = size * (score / 100);
  const ipts = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 6; return `${cx + fillSize * Math.cos(a)},${cy + fillSize * Math.sin(a)}`; }).join(" ");
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={180} height={180} className="hex-score">
        <defs><filter id="hg"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        <polygon points={pts} fill="none" stroke="var(--border-bright)" strokeWidth="1" />
        <polygon points={ipts} fill="rgba(74,144,217,0.13)" stroke={gc} strokeWidth="1.5" filter="url(#hg)" style={{ animation: "glowPulse 3s ease infinite" }} />
        <text x={cx} y={cy - 8} textAnchor="middle" fill={gc} fontSize="36" fontFamily="Playfair Display,serif" fontWeight="700">{g}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--muted)" fontSize="10" fontFamily="Space Mono" letterSpacing="2">{score}/100</text>
      </svg>
      <div style={{ fontSize: 12, color: gc, letterSpacing: "0.15em", marginTop: -8 }}>{gl.toUpperCase()}</div>
    </div>
  );
}

function StatCard({ label, value, suffix = "", icon, color = "var(--blue)" }) {
  return (
    <div className="card" style={{ padding: "24px 20px", textAlign: "center" }}>
      {icon && <div style={{ fontSize: 18, marginBottom: 8, color }}>{icon}</div>}
      <div className="serif" style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>
        <CountUp value={value} suffix={suffix} />
      </div>
      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginTop: 8 }}>{label}</div>
    </div>
  );
}

function InsightCard({ insight }) {
  const colors = { warning: "var(--rose)", positive: "var(--green)", neutral: "var(--blue)" };
  const icons = { warning: "!", positive: "✓", neutral: "→" };
  const c = colors[insight.type] || "var(--blue)";
  return (
    <div className="card" style={{ padding: "20px 24px", borderLeft: `2px solid ${c}` }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{icons[insight.type]}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{insight.headline}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>{insight.body}</div>
        </div>
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
    <div className="scroll-reveal" style={{ marginBottom: 32 }}>
      <SectionLabel color="var(--cream-muted)" icon="📅">FRIEND GROWTH HEATMAP</SectionLabel>
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
                const fill = count === maxCount ? "var(--blue)" : count > maxCount * 0.6 ? "var(--blue)" : "var(--teal)";
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
          <span style={{ fontSize: 8, color: "var(--muted)" }}>Less</span>
          {[0.05, 0.2, 0.4, 0.6, 0.9].map((o, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: "var(--blue)", opacity: o }} />
          ))}
          <span style={{ fontSize: 8, color: "var(--muted)" }}>More</span>
        </div>
      </div>
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
        const isTop = d.added === maxAdded && d.added > 0;
        const intensity = d.added > 0 ? 0.18 + (d.added / maxAdded) * 0.35 : 0;
        const [year, month] = d.month.split("-");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const label = `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`;
        return (
          <div key={i} style={{
            padding: "10px 8px", position: "relative", overflow: "hidden",
            background: "var(--cream)", border: isTop ? "1.5px solid var(--blue)" : "1px solid var(--cream-border)",
            textAlign: "center", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: `opacity 0.3s ${i * 0.03}s, transform 0.3s ${i * 0.03}s`,
          }}>
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              height: visible && d.added > 0 ? `${fillPct}%` : "0%",
              background: `linear-gradient(to top, rgba(74,144,217,${intensity}), rgba(74,144,217,${intensity * 0.3}))`,
              transition: visible ? `height 0.8s ${0.2 + i * 0.04}s cubic-bezier(0.22,1,0.36,1)` : "none",
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 8, color: "var(--cream-muted)", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
              <div className="serif" style={{ fontSize: 20, color: isTop ? "var(--blue)" : "var(--cream-text)", lineHeight: 1, marginBottom: 2, fontWeight: isTop ? 700 : 400 }}>{d.added}</div>
              {pct > 0 && <div style={{ fontSize: 8, color: isTop ? "var(--blue)" : "var(--cream-muted)" }}>{pct}%</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tag Cloud ───────────────────────────────────────────────────────────────
function TagCloud({ tags, color = "var(--blue)" }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {tags.map((tag, i) => {
        const text = typeof tag === "string" ? tag : tag[0];
        const size = typeof tag === "string" ? 12 : Math.max(10, Math.min(18, 10 + tag[1] * 2));
        return (
          <span key={i} style={{
            padding: "6px 14px", background: `${color}15`, border: `1px solid ${color}40`,
            fontSize: size, color, fontFamily: "Space Mono", letterSpacing: "0.05em",
            animation: `floatIn 0.3s ${i * 0.03}s ease forwards`, opacity: 0,
          }}>{text}</span>
        );
      })}
    </div>
  );
}

// ─── Bubble Chart for Off-Facebook ───────────────────────────────────────────
function OffFacebookBubbles({ data }) {
  if (!data || data.length === 0) return null;
  const maxEvents = Math.max(...data.map(d => d.events.length), 1);
  const width = 700, height = 300;
  const bubbles = data.slice(0, 15).map((d, i) => {
    const r = 18 + (d.events.length / maxEvents) * 40;
    const cols = Math.min(data.length, 5);
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = 70 + col * ((width - 140) / Math.max(cols - 1, 1)) + (row % 2 === 1 ? 35 : 0);
    const y = 70 + row * 90;
    return { ...d, x, y, r, i };
  });
  const svgHeight = Math.max(height, 70 + Math.ceil(bubbles.length / 5) * 90 + 40);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
      <svg viewBox={`0 0 ${width} ${svgHeight}`} style={{ width: "100%", maxWidth: 700, height: "auto", overflow: "visible" }}>
        <defs>
          <filter id="obGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {bubbles.map(b => (
          <g key={b.i} style={{ animation: `floatIn 0.7s ${b.i * 0.1}s ease forwards`, opacity: 0 }}>
            <circle cx={b.x} cy={b.y} r={b.r * 1.4} fill="var(--rose)" opacity="0.03" filter="url(#obGlow)" />
            <circle cx={b.x} cy={b.y} r={b.r} fill="rgba(232,96,96,0.1)" stroke="var(--rose)" strokeWidth="0.8" />
            <circle cx={b.x} cy={b.y} r={b.r * 0.3} fill="var(--rose)" opacity="0.2" />
            <text x={b.x} y={b.y + (b.r > 30 ? -5 : 3)} textAnchor="middle" fill="var(--rose)" fontSize={b.r > 35 ? "7.5" : b.r > 25 ? "6" : "5"} fontFamily="Space Mono" fontWeight="700">
              {b.name.length > 14 ? b.name.slice(0, 12) + ".." : b.name}
            </text>
            {b.r > 30 && <text x={b.x} y={b.y + 9} textAnchor="middle" fill="var(--muted)" fontSize="5" fontFamily="Space Mono">{b.events.length} events</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Activity Timeline ───────────────────────────────────────────────────────
function ActivityTimeline({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.posts + d.comments), 1);
  const barW = Math.max(12, Math.min(30, 500 / data.length));

  return (
    <div>
      <svg viewBox={`0 0 ${data.length * (barW + 4)} 80`} style={{ width: "100%", height: 120, overflow: "visible" }}>
        {data.map((d, i) => {
          const ph = (d.posts / maxVal) * 60;
          const ch = (d.comments / maxVal) * 60;
          return (
            <g key={i} style={{ animation: `fadeIn 0.3s ${i * 0.03}s ease forwards`, opacity: 0 }}>
              <rect x={i * (barW + 4)} y={70 - ph} width={barW * 0.45} height={ph} fill="var(--blue)" opacity="0.7" rx={1} />
              <rect x={i * (barW + 4) + barW * 0.5} y={70 - ch} width={barW * 0.45} height={ch} fill="var(--teal)" opacity="0.7" rx={1} />
              <text x={i * (barW + 4) + barW / 2} y={78} textAnchor="middle" fill="var(--muted)" fontSize="5" fontFamily="Space Mono">{d.year}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, background: "var(--blue)", opacity: 0.7, borderRadius: 2 }} />
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Posts</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, background: "var(--teal)", opacity: 0.7, borderRadius: 2 }} />
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Comments</span>
        </div>
      </div>
    </div>
  );
}

// ─── Radial Chart ────────────────────────────────────────────────────────────
function RadialSegments({ data, total, label = "CATEGORIES" }) {
  if (!data || data.length === 0) return null;
  const topN = data.slice(0, 7);
  const cx = 80, cy = 80, r = 65, ir = 35;
  let angle = -Math.PI / 2;
  const segs = topN.map(([name, count], i) => {
    const frac = count / total;
    const sweep = frac * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep), y2 = cy + r * Math.sin(angle + sweep);
    const ix1 = cx + ir * Math.cos(angle), iy1 = cy + ir * Math.sin(angle);
    const ix2 = cx + ir * Math.cos(angle + sweep), iy2 = cy + ir * Math.sin(angle + sweep);
    const lg = sweep > Math.PI ? 1 : 0;
    const path = `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${lg} 0 ${ix1} ${iy1} Z`;
    angle += sweep + 0.02;
    return { path, color: SEGMENT_COLORS[i], label: name, count, frac };
  });

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
      <svg width={160} height={160} style={{ flexShrink: 0 }}>
        <defs><filter id="sg"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {segs.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.85" filter="url(#sg)" />)}
        <circle cx={cx} cy={cy} r={ir - 2} fill="var(--surface)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--blue)" fontSize="16" fontFamily="Playfair Display,serif">{topN.length}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--muted)" fontSize="6" fontFamily="Space Mono" letterSpacing="1">{label}</text>
      </svg>
      <div style={{ flex: 1, minWidth: 140 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "var(--text)", flex: 1 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: "var(--muted)" }}>{Math.round(s.frac * 100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Privacy Radar ───────────────────────────────────────────────────────────
function PrivacyRadar({ data }) {
  const axes = [
    { label: "Friends", value: Math.min((data.friendsAnalysis?.total || 0) / 5, 100) },
    { label: "Tracking", value: Math.min(((data.advertisersAnalysis?.total || 0) + (data.offFacebookAnalysis?.total || 0)) * 1.2, 100) },
    { label: "Activity", value: Math.min(((data.activityAnalysis?.totalPosts || 0) + (data.activityAnalysis?.totalComments || 0)) / 4, 100) },
    { label: "Messaging", value: Math.min((data.messagesAnalysis?.totalMessages || 0) / 25, 100) },
    { label: "Searches", value: Math.min((data.searchesAnalysis?.total || 0) * 1.2, 100) },
    { label: "Logins", value: Math.min((data.loginsAnalysis?.total || 0) / 5, 100) },
  ];
  const cx = 200, cy = 200, maxR = 140;
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;

  const points = axes.map((a, i) => {
    const ang = -Math.PI / 2 + i * angleStep;
    const rv = (a.value / 100) * maxR;
    return { ...a, x: cx + rv * Math.cos(ang), y: cy + rv * Math.sin(ang), lx: cx + (maxR + 28) * Math.cos(ang), ly: cy + (maxR + 28) * Math.sin(ang) };
  });
  const pathD = "M" + points.map(p => `${p.x},${p.y}`).join("L") + "Z";
  const totalLen = points.reduce((s, p, i) => {
    const next = points[(i + 1) % points.length];
    return s + Math.hypot(next.x - p.x, next.y - p.y);
  }, 0);

  return (
    <div className="scroll-reveal" style={{ display: "flex", justifyContent: "center", padding: "24px 0", marginBottom: 32 }}>
      <svg viewBox="0 0 400 400" style={{ width: "100%", maxWidth: 420, height: "auto" }}>
        <defs>
          <radialGradient id="radarFill"><stop offset="0%" stopColor="var(--blue)" stopOpacity="0.25" /><stop offset="100%" stopColor="var(--blue)" stopOpacity="0.03" /></radialGradient>
          <filter id="radarGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {[25, 50, 75, 100].map(level => {
          const rv = (level / 100) * maxR;
          const pts = Array.from({ length: n }, (_, i) => {
            const ang = -Math.PI / 2 + i * angleStep;
            return `${cx + rv * Math.cos(ang)},${cy + rv * Math.sin(ang)}`;
          }).join(" ");
          return <polygon key={level} points={pts} fill="none" stroke="var(--border)" strokeWidth="0.5" opacity={0.15 + level * 0.002} />;
        })}
        {axes.map((_, i) => {
          const ang = -Math.PI / 2 + i * angleStep;
          return <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(ang)} y2={cy + maxR * Math.sin(ang)} stroke="var(--border)" strokeWidth="0.5" opacity="0.2" />;
        })}
        <path d={pathD} fill="url(#radarFill)" stroke="var(--blue)" strokeWidth="2" filter="url(#radarGlow)" strokeDasharray={totalLen} strokeDashoffset={totalLen} style={{ animation: `drawIn 2s 0.3s ease forwards` }} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} fill="var(--blue)" opacity="0" style={{ animation: `floatIn 0.5s ${1 + i * 0.1}s ease forwards` }} />
            <circle cx={p.x} cy={p.y} r={2} fill="var(--bg)" opacity="0" style={{ animation: `floatIn 0.5s ${1 + i * 0.1}s ease forwards` }} />
            <text x={p.lx} y={p.ly - 6} textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="Space Mono" letterSpacing="0.5" opacity="0" style={{ animation: `floatIn 0.5s ${1.2 + i * 0.05}s ease forwards` }}>{p.label.toUpperCase()}</text>
            <text x={p.lx} y={p.ly + 8} textAnchor="middle" fill="var(--blue)" fontSize="11" fontFamily="Playfair Display,serif" fontWeight="700" opacity="0" style={{ animation: `floatIn 0.5s ${1.2 + i * 0.05}s ease forwards` }}>{Math.round(p.value)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [stage, setStage] = useState("upload");
  const [analysed, setAnalysed] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const processData = useCallback(async (rawData, isDemo = false) => {
    setError(""); setStage("analysing");
    try {
      if (!isDemo && (!rawData.friends || rawData.friends.length < 1)) {
        throw new Error("Could not find friends data in the export.");
      }

      await new Promise(r => setTimeout(r, 2200));

      const friendsAnalysis = rawData.friends ? analyseFriends(rawData.friends) : null;
      const messagesAnalysis = rawData.conversations ? analyseMessages(rawData.conversations) : null;
      const advertisersAnalysis = rawData.advertisers ? analyseAdvertisers(rawData.advertisers) : null;
      const offFacebookAnalysis = rawData.offFacebookActivity ? analyseOffFacebook(rawData.offFacebookActivity) : null;
      const activityAnalysis = analyseActivity(rawData.posts, rawData.comments);
      const searchesAnalysis = analyseSearches(rawData.searches);
      const loginsAnalysis = analyseLogins(rawData.logins);
      const pageCategories = categorizePages(rawData.pages);

      const score = calculateScore(rawData);

      const analysedData = {
        friendsAnalysis,
        messagesAnalysis,
        advertisersAnalysis,
        offFacebookAnalysis,
        activityAnalysis,
        searchesAnalysis,
        loginsAnalysis,
        pageCategories,
        adInterests: rawData.adInterests || [],
        groups: rawData.groups || [],
        pages: rawData.pages || [],
        profile: rawData.profile || null,
        score,
      };

      analysedData.insights = generateInsights(analysedData);

      setAnalysed(analysedData);
      setStage("results");
    } catch (e) { setError(e.message); setStage("upload"); }
  }, []);

  const process = useCallback(async (file) => {
    setError(""); setStage("analysing");
    try {
      if (!file.name.endsWith(".zip")) {
        throw new Error("Please upload your Facebook data export as a .zip file");
      }
      const rawData = await processZip(file);
      await processData(rawData);
    } catch (e) { setError(e.message); setStage("upload"); }
  }, [processData]);

  const loadDemo = useCallback(() => {
    const synth = generateSyntheticData();
    processData(synth, true);
  }, [processData]);

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) process(f);
  }, [process]);

  return (
    <>
      {stage === "upload" && <Upload onDrop={onDrop} dragOver={dragOver} setDragOver={setDragOver} fileRef={fileRef} process={process} error={error} loadDemo={loadDemo} />}
      {stage === "analysing" && <Analysing />}
      {stage === "results" && analysed && <Results data={analysed} onReset={() => { setStage("upload"); setAnalysed(null); }} />}
    </>
  );
}

// ─── Upload ───────────────────────────────────────────────────────────────────
function Upload({ onDrop, dragOver, setDragOver, fileRef, process, error, loadDemo }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 24px", maxWidth: 680, margin: "0 auto" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,144,217,0.04) 0%, transparent 70%)", top: "20%", left: "50%", transform: "translateX(-50%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="animate-fade-up" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 10, letterSpacing: "0.25em", color: "var(--blue)", borderBottom: "1px solid var(--blue-dim)", paddingBottom: 2 }}>FACEBOOK DATA INTELLIGENCE</span>
        </div>
        <h1 className="serif animate-fade-up-1" style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 400, lineHeight: 1.1, margin: "16px 0 12px" }}>
          Facebook has been watching<br />you for years. <em style={{ color: "var(--blue)" }}>Now see what it sees.</em>
        </h1>
        <p className="animate-fade-up-2" style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.8, marginBottom: 36, maxWidth: 520 }}>
          Upload your Facebook data export and discover your digital shadow — who's tracking you, what Facebook knows about your interests, and how deep your footprint really goes.
        </p>
        <div className={`drop-zone animate-fade-up-3 ${dragOver ? "over" : ""}`}
          style={{ padding: "48px 40px", textAlign: "center", marginBottom: 16 }}
          onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current.click()}>
          <div className="upload-icon" style={{ fontSize: 28, marginBottom: 12 }}>&#8593;</div>
          <div className="serif" style={{ fontSize: 20, marginBottom: 6 }}>Drop your export here</div>
          <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em" }}>FACEBOOK DATA EXPORT (.ZIP)</div>
          <input ref={fileRef} type="file" accept=".zip" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) process(f); }} />
        </div>
        <div className="animate-fade-up-4" style={{ textAlign: "center", marginBottom: 24 }}>
          <button className="btn-ghost" onClick={loadDemo} style={{ fontSize: 11, letterSpacing: "0.12em" }}>
            TRY DEMO WITH SAMPLE DATA
          </button>
        </div>
        {error && <div style={{ padding: "12px 16px", background: "rgba(232,96,96,0.08)", border: "1px solid rgba(232,96,96,0.25)", color: "var(--rose)", fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>{error}</div>}
        <div className="card animate-fade-up-5" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--blue)", marginBottom: 14 }}>HOW TO GET YOUR DATA</div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 16px", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
            {[["01", "Go to Facebook Settings & Privacy"], ["02", "Select 'Your Facebook Information'"], ["03", "Click 'Download Your Information' in JSON format"], ["04", "Upload the zip file you receive"]].map(([n, t], i) => (
              <div key={i} style={{ display: "contents" }}>
                <span style={{ color: "var(--blue-dim)", fontWeight: 700 }}>{n}</span>
                <span style={{ color: i === 3 ? "var(--blue)" : "var(--text)" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="animate-fade-up-6" style={{ display: "flex", gap: 24, fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", flexWrap: "wrap" }}>
          <span>Runs entirely in your browser</span>
          <span>No data stored or transmitted</span>
          <span>Works with Facebook JSON export</span>
        </div>
      </div>
    </div>
  );
}

// ─── Analysing ────────────────────────────────────────────────────────────────
function Analysing() {
  const steps = [
    "Parsing friend data...",
    "Scanning advertiser lists...",
    "Mapping off-Facebook tracking...",
    "Analysing messaging patterns...",
    "Reading search history...",
    "Cataloguing ad interests...",
    "Processing group memberships...",
    "Scanning page likes...",
    "Reviewing post history...",
    "Analysing login patterns...",
    "Calculating social footprint...",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 380); return () => clearInterval(t); }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
      <div style={{ position: "relative" }}>
        <div style={{ width: 48, height: 48, border: "1px solid var(--border)", borderTop: "1px solid var(--blue)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ position: "absolute", inset: 0, border: "1px solid transparent", borderRight: "1px solid var(--blue-dim)", borderRadius: "50%", animation: "spin 2s linear infinite reverse" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div className="serif" style={{ fontSize: 24, fontWeight: 400, marginBottom: 8 }}>Analysing your data</div>
        <div style={{ fontSize: 11, color: "var(--blue)", letterSpacing: "0.15em", animation: "pulse 1s ease infinite" }}>{steps[step]}</div>
      </div>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────
function Results({ data, onReset }) {
  const ch1Ref = useScrollReveal();
  const ch2Ref = useScrollReveal();
  const ch3Ref = useScrollReveal();
  const ch4Ref = useScrollReveal();
  const ch5Ref = useScrollReveal();

  const { friendsAnalysis: fa, messagesAnalysis: ma, advertisersAnalysis: aa, offFacebookAnalysis: ofa, activityAnalysis: act, searchesAnalysis: sa, loginsAnalysis: la, pageCategories: pc, adInterests: ai, groups: gr, pages: pg, profile: prof, score, insights } = data;

  return (
    <div>
      {/* ─── Chapter 1: Your Social Footprint (dark) ─── */}
      <div className="chapter chapter-dark" ref={ch1Ref}>
        <div className="chapter-opener">
          <div className="scroll-reveal" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.25em", color: "var(--blue)", borderBottom: "1px solid var(--blue-dim)", paddingBottom: 2 }}>CHAPTER 01</span>
          </div>
          <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 400, lineHeight: 1.15, marginBottom: 12 }}>
            Your Social Footprint
          </h2>
          <p className="scroll-reveal scroll-reveal-delay-2" style={{ color: "var(--muted)", fontSize: 13, maxWidth: 500, lineHeight: 1.7, marginBottom: 40 }}>
            {prof?.name?.full_name ? `${prof.name.full_name}, here` : "Here"}'s the shadow you cast across Facebook's servers.
          </p>

          <div className="scroll-reveal scroll-reveal-delay-3">
            <ScoreHex score={score} />
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Radar */}
          <PrivacyRadar data={data} />

          {/* 4 stat cards */}
          <div className="scroll-reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 48 }}>
            <StatCard label="TOTAL FRIENDS" value={fa?.total || 0} icon="&#128101;" color="var(--blue)" />
            <StatCard label="YEARS ON PLATFORM" value={fa?.yearsOnPlatform || 0} icon="&#128197;" color="var(--teal)" />
            <StatCard label="ADVERTISERS TRACKING" value={aa?.total || 0} icon="&#128065;" color="var(--rose)" />
            <StatCard label="OFF-FB TRACKERS" value={ofa?.total || 0} icon="&#128270;" color="var(--amber)" />
          </div>

          {/* Insights */}
          {insights && insights.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel icon="&#128161;" color="var(--blue)">KEY INSIGHTS</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
              </div>
            </div>
          )}
        </div>

        <div className="chapter-divider" style={{ marginTop: 48 }} />
      </div>

      {/* ─── Chapter 2: Your Social Circle (light) ─── */}
      <div className="chapter chapter-light" ref={ch2Ref}>
        <div className="chapter-opener">
          <div className="scroll-reveal" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.25em", color: "var(--blue)" }}>CHAPTER 02</span>
          </div>
          <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 400, lineHeight: 1.15, marginBottom: 12 }}>
            Your Social Circle
          </h2>
          <p className="scroll-reveal scroll-reveal-delay-2" style={{ color: "var(--cream-muted)", fontSize: 13, maxWidth: 500, lineHeight: 1.7 }}>
            How your network has evolved over time.
          </p>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Friend growth by year */}
          {fa && fa.yearHistory && fa.yearHistory.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--cream-muted)" icon="&#128200;">FRIENDS ADDED PER YEAR</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <TimelineChart data={fa.yearHistory} color="var(--blue)" />
              </div>
            </div>
          )}

          {/* Last 24 months grid */}
          {fa && fa.last24 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--cream-muted)" icon="&#128197;">LAST 24 MONTHS</SectionLabel>
              <MonthGrid data={fa.last24} />
            </div>
          )}

          {/* Heatmap */}
          {fa && <ConnectionHeatmap monthMap={fa.monthMap} firstYear={fa.firstYear} />}
        </div>

        <div className="chapter-divider" />
      </div>

      {/* ─── Chapter 3: What Facebook Knows (dark) ─── */}
      <div className="chapter chapter-dark" ref={ch3Ref}>
        <div className="chapter-opener">
          <div className="scroll-reveal" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.25em", color: "var(--blue)", borderBottom: "1px solid var(--blue-dim)", paddingBottom: 2 }}>CHAPTER 03</span>
          </div>
          <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 400, lineHeight: 1.15, marginBottom: 12 }}>
            What Facebook Knows
          </h2>
          <p className="scroll-reveal scroll-reveal-delay-2" style={{ color: "var(--muted)", fontSize: 13, maxWidth: 500, lineHeight: 1.7 }}>
            The interests, trackers, and advertisers building your profile.
          </p>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Ad Interests */}
          {ai && ai.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel icon="&#127919;" color="var(--blue)">YOUR AD INTEREST PROFILE</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>Facebook has tagged you with {ai.length} interest categories for ad targeting.</p>
                <TagCloud tags={ai} color="var(--blue)" />
              </div>
            </div>
          )}

          {/* Advertisers bar chart */}
          {aa && aa.top15 && aa.top15.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel icon="&#128188;" color="var(--rose)">ADVERTISERS WITH YOUR DATA</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
                  {aa.total} advertisers uploaded contact lists that matched your information. {aa.withData} have your data directly.
                </p>
                {aa.top15.map((a, i) => {
                  const aScore = (a.has_data_file_custom_audience ? 3 : 0) + (a.has_remarketing_custom_audience ? 2 : 0) + (a.has_in_person_store_visit ? 1 : 0);
                  return (
                    <SparkBar key={i} value={aScore} max={6} color="var(--rose)" delay={i * 0.05}
                      label={a.advertiser_name} count={aScore} total={6} />
                  );
                })}
                <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}><span style={{ color: "var(--rose)" }}>&#9679;</span> Contact list match</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}><span style={{ color: "var(--amber)" }}>&#9679;</span> Remarketing</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}><span style={{ color: "var(--teal)" }}>&#9679;</span> Store visit</div>
                </div>
              </div>
            </div>
          )}

          {/* Off-Facebook Activity */}
          {ofa && ofa.top15 && ofa.top15.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel icon="&#128065;" color="var(--rose)">OFF-FACEBOOK TRACKING</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
                  {ofa.total} companies send your browsing and purchase data to Facebook — {ofa.totalEvents.toLocaleString()} tracked events in total. This happens even when you're not using Facebook.
                </p>
                <OffFacebookBubbles data={ofa.top15} />
                {ofa.eventTypes && Object.keys(ofa.eventTypes).length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 10 }}>EVENT TYPES TRACKED</div>
                    {Object.entries(ofa.eventTypes).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([type, count], i) => (
                      <SparkBar key={i} value={count} max={ofa.totalEvents} color="var(--amber)" delay={i * 0.05}
                        label={type.replace(/_/g, " ")} count={count} total={ofa.totalEvents} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search history */}
          {sa && sa.topWords && sa.topWords.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel icon="&#128269;" color="var(--blue)">SEARCH HISTORY ANALYSIS</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
                  Facebook has retained {sa.total} of your searches. Here are the most common topics.
                </p>
                <TagCloud tags={sa.topWords} color="var(--teal)" />
                {sa.yearHistory && sa.yearHistory.length > 1 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 10 }}>SEARCHES PER YEAR</div>
                    <TimelineChart data={sa.yearHistory} color="var(--teal)" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="chapter-divider" />
      </div>

      {/* ─── Chapter 4: Your Activity (light) ─── */}
      <div className="chapter chapter-light" ref={ch4Ref}>
        <div className="chapter-opener">
          <div className="scroll-reveal" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.25em", color: "var(--blue)" }}>CHAPTER 04</span>
          </div>
          <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 400, lineHeight: 1.15, marginBottom: 12 }}>
            Your Activity
          </h2>
          <p className="scroll-reveal scroll-reveal-delay-2" style={{ color: "var(--cream-muted)", fontSize: 13, maxWidth: 500, lineHeight: 1.7 }}>
            Posts, comments, messages, and group memberships over the years.
          </p>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Post & Comment Timeline */}
          {act && act.timeline && act.timeline.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--cream-muted)" icon="&#128221;">POSTING & COMMENTING ACTIVITY</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                  <div style={{ textAlign: "center" }}>
                    <div className="serif" style={{ fontSize: 28, color: "var(--blue)", fontWeight: 700 }}><CountUp value={act.totalPosts} /></div>
                    <div style={{ fontSize: 10, color: "var(--cream-muted)", letterSpacing: "0.15em" }}>POSTS</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div className="serif" style={{ fontSize: 28, color: "var(--teal)", fontWeight: 700 }}><CountUp value={act.totalComments} /></div>
                    <div style={{ fontSize: 10, color: "var(--cream-muted)", letterSpacing: "0.15em" }}>COMMENTS</div>
                  </div>
                </div>
                <ActivityTimeline data={act.timeline} />
              </div>
            </div>
          )}

          {/* Messaging Stats */}
          {ma && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--cream-muted)" icon="&#128172;">MESSAGING STATS</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 24 }}>
                  <div style={{ textAlign: "center" }}>
                    <div className="serif" style={{ fontSize: 24, color: "var(--blue)", fontWeight: 700 }}><CountUp value={ma.totalMessages} /></div>
                    <div style={{ fontSize: 9, color: "var(--cream-muted)", letterSpacing: "0.12em" }}>TOTAL MESSAGES</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div className="serif" style={{ fontSize: 24, color: "var(--teal)", fontWeight: 700 }}><CountUp value={ma.uniqueConversations} /></div>
                    <div style={{ fontSize: 9, color: "var(--cream-muted)", letterSpacing: "0.12em" }}>CONVERSATIONS</div>
                  </div>
                  {ma.peakHour && (
                    <div style={{ textAlign: "center" }}>
                      <div className="serif" style={{ fontSize: 24, color: "var(--amber)", fontWeight: 700 }}>{ma.peakHour}</div>
                      <div style={{ fontSize: 9, color: "var(--cream-muted)", letterSpacing: "0.12em" }}>PEAK HOUR</div>
                    </div>
                  )}
                </div>

                {/* Top contacts */}
                {ma.topContacts && ma.topContacts.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 10 }}>TOP CONTACTS</div>
                    {ma.topContacts.slice(0, 8).map(([name, count], i) => (
                      <SparkBar key={i} value={count} max={ma.topContacts[0][1]} color="var(--blue)" delay={i * 0.05}
                        label={name} count={count} total={ma.totalMessages} />
                    ))}
                  </div>
                )}

                {/* Messages per year */}
                {ma.yearHistory && ma.yearHistory.length > 1 && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--cream-muted)", marginBottom: 10 }}>MESSAGES PER YEAR</div>
                    <TimelineChart data={ma.yearHistory} color="var(--blue)" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Group Memberships */}
          {gr && gr.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel color="var(--cream-muted)" icon="&#128101;">GROUP MEMBERSHIPS ({gr.length})</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...gr].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map((g, i) => {
                    const d = g.timestamp ? new Date(g.timestamp * 1000) : null;
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--cream)", border: "1px solid var(--cream-border)", animation: `floatIn 0.3s ${i * 0.05}s ease forwards`, opacity: 0 }}>
                        <span style={{ fontSize: 12 }}>{g.name}</span>
                        {d && <span style={{ fontSize: 10, color: "var(--cream-muted)" }}>{d.getFullYear()}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="chapter-divider" />
      </div>

      {/* ─── Chapter 5: Your Digital Shadow (dark) ─── */}
      <div className="chapter chapter-dark" ref={ch5Ref}>
        <div className="chapter-opener">
          <div className="scroll-reveal" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.25em", color: "var(--blue)", borderBottom: "1px solid var(--blue-dim)", paddingBottom: 2 }}>CHAPTER 05</span>
          </div>
          <h2 className="serif scroll-reveal scroll-reveal-delay-1" style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 400, lineHeight: 1.15, marginBottom: 12 }}>
            Your Digital Shadow
          </h2>
          <p className="scroll-reveal scroll-reveal-delay-2" style={{ color: "var(--muted)", fontSize: 13, maxWidth: 500, lineHeight: 1.7 }}>
            Login patterns, page preferences, and your overall privacy score breakdown.
          </p>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Login summary */}
          {la && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel icon="&#128274;" color="var(--blue)">LOGIN ACTIVITY</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 24 }}>
                  <div style={{ textAlign: "center" }}>
                    <div className="serif" style={{ fontSize: 24, color: "var(--blue)", fontWeight: 700 }}><CountUp value={la.total} /></div>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em" }}>TOTAL LOGINS</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div className="serif" style={{ fontSize: 24, color: "var(--teal)", fontWeight: 700 }}><CountUp value={la.uniqueIPs} /></div>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em" }}>UNIQUE IPs</div>
                  </div>
                </div>

                {/* Devices */}
                {la.devices && la.devices.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 10 }}>DEVICES</div>
                    {la.devices.map(([device, count], i) => (
                      <SparkBar key={i} value={count} max={la.devices[0][1]} color="var(--teal)" delay={i * 0.05}
                        label={device} count={count} total={la.total} />
                    ))}
                  </div>
                )}

                {/* Logins per year */}
                {la.yearHistory && la.yearHistory.length > 1 && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--muted)", marginBottom: 10 }}>LOGINS PER YEAR</div>
                    <TimelineChart data={la.yearHistory} color="var(--blue)" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pages liked categories */}
          {pc && pc.length > 0 && (
            <div className="scroll-reveal" style={{ marginBottom: 48 }}>
              <SectionLabel icon="&#128077;" color="var(--blue)">PAGE CATEGORIES ({pg.length} pages liked)</SectionLabel>
              <div className="card" style={{ padding: 24 }}>
                <RadialSegments data={pc} total={pg.length} label="CATEGORIES" />
              </div>
            </div>
          )}

          {/* Privacy score breakdown */}
          <div className="scroll-reveal" style={{ marginBottom: 48 }}>
            <SectionLabel icon="&#128737;" color="var(--blue)">PRIVACY SCORE BREAKDOWN</SectionLabel>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                {[
                  { label: "Friend network exposure", value: Math.min(Math.round((fa?.total || 0) / 5), 100), color: "var(--blue)" },
                  { label: "Advertiser tracking", value: Math.min(Math.round((aa?.total || 0) * 1.5), 100), color: "var(--rose)" },
                  { label: "Off-platform tracking", value: Math.min(Math.round((ofa?.total || 0) * 2.5), 100), color: "var(--amber)" },
                  { label: "Content contribution", value: Math.min(Math.round(((act?.totalPosts || 0) + (act?.totalComments || 0)) / 3.5), 100), color: "var(--teal)" },
                  { label: "Search data retained", value: Math.min(Math.round((sa?.total || 0) * 1.2), 100), color: "var(--blue)" },
                  { label: "Login frequency", value: Math.min(Math.round((la?.total || 0) / 5), 100), color: "var(--green)" },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--text)" }}>{item.label}</span>
                      <span style={{ fontSize: 10, color: item.color }}>{item.value}%</span>
                    </div>
                    <div style={{ height: 4, background: "var(--faint)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${item.value}%`, background: item.color, borderRadius: 2, transformOrigin: "left", animation: `barGrowH 0.8s ${i * 0.1}s cubic-bezier(0.22,1,0.36,1) forwards`, transform: "scaleX(0)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="scroll-reveal" style={{ textAlign: "center", padding: "60px 24px 40px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--muted)", marginBottom: 20 }}>BUILT BY</div>
            <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 8 }}>Rob Browton</h3>
            <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.7, maxWidth: 400, margin: "0 auto 32px" }}>
              Helping people understand their digital footprint. Want to learn more about your data?
            </p>
            <a href="https://www.linkedin.com/in/robertbrowton" target="_blank" rel="noopener noreferrer" className="btn-primary">CONNECT ON LINKEDIN</a>
          </div>

          {/* Privacy notice + reset */}
          <div className="scroll-reveal" style={{ textAlign: "center", padding: "24px", borderTop: "1px solid var(--border)", marginTop: 40 }}>
            <p style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", marginBottom: 16 }}>
              Runs entirely in your browser — nothing stored or transmitted
            </p>
            <button className="btn-ghost" onClick={onReset}>ANALYSE ANOTHER EXPORT</button>
          </div>
        </div>
      </div>
    </div>
  );
}
