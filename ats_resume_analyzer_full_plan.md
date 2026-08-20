# ATS Resume Analyzer — Full Production System Design & Website Plan

> **Goal:** Build a high-accuracy, production-ready ATS Resume Analyzer that checks resume machine-readability, compares a resume against a job description, produces a transparent ATS Compatibility Score, and uses Gemini AI for semantic analysis and improvement suggestions.

## 0. Product Positioning

Do **not** claim that the product reproduces the exact score of every ATS. There is no single public ATS scoring algorithm shared by all employers and ATS vendors.

Position the product as:

> **Evidence-based ATS Compatibility & Job Match Analyzer**

The product should answer five questions:

1. Can an ATS reliably parse this resume?
2. Does the resume contain the important requirements from this job?
3. Does the experience actually demonstrate those requirements?
4. What is weak, missing, risky, or unclear?
5. What specific changes could improve the resume without inventing facts?

The core design principle is:

```text
Deterministic checks
        +
Rule-based scoring
        +
Semantic matching
        +
Gemini contextual analysis
        =
Transparent ATS Compatibility Analysis
```

**Gemini must not be the sole score calculator.**

---

# 1. Target User Experience

## Main flow

```text
Landing Page
      ↓
Upload Resume
      ↓
Resume Parsing
      ↓
Resume Health Analysis
      ↓
Paste Job Description
      ↓
Job Requirement Extraction
      ↓
Resume ↔ Job Matching
      ↓
Gemini AI Analysis
      ↓
Score Aggregation
      ↓
Results Dashboard
      ↓
Prioritized Suggestions
      ↓
Optional AI Rewrites
      ↓
Re-score
```

## Supported input

Initial MVP:

- PDF
- DOCX

Later:

- TXT
- Google Docs export
- Resume builder integration

---

# 2. Recommended Tech Stack

## Frontend

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Recharts
- TanStack Query

## Backend

Use:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL
- Redis

Optional at larger scale:

- Celery or RQ
- S3-compatible object storage

## Parsing

Recommended:

- PyMuPDF / `fitz`
- `python-docx`
- pdfplumber
- OCR fallback only when normal extraction fails

## AI

Use Google's Gemini API behind a backend service abstraction.

For the current API documentation, Gemini 2.5 Flash and Gemini 2.5 Flash-Lite are stable models with free-tier API availability; limits and quotas apply. Gemini 2.5 Flash-Lite is specifically positioned as a fast, cost-efficient model for high-volume lightweight workloads. citeturn579754search0turn579754search1

Google's API supports structured JSON output, including Pydantic schemas in Python, which should be used so AI responses are validated rather than parsed from arbitrary prose. citeturn579754search2turn579754search4

---

# 3. Gemini Model Strategy

## Recommended architecture

Never hard-code model names throughout the application.

```env
GEMINI_PRIMARY_MODEL=gemini-2.5-flash
GEMINI_FAST_MODEL=gemini-2.5-flash-lite
```

Use the fast model for:

- Job-description extraction
- Basic classification
- Simple suggestion generation
- High-volume analysis

Use the primary model for:

- Detailed resume ↔ JD reasoning
- Complex semantic matching
- Bullet analysis
- Final recommendations

Google currently documents Gemini 2.5 Flash as a low-latency, high-volume reasoning model and Gemini 2.5 Flash-Lite as the fastest, budget-focused 2.5-family option. citeturn579754search8

### Important

Do not design the application around an undocumented or unstable model name.

Use environment variables and a provider abstraction so you can replace the model later.

Google's documentation also shows multiple current Gemini model generations and documents shutdown/deprecation dates for older preview models, so model IDs should always be configurable. citeturn579754search6

---

# 4. Free Gemini Usage Architecture

The free tier is **not unlimited production capacity**.

Design for quota constraints from day one.

```text
Browser
   ↓
FastAPI
   ↓
Authentication / IP Rate Limit
   ↓
AI Request Budget
   ↓
Gemini Service
   ↓
Gemini API
```

## Free-tier controls

Implement:

- Daily anonymous analysis limit
- Daily authenticated-user limit
- Maximum file size
- Maximum resume pages
- Maximum job-description length
- AI request budget per analysis
- Request timeouts
- Retry with exponential backoff
- Quota-exceeded handling
- Caching
- Duplicate-analysis detection
- Circuit breaker
- API key protection

Never expose the Gemini API key in frontend JavaScript.

```env
GEMINI_API_KEY=xxxxxxxx
```

The frontend communicates only with your backend.

---

# 5. Core Product Modules

```text
1. Resume Upload
2. Resume Parser
3. Resume Normalizer
4. ATS Formatting Analyzer
5. Job Description Parser
6. Keyword Engine
7. Skill Normalizer
8. Semantic Matching Engine
9. Experience Matching Engine
10. Gemini AI Analyzer
11. Deterministic Scoring Engine
12. Suggestion Engine
13. AI Rewrite Engine
14. Results Dashboard
15. Resume Versioning
16. Analytics / Monitoring
17. Authentication
18. Billing / Usage
```

---

# 6. System Architecture

```text
                         ┌───────────────────┐
                         │      Browser      │
                         │ React + TypeScript│
                         └─────────┬─────────┘
                                   │ HTTPS
                                   ▼
                         ┌───────────────────┐
                         │      FastAPI      │
                         │ API + Auth + Rate │
                         │       Limits      │
                         └─────────┬─────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
      ┌───────────────┐    ┌──────────────┐    ┌──────────────┐
      │ Resume Parser │    │ PostgreSQL   │    │    Redis     │
      └───────┬───────┘    └──────────────┘    └──────┬───────┘
              │                                         │
              ▼                                         ▼
      ┌───────────────┐                         ┌──────────────┐
      │ Normalization │                         │ Background   │
      └───────┬───────┘                         │ Jobs / Cache │
              │                                 └──────┬───────┘
              ▼                                        │
      ┌───────────────┐                               │
      │ ATS Rule      │                               │
      │ Engine        │                               │
      └───────┬───────┘                               │
              │                                        │
              ├──────────────────┐                     │
              ▼                  ▼                     ▼
      ┌───────────────┐   ┌──────────────┐    ┌──────────────┐
      │ Keyword       │   │ Semantic     │    │ Gemini AI    │
      │ Matching      │   │ Matching     │    │ Service      │
      └───────┬───────┘   └──────┬───────┘    └──────┬───────┘
              │                  │                   │
              └──────────────────┼───────────────────┘
                                 ▼
                       ┌────────────────────┐
                       │ Score Aggregator   │
                       │ + Validation       │
                       └─────────┬──────────┘
                                 ▼
                       ┌────────────────────┐
                       │ Suggestions        │
                       │ + Evidence         │
                       └─────────┬──────────┘
                                 ▼
                       ┌────────────────────┐
                       │ Results Dashboard  │
                       └────────────────────┘
```

---

# 7. Canonical Resume Schema

Every uploaded resume should be converted into one normalized internal structure.

```json
{
  "candidate": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "portfolio": ""
  },

  "summary": "",

  "skills": [
    {
      "name": "",
      "category": "",
      "source": "skills_section"
    }
  ],

  "experience": [
    {
      "company": "",
      "title": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "bullets": []
    }
  ],

  "education": [],

  "projects": [],

  "certifications": [],

  "achievements": [],

  "sections": [],

  "raw_text": "",

  "page_count": 0,

  "parser_confidence": 0
}
```

---

# 8. Job Description Schema

Normalize every JD into:

```json
{
  "title": "",
  "company": "",
  "seniority": "",
  "years_experience": null,

  "required_skills": [],
  "preferred_skills": [],

  "responsibilities": [],

  "education_requirements": [],

  "certifications": [],

  "tools": [],

  "domain_terms": [],

  "soft_skills": [],

  "keywords": []
}
```

Important classification:

```text
REQUIRED
PREFERRED
NICE_TO_HAVE
CONTEXTUAL
```

Missing a required skill should have greater impact than a missing preferred skill.

---

# 9. Resume Parsing Pipeline

```text
Uploaded file
      ↓
File validation
      ↓
MIME validation
      ↓
Text extraction
      ↓
Layout extraction
      ↓
Section detection
      ↓
Contact extraction
      ↓
Experience extraction
      ↓
Education extraction
      ↓
Skills extraction
      ↓
Date normalization
      ↓
Parser confidence
      ↓
Canonical resume JSON
```

## Parser confidence

Calculate before running the final score.

Example:

```text
30% text extraction quality
20% section detection
20% contact extraction
15% date extraction
15% experience extraction
```

If confidence is low:

```text
We could not reliably parse this resume.
Please upload a cleaner PDF or DOCX.
```

Never produce a highly precise-looking score from an unreadable resume.

---

# 10. ATS Formatting Analyzer

Check for possible parsing risks.

## High-risk indicators

- Important information inside images
- Text embedded in graphics
- Complex multi-column layout
- Important information inside tables
- Decorative icons replacing text
- Critical information in headers/footers
- Unusual or missing section headings
- Text extraction failure
- Invisible / suspicious text
- Broken characters
- Broken hyperlinks

## Medium-risk indicators

- Excessive graphics
- Very small fonts
- Inconsistent dates
- Multiple unrelated bullet styles
- Excessive whitespace
- Over-designed separators

## Important

Do **not** claim:

> "All ATS reject tables."

Instead say:

> "Tables may introduce parsing risk depending on the ATS and document structure."

The application should distinguish:

```text
Confirmed parsing problem
Potential parsing risk
No detected risk
```

---

# 11. Standard Section Detection

Normalize common headings.

```text
EXPERIENCE
WORK EXPERIENCE
EMPLOYMENT
PROFESSIONAL EXPERIENCE
```

→

```text
experience
```

Similarly:

```text
EDUCATION
ACADEMIC BACKGROUND
```

→

```text
education
```

Example normalized sections:

```text
summary
experience
education
skills
projects
certifications
achievements
```

---

# 12. Keyword Matching Engine

Use a three-stage strategy.

## Stage 1 — Exact matching

```text
Job: Kubernetes

Resume: Kubernetes
```

→ Exact match.

## Stage 2 — Alias / normalization

Example mapping:

```text
ReactJS → React
React.js → React
Node JS → Node.js
Amazon Web Services → AWS
K8s → Kubernetes
Postgres → PostgreSQL
```

Keep this dictionary versioned and configurable.

## Stage 3 — Semantic matching

Example:

```text
Job:
"Experience building RESTful APIs"

Resume:
"Designed backend services with FastAPI"
```

Possible semantic relationship:

```text
Potential match
Confidence: Medium
```

Do not convert semantic similarity into factual proof.

---

# 13. Evidence Hierarchy

A skill should receive stronger evidence when it appears in real experience.

Suggested initial evidence weights:

```text
Experience evidence       1.00
Project evidence          0.85
Certification evidence    0.75
Skills section            0.55
Summary only              0.40
Semantic-only inference   0.25
```

These are starting heuristics, not universal ATS standards.

Calibrate them using a labeled test set.

---

# 14. Required Skill Evidence

For every important requirement, store:

```json
{
  "requirement": "Kubernetes",
  "importance": "required",
  "exact_match": false,
  "alias_match": false,
  "semantic_match": false,
  "resume_evidence": [],
  "confidence": 0
}
```

Example UI:

```text
Kubernetes
Missing

Required by job: Yes
Resume evidence: Not found
Confidence: High
```

---

# 15. Job Match Engine

The matching engine should combine:

```text
Exact keyword evidence
+
Alias evidence
+
Semantic similarity
+
Experience context
+
Seniority
+
Responsibility similarity
```

For each job requirement produce:

```text
Matched
Partially Matched
Potential Match
Missing
```

---

# 16. Recommended Scoring Model

Use a transparent 0–100 score.

## Overall ATS Compatibility

```text
20% Parsing & Structure
20% Keyword Coverage
25% Requirement Match
15% Experience Relevance
10% Achievement Quality
10% Formatting / ATS Safety
```

Formula:

```python
overall_score = round(
    parsing_score * 0.20 +
    keyword_score * 0.20 +
    requirement_score * 0.25 +
    experience_score * 0.15 +
    achievement_score * 0.10 +
    formatting_score * 0.10
)
```

Keep weights configurable:

```python
SCORING_WEIGHTS = {
    "parsing": 0.20,
    "keywords": 0.20,
    "requirements": 0.25,
    "experience": 0.15,
    "achievements": 0.10,
    "formatting": 0.10
}
```

---

# 17. Resume Health Score

This score does not require a job description.

```text
25% Parsing Safety
20% Structure
15% Contact Completeness
15% Bullet Quality
10% Quantification / Evidence
10% Consistency
5% Readability
```

UI:

```text
Resume Health
91 / 100
```

---

# 18. Job Match Score

When a job description exists:

```text
30% Required Skill Coverage
20% Responsibility Similarity
15% Experience Alignment
10% Seniority Alignment
10% Domain / Industry Match
5% Education / Certification
5% Preferred Skills
5% Keyword Coverage
```

This score answers:

> "How closely does this resume fit this specific job?"

---

# 19. Score Labels

Use product-level interpretation:

```text
90–100  Excellent
80–89   Strong
70–79   Good
60–69   Needs Improvement
0–59    High Risk
```

These are your product heuristics.

Do not label them:

```text
"Official ATS standards"
```

---

# 20. Avoid the Fake Universal ATS Score Problem

The product should present:

```text
ATS Compatibility Score
84 / 100

Based on:
- machine readability
- formatting safety
- requirement coverage
- keyword coverage
- experience relevance
```

Do not present:

```text
"Your Workday ATS Score = 84"
```

unless you have actual validated data for that specific system.

---

# 21. Gemini AI Responsibilities

Gemini should analyze:

### Resume

- Summary quality
- Bullet quality
- Action verbs
- Achievement orientation
- Technical specificity
- Clarity
- Repetition
- Context

### Job Description

- Role expectations
- Required skills
- Preferred skills
- Seniority
- Responsibilities
- Domain terminology
- Important signals

### Comparison

- Missing requirements
- Weakly demonstrated requirements
- Strong matches
- Potential semantic matches
- Experience relevance
- Seniority mismatch
- Suggested improvements

---

# 22. What Gemini Should NOT Do

Do not use Gemini as the authority for:

```text
page count
exact keyword counts
email validation
date arithmetic
file validation
score arithmetic
format risk detection
```

These should be deterministic.

Gemini is excellent for reasoning over text, but your application needs reproducibility.

---

# 23. Gemini Structured Output

Use structured output.

Example Python schema:

```python
from pydantic import BaseModel
from typing import List

class Suggestion(BaseModel):
    priority: str
    category: str
    issue: str
    evidence: List[str]
    recommendation: str
    confidence: float

class ResumeAnalysis(BaseModel):
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    missing_requirements: List[str]
    suggestions: List[Suggestion]
    confidence: float
```

Then request Gemini to return JSON matching the schema.

Google documents structured outputs specifically for predictable, type-safe extraction and provides examples using Pydantic in Python. citeturn579754search4

---

# 24. Prompt Architecture

Do not create one enormous AI prompt.

Create specialized prompts:

```text
prompts/
├── extract_resume_entities.txt
├── extract_job_requirements.txt
├── analyze_summary.txt
├── analyze_bullets.txt
├── analyze_match.txt
├── generate_suggestions.txt
└── rewrite_bullet.txt
```

## System prompt principles

Use rules such as:

```text
You are an evidence-based resume analysis engine.

Never invent candidate experience.

Never invent technologies.

Never invent metrics.

Never invent employers.

Never invent certifications.

Separate direct evidence from inference.

If evidence is absent, say that evidence is absent.

Recommend adding a skill only if the candidate confirms
that they actually have that skill.

Return only the requested structured response.
```

---

# 25. AI Hallucination Guard

After Gemini generates an answer:

```text
Gemini output
      ↓
Schema validation
      ↓
Claim extraction
      ↓
Compare claims with canonical resume
      ↓
Business-rule validation
      ↓
Accept / Reject / Mark for verification
```

Example:

Gemini says:

```text
"Reduced API latency by 40%."
```

If the resume does not contain this evidence:

```text
REJECT
```

Replace with:

```text
Consider adding a verified performance metric if one exists.
```

---

# 26. Suggestion Engine

Every suggestion should contain:

```json
{
  "priority": "high",
  "category": "missing_required_skill",
  "issue": "AWS is required but not clearly demonstrated.",
  "evidence": [
    "AWS appears in the job description.",
    "No AWS evidence was found in the resume."
  ],
  "recommendation": "Add AWS only if you have genuine experience.",
  "expected_impact": "High",
  "confidence": 0.96
}
```

Categories:

```text
missing_required_skill
missing_preferred_skill
weak_bullet
weak_summary
keyword_gap
formatting_risk
date_inconsistency
missing_section
generic_language
repetition
unsupported_claim
seniority_mismatch
```

---

# 27. Suggestion Priority

Rank suggestions using:

```text
Priority =
Impact
×
Confidence
×
Requirement Importance
```

Example:

```text
HIGH
Missing required skill

HIGH
Resume parser risk

MEDIUM
Weak achievement bullet

LOW
Minor wording improvement
```

Do not overload the user with 50 suggestions.

Show:

```text
Top 5 fixes
```

and allow:

```text
Show all suggestions
```

---

# 28. Bullet Quality Analyzer

Use this framework:

```text
Action
+
Task
+
Technology / Context
+
Outcome
+
Evidence
```

Weak:

```text
Worked on APIs.
```

Better:

```text
Built REST APIs using FastAPI for internal automation workflows.
```

Stronger:

```text
Built 18 REST APIs using FastAPI, reducing manual processing time by 35%.
```

Only use the 35% if it is a verified user-provided metric.

---

# 29. Bullet Scoring

Each bullet can receive:

```text
20 Action strength
20 Specificity
20 Technical relevance
20 Impact
20 Evidence
```

But do not force every bullet to contain a numeric metric.

Classify impact as:

```text
Quantified
Qualitative
Task-only
```

---

# 30. AI Rewrite Rules

AI may:

```text
Improve grammar
Improve clarity
Improve action verbs
Improve technical specificity
Remove repetition
Improve structure
Suggest metric placeholders
```

AI must not invent:

```text
Metrics
Technologies
Clients
Employers
Awards
Certifications
Responsibilities
```

Example:

```text
Original:
Worked on website performance.

Suggested:
Improved website performance by optimizing frontend rendering
and reducing unnecessary network requests.

Verification:
Add a percentage only if you have a measured value.
```

---

# 31. Resume ↔ Job Evidence Matrix

The dashboard should show a matrix.

| Requirement | Importance | Resume Evidence | Match | Confidence |
|---|---|---|---|---|
| Python | Required | 2 jobs + 3 projects | Strong | High |
| FastAPI | Required | 1 job | Strong | High |
| AWS | Required | Not found | Missing | High |
| Docker | Preferred | Project | Partial | Medium |
| CI/CD | Preferred | GitHub Actions | Strong | High |

This is one of the strongest differentiators because it makes the score explainable.

---

# 32. Main Dashboard

## Top

```text
ATS COMPATIBILITY

84 / 100

STRONG MATCH
```

## Secondary scores

```text
Resume Health       91
Job Match            82
Keyword Coverage     76
ATS Safety           95
Experience Match     84
```

---

# 33. Executive Summary

Example:

```text
Your resume is technically ATS-friendly and demonstrates
strong backend experience.

The largest gaps are:
1. AWS is required but not clearly demonstrated.
2. Kubernetes appears in the job but is not supported by resume evidence.
3. Two experience bullets describe tasks without measurable outcomes.
```

---

# 34. Strengths Section

```text
✓ Strong Python experience
✓ Good backend project evidence
✓ Standard section structure
✓ Good machine-readable text
✓ Relevant API development experience
```

---

# 35. Weaknesses Section

```text
⚠ 4 required terms are missing
⚠ One role has weak achievement evidence
⚠ Two-column formatting may create parsing risk
```

---

# 36. Formatting Section

Display:

```text
Machine Readability       95
Section Detection         100
Contact Extraction        100
Date Consistency          92
Formatting Safety         88
```

Each item should be clickable.

---

# 37. Keyword Section

```text
Required Keywords
17 / 22

Preferred Keywords
8 / 13

Overall Coverage
25 / 35
```

Then:

```text
Missing Required

AWS
Kubernetes
Terraform
```

And:

```text
Possible Semantic Matches

Container orchestration → Kubernetes
Cloud infrastructure → AWS
```

The semantic match should be clearly labelled as inference rather than proof.

---

# 38. “Improve My Resume” Flow

```text
Analysis
   ↓
Suggestions
   ↓
Select suggestions
   ↓
AI proposes edits
   ↓
User reviews
   ↓
Accept / Reject
   ↓
Create new resume version
   ↓
Re-analyze
```

Display:

```text
Current Score
72

Predicted Score After Accepted Fixes
84
```

Use wording:

```text
Predicted improvement
```

not:

```text
Guaranteed score increase
```

---

# 39. Resume Versioning

Store:

```text
Resume v1
Resume v2
Resume v3
```

Each version:

```text
Score
Target job
Created date
Changed sections
Suggestions accepted
Suggestions rejected
```

Comparison:

```text
v1   72
v2   81
v3   87
```

---

# 40. API Design

## Upload

```http
POST /api/resumes
```

## Parse

```http
POST /api/resumes/{resume_id}/parse
```

## Create analysis

```http
POST /api/analyses
```

Example:

```json
{
  "resume_id": "123",
  "job_description": "..."
}
```

## Get analysis

```http
GET /api/analyses/{analysis_id}
```

## Suggestions

```http
GET /api/analyses/{analysis_id}/suggestions
```

## Rewrite

```http
POST /api/suggestions/{suggestion_id}/rewrite
```

## Rescore

```http
POST /api/analyses/{analysis_id}/rescore
```

---

# 41. Suggested API Response

```json
{
  "analysis_id": "a123",
  "scores": {
    "overall": 84,
    "resume_health": 91,
    "job_match": 82,
    "keywords": 76,
    "parsing": 95,
    "formatting": 88,
    "experience": 84
  },

  "summary": "...",

  "strengths": [],

  "missing_requirements": [],

  "warnings": [],

  "suggestions": [],

  "evidence_matrix": [],

  "parser_confidence": 0.97,

  "ai_confidence": 0.90
}
```

---

# 42. Database Schema

## users

```text
id
email
password_hash / auth_provider
plan
created_at
updated_at
```

## resumes

```text
id
user_id
filename
mime_type
raw_text
parsed_json
parser_confidence
page_count
created_at
deleted_at
```

## jobs

```text
id
user_id
title
company
description
parsed_json
created_at
```

## analyses

```text
id
resume_id
job_id
overall_score
resume_health_score
job_match_score
keyword_score
parsing_score
formatting_score
experience_score
ai_result_json
created_at
```

## suggestions

```text
id
analysis_id
category
priority
issue
evidence_json
recommendation
status
created_at
```

---

# 43. Caching

Cache expensive work.

Cache keys:

```text
resume_parse_hash
job_description_hash
resume_jd_match_hash
embedding_hash
```

For example:

```text
SHA256(normalized_resume)
```

If the exact same resume is analyzed again:

```text
Use cached parsing result
```

For the same resume + same JD:

```text
Reuse analysis when safe
```

---

# 44. Semantic Matching

For high-quality matching, use:

```text
Exact match
+
Alias match
+
Embedding similarity
+
Gemini contextual verification
```

Possible pipeline:

```text
JD requirement
      ↓
Embedding search
      ↓
Top resume evidence
      ↓
Gemini verifies contextual relevance
      ↓
Match classification
```

This is much better than simply asking Gemini:

> "How much does this resume match this job?"

---

# 45. Similarity Thresholds

Start with configurable thresholds:

```text
0.85+ → Strong semantic candidate
0.70–0.84 → Possible match
0.55–0.69 → Weak candidate
<0.55 → Unrelated
```

Do **not** assume these thresholds are universally correct.

Calibrate them using your test dataset.

---

# 46. Important Semantic Matching Rule

Never let semantic similarity alone claim:

```text
Candidate knows Kubernetes.
```

Instead:

```text
Potential semantic match:
Container orchestration

No explicit Kubernetes evidence detected.
```

This significantly reduces false positives.

---

# 47. ATS Formatting Safety Rules

Build a rule engine with:

```python
class ATSCheck:
    name: str
    severity: str
    passed: bool
    evidence: list[str]
    recommendation: str
```

Example:

```json
{
  "name": "critical_information_in_image",
  "severity": "high",
  "passed": false,
  "evidence": ["Candidate contact block appears image-based"],
  "recommendation": "Use text-based contact information."
}
```

---

# 48. Parser Failure Handling

If PDF extraction is poor:

```text
Do not silently continue.
```

Instead:

```text
Parser Confidence: 42%

The document could not be reliably extracted.
Some ATS checks may be inaccurate.

Recommended:
Upload a text-based PDF or DOCX.
```

---

# 49. Security

Resume files contain personal information.

Implement:

- HTTPS
- File-size limit
- MIME validation
- Extension validation
- Malware scanning where appropriate
- Isolated file processing
- Authentication
- Authorization
- Rate limiting
- Secure cookies
- Environment-managed secrets
- Minimal logging
- Data deletion
- Storage encryption
- Short retention period

Never log complete:

```text
resume text
phone numbers
email addresses
API keys
```

unless explicitly required and protected.

---

# 50. Privacy UX

Provide:

```text
Delete Resume
Delete Analysis
Delete Account
```

Explain:

```text
Your resume is processed to generate the analysis.
```

Do not claim:

```text
100% private
```

unless you can substantiate the entire infrastructure and data lifecycle.

---

# 51. AI Cost Optimization

Avoid:

```text
One Gemini request per bullet
```

Instead:

```text
One batch call for all bullets
```

Avoid repeated calls for deterministic checks.

Recommended:

```text
Parser                    Local
Keyword matching          Local
Score arithmetic           Local
JD normalization           Gemini
Semantic analysis          Gemini / embeddings
Bullet analysis            Gemini
Suggestion generation     Gemini
Rewrite                    Gemini
```

This reduces AI cost and improves reliability.

---

# 52. Suggested Gemini Call Budget

For one analysis:

```text
Call 1:
Job requirement extraction

Call 2:
Resume + JD contextual analysis

Call 3:
All-bullet analysis

Optional Call 4:
Final suggestions / rewrite
```

Do not automatically run Call 4 for every user.

Only run expensive rewrites when requested.

---

# 53. Deterministic + AI Hybrid Architecture

This is the most important architectural decision.

## Bad architecture

```text
Resume
 ↓
Gemini
 ↓
"ATS score = 88"
```

Problems:

- Non-deterministic
- Hard to test
- Difficult to debug
- Easy to hallucinate
- Difficult to calibrate

## Recommended architecture

```text
Resume
 ↓
Parser
 ↓
Canonical Resume
 ↓
Deterministic ATS Engine
 ↓
Keyword Engine
 ↓
Semantic Matcher
 ↓
Gemini Contextual Analysis
 ↓
Validation
 ↓
Score Aggregator
 ↓
Suggestions
```

---

# 54. Explainable Scoring

Every component should have:

```json
{
  "score": 82,
  "reasons": [
    "17/22 required keywords matched",
    "3 required skills not demonstrated",
    "Resume is machine-readable",
    "2 bullets have weak impact evidence"
  ]
}
```

The UI should let users click:

```text
Why 82?
```

and see the calculation.

---

# 55. Example Score Breakdown

```text
ATS Compatibility                         84

Parsing & Structure                       95
Keyword Coverage                          76
Requirement Match                         82
Experience Relevance                      84
Achievement Quality                       79
Formatting Safety                         88
```

Then show:

```text
Largest score losses

- Missing Kubernetes evidence    -7
- Missing AWS evidence           -5
- Weak achievement bullets       -3
- Keyword coverage               -4
```

---

# 56. “Why This Matters” Evidence

Each negative score must be connected to evidence.

Bad:

```text
Formatting: 72
```

Good:

```text
Formatting: 72

Potential parsing risk:
Two-column layout detected.

Why:
Some ATS parsers may read multi-column text in unexpected order.

Recommendation:
Use a single-column layout for maximum compatibility.
```

---

# 57. ATS Resume Recommendations

The final recommendation engine should classify every issue:

```text
Fix now
Consider fixing
Optional
Do not change
```

Example:

```text
FIX NOW
Required skill not evidenced

CONSIDER
Improve generic bullet

OPTIONAL
Strengthen summary

DO NOT CHANGE
Correct technical skill already supported by experience
```

---

# 58. Prevent Keyword Stuffing

Detect:

```text
Python Python Python
AWS AWS AWS
```

and suspicious repetition.

Also distinguish:

```text
Skill exists only in Skills section
```

from:

```text
Skill appears in real experience
```

Experience evidence should be stronger.

---

# 59. AI Suggestion Safety

Never tell the user:

```text
Add Kubernetes
```

without context.

Instead:

```text
Kubernetes is a required job skill but was not detected
in your resume.

If you have genuine Kubernetes experience:
consider adding the technology to the most relevant role/project.

If you do not have experience:
do not add it solely for ATS optimization.
```

---

# 60. Landing Page

## Hero

```text
See Exactly How Well Your Resume Matches a Job

Upload your resume.
Paste the job description.
Get a transparent ATS compatibility score,
missing requirements, formatting risks,
and AI-powered improvement suggestions.
```

CTA:

```text
Analyze My Resume — Free
```

Trust badges:

```text
✓ Job-specific matching
✓ Explainable scoring
✓ AI-powered suggestions
✓ Evidence-based recommendations
```

---

# 61. Main Pages

```text
/
    Landing page

/analyzer
    Upload + JD input

/analysis/:id
    Results dashboard

/resumes
    Resume versions

/resumes/:id
    Resume details

/jobs
    Saved jobs

/settings
    Account + privacy

/pricing
    Free / Pro

/privacy
    Privacy policy

/terms
    Terms
```

---

# 62. SEO Pages

Important search-intent pages:

```text
/ats-resume-checker
/free-ats-resume-checker
/resume-score-checker
/resume-keyword-checker
/resume-job-match
/ats-friendly-resume-checker
/resume-analyzer
```

Educational pages:

```text
/how-to-make-resume-ats-friendly
/ats-friendly-resume-format
/how-ats-resume-screening-works
/resume-keyword-guide
/resume-for-software-engineer
/resume-for-data-scientist
/resume-for-product-manager
```

Avoid generating thousands of thin AI pages.

---

# 63. Monetization

## Free

```text
3–5 analyses/day
Basic ATS score
Basic keyword analysis
Basic formatting checks
Top suggestions
```

## Pro

```text
Higher analysis limits
Detailed AI analysis
Resume versions
Advanced matching
AI rewrites
Multiple target jobs
Export
```

## Future

```text
Resume tailoring
Cover letter matching
Application tracker
Job tracking
Interview preparation
Recruiter tools
Enterprise API
```

---

# 64. MVP Scope

Build only:

```text
[ ] React frontend
[ ] FastAPI backend
[ ] PDF upload
[ ] DOCX upload
[ ] Resume parser
[ ] Canonical resume schema
[ ] Job description input
[ ] JD extraction
[ ] Required/preferred classification
[ ] Keyword matcher
[ ] Alias matcher
[ ] ATS formatting checks
[ ] Resume Health Score
[ ] Job Match Score
[ ] Overall ATS Compatibility Score
[ ] Gemini AI analysis
[ ] Top 5 suggestions
[ ] Bullet improvement
[ ] Explainable score
[ ] Rate limiting
[ ] Error handling
```

---

# 65. Phase 2

Add:

```text
[ ] Authentication
[ ] Resume history
[ ] Resume version comparison
[ ] Embeddings
[ ] Semantic matching
[ ] Re-score after changes
[ ] PDF export
[ ] Advanced dashboard
[ ] Usage dashboard
```

---

# 66. Phase 3

Add:

```text
[ ] Resume builder
[ ] Resume tailoring
[ ] Cover letters
[ ] Application tracker
[ ] Job board integrations
[ ] Browser extension
[ ] Recruiter analytics
[ ] Enterprise API
```

---

# 67. Repository Structure

```text
ats-resume-analyzer/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── main.tsx
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── parser/
│   │   │   ├── ats/
│   │   │   ├── matching/
│   │   │   ├── scoring/
│   │   │   ├── ai/
│   │   │   └── suggestions/
│   │   ├── prompts/
│   │   ├── core/
│   │   └── main.py
│   │
│   └── tests/
│
├── migrations/
├── docs/
├── .env.example
├── docker-compose.yml
└── README.md
```

---

# 68. AI Service Interface

Create a provider abstraction.

```python
class ResumeAIService:

    async def extract_job_requirements(self, job_description):
        ...

    async def analyze_resume_match(self, resume, job):
        ...

    async def analyze_bullets(self, bullets, job):
        ...

    async def generate_suggestions(self, analysis):
        ...

    async def rewrite_bullet(self, bullet, context):
        ...
```

Then:

```python
class GeminiResumeAIService(ResumeAIService):
    ...
```

Later you can add another model provider without changing the rest of the application.

---

# 69. Application Flow State

Frontend states:

```text
idle
uploading
parsing
analyzing
completed
error
```

Show progress:

```text
✓ Resume uploaded
✓ Resume parsed
✓ Job requirements extracted
✓ ATS checks completed
● AI analysis
○ Suggestions
```

This is better UX than a generic loading spinner.

---

# 70. Background Processing

MVP:

```text
FastAPI BackgroundTasks
```

Production:

```text
FastAPI
 ↓
Redis
 ↓
Celery/RQ
 ↓
Worker
```

Use asynchronous processing when AI analysis becomes slower or traffic increases.

---

# 71. Testing Strategy

## Unit tests

Test:

```text
PDF parsing
DOCX parsing
Section detection
Contact extraction
Date normalization
Keyword normalization
Alias matching
Score calculation
Formatting risk detection
Schema validation
```

## AI contract tests

Test:

```text
Valid JSON
Missing fields
Invalid score
Hallucinated claim
Unsupported technology
Low-confidence inference
```

## E2E

```text
Upload
 ↓
Parse
 ↓
JD
 ↓
Analyze
 ↓
Dashboard
 ↓
Suggestions
 ↓
Rewrite
 ↓
Re-score
```

---

# 72. Golden Dataset

Create a private test set:

```text
resume_001
resume_002
resume_003
...
```

For each resume record expected labels:

```text
sections
skills
dates
format risks
experience
requirements
```

Then benchmark every major release.

---

# 73. Accuracy Metrics

Do not optimize only for a visually pleasing score.

Track:

```text
Parser accuracy
Section detection accuracy
Skill precision
Skill recall
Requirement classification accuracy
False-positive skill rate
False-negative skill rate
Hallucination rate
Suggestion acceptance rate
AI confidence calibration
```

Most important:

```text
Unsupported claim rate
```

Target:

```text
As close to 0% as practical
```

---

# 74. Confidence Calibration

Show confidence levels:

```text
High
Medium
Low
```

Examples:

```text
Exact keyword
→ High

Alias match
→ High

Strong semantic evidence
→ Medium/High

Weak semantic similarity
→ Low
```

Never display false precision such as:

```text
Kubernetes confidence = 93.42%
```

unless your benchmark validates that probability interpretation.

---

# 75. Observability

Track:

```text
analysis_success_rate
parser_failure_rate
gemini_error_rate
gemini_latency
average_analysis_time
quota_exceeded_count
rate_limit_hits
file_processing_errors
average_score
```

Do not put full resume contents into logs.

---

# 76. Error Handling

## Invalid file

```text
Please upload a PDF or DOCX resume.
```

## Poor extraction

```text
We could not reliably read this document.
Try a text-based PDF or DOCX.
```

## JD too short

```text
Please provide a complete job description for better matching.
```

## Gemini quota

```text
AI analysis is temporarily unavailable.
Your resume was parsed successfully, but AI suggestions could not be completed.
```

## Rate limit

```text
You have reached your free analysis limit.
```

Never expose raw API or infrastructure errors.

---

# 77. Recommended Initial Environment

```env
APP_ENV=production

DATABASE_URL=postgresql://...

REDIS_URL=redis://...

GEMINI_API_KEY=...

GEMINI_PRIMARY_MODEL=gemini-2.5-flash
GEMINI_FAST_MODEL=gemini-2.5-flash-lite

MAX_FILE_SIZE_MB=10
MAX_RESUME_PAGES=5

FREE_ANALYSES_PER_DAY=5

JWT_SECRET=...
```

The exact free-tier request limits should be configured from Google's current quota information rather than hard-coded into the application. Google's pricing page explicitly lists free-tier availability while still imposing quota limits. citeturn579754search1

---

# 78. Deployment Plan

## Low-cost MVP

```text
Frontend
→ Netlify / Vercel

Backend
→ Render / Railway / Fly.io / VPS

Database
→ PostgreSQL

Redis
→ Managed Redis or same-host MVP

AI
→ Gemini API
```

## Production

```text
CDN
 ↓
Frontend
 ↓
Load Balancer
 ↓
FastAPI instances
 ↓
Redis
 ↓
Worker pool
 ↓
PostgreSQL
 ↓
Object storage
```

---

# 79. Docker

Use separate containers:

```text
frontend
backend
worker
postgres
redis
```

Local:

```bash
docker compose up
```

---

# 80. Performance Targets

Initial targets:

```text
Upload response        < 2 sec
PDF parsing            < 5 sec
Basic ATS checks       < 2 sec
JD extraction          < 5 sec
Full AI analysis       < 20 sec target
Dashboard render       < 2 sec
```

Do not make these hard guarantees.

Track real production percentiles:

```text
p50
p95
p99
```

---

# 81. UX Principles

Avoid:

```text
"Your score is 63. Good luck."
```

Use:

```text
Your score: 63

Top problems:
1. 4 required skills are missing
2. 3 bullets lack evidence of impact
3. Formatting may create parsing risk

Recommended order:
Fix required skills → strengthen experience → simplify formatting
```

Users should always know:

```text
What is wrong?
Why?
How important?
How do I fix it?
```

---

# 82. Core Differentiator

The strongest product positioning is:

```text
Not just an ATS score.

An evidence-based resume diagnostic system.
```

Each result should follow:

```text
Score
  ↓
Reason
  ↓
Evidence
  ↓
Recommendation
  ↓
Optional AI rewrite
```

---

# 83. Example End-to-End Result

```text
ATS Compatibility
84 / 100

Resume Health
91 / 100

Job Match
82 / 100

Keyword Coverage
76 / 100
```

## Top strengths

```text
✓ Python appears in 2 roles and 3 projects
✓ FastAPI is directly demonstrated
✓ Resume is machine-readable
✓ Experience chronology is consistent
```

## Highest-priority issues

```text
1. AWS is required but not demonstrated
2. Kubernetes is required but not demonstrated
3. Terraform is preferred but missing
4. Two bullets describe tasks without outcomes
```

## Suggested actions

```text
1. Add genuine AWS evidence if applicable
2. Add genuine Kubernetes evidence if applicable
3. Strengthen two bullets with real outcomes
4. Keep formatting simple and single-column
```

---

# 84. Final Architecture Decision

The production system should use:

```text
                 RESUME
                    │
                    ▼
             ┌──────────────┐
             │ File Parser  │
             └──────┬───────┘
                    │
                    ▼
          Canonical Resume JSON
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
   Deterministic ATS     Gemini AI
        Engine            Analysis
          │                   │
          ▼                   ▼
   Exact / Rules        Semantic / Context
          │                   │
          └─────────┬─────────┘
                    ▼
             Evidence Validator
                    │
                    ▼
              Score Engine
                    │
                    ▼
            Suggestion Engine
                    │
                    ▼
             Results Dashboard
                    │
                    ▼
            Optional AI Rewrite
                    │
                    ▼
                 Re-score
```

---

# 85. Non-Negotiable Rules

1. **Never expose the Gemini API key in the frontend.**
2. **Never let Gemini independently decide the final ATS score.**
3. **Never invent candidate experience.**
4. **Never invent metrics.**
5. **Never tell users to add skills they do not possess.**
6. **Always show evidence for important match claims.**
7. **Separate exact, alias, and semantic matches.**
8. **Show parser confidence.**
9. **Treat formatting warnings as risk indicators, not universal ATS laws.**
10. **Keep scoring weights configurable.**
11. **Use structured Gemini output and validate it.**
12. **Add rate limits and quota handling from the beginning.**
13. **Benchmark against a golden dataset before claiming accuracy.**
14. **Do not market a fabricated “100% ATS accurate” score.**
15. **Optimize the system for reproducibility, explainability, and low hallucination.**

---

# 86. Recommended Build Order

## Step 1 — Foundation

```text
FastAPI
PostgreSQL
React
Docker
Environment configuration
```

## Step 2 — Resume parser

```text
PDF
DOCX
Canonical JSON
Parser confidence
```

## Step 3 — Deterministic ATS engine

```text
Sections
Contact
Dates
Formatting
Keywords
Machine readability
```

## Step 4 — JD engine

```text
Requirements
Skills
Responsibilities
Seniority
Keywords
```

## Step 5 — Scoring engine

```text
Resume Health
Keyword Score
Requirement Score
Job Match
ATS Compatibility
```

## Step 6 — Gemini integration

```text
JD extraction
Context analysis
Bullet analysis
Suggestions
```

## Step 7 — Semantic matching

```text
Embeddings
Candidate evidence retrieval
Gemini verification
```

## Step 8 — Dashboard

```text
Scores
Evidence matrix
Missing requirements
Suggestions
Formatting risks
```

## Step 9 — AI rewrite

```text
Bullet rewrite
User approval
Version creation
Re-score
```

## Step 10 — Production hardening

```text
Authentication
Rate limiting
Caching
Monitoring
Deletion
Security
Quota handling
Tests
Benchmarking
```

---

# 87. Definition of Done

The product is MVP-ready when a user can:

```text
1. Upload a PDF/DOCX resume.
2. See whether it was parsed reliably.
3. Paste a real job description.
4. See required/preferred requirements.
5. See exact and semantic matches separately.
6. Receive a reproducible ATS Compatibility Score.
7. Understand every major score deduction.
8. See missing requirements.
9. Receive AI suggestions.
10. Get safe bullet rewrites.
11. Accept/reject changes.
12. Re-score the updated version.
13. Delete their resume and analysis.
14. Use the free tier without exposing API credentials.
```

---

# 88. Final Product Vision

The finished website should feel less like:

> "AI gave me a random resume score."

and more like:

> "The system inspected my resume, compared it with this exact job, showed the evidence behind every major finding, and gave me a safe prioritized plan to improve it."

That is the right path toward a genuinely useful ATS analyzer.
