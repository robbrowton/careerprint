#!/usr/bin/env node
/**
 * generate-demo-json.js
 *
 * Reads test-data/late-career-export.zip and outputs parsed CSV data
 * as JSON to apps/linkedin/public/demo-data.json.
 * The browser app will run its own analyse* functions on this raw data.
 */

const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headerIdx = lines.findIndex(l => /first.?name|connected.?on|position|skill|from|to|content|company|name|type|date|amount|verification|location|member|inference/i.test(l));
  const start = headerIdx >= 0 ? headerIdx : 0;
  const headers = lines[start].split(",").map(h => h.replace(/"/g, "").trim());
  return lines.slice(start + 1).filter(l => l.trim()).map(line => {
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

async function main() {
  const zipPath = path.join(__dirname, "..", "test-data", "late-career-export.zip");
  if (!fs.existsSync(zipPath)) {
    console.error("Run generate-test-data.js first!");
    process.exit(1);
  }

  const buf = fs.readFileSync(zipPath);
  const zip = await JSZip.loadAsync(buf);

  const find = pat => zip.file(new RegExp(pat, "i"))[0];
  const result = {};

  const cf = find("connections\\.csv"); if (cf) result.connections = parseCSV(await cf.async("string"));
  const mf = find("messages\\.csv"); if (mf) result.messages = parseCSV(await mf.async("string"));
  const ivf = find("invitations\\.csv"); if (ivf) result.invitations = parseCSV(await ivf.async("string"));
  const sf = find("skills\\.csv"); if (sf) result.skills = parseCSV(await sf.async("string"));
  const ef = find("endorsement_received_info\\.csv"); if (ef) result.endorsements = parseCSV(await ef.async("string"));
  const pf = find("positions\\.csv"); if (pf) result.positions = parseCSV(await pf.async("string"));
  const prof = find("profile\\.csv"); if (prof) result.profile = parseCSV(await prof.async("string"));
  const edf = find("education\\.csv"); if (edf) result.education = parseCSV(await edf.async("string"));
  const cef = find("certifications\\.csv"); if (cef) result.certifications = parseCSV(await cef.async("string"));
  const rrf = find("recommendations_received\\.csv"); if (rrf) result.recsReceived = parseCSV(await rrf.async("string"));
  const rgf = find("recommendations_given\\.csv"); if (rgf) result.recsGiven = parseCSV(await rgf.async("string"));
  const lf = find("learning\\.csv"); if (lf) result.learning = parseCSV(await lf.async("string"));
  const egf = find("endorsement_given_info\\.csv"); if (egf) result.endorsementsGiven = parseCSV(await egf.async("string"));
  const rmf = find("rich_media\\.csv"); if (rmf) result.richMedia = parseCSV(await rmf.async("string"));
  const regf = find("registration\\.csv"); if (regf) result.registration = parseCSV(await regf.async("string"));
  const sjf = find("saved.?jobs\\.csv"); if (sjf) result.savedJobs = parseCSV(await sjf.async("string"));
  const jaf = find("job.?applications?\\.csv"); if (jaf) result.jobApplications = parseCSV(await jaf.async("string"));
  const saf = find("saved.?job.?alerts?\\.csv"); if (saf) result.savedJobAlerts = parseCSV(await saf.async("string"));
  const cff = find("company.?follows\\.csv"); if (cff) result.companyFollows = parseCSV(await cff.async("string"));
  const evf = find("events\\.csv"); if (evf) result.events = parseCSV(await evf.async("string"));
  const jsp = find("job.?seeker.?preferences\\.csv"); if (jsp) result.jobSeekerPrefs = parseCSV(await jsp.async("string"));
  const vff = find("verifications\\.csv"); if (vff) result.verifications = parseCSV(await vff.async("string"));

  const outPath = path.join(__dirname, "..", "apps", "linkedin", "public", "demo-data.json");
  fs.writeFileSync(outPath, JSON.stringify(result));

  const size = (fs.statSync(outPath).size / 1024).toFixed(1);
  const counts = {};
  for (const [k, v] of Object.entries(result)) {
    counts[k] = Array.isArray(v) ? v.length : 1;
  }
  console.log(`Written ${outPath} (${size} KB)`);
  console.log("Counts:", counts);
}

main().catch(err => { console.error(err); process.exit(1); });
