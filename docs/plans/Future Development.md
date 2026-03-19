# CareerPrint × Consulting — Future Development

## 1. CareerPrint as a Coaching Intake Tool
Coaches in the consulting platform could ask new clients to upload their LinkedIn data as part of onboarding. CareerPrint's analysis (network strength score, industry concentration, seniority distribution, growth trajectory) gives a richer baseline than a self-reported intake form.

**Implementation path:** Extract the scoring logic (`GRADE`, network benchmarks, 6-axis radar metrics) into `@consulting/survey-engine` as a "LinkedIn assessment" instrument type. Wire it through the existing `AssessmentSummary` / `InstrumentScore` contracts so it appears alongside 360-feedback and maturity assessments in the coaching dashboard.

**Impact:** Turns a standalone brand tool into a lead-gen funnel for consulting.

## 2. Report-as-a-Format in Consulting
CareerPrint's 5-chapter scrolling dossier with the seal-break reveal is a more compelling presentation than a standard dashboard grid. The coaching app's results pages and maturitymap output could adopt this pattern.

**What to port:** Alternating dark/light sections, scroll-triggered reveals, narrative chapter structure wrapping data. This is a design pattern, not a code extraction.

**Where it fits:** Coaching assessment results, maturitymap stakeholder reports, pindrop 360-feedback summaries.

## 3. Client-side Export for CareerPrint
CareerPrint has no export. The consulting repo has `@consulting/export` with PDF, PPTX, and Excel support. PPTX and Excel generators are pure JS — they work client-side.

**Implementation:** Add a "Download Report" button that generates a branded PDF or slide deck of the 5 chapters. Makes CareerPrint a shareable artefact rather than a one-time browser experience.

## 4. Portraits × CareerPrint
The `portraits` app in consulting builds persona/profile visualisations. CareerPrint builds a career portrait from data. Natural product overlap.

**Implementation:** Portraits could ingest LinkedIn data as one signal source alongside 360-feedback and survey data. The `NetworkDNA` strip and `CompanyBubbles` viz make more sense in that context than as generic shared charts.

## 5. Shared CSV Parsing
CareerPrint has a battle-tested `parseCSV` with header detection, quote handling, and graceful degradation. Consulting apps (employeeexperience, pindrop) import survey data from CSVs.

**Implementation:** Extract into a `@consulting/parsers` package. More robust than whatever each app does independently.

## 6. Unvarnished Connection
Unvarnished does AI career impact assessments. CareerPrint does data-driven career analysis. Two angles on the same user need.

**Implementation:** CareerPrint's LinkedIn analysis feeds into Unvarnished's assessment as "evidence" — network strength, career trajectory data points — making Unvarnished's output more grounded and differentiated.
