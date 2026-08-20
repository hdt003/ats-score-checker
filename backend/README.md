# ATS Resume Analyzer & Job Match Engine - Backend API

A high-performance Python FastAPI backend service that powers intelligent resume parsing, deterministic ATS layout validation, keyword matching, semantic embeddings, and Gemini AI contextual analysis.

---

## 🤖 Gemini AI Models Used

The backend uses the official **Google GenAI SDK (`google-genai`)** with the following models configured in `app/config.py`:

| Task | Active Gemini AI Model | Fallback Behavior |
| :--- | :--- | :--- |
| **Primary Contextual Analysis** | `gemini-2.5-flash` | Deterministic NLP Engine |
| **Fast JD Requirement Extraction** | `gemini-2.5-flash-lite` | Regular Expression Rule Parser |
| **1-Click AI Bullet Rewriter** | `gemini-2.5-flash` | Structured Action-Verb Template |
| **Semantic Embeddings (Optional)** | `text-embedding-004` | Cosine Similarity Vector Matching |

> **Note:** If `GEMINI_API_KEY` is not configured in `.env`, the system automatically defaults to **Deterministic Fallback Mode**, ensuring 100% offline functionality.

---

## 🚀 Key Features

* **Dual Engine Architecture:** Combines fast deterministic rules (for font safety, layout, multi-column risks) with Gemini 2.5 AI reasoning.
* **100% Local & Confidential:** Resumes are processed in-memory or persisted locally in SQLite (`ats_analyzer.db`).
* **Zero Hallucination Guardrails:** Strict prompt engineering ensures the AI rewriter never invents fake metrics, dates, or employers.
* **FastAPI Async Pipeline:** RESTful endpoints for resume parsing, instant job matching, rescoring, and sample scenario generation.

---

## 🛠️ Tech Stack & Dependencies

* **Framework:** FastAPI (Python 3.10+)
* **AI Provider:** Google GenAI SDK (`google-genai`)
* **Document Parsers:** PyMuPDF (`fitz`), `python-docx`
* **Database:** SQLite via SQLAlchemy ORM (PostgreSQL ready via `DATABASE_URL`)
* **Data Validation:** Pydantic v2
* **Web Server:** Uvicorn

---

## 💻 Local Setup & Execution

### 1. Install Dependencies
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_PRIMARY_MODEL=gemini-2.5-flash
GEMINI_FAST_MODEL=gemini-2.5-flash-lite
DATABASE_URL=sqlite:///./ats_analyzer.db
```

### 3. Run Development Server
```bash
python run.py
```
The API server will run at: `http://localhost:8000`
Interactive Swagger Documentation available at: `http://localhost:8000/docs`

---

## 📡 Key API Endpoints

* `GET /api/health` - Check backend database & Gemini AI configuration status.
* `POST /api/resumes/upload` - Upload PDF/DOCX resume file and extract canonical JSON structure.
* `POST /api/resumes/parse-text` - Parse raw resume text into canonical format.
* `POST /api/analyses` - Execute full ATS compatibility audit (parsing, keywords, evidence matrix, suggestions).
* `POST /api/suggestions/{id}/rewrite` - Generate 1-click AI bullet point rewrite using Gemini 2.5.
* `GET /api/samples` - Retrieve pre-configured demo resume scenarios.
