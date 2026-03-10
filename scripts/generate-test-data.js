#!/usr/bin/env node
/**
 * generate-test-data.js
 *
 * Creates 3 synthetic LinkedIn data-export zips for testing:
 *   1. early-career-export.zip  — Maya Chen, ~2 years on LinkedIn
 *   2. mid-career-export.zip    — James Okoye, ~8 years on LinkedIn
 *   3. late-career-export.zip   — Dr. Sarah Whitfield, ~15+ years on LinkedIn
 *
 * Usage:  node scripts/generate-test-data.js
 * Output: test-data/*.zip
 */

const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");

// ─── Seeded pseudo-random for reproducibility ────────────────────────────────
let _seed = 42;
function rand() { _seed = (_seed * 16807 + 0) % 2147483647; return (_seed - 1) / 2147483646; }
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = randInt(0, copy.length - 1);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Name pools ──────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Emma","Oliver","Amara","Liam","Priya","Noah","Fatima","James","Yuki","Aisha",
  "William","Sofia","Benjamin","Chen","Zara","Alexander","Mei","Daniel","Nia","Samuel",
  "Olivia","Ethan","Isla","Lucas","Freya","Henry","Anya","Jack","Rosa","Thomas",
  "Charlotte","Harry","Amelia","George","Lily","Edward","Grace","Arthur","Ruby","Oscar",
  "Hannah","Leo","Mia","Jacob","Ella","Alfie","Chloe","Charlie","Emily","Archie",
  "Sophie","Joshua","Jessica","Muhammad","Katie","Adam","Lauren","Ryan","Rebecca","David",
  "Tariq","Akiko","Raj","Ingrid","Kofi","Sven","Lucia","Andrei","Fatou","Ibrahim",
  "Olga","Pietro","Carmen","Lars","Ayumi","Hassan","Bianca","Dmitri","Adaeze","Kenji",
  "Nadia","Marcus","Elise","Hugo","Xiulan","Kwame","Astrid","Pavel","Chioma","Riku",
  "Marta","Felix","Ines","Gustaf","Amina","Boris","Helena","Takeshi","Svetlana","Ramon"
];

const LAST_NAMES = [
  "Smith","Patel","Johnson","Williams","Brown","Jones","Taylor","Davies","Wilson","Evans",
  "Thomas","Roberts","Walker","Wright","Thompson","White","Hall","Green","Wood","Harris",
  "Clark","Lewis","Young","King","Mitchell","Anderson","Campbell","Stewart","Martin","Turner",
  "Parker","Morris","Adams","Murphy","Graham","Murray","Khan","Ali","Singh","Sharma",
  "Okafor","Adeyemi","Mensah","Nkrumah","Okoro","Nakamura","Tanaka","Watanabe","Suzuki","Kim",
  "Chen","Wang","Liu","Zhang","Li","Andersson","Johansson","Larsson","Bergström","Petrov",
  "Kowalski","Novak","Schneider","Müller","Schmidt","Rossi","Ferrari","Moreau","Dubois","Garcia",
  "Fernandez","Santos","Costa","Almeida","Pereira","O'Brien","O'Connor","McCarthy","Reilly","Walsh",
  "Okonkwo","Chukwu","Abara","Eze","Nwosu","Hayashi","Ishikawa","Yamazaki","Inoue","Sato",
  "Lindberg","Eriksson","Olsson","Nyström","Falk","Bassi","Conti","Marchetti","Leone","Ricci"
];

// ─── Company pools ───────────────────────────────────────────────────────────
const UK_TECH_COMPANIES = [
  "Revolut","Monzo","Wise","Starling Bank","OakNorth","Checkout.com","Darktrace","Improbable",
  "Deliveroo","Cazoo","Babylon Health","Graphcore","Arm Holdings","BT Group","Sky",
  "Ocado Technology","Farfetch","GoCardless","Funding Circle","Snyk","Paddle","Thought Machine",
  "Digital Catapult","Faculty AI","Tractable","Peak AI","PolyAI","Cleo AI","Bulb Energy",
  "Multiverse","Beamery","Cuvva","Pleo","Form3","TrueLayer","Eigen Technologies"
];

const UK_CONSULTING = [
  "McKinsey & Company","Boston Consulting Group","Bain & Company","Deloitte","PwC","EY","KPMG",
  "Accenture","Capgemini","PA Consulting","Mercer","Aon","Willis Towers Watson","Oliver Wyman",
  "Roland Berger","Kearney","FTI Consulting","Alvarez & Marsal","L.E.K. Consulting",
  "Korn Ferry","Heidrick & Struggles","Spencer Stuart","Russell Reynolds","Egon Zehnder"
];

const UK_FINANCE = [
  "Barclays","HSBC","Lloyds Banking Group","NatWest Group","Standard Chartered",
  "Schroders","Legal & General","Aviva","Prudential","M&G","Hargreaves Lansdown",
  "HL","Baillie Gifford","Rathbones","St James's Place","Brewin Dolphin",
  "Man Group","Winton","Marshall Wace","Citadel Securities","Jane Street"
];

const UK_LARGE = [
  "Unilever","GlaxoSmithKline","AstraZeneca","BP","Shell","Rio Tinto","Anglo American",
  "BAE Systems","Rolls-Royce","Tesco","Sainsbury's","Marks & Spencer","John Lewis",
  "BBC","ITV","Pearson","RELX","WPP","Publicis","Dentsu","Diageo","Burberry"
];

const ALL_COMPANIES = [...UK_TECH_COMPANIES, ...UK_CONSULTING, ...UK_FINANCE, ...UK_LARGE];

const TECH_SKILLS = [
  "JavaScript","TypeScript","React","Node.js","Python","SQL","Git","HTML","CSS","AWS",
  "Docker","Kubernetes","GraphQL","REST APIs","Agile","Scrum","CI/CD","TDD","Figma",
  "Data Analysis","Machine Learning","Cloud Computing","DevOps","Terraform","Linux",
  "Java","Go","Rust","C++","PostgreSQL","MongoDB","Redis","Elasticsearch","Kafka"
];

const BUSINESS_SKILLS = [
  "Project Management","Product Management","Strategic Planning","Change Management",
  "Stakeholder Management","Business Development","Financial Analysis","Data Analysis",
  "Team Leadership","Negotiation","Presentation Skills","Executive Coaching",
  "Organisational Development","Talent Management","Board Advisory","Governance",
  "Risk Management","Mergers & Acquisitions","Due Diligence","Investor Relations",
  "Budget Management","P&L Management","Cross-functional Leadership","Process Improvement",
  "Supply Chain","Operations Management","Customer Success","Account Management",
  "Market Research","Competitive Analysis","Brand Strategy","Digital Transformation",
  "People Analytics","Workforce Planning","Succession Planning","Learning & Development",
  "Employee Engagement","Culture Transformation","Psychometrics","360 Feedback",
  "Executive Assessment","Leadership Development","Coaching","Facilitation",
  "Organisation Design","Restructuring","Performance Management","Diversity & Inclusion"
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d) {
  return `${String(d.getDate()).padStart(2,"0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function randomDate(startYear, endYear) {
  const y = randInt(startYear, endYear);
  const m = randInt(0, 11);
  const d = randInt(1, 28);
  return new Date(y, m, d);
}

function generateName() {
  return { first: pick(FIRST_NAMES), last: pick(LAST_NAMES) };
}

function escapeCSV(val) {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCSV(headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => escapeCSV(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

// ─── Generate connections with realistic growth curve ────────────────────────
function generateConnections(count, startYear, endYear, titlePool) {
  const rows = [];
  const totalYears = endYear - startYear + 1;
  // Weight later years more heavily (exponential-ish growth)
  const weights = [];
  for (let i = 0; i < totalYears; i++) {
    weights.push(Math.pow(1.4, i));
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < count; i++) {
    const name = generateName();
    // Weighted year selection
    let r = rand() * totalWeight;
    let yearIdx = 0;
    for (let j = 0; j < weights.length; j++) {
      r -= weights[j];
      if (r <= 0) { yearIdx = j; break; }
    }
    const year = startYear + yearIdx;
    const month = randInt(0, 11);
    const day = randInt(1, 28);
    const connDate = new Date(year, month, day);

    const company = pick(ALL_COMPANIES);
    const position = pick(titlePool);

    rows.push({
      "First Name": name.first,
      "Last Name": name.last,
      "URL": `https://www.linkedin.com/in/${name.first.toLowerCase()}${name.last.toLowerCase()}${randInt(1,999)}`,
      "Email Address": rand() > 0.7 ? `${name.first.toLowerCase()}.${name.last.toLowerCase()}@${pick(["gmail.com","outlook.com","yahoo.co.uk","hotmail.com"])}` : "",
      "Company": company,
      "Position": position,
      "Connected On": formatDate(connDate),
    });
  }
  return rows;
}

// ─── Title pools per career stage ────────────────────────────────────────────
const EARLY_TITLES = [
  "Junior Developer","Software Engineer","Graduate Analyst","Marketing Assistant",
  "Data Analyst","UX Designer","Junior Consultant","Associate","Intern",
  "Trainee Accountant","Junior Product Designer","Frontend Developer","QA Engineer",
  "Content Writer","Social Media Coordinator","Research Assistant","Graduate Trainee",
  "Junior Project Manager","IT Support Analyst","Business Analyst","Technical Writer"
];

const MID_TITLES = [
  "Senior Software Engineer","Product Manager","Engineering Lead","Senior Analyst",
  "Head of Product","Director of Engineering","Senior Consultant","Manager",
  "Principal Engineer","VP Engineering","Senior Product Manager","Technical Lead",
  "Chief Technology Officer","Solutions Architect","Senior Data Scientist",
  "UX Lead","DevOps Lead","Scrum Master","Agile Coach","Senior Designer",
  "Account Manager","Senior Account Executive","Business Development Manager",
  "Regional Director","Head of Sales","Marketing Manager","Brand Director",
  "Senior HR Business Partner","Talent Acquisition Lead","People Operations Manager",
  "Finance Manager","Senior Financial Analyst","Investment Associate","Portfolio Manager",
  "Founder","Co-Founder","Managing Director","CEO","COO","CFO",
  "Associate Director","Programme Manager","Delivery Lead","Engineering Manager"
];

const LATE_TITLES = [
  "CEO","CFO","CTO","COO","Chief People Officer","Chief Strategy Officer",
  "Managing Director","Founder","Co-Founder","Chairman","President",
  "VP People & Culture","VP Strategy","VP Operations","SVP Consulting",
  "Director of OD","Director of L&D","Director of HR","Director of Talent",
  "Partner","Senior Partner","Managing Partner","Associate Partner",
  "Head of Consulting","Head of People Analytics","Head of Transformation",
  "Senior Consultant","Principal Consultant","Management Consultant",
  "Non-Executive Director","Board Advisor","Trustee",
  "Professor","Associate Professor","Visiting Fellow","Research Director",
  "Senior Manager","Programme Director","Transformation Director",
  "Executive Coach","Leadership Coach","Organisational Psychologist",
  "Independent Consultant","Advisory Board Member","Interim CHRO"
];

// ─── Persona definitions ────────────────────────────────────────────────────
const PERSONAS = {
  early: {
    name: "early-career-export",
    profile: {
      "First Name": "Maya", "Last Name": "Chen", "Maiden Name": "",
      "Address": "Manchester, UK", "Birth Date": "15 Jun 2001",
      "Headline": "Junior Frontend Developer | React & TypeScript | University of Manchester BSc CS 2024",
      "Summary": "Recent computer science graduate passionate about building beautiful, accessible web applications. Currently working at a Manchester-based startup building fintech products with React, TypeScript, and Node.js. Looking to grow into a senior engineering role.",
      "Industry": "Information Technology & Services",
      "Zip Code": "M1 1AD", "Geo Location": "Manchester, Greater Manchester, United Kingdom",
      "Twitter Handles": "@mayachen_dev", "Websites": "https://mayachen.dev"
    },
    registration: "2024-03-15",
    connectionCount: 50,
    connStartYear: 2024, connEndYear: 2026,
    connTitles: EARLY_TITLES,
    positions: [
      { "Company Name": "Digital Spark Agency", "Title": "Frontend Development Intern", "Description": "Built responsive landing pages and email templates for agency clients using HTML, CSS, and JavaScript. Collaborated with senior developers on React component library.", "Location": "Manchester, UK", "Started On": "Jun 2023", "Finished On": "Aug 2023" },
      { "Company Name": "Finley Technologies", "Title": "Junior Frontend Developer", "Description": "Developing customer-facing fintech dashboards using React 18, TypeScript, and Tailwind CSS. Implemented real-time data visualisation features and reduced page load times by 40%.", "Location": "Manchester, UK", "Started On": "Sep 2024", "Finished On": "" },
    ],
    education: [
      { "School Name": "University of Manchester", "Degree Name": "BSc Computer Science", "Start Date": "2020", "End Date": "2024" },
    ],
    certifications: [
      { "Name": "Google Analytics Certification", "Authority": "Google", "Started On": "Mar 2025" },
    ],
    skills: pickN([...TECH_SKILLS], 8),
    endorsementCount: 5,
    endorsementGivenCount: 3,
    messageCount: 20,
    msgStartYear: 2025, msgEndYear: 2026, msgConversations: 5,
    invitationCount: 40,
    invStartYear: 2024, invEndYear: 2026,
    recsReceived: [
      { "Recommender First Name": "David", "Recommender Last Name": "Harrison", "Recommender Company": "Digital Spark Agency", "Recommender Title": "Creative Director", "Text": "Maya was an outstanding intern. She picked up React faster than anyone I've seen and delivered pixel-perfect work consistently. Her attention to accessibility was impressive for someone at her career stage.", "Creation Date": "Sep 2023", "Status": "VISIBLE" },
    ],
    recsGiven: [],
    learningCount: 3,
    richMediaCount: 2,
    receiptsCount: 0,
    savedJobsCount: 15,
    savedJobTitles: ["Graduate Frontend Developer","Junior React Developer","Graduate Software Engineer","Junior Web Developer","Entry Level Developer","Graduate UX Engineer","Junior Full Stack Developer","Frontend Developer","Junior JavaScript Developer","Graduate Data Analyst","Junior Product Designer","Web Developer","Software Engineer Graduate","Frontend Engineer","UI Developer"],
    jobAppCount: 25,
    jobAppTitles: ["Graduate Frontend Developer","Junior React Developer","Graduate Software Engineer","Junior Web Developer","Entry Level Developer","Graduate UX Engineer","Junior Full Stack Developer","Frontend Developer","Junior JavaScript Developer","Graduate Data Analyst","Junior Product Designer","Web Developer","Software Engineer Graduate","Frontend Engineer","UI Developer","Junior DevOps Engineer","Graduate Cloud Engineer","Technical Support Analyst","Junior QA Engineer","Software Tester","Junior Systems Engineer","Graduate Developer","Application Developer","IT Graduate","Web Application Developer"],
    savedJobAlerts: ["Frontend Developer Manchester","Junior React Developer UK","Graduate Software Engineer","Entry Level Tech Manchester"],
    companyFollowCount: 10,
    eventCount: 2,
    guideMessageCount: 3,
    coachMessageCount: 5,
    jobSeekerPrefs: {
      "Locations": "Manchester; London; Remote",
      "Industries": "Information Technology; Software Development",
      "Preferred Job Types": "Full-time",
      "Job Titles": "Frontend Developer; React Developer; Software Engineer",
      "Open To Recruiters": "Yes",
      "Dream Companies": "Revolut; Monzo; Deliveroo; Spotify; Shopify",
      "Job Seeker Activity Level": "Active",
      "Job Seeking Urgency Level": "Open to opportunities",
      "Company Employee Count": "11-50; 51-200; 201-500",
      "Preferred Start Time Range": "Immediately",
      "Commute Preference Starting Address": "Manchester, UK",
      "Maximum Commute Duration": "45 minutes"
    },
    privateAssetCount: 1,
    verificationCount: 0,
    providerCount: 0,
    adTargeting: {
      "Member Age": "18-24",
      "Member Gender": "Female",
      "Job Seniorities": "Entry; Junior",
      "Job Functions": "Engineering; Information Technology",
      "Job Titles": "Frontend Developer; Software Engineer",
      "Company Industries": "Computer Software; Internet",
      "Member Interests": "Web Development; React; JavaScript",
      "Buyer Groups": "IT Decision Maker",
      "Member Traits": "Frequent LinkedIn User; Job Seeker",
      "High Value Audience Segments": "Recent Graduate",
      "Member Skills": "JavaScript; React; CSS",
      "Fields of Study": "Computer Science",
      "Member Schools": "University of Manchester",
      "Company Size": "11-50 employees",
      "Company Revenue": "Under 1M",
      "Years of Experience": "1-2 years",
      "Profile Locations": "Manchester, United Kingdom",
      "Member Groups": "Manchester Tech Community; React Developers UK",
      "Company Follower of": "Revolut; Monzo",
      "Company Connections": "Finley Technologies"
    },
    inferences: [
      "Likely to engage with job ads",
      "Interested in software development",
      "Active job seeker",
      "Early career professional",
      "Tech industry interest"
    ],
  },

  mid: {
    name: "mid-career-export",
    profile: {
      "First Name": "James", "Last Name": "Okoye", "Maiden Name": "",
      "Address": "London, UK", "Birth Date": "22 Nov 1991",
      "Headline": "Senior Product Manager at Checkout.com | ex-Barclays, Deloitte | MBA London Business School",
      "Summary": "Product leader with 10+ years experience spanning consulting, banking, and fintech. I build products that bridge complex financial infrastructure with consumer-grade UX. MBA from London Business School. Previously Deloitte and Barclays. Passionate about financial inclusion and emerging markets.",
      "Industry": "Financial Services",
      "Zip Code": "EC2A 1NT", "Geo Location": "London, Greater London, United Kingdom",
      "Twitter Handles": "@jamesokoye", "Websites": "https://jamesokoye.com"
    },
    registration: "2018-06-20",
    connectionCount: 800,
    connStartYear: 2018, connEndYear: 2026,
    connTitles: MID_TITLES,
    positions: [
      { "Company Name": "Deloitte", "Title": "Business Analyst", "Description": "Supported digital transformation projects for FTSE 250 financial services clients. Conducted stakeholder interviews, mapped processes, and delivered recommendations.", "Location": "London, UK", "Started On": "Sep 2014", "Finished On": "Aug 2016" },
      { "Company Name": "Deloitte", "Title": "Senior Consultant", "Description": "Led workstreams on large-scale banking transformation programmes. Managed teams of 3-5 analysts. Specialised in payments and open banking.", "Location": "London, UK", "Started On": "Sep 2016", "Finished On": "Jun 2018" },
      { "Company Name": "Barclays", "Title": "Product Owner — Digital Payments", "Description": "Owned the mobile payments product backlog. Launched contactless payment features used by 2M+ customers. Worked closely with engineering, design, and compliance.", "Location": "Singapore", "Started On": "Jul 2018", "Finished On": "Dec 2020" },
      { "Company Name": "Wise", "Title": "Product Manager — Business Accounts", "Description": "Led the business accounts product for APAC and US markets. Grew B2B revenue by 35% YoY through pricing optimisation and feature launches.", "Location": "New York, NY, USA", "Started On": "Jan 2021", "Finished On": "Aug 2023" },
      { "Company Name": "Checkout.com", "Title": "Senior Product Manager — Merchant Experience", "Description": "Leading merchant onboarding and dashboard experience for enterprise clients. Managing a cross-functional squad of 12. Driving platform adoption metrics.", "Location": "London, UK", "Started On": "Sep 2023", "Finished On": "" },
    ],
    education: [
      { "School Name": "University of Warwick", "Degree Name": "BSc Business Management", "Start Date": "2010", "End Date": "2013" },
      { "School Name": "London Business School", "Degree Name": "MBA", "Start Date": "2016", "End Date": "2018" },
    ],
    certifications: [
      { "Name": "Project Management Professional (PMP)", "Authority": "PMI", "Started On": "Jun 2019" },
      { "Name": "AWS Solutions Architect Associate", "Authority": "Amazon Web Services", "Started On": "Mar 2022" },
      { "Name": "Certified Scrum Product Owner (CSPO)", "Authority": "Scrum Alliance", "Started On": "Nov 2024" },
    ],
    skills: pickN([...TECH_SKILLS, ...BUSINESS_SKILLS], 25),
    endorsementCount: 80,
    endorsementGivenCount: 35,
    messageCount: 500,
    msgStartYear: 2019, msgEndYear: 2026, msgConversations: 80,
    invitationCount: 600,
    invStartYear: 2018, invEndYear: 2026,
    recsReceived: [
      { "Recommender First Name": "Sarah", "Recommender Last Name": "Patterson", "Recommender Company": "Deloitte", "Recommender Title": "Partner", "Text": "James is one of the strongest consultants I've managed. He combines rigorous analytical thinking with genuine empathy for clients. His ability to simplify complex problems and communicate solutions clearly made him invaluable on our banking transformation programmes.", "Creation Date": "Jul 2018", "Status": "VISIBLE" },
      { "Recommender First Name": "Michael", "Recommender Last Name": "Torres", "Recommender Company": "Barclays", "Recommender Title": "Head of Digital Products", "Text": "James transformed our mobile payments product. He brought a rare combination of technical understanding and customer obsession that resulted in measurable improvements to NPS and transaction volumes. A natural product leader.", "Creation Date": "Jan 2021", "Status": "VISIBLE" },
      { "Recommender First Name": "Anya", "Recommender Last Name": "Petrov", "Recommender Company": "Wise", "Recommender Title": "VP Product", "Text": "I hired James to lead our business accounts product and he exceeded every expectation. His 35% revenue growth wasn't luck — it came from deep customer research and smart prioritisation. Would work with him again in a heartbeat.", "Creation Date": "Sep 2023", "Status": "VISIBLE" },
      { "Recommender First Name": "David", "Recommender Last Name": "Obi", "Recommender Company": "London Business School", "Recommender Title": "Professor of Strategy", "Text": "James was an exceptional MBA student who consistently brought practical insights from his consulting background into classroom discussions. His final project on financial inclusion in West Africa was one of the strongest I've supervised.", "Creation Date": "Jun 2018", "Status": "VISIBLE" },
    ],
    recsGiven: [
      { "Recommender First Name": "James", "Recommender Last Name": "Okoye", "Recommender Company": "Checkout.com", "Recommender Title": "Senior Product Manager", "Text": "Brilliant engineer who consistently delivered high-quality work.", "Creation Date": "Mar 2024", "Status": "VISIBLE" },
      { "Recommender First Name": "James", "Recommender Last Name": "Okoye", "Recommender Company": "Checkout.com", "Recommender Title": "Senior Product Manager", "Text": "Outstanding designer with a keen eye for detail.", "Creation Date": "Jun 2024", "Status": "VISIBLE" },
    ],
    learningCount: 15,
    richMediaCount: 10,
    receiptsCount: 12,
    receiptsStartYear: 2023,
    savedJobsCount: 8,
    savedJobTitles: ["VP Product","Director of Product","Head of Product","Senior Product Manager","Chief Product Officer","Product Director","Group Product Manager","Principal PM"],
    jobAppCount: 6,
    jobAppTitles: ["Head of Product — Fintech","VP Product — Payments","Senior PM — Enterprise","Director Product Management","Product Lead — Financial Services","Head of Product Experience"],
    savedJobAlerts: ["Senior Product Manager London","Head of Product Fintech","VP Product Payments","Director Product London"],
    companyFollowCount: 40,
    eventCount: 8,
    guideMessageCount: 10,
    coachMessageCount: 8,
    jobSeekerPrefs: {
      "Locations": "London; Remote; Amsterdam",
      "Industries": "Financial Services; Computer Software; Payments",
      "Preferred Job Types": "Full-time",
      "Job Titles": "VP Product; Director Product; Head of Product; Senior PM",
      "Open To Recruiters": "Yes",
      "Dream Companies": "Stripe; Adyen; Square; Revolut; Wise; Plaid",
      "Job Seeker Activity Level": "Passively looking",
      "Job Seeking Urgency Level": "Open to opportunities",
      "Company Employee Count": "201-500; 501-1000; 1001-5000",
      "Preferred Start Time Range": "Within 3 months",
      "Commute Preference Starting Address": "London, UK",
      "Maximum Commute Duration": "60 minutes"
    },
    privateAssetCount: 2,
    verificationCount: 1,
    providerCount: 0,
    adTargeting: {
      "Member Age": "25-34",
      "Member Gender": "Male",
      "Job Seniorities": "Senior; Manager; Director",
      "Job Functions": "Product Management; Business Development; Strategy; Engineering; Operations",
      "Job Titles": "Senior Product Manager; Product Lead; Product Owner; Business Analyst",
      "Company Industries": "Financial Services; Computer Software; Internet; Payments",
      "Member Interests": "Fintech; Payments; Product Management; Digital Transformation; Open Banking",
      "Buyer Groups": "IT Decision Maker; Business Decision Maker; Finance Decision Maker",
      "Member Traits": "Frequent LinkedIn User; Open to Work; MBA Graduate; Active Networker",
      "High Value Audience Segments": "Business Decision Maker; Finance Professional; MBA Alumni",
      "Member Skills": "Product Management; Agile; Scrum; SQL; Data Analysis; Stakeholder Management; Payments",
      "Fields of Study": "Business Management; MBA",
      "Member Schools": "University of Warwick; London Business School",
      "Company Size": "1001-5000 employees; 5001-10000 employees",
      "Company Revenue": "100M-500M",
      "Years of Experience": "8-10 years",
      "Profile Locations": "London, United Kingdom",
      "Member Groups": "Product Management UK; Fintech Founders; LBS Alumni Network; Payments Innovation Forum",
      "Company Follower of": "Checkout.com; Stripe; Wise; Revolut; Adyen",
      "Company Connections": "Deloitte; Barclays; Wise; Checkout.com"
    },
    inferences: [
      "Product management professional",
      "Interested in fintech",
      "Likely to engage with B2B content",
      "Finance industry professional",
      "MBA graduate",
      "Open to senior roles",
      "Active networker",
      "Payments industry expert",
      "Digital transformation interest",
      "London-based professional",
      "Business decision maker",
      "Scale-up experience",
      "Cross-functional leader",
      "Data-driven decision maker",
      "Agile practitioner",
      "Financial inclusion advocate",
      "Emerging markets interest",
      "Enterprise product experience",
      "SaaS industry knowledge",
      "Platform thinking"
    ],
  },

  late: {
    name: "late-career-export",
    profile: {
      "First Name": "Sarah", "Last Name": "Whitfield", "Maiden Name": "Carter",
      "Address": "Oxford, UK", "Birth Date": "03 Sep 1973",
      "Headline": "Independent OD Consultant | NED | PhD Organisational Psychology | ex-McKinsey, Mercer",
      "Summary": "I help organisations navigate complex change. With 25+ years spanning academic research, Big 4 consulting, and independent practice, I specialise in leadership development, culture transformation, and executive assessment. PhD in Organisational Psychology from UCL. Non-Executive Director at two FTSE 250 companies. Former Partner at Mercer. Author of 'The Adaptive Organisation' (Routledge, 2019). Fellow of the CIPD and BPS.",
      "Industry": "Management Consulting",
      "Zip Code": "OX1 2JD", "Geo Location": "Oxford, Oxfordshire, United Kingdom",
      "Twitter Handles": "@drwhitfield_od", "Websites": "https://whitfieldconsulting.co.uk;https://theadaptiveorganisation.com"
    },
    registration: "2008-01-10",
    connectionCount: 3500,
    connStartYear: 2008, connEndYear: 2026,
    connTitles: LATE_TITLES,
    positions: [
      { "Company Name": "University College London", "Title": "Research Associate — Organisational Psychology", "Description": "Conducted doctoral and post-doctoral research on adaptive leadership in VUCA environments. Published 4 peer-reviewed papers.", "Location": "London, UK", "Started On": "Sep 1998", "Finished On": "Aug 2002" },
      { "Company Name": "Hay Group", "Title": "Consultant — Leadership & Talent", "Description": "Delivered leadership assessment and development programmes for FTSE 100 clients. Specialised in psychometric design and 360 feedback.", "Location": "London, UK", "Started On": "Sep 2002", "Finished On": "Dec 2005" },
      { "Company Name": "McKinsey & Company", "Title": "Associate — Organisation Practice", "Description": "Advised C-suite clients on organisational design, culture change, and post-merger integration. Led teams of 4-8 across UK and European engagements.", "Location": "Dubai, United Arab Emirates", "Started On": "Jan 2006", "Finished On": "Jun 2009" },
      { "Company Name": "McKinsey & Company", "Title": "Engagement Manager — People & Organisation", "Description": "Managed complex multi-workstream engagements. Built McKinsey's UK capability in leadership assessment and executive team effectiveness.", "Location": "Singapore", "Started On": "Jul 2009", "Finished On": "Dec 2011" },
      { "Company Name": "Mercer", "Title": "Principal — Talent Strategy", "Description": "Led Mercer's UK talent strategy practice. Built and managed a team of 15 consultants. Grew practice revenue from £4M to £12M over 4 years.", "Location": "Sydney, Australia", "Started On": "Jan 2012", "Finished On": "Jun 2015" },
      { "Company Name": "Mercer", "Title": "Partner — People Strategy & Transformation", "Description": "Senior client relationship partner for 8 FTSE 100 accounts. Led Mercer's European thought leadership on future of work. Member of global leadership team.", "Location": "New York, NY, USA", "Started On": "Jul 2015", "Finished On": "Dec 2018" },
      { "Company Name": "Whitfield Consulting", "Title": "Founder & Managing Director", "Description": "Independent organisational development consultancy. Working with FTSE 250 and PE-backed companies on leadership, culture, and transformation. Published 'The Adaptive Organisation' (Routledge, 2019).", "Location": "Oxford, UK", "Started On": "Jan 2019", "Finished On": "" },
      { "Company Name": "Renewables UK Holdings plc", "Title": "Non-Executive Director", "Description": "Member of Board, Remuneration Committee Chair. Providing governance oversight and strategic counsel on people, culture, and ESG.", "Location": "London, UK", "Started On": "Apr 2020", "Finished On": "" },
      { "Company Name": "HealthBridge Group plc", "Title": "Non-Executive Director", "Description": "Member of Board and Nomination Committee. Advising on executive succession, board effectiveness, and organisational resilience.", "Location": "Manchester, UK", "Started On": "Sep 2021", "Finished On": "" },
      { "Company Name": "University of Oxford — Saïd Business School", "Title": "Visiting Fellow — Organisational Behaviour", "Description": "Teaching executive education programmes on adaptive leadership and culture change. Contributing to research on post-pandemic organisational design.", "Location": "Oxford, UK", "Started On": "Jan 2022", "Finished On": "" },
      { "Company Name": "Korn Ferry", "Title": "Senior Advisor — Board & CEO Services", "Description": "Advisory role supporting Korn Ferry's UK board practice with CEO succession and board effectiveness engagements.", "Location": "London, UK", "Started On": "Mar 2023", "Finished On": "" },
    ],
    education: [
      { "School Name": "University of Edinburgh", "Degree Name": "BSc Psychology", "Start Date": "1991", "End Date": "1995" },
      { "School Name": "University of Bath", "Degree Name": "MSc Organisational Psychology", "Start Date": "1996", "End Date": "1997" },
      { "School Name": "University College London", "Degree Name": "PhD Organisational Psychology", "Start Date": "1998", "End Date": "2002" },
      { "School Name": "INSEAD", "Degree Name": "Executive Education — Leading Organisations", "Start Date": "2014", "End Date": "2014" },
    ],
    certifications: [
      { "Name": "Chartered Psychologist (CPsychol)", "Authority": "British Psychological Society", "Started On": "Jun 2004" },
      { "Name": "Fellow — CIPD", "Authority": "Chartered Institute of Personnel and Development", "Started On": "Mar 2010" },
      { "Name": "Hogan Assessment Certification", "Authority": "Hogan Assessments", "Started On": "Sep 2003" },
      { "Name": "MBTI Master Practitioner", "Authority": "The Myers-Briggs Company", "Started On": "Feb 2005" },
      { "Name": "ICF Professional Certified Coach (PCC)", "Authority": "International Coaching Federation", "Started On": "Nov 2016" },
      { "Name": "IoD Certificate in Company Direction", "Authority": "Institute of Directors", "Started On": "Jan 2020" },
    ],
    skills: pickN([...BUSINESS_SKILLS], 50),
    endorsementCount: 350,
    endorsementGivenCount: 120,
    messageCount: 2000,
    msgStartYear: 2010, msgEndYear: 2026, msgConversations: 300,
    invitationCount: 2500,
    invStartYear: 2008, invEndYear: 2026,
    recsReceived: [
      { "Recommender First Name": "Richard", "Recommender Last Name": "Hargreaves", "Recommender Company": "McKinsey & Company", "Recommender Title": "Senior Partner", "Text": "Sarah is one of the most talented organisation consultants I have worked with in 30 years at McKinsey. Her ability to combine rigorous research with practical executive insight is exceptional. She built our UK leadership assessment capability virtually from scratch.", "Creation Date": "Jan 2012", "Status": "VISIBLE" },
      { "Recommender First Name": "Dame Patricia", "Recommender Last Name": "Hodgson", "Recommender Company": "Renewables UK Holdings", "Recommender Title": "Chairman", "Text": "Sarah brings extraordinary insight to our Board. Her combination of deep expertise in organisational behaviour with practical commercial acumen makes her an invaluable NED. She has been particularly effective as Remuneration Committee Chair.", "Creation Date": "Jan 2022", "Status": "VISIBLE" },
      { "Recommender First Name": "Kwame", "Recommender Last Name": "Asante", "Recommender Company": "Mercer", "Recommender Title": "CEO UK & Ireland", "Text": "During her 7 years at Mercer, Sarah transformed our talent strategy practice from a small team into a market-leading capability. Her thought leadership on the future of work positioned Mercer as the go-to advisor for FTSE boards. An exceptional leader and colleague.", "Creation Date": "Feb 2019", "Status": "VISIBLE" },
      { "Recommender First Name": "Professor", "Recommender Last Name": "Anne Cooke", "Recommender Company": "University College London", "Recommender Title": "Head of Organisational Psychology", "Text": "Sarah's doctoral work on adaptive leadership was genuinely original and has been widely cited. She combines intellectual rigour with a practical orientation that is rare in academia. I'm delighted she has continued to contribute to the field through her visiting fellowship at Oxford.", "Creation Date": "Mar 2015", "Status": "VISIBLE" },
      { "Recommender First Name": "Catherine", "Recommender Last Name": "Marks", "Recommender Company": "Barclays", "Recommender Title": "CHRO", "Text": "We engaged Sarah to lead our executive team effectiveness programme and the results were transformational. She has an uncanny ability to ask the questions others avoid. Our senior leadership team cohesion scores improved by 40% within 12 months.", "Creation Date": "Jun 2020", "Status": "VISIBLE" },
      { "Recommender First Name": "James", "Recommender Last Name": "Thornton", "Recommender Company": "PE Capital Partners", "Recommender Title": "Managing Partner", "Text": "Sarah has been our go-to advisor for leadership due diligence on portfolio company acquisitions. Her assessments have been consistently accurate and her recommendations practical. She has saved us from at least two problematic CEO appointments.", "Creation Date": "Nov 2021", "Status": "VISIBLE" },
      { "Recommender First Name": "Dr", "Recommender Last Name": "Ingrid Svensson", "Recommender Company": "INSEAD", "Recommender Title": "Professor of Leadership", "Text": "I have known Sarah since she attended our executive programme in 2014. She is one of those rare practitioners who can bridge the gap between academic research and executive practice. Her book 'The Adaptive Organisation' is essential reading.", "Creation Date": "Apr 2020", "Status": "VISIBLE" },
      { "Recommender First Name": "Martin", "Recommender Last Name": "Fletcher", "Recommender Company": "HealthBridge Group", "Recommender Title": "CEO", "Text": "Sarah joined our Board at a critical time during the post-pandemic restructuring. Her advice on organisational design and leadership capability was instrumental in our successful turnaround. She combines wisdom with warmth.", "Creation Date": "Mar 2023", "Status": "VISIBLE" },
      { "Recommender First Name": "Priya", "Recommender Last Name": "Krishnamurthy", "Recommender Company": "Whitfield Consulting", "Recommender Title": "Associate Director", "Text": "Working with Sarah has been the most developmental experience of my career. She is a brilliant mentor who gives genuinely transformative feedback. Her client work is extraordinary — I've watched CEOs completely rethink their approach after a single session with her.", "Creation Date": "Jul 2022", "Status": "VISIBLE" },
      { "Recommender First Name": "Oliver", "Recommender Last Name": "Pemberton", "Recommender Company": "Hay Group (now Korn Ferry)", "Recommender Title": "Managing Director UK", "Text": "I hired Sarah early in her consulting career and she was immediately exceptional. Her psychometric expertise and client presence were well beyond her experience level. Not surprised she has gone on to achieve so much.", "Creation Date": "May 2012", "Status": "VISIBLE" },
    ],
    recsGiven: [
      { "Recommender First Name": "Sarah", "Recommender Last Name": "Whitfield", "Recommender Company": "Whitfield Consulting", "Recommender Title": "Founder", "Text": "An exceptional talent with deep expertise.", "Creation Date": "Mar 2020", "Status": "VISIBLE" },
      { "Recommender First Name": "Sarah", "Recommender Last Name": "Whitfield", "Recommender Company": "Whitfield Consulting", "Recommender Title": "Founder", "Text": "One of the finest leaders I have had the privilege of working alongside.", "Creation Date": "Jun 2021", "Status": "VISIBLE" },
      { "Recommender First Name": "Sarah", "Recommender Last Name": "Whitfield", "Recommender Company": "Whitfield Consulting", "Recommender Title": "Founder", "Text": "A brilliant researcher with genuine practical impact.", "Creation Date": "Sep 2019", "Status": "VISIBLE" },
      { "Recommender First Name": "Sarah", "Recommender Last Name": "Whitfield", "Recommender Company": "Whitfield Consulting", "Recommender Title": "Founder", "Text": "Outstanding consultant who consistently exceeds expectations.", "Creation Date": "Jan 2022", "Status": "VISIBLE" },
      { "Recommender First Name": "Sarah", "Recommender Last Name": "Whitfield", "Recommender Company": "Whitfield Consulting", "Recommender Title": "Founder", "Text": "Exceptional professional with a rare combination of skills.", "Creation Date": "Apr 2023", "Status": "VISIBLE" },
    ],
    learningCount: 40,
    richMediaCount: 30,
    receiptsCount: 60,
    receiptsStartYear: 2012,
    savedJobsCount: 3,
    savedJobTitles: ["Non-Executive Director","Board Advisor — FTSE 250","Advisory Board Member"],
    jobAppCount: 2,
    jobAppTitles: ["Non-Executive Director — NHS Trust","Chair — Charity Board"],
    savedJobAlerts: ["NED Opportunities UK","Board Advisory Roles"],
    companyFollowCount: 80,
    eventCount: 20,
    guideMessageCount: 0,
    coachMessageCount: 0,
    jobSeekerPrefs: {
      "Locations": "London; Oxford; Remote",
      "Industries": "Management Consulting; Human Resources; Executive Offices",
      "Preferred Job Types": "Part-time; Contract; Board/NED",
      "Job Titles": "Non-Executive Director; Board Advisor; Senior Advisor; Visiting Professor",
      "Open To Recruiters": "Selectively",
      "Dream Companies": "John Lewis Partnership; Wellcome Trust; British Museum; NHS England",
      "Job Seeker Activity Level": "Not actively looking",
      "Job Seeking Urgency Level": "Open to the right opportunity",
      "Company Employee Count": "5001-10000; 10001+",
      "Preferred Start Time Range": "Flexible",
      "Commute Preference Starting Address": "Oxford, UK",
      "Maximum Commute Duration": "90 minutes"
    },
    privateAssetCount: 4,
    verificationCount: 2,
    providerCount: 2,
    adTargeting: {
      "Member Age": "45-54",
      "Member Gender": "Female",
      "Job Seniorities": "VP; Director; CXO; Partner; Owner; Senior",
      "Job Functions": "Human Resources; Consulting; Education; Research; General Management; Business Development; Strategy",
      "Job Titles": "Managing Director; Founder; Non-Executive Director; Partner; Consultant; Visiting Fellow; Senior Advisor; Organisational Psychologist; Executive Coach; Board Advisor",
      "Company Industries": "Management Consulting; Human Resources; Staffing & Recruiting; Professional Training & Coaching; Higher Education; Hospital & Health Care; Oil & Energy; Financial Services",
      "Member Interests": "Leadership Development; Organisational Development; Executive Coaching; Board Governance; ESG; Future of Work; Psychometrics; Talent Management; Culture Change; Diversity Equity and Inclusion; Employee Engagement; Succession Planning; Post-Merger Integration; Digital Transformation; Workforce Analytics; Adaptive Leadership; Resilience; Wellbeing at Work; Hybrid Work; Purpose-Driven Leadership",
      "Buyer Groups": "C-Suite; HR Decision Maker; Board Member; Business Decision Maker; Consulting Buyer",
      "Member Traits": "Long-time LinkedIn Member; Thought Leader; Content Creator; Premium Subscriber; Influencer; Published Author; Speaker; Academic",
      "High Value Audience Segments": "C-Suite; Board Director; Management Consultant; Business Owner; HR Leader; Thought Leader",
      "Member Skills": "Organisational Development; Leadership Development; Executive Coaching; Change Management; Talent Management; Psychometrics; Board Governance; Strategic Planning; Succession Planning; Culture Transformation; Organisation Design; Executive Assessment; Stakeholder Management; Facilitation; 360 Feedback; Employee Engagement; Workforce Planning; Learning & Development; Team Effectiveness; Performance Management",
      "Fields of Study": "Psychology; Organisational Psychology; Business Administration",
      "Member Schools": "University of Edinburgh; University of Bath; University College London; INSEAD",
      "Company Size": "Self-employed; 1-10 employees; 1001-5000 employees; 5001-10000 employees",
      "Company Revenue": "1M-10M; 500M-1B",
      "Years of Experience": "20+ years",
      "Profile Locations": "Oxford, United Kingdom; London, United Kingdom",
      "Member Groups": "CIPD Senior Leaders; BPS Division of Occupational Psychology; IoD Members; McKinsey Alumni; Mercer Alumni; INSEAD Alumni; Women on Boards UK; NED Network; Oxford Business Network; Future of Work Forum; HR Directors Forum; Executive Coaching Network",
      "Company Follower of": "McKinsey & Company; Mercer; Korn Ferry; Harvard Business Review; CIPD; Financial Times; The Economist; London Business School; Oxford Said Business School; INSEAD",
      "Company Connections": "Whitfield Consulting; McKinsey & Company; Mercer; Korn Ferry; UCL"
    },
    inferences: [
      "Senior executive",
      "Management consulting background",
      "Human resources expertise",
      "Likely board member or advisor",
      "Published author",
      "Academic connections",
      "Executive coaching professional",
      "UK-based professional",
      "High engagement with thought leadership content",
      "Organisational development specialist",
      "Change management expert",
      "Leadership development professional",
      "Psychometrics practitioner",
      "Financial services industry knowledge",
      "Healthcare industry knowledge",
      "Energy sector interest",
      "ESG and sustainability interest",
      "Diversity and inclusion advocate",
      "Future of work thought leader",
      "Premium LinkedIn subscriber",
      "Frequent content creator",
      "Conference speaker",
      "Professional certification holder",
      "Alumni network active member",
      "Non-executive director",
      "Governance expertise",
      "Talent strategy professional",
      "Culture transformation specialist",
      "Post-merger integration experience",
      "Executive assessment specialist",
      "Team effectiveness consultant",
      "Succession planning advisor",
      "Large enterprise experience",
      "Multi-industry experience",
      "Cross-border consulting experience",
      "Research background",
      "Quantitative and qualitative research",
      "Stakeholder management expert",
      "Client relationship management",
      "Practice building experience",
      "Revenue growth track record",
      "Thought leadership creator",
      "Mentoring and development",
      "Professional body fellow",
      "PhD holder",
      "Executive education teacher",
      "Strategic advisor",
      "Private equity advisory",
      "Workforce analytics interest",
      "Hybrid work strategy"
    ],
  },
};


// ─── CSV generators for each file type ───────────────────────────────────────

function generateMessages(count, startYear, endYear, numConversations, profileName) {
  const headers = ["FROM","TO","DATE","SUBJECT","CONTENT","FOLDER","CONVERSATION ID"];
  const rows = [];
  const subjects = [
    "Great connecting!","Quick question","Following up","Introduction","Opportunity",
    "Congratulations!","Coffee chat?","Referral","Project discussion","Feedback request",
    "Re: Collaboration","Speaking opportunity","Partnership proposal","Job opportunity",
    "Catch up","Thanks","Event invitation","Article you might like","Recommendation request",
    "Happy holidays","Industry insights","Upcoming conference","Team update","Proposal review"
  ];
  const contents = [
    "Hi, great to connect with you!",
    "Thanks for accepting my connection request.",
    "I'd love to learn more about your work at the company.",
    "Would you be free for a quick call next week?",
    "I came across your profile and thought we might have some common interests.",
    "Congratulations on your new role!",
    "Thanks for the introduction — really appreciate it.",
    "I wanted to follow up on our conversation from last week.",
    "Would you be open to grabbing a coffee sometime?",
    "I thought you might find this article interesting.",
    "Thanks for the recommendation — it means a lot.",
    "I'd be happy to help with that.",
    "Looking forward to connecting further.",
    "Let me know if there's anything I can help with.",
    "Great chatting with you at the event.",
  ];

  const conversationIds = [];
  for (let i = 0; i < numConversations; i++) {
    conversationIds.push(`conv-${randInt(100000,999999)}`);
  }

  for (let i = 0; i < count; i++) {
    const name = generateName();
    const isSent = rand() > 0.5;
    const convId = pick(conversationIds);
    const date = randomDate(startYear, endYear);

    rows.push({
      "FROM": isSent ? `${profileName.first} ${profileName.last}` : `${name.first} ${name.last}`,
      "TO": isSent ? `${name.first} ${name.last}` : `${profileName.first} ${profileName.last}`,
      "DATE": `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")} ${String(randInt(8,22)).padStart(2,"0")}:${String(randInt(0,59)).padStart(2,"0")}:${String(randInt(0,59)).padStart(2,"0")} UTC`,
      "SUBJECT": pick(subjects),
      "CONTENT": pick(contents),
      "FOLDER": isSent ? "SENT" : "INBOX",
      "CONVERSATION ID": convId,
    });
  }
  return toCSV(headers, rows);
}

function generateInvitations(count, startYear, endYear, profileName) {
  const headers = ["From","To","Sent At","Message","Direction"];
  const rows = [];
  const messages = [
    "I'd like to add you to my professional network.",
    "Hi, I came across your profile and would love to connect.",
    "We met at the conference last week — great to connect!",
    "I'm interested in your work and would like to connect.",
    "",
    "Fellow alumnus here — would love to connect!",
    "We have mutual connections and I'd love to be in touch.",
    "",
    "I admire your work at the company. Let's connect!",
    "",
  ];
  for (let i = 0; i < count; i++) {
    const name = generateName();
    const isOutgoing = rand() > 0.4;
    const date = randomDate(startYear, endYear);
    rows.push({
      "From": isOutgoing ? `${profileName.first} ${profileName.last}` : `${name.first} ${name.last}`,
      "To": isOutgoing ? `${name.first} ${name.last}` : `${profileName.first} ${profileName.last}`,
      "Sent At": `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")} ${String(randInt(8,22)).padStart(2,"0")}:${String(randInt(0,59)).padStart(2,"0")}:${String(randInt(0,59)).padStart(2,"0")} UTC`,
      "Message": pick(messages),
      "Direction": isOutgoing ? "OUTGOING" : "INCOMING",
    });
  }
  return toCSV(headers, rows);
}

function generateEndorsementsReceived(count, connections, skills) {
  const headers = ["Skill Name","Endorser First Name","Endorser Last Name","Endorser Profile Url"];
  const rows = [];
  for (let i = 0; i < count; i++) {
    const conn = connections[i % connections.length];
    rows.push({
      "Skill Name": pick(skills),
      "Endorser First Name": conn["First Name"],
      "Endorser Last Name": conn["Last Name"],
      "Endorser Profile Url": conn["URL"],
    });
  }
  return toCSV(headers, rows);
}

function generateEndorsementsGiven(count, connections) {
  const headers = ["Endorsee First Name","Endorsee Last Name","Endorsee Profile Url"];
  const rows = [];
  for (let i = 0; i < count; i++) {
    const conn = connections[i % connections.length];
    rows.push({
      "Endorsee First Name": conn["First Name"],
      "Endorsee Last Name": conn["Last Name"],
      "Endorsee Profile Url": conn["URL"],
    });
  }
  return toCSV(headers, rows);
}

function generateLearning(count) {
  const headers = ["Content Title","Content Description","Content Last Watched Date (if viewed)","Content Completed At (if completed)"];
  const courses = [
    "Learning React.js","Advanced JavaScript","Python for Data Science","AWS Cloud Practitioner Essentials",
    "Machine Learning Foundations","Agile Project Management","Design Thinking","SQL Essential Training",
    "Git Essential Training","Docker Essential Training","Kubernetes Essential Training",
    "Leadership Foundations","Strategic Thinking","Negotiation Skills","Communication Foundations",
    "Product Management First Steps","UX Design Foundations","Data Visualization","Power BI Essential Training",
    "Emotional Intelligence","Managing Up","Giving and Receiving Feedback","Building Resilience",
    "Executive Presence","Board Governance Essentials","Coaching Skills for Leaders",
    "Change Management Foundations","Organisational Culture","Diversity Equity and Inclusion",
    "Financial Modelling","Valuation Fundamentals","M&A Strategy","ESG Fundamentals",
    "Cybersecurity Foundations","Cloud Architecture","Microservices","API Design",
    "Technical Writing","Public Speaking Foundations","Time Management","Presentation Design",
    "Advanced Excel","Tableau Essential Training","Google Analytics","SEO Foundations"
  ];
  const rows = [];
  const selected = pickN(courses, Math.min(count, courses.length));
  for (let i = 0; i < selected.length; i++) {
    const watchDate = randomDate(2020, 2026);
    const completed = rand() > 0.3;
    rows.push({
      "Content Title": selected[i],
      "Content Description": `Professional development course on ${selected[i].toLowerCase()}.`,
      "Content Last Watched Date (if viewed)": isoDate(watchDate),
      "Content Completed At (if completed)": completed ? isoDate(watchDate) : "",
    });
  }
  return toCSV(headers, rows);
}

function generateRichMedia(count) {
  const headers = ["Type","Date"];
  const types = ["IMAGE","DOCUMENT","VIDEO","PRESENTATION","LINK"];
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      "Type": pick(types),
      "Date": isoDate(randomDate(2018, 2026)),
    });
  }
  return toCSV(headers, rows);
}

function generateReceipts(count, startYear, currencies) {
  const headers = ["Amount","Currency","Date"];
  const rows = [];
  for (let i = 0; i < count; i++) {
    const currency = pick(currencies);
    const amount = currency === "GBP" ? "24.99" : "29.99";
    const year = startYear + Math.floor(i / 12);
    const month = (i % 12) + 1;
    rows.push({
      "Amount": amount,
      "Currency": currency,
      "Date": `${year}-${String(month).padStart(2,"0")}-15`,
    });
  }
  return toCSV(headers, rows);
}

function generateSavedJobs(titles) {
  const headers = ["Company Name","Job Title"];
  const rows = titles.map(t => ({
    "Company Name": pick(ALL_COMPANIES),
    "Job Title": t,
  }));
  return toCSV(headers, rows);
}

function generateJobApplications(titles) {
  const headers = ["Company Name","Job Title","Application Date"];
  const rows = titles.map(t => ({
    "Company Name": pick(ALL_COMPANIES),
    "Job Title": t,
    "Application Date": isoDate(randomDate(2020, 2026)),
  }));
  return toCSV(headers, rows);
}

function generateSavedJobAlerts(alerts) {
  const headers = ["Job Alert Name"];
  return toCSV(headers, alerts.map(a => ({ "Job Alert Name": a })));
}

function generateCompanyFollows(count) {
  const headers = ["Organization","Followed On"];
  const selected = pickN(ALL_COMPANIES, Math.min(count, ALL_COMPANIES.length));
  const rows = selected.map(c => ({
    "Organization": c,
    "Followed On": isoDate(randomDate(2015, 2026)),
  }));
  return toCSV(headers, rows);
}

function generateEvents(count) {
  const headers = ["Event Name","Event Time","Status"];
  const events = [
    "London Tech Week 2024","ProductCon London","Fintech Connect","Web Summit",
    "CogX Festival","UK Fintech Awards","London Blockchain Conference","SaaS Growth Summit",
    "HR Tech World","CIPD Annual Conference","Future of Work Summit","Leadership Forum",
    "Board Directors Conference","NED Networking Event","McKinsey Alumni Reunion",
    "Oxford Business Forum","Cambridge Innovation Summit","Manchester Digital Festival",
    "Bristol Tech Festival","Edinburgh Fringe Networking","AWS re:Invent Watch Party",
    "Google I/O Extended London","React London Meetup","Node.js Conference UK"
  ];
  const rows = pickN(events, Math.min(count, events.length)).map(e => ({
    "Event Name": e,
    "Event Time": `${isoDate(randomDate(2020, 2026))} 18:00:00 UTC`,
    "Status": pick(["ATTENDING","INTERESTED","ATTENDED"]),
  }));
  return toCSV(headers, rows);
}

function generateGuideMessages(count) {
  const headers = ["SUBJECT","CONTENT"];
  const messages = [
    { s: "Profile tips", c: "Consider adding more detail to your current role description to increase profile views." },
    { s: "Connection suggestions", c: "You might want to connect with professionals in your industry." },
    { s: "Skill endorsements", c: "Ask colleagues to endorse your top skills to strengthen your profile." },
    { s: "Job search tips", c: "Set up job alerts for roles matching your experience." },
    { s: "Content suggestions", c: "Sharing industry articles can increase your visibility." },
    { s: "Profile optimization", c: "Adding a professional headline can improve your search ranking." },
    { s: "Networking tips", c: "Engage with posts from your connections to stay visible." },
    { s: "Career development", c: "Complete a LinkedIn Learning course to add a certification to your profile." },
    { s: "Interview prep", c: "Practice common interview questions for your target role." },
    { s: "Profile completeness", c: "Your profile is 85% complete. Add volunteer experience to reach All-Star status." },
  ];
  const rows = pickN(messages, Math.min(count, messages.length)).map(m => ({
    "SUBJECT": m.s,
    "CONTENT": m.c,
  }));
  return toCSV(headers, rows);
}

function generateCoachMessages(count) {
  const headers = ["CONTENT"];
  const messages = [
    "Have you considered which skills are most in demand for your target role?",
    "Based on your learning history, you might enjoy this course on leadership.",
    "Many professionals in your field are upskilling in data analysis.",
    "Setting weekly learning goals can help you stay on track.",
    "Which area would you like to develop most: technical skills or leadership?",
    "Here's a learning path tailored to your career goals.",
    "Completing certifications can increase your profile visibility by 6x.",
    "Try dedicating 30 minutes per week to professional development.",
  ];
  const rows = pickN(messages, Math.min(count, messages.length)).map(m => ({
    "CONTENT": m,
  }));
  return toCSV(headers, rows);
}

function generatePrivateAssets(count) {
  const headers = ["File Name","File Size","Upload Date"];
  const names = ["CV_2024.pdf","Resume_v3.pdf","Cover_Letter_Template.docx","CV_Academic.pdf","CV_Board.pdf"];
  const rows = pickN(names, Math.min(count, names.length)).map(n => ({
    "File Name": n,
    "File Size": `${randInt(50,500)}KB`,
    "Upload Date": isoDate(randomDate(2020, 2026)),
  }));
  // Use a simple format — the app's parsePrivateAssets handles it
  return toCSV(headers, rows);
}

function generateVerifications(count) {
  const headers = ["Verification type","Organization name","Document type","Verification service provider","Verified date","Expiry date"];
  const verifs = [
    { type: "Education", org: "University of Warwick", doc: "Degree Certificate", provider: "Hedd", verified: "2023-05-10", expiry: "" },
    { type: "Employment", org: "Checkout.com", doc: "Employment Letter", provider: "Evident", verified: "2024-01-15", expiry: "2025-01-15" },
    { type: "Education", org: "University College London", doc: "PhD Certificate", provider: "Hedd", verified: "2020-03-20", expiry: "" },
    { type: "Professional Membership", org: "British Psychological Society", doc: "Membership Certificate", provider: "BPS", verified: "2022-06-01", expiry: "2025-06-01" },
  ];
  const rows = verifs.slice(0, count).map(v => ({
    "Verification type": v.type,
    "Organization name": v.org,
    "Document type": v.doc,
    "Verification service provider": v.provider,
    "Verified date": v.verified,
    "Expiry date": v.expiry,
  }));
  return toCSV(headers, rows);
}

function generateProviders(count) {
  const headers = ["ProFinder Service Category","Secondary Service Category","Available to Work Remotely","Status","Creation Time"];
  const providers = [
    { cat: "Executive Coaching", secondary: "Leadership Development", remote: "Yes", status: "Active", time: "2019-06-15 10:00:00 UTC" },
    { cat: "Management Consulting", secondary: "Organisational Development", remote: "Yes", status: "Active", time: "2020-01-20 14:00:00 UTC" },
  ];
  const rows = providers.slice(0, count).map(p => ({
    "ProFinder Service Category": p.cat,
    "Secondary Service Category": p.secondary,
    "Available to Work Remotely": p.remote,
    "Status": p.status,
    "Creation Time": p.time,
  }));
  return toCSV(headers, rows);
}

// ─── Ad Targeting (special format: headers + single data row, semicolons) ────
function generateAdTargeting(data) {
  const headers = [
    "Member Age","Member Gender","Job Seniorities","Job Functions","Job Titles",
    "Company Industries","Member Interests","Buyer Groups","Member Traits",
    "High Value Audience Segments","Member Skills","Fields of Study","Member Schools",
    "Company Size","Company Revenue","Years of Experience","Profile Locations",
    "Member Groups","Company Follower of","Company Connections"
  ];
  const headerLine = headers.join(",");
  const dataLine = headers.map(h => {
    const val = data[h] || "";
    // Values already have semicolons as separators
    if (val.includes(",")) return `"${val}"`;
    return val;
  }).join(",");
  return headerLine + "\n" + dataLine;
}

// ─── Main generation ─────────────────────────────────────────────────────────
async function main() {
  const outDir = path.join(__dirname, "..", "test-data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const [key, persona] of Object.entries(PERSONAS)) {
    console.log(`Generating ${persona.name}...`);
    _seed = key === "early" ? 42 : key === "mid" ? 1337 : 9999;

    const zip = new JSZip();

    // Profile
    const profileHeaders = ["First Name","Last Name","Maiden Name","Address","Birth Date","Headline","Summary","Industry","Zip Code","Geo Location","Twitter Handles","Websites"];
    zip.file("Profile.csv", toCSV(profileHeaders, [persona.profile]));

    // Registration
    zip.file("Registration.csv", `Registered At\n${persona.registration}`);

    // Connections
    const connections = generateConnections(
      persona.connectionCount, persona.connStartYear, persona.connEndYear, persona.connTitles
    );
    const connHeaders = ["First Name","Last Name","URL","Email Address","Company","Position","Connected On"];
    zip.file("Connections.csv", toCSV(connHeaders, connections));

    // Positions
    const posHeaders = ["Company Name","Title","Description","Location","Started On","Finished On"];
    zip.file("Positions.csv", toCSV(posHeaders, persona.positions));

    // Education
    const eduHeaders = ["School Name","Degree Name","Start Date","End Date"];
    zip.file("Education.csv", toCSV(eduHeaders, persona.education));

    // Certifications
    const certHeaders = ["Name","Authority","Started On"];
    zip.file("Certifications.csv", toCSV(certHeaders, persona.certifications));

    // Skills
    const skillHeaders = ["Name"];
    zip.file("Skills.csv", toCSV(skillHeaders, persona.skills.map(s => ({ "Name": s }))));

    // Endorsements Received
    zip.file("Endorsement_Received_Info.csv",
      generateEndorsementsReceived(persona.endorsementCount, connections, persona.skills));

    // Endorsements Given
    zip.file("Endorsement_Given_Info.csv",
      generateEndorsementsGiven(persona.endorsementGivenCount, connections));

    // Messages
    const profileName = { first: persona.profile["First Name"], last: persona.profile["Last Name"] };
    zip.file("Messages.csv",
      generateMessages(persona.messageCount, persona.msgStartYear, persona.msgEndYear, persona.msgConversations, profileName));

    // Invitations
    zip.file("Invitations.csv",
      generateInvitations(persona.invitationCount, persona.invStartYear, persona.invEndYear, profileName));

    // Recommendations Received
    const recRecHeaders = ["Recommender First Name","Recommender Last Name","Recommender Company","Recommender Title","Text","Creation Date","Status"];
    zip.file("Recommendations_Received.csv", toCSV(recRecHeaders, persona.recsReceived));

    // Recommendations Given
    zip.file("Recommendations_Given.csv", toCSV(recRecHeaders, persona.recsGiven));

    // Learning
    zip.file("Learning.csv", generateLearning(persona.learningCount));

    // Rich Media
    zip.file("Rich_Media.csv", generateRichMedia(persona.richMediaCount));

    // Receipts
    if (persona.receiptsCount > 0) {
      const currencies = key === "late" ? ["GBP","GBP","GBP","USD"] : ["USD"];
      zip.file("Receipts_v2.csv", generateReceipts(persona.receiptsCount, persona.receiptsStartYear, currencies));
    } else {
      zip.file("Receipts_v2.csv", "Amount,Currency,Date\n");
    }

    // Saved Jobs
    zip.file("Saved_Jobs.csv", generateSavedJobs(persona.savedJobTitles));

    // Job Applications
    zip.file("Job_Applications.csv", generateJobApplications(persona.jobAppTitles));

    // Saved Job Alerts
    zip.file("Saved_Job_Alerts.csv", generateSavedJobAlerts(persona.savedJobAlerts));

    // Company Follows
    zip.file("Company_Follows.csv", generateCompanyFollows(persona.companyFollowCount));

    // Events
    zip.file("Events.csv", generateEvents(persona.eventCount));

    // Guide Messages
    if (persona.guideMessageCount > 0) {
      zip.file("Guide_Messages.csv", generateGuideMessages(persona.guideMessageCount));
    }

    // Learning Coach Messages
    if (persona.coachMessageCount > 0) {
      zip.file("Learning_Coach_Messages.csv", generateCoachMessages(persona.coachMessageCount));
    }

    // Job Seeker Preferences
    const jspHeaders = ["Locations","Industries","Preferred Job Types","Job Titles","Open To Recruiters","Dream Companies","Job Seeker Activity Level","Job Seeking Urgency Level","Company Employee Count","Preferred Start Time Range","Commute Preference Starting Address","Maximum Commute Duration"];
    zip.file("Job_Seeker_Preferences.csv", toCSV(jspHeaders, [persona.jobSeekerPrefs]));

    // Private Identity Asset
    zip.file("Private_Identity_Asset.csv", generatePrivateAssets(persona.privateAssetCount));

    // Verifications
    if (persona.verificationCount > 0) {
      zip.file("Verifications.csv", generateVerifications(persona.verificationCount));
    } else {
      zip.file("Verifications.csv", "Verification type,Organization name,Document type,Verification service provider,Verified date,Expiry date\n");
    }

    // Providers
    if (persona.providerCount > 0) {
      zip.file("Providers.csv", generateProviders(persona.providerCount));
    } else {
      zip.file("Providers.csv", "ProFinder Service Category,Secondary Service Category,Available to Work Remotely,Status,Creation Time\n");
    }

    // Ad Targeting (special format)
    zip.file("Ad_Targeting.csv", generateAdTargeting(persona.adTargeting));

    // Inferences
    zip.file("Inferences.csv", "Inference\n" + persona.inferences.join("\n"));

    // Generate zip buffer and write
    const buf = await zip.generateAsync({ type: "nodebuffer" });
    const outPath = path.join(outDir, `${persona.name}.zip`);
    fs.writeFileSync(outPath, buf);
    console.log(`  -> ${outPath} (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  console.log("\nDone! All test data zips generated in test-data/");
}

main().catch(err => {
  console.error("Error generating test data:", err);
  process.exit(1);
});
