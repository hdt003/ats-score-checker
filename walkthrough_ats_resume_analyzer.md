# Hosted ATS Resume Analyzer & Job Match Engine — Walkthrough & Architecture

## Overview
We have built and verified the **ATS Resume Analyzer Platform**, a hosted full-stack application for deterministic ATS compatibility testing, evidence-backed job description matching, formatting health audits, and Gemini AI-powered bullet optimization.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (React + TypeScript + Vite + Tailwind CSS)"]
        UI[Glassmorphic UI Engine]
        Uploader[Resume Uploader & Raw Text Parser]
        JD[Job Description Matcher]
        Dash[ATS Results Dashboard]
        Modal[1-Click Gemini AI Bullet Optimizer]
    end

    subgraph Backend ["Backend (FastAPI + Python + SQLAlchemy)"]
        API[REST Endpoints /api]
        Parser[Multi-Format Resume Parser\n(PyMuPDF & python-docx)]
        DetEngine[Deterministic ATS Health Engine]
        KeyEngine[Keyword & Tech Alias Normalizer]
        SemEngine[TF-IDF & Cosine Similarity Engine]
        Gemini[Google Gemini 2.5/2.0 Flash AI Service]
        ScoreEngine[Transparent Score Aggregator]
        DB[(PostgreSQL / SQLite Database)]
    end

    Uploader -->|Upload PDF / DOCX| API
    JD -->|Post Job Requirements| API
    API --> Parser
    Parser --> DetEngine
    Parser --> KeyEngine
    Parser --> SemEngine
    KeyEngine & SemEngine & DetEngine --> Gemini
    Gemini --> ScoreEngine
    ScoreEngine --> DB
    ScoreEngine -->|Return Complete Analysis JSON| Dash
    Modal -->|Trigger Instant Rescore| API
```

---

## Key Features Implemented

### 1. Multi-Format Parsing & Health Audit
- **Layout-Aware PDF Parser (`PyMuPDF`):** Extracts body text while analyzing column layouts, table structures, and font hierarchies.
- **DOCX Parser (`python-docx`):** Parses native Word document structures and section headings.
- **Section Extractor:** Regex-based detection for standard sections (`Experience`, `Education`, `Skills`, `Projects`, `Summary`) and candidate contact details (`Email`, `Phone`, `LinkedIn`, `GitHub`, `Location`).

### 2. Transparent Multi-Engine Compatibility Scoring (0–100)
The overall score is calculated using explicit, weighted criteria:
$$\text{Overall Score} = 0.25 \times \text{ReqCoverage} + 0.20 \times \text{KeyCoverage} + 0.20 \times \text{MachineParse} + 0.15 \times \text{ExpMatch} + 0.10 \times \text{FormatSafety} + 0.10 \times \text{BulletQuality}$$

- **Resume Health (0-100):** Contact completeness & standard headings checklist.
- **Job Match (0-100):** Exact + alias + semantic requirement coverage.
- **Keyword Coverage (0-100):** Normalizes tech skill synonyms (e.g. `React.js` $\leftrightarrow$ `React`, `Python 3` $\leftrightarrow$ `Python`).
- **Formatting Safety (0-100):** Flags multi-column layouts, embedded graphics, missing headings, and date inconsistencies.
- **Machine Parse (0-100):** Evaluates overall text extraction reliability.

### 3. Requirement Evidence Matrix
For every job description requirement, the engine displays:
- **Requirement Name & Importance** (`Required` vs `Preferred`)
- **Match Status** (`Matched`, `Partial`, `Semantic Match`, `Missing`)
- **Resume Evidence Quote** (Direct quote extracted from work experience)
- **Match Confidence %**

### 4. 1-Click Gemini AI Bullet Optimizer
- **Hallucination-Guarded Rewrites:** Improves passive action verbs (`worked on`, `responsible for`) into strong verbs (`Architected`, `Spearheaded`, `Optimized`).
- **User Verified Metric Prompt:** Allows candidates to enter real numbers without inventing fake statistics.
- **Instant Rescoring:** Accepting a rewrite triggers immediate score updates (e.g., **60** $\rightarrow$ **65**).

---

## UI Screenshots & Media

The interactive recording of the full application flow is available in artifacts:
![ATS Resume Analyzer Interactive Flow](file:///C:/Users/harsh/.gemini/antigravity/brain/51c2bb77-d7c2-467a-8603-b86faadcde83/ats_full_interactive_demo_1787167359669.webp)

---

## Live Development Servers

| Component | Tech Stack | Status | URL |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React 19 + TypeScript + Vite + Tailwind CSS | **RUNNING** | `http://localhost:5173/` |
| **Backend REST API** | FastAPI + Uvicorn + Gemini GenAI SDK | **RUNNING** | `http://localhost:8000/` |
| **API Documentation** | OpenAPI / Swagger UI | **ACTIVE** | `http://localhost:8000/docs` |
