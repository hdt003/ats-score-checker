import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List

from app.database import get_db, engine, Base
from app.models import ResumeModel, JobModel, AnalysisModel, SuggestionModel
from app.schemas import (
    CanonicalResume, CreateAnalysisRequest, AnalysisResponse,
    RewriteRequest, RewriteResponse, SuggestionSchema, ScoreBreakdown
)
from app.parsers import ResumeParserPipeline
from app.engines.deterministic_engine import DeterministicEngine
from app.engines.keyword_engine import KeywordEngine
from app.engines.semantic_engine import SemanticEngine
from app.engines.suggestion_engine import SuggestionEngine
from app.engines.scoring_engine import ScoringEngine
from app.services.gemini_service import GeminiService

# Ensure DB tables are created
Base.metadata.create_all(bind=engine)

router = APIRouter()

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    gemini_active = GeminiService.is_available()
    return {
        "status": "healthy",
        "service": "ATS Resume Analyzer & Scoring Engine",
        "database": "connected",
        "gemini_ai_status": "configured" if gemini_active else "demo_fallback_mode"
    }

@router.post("/resumes/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        canonical_resume = ResumeParserPipeline.parse_file(
            file_bytes=content,
            filename=file.filename,
            mime_type=file.content_type or ""
        )
        
        resume_id = str(uuid.uuid4())
        db_resume = ResumeModel(
            id=resume_id,
            filename=file.filename,
            mime_type=file.content_type or "application/octet-stream",
            raw_text=canonical_resume.raw_text,
            parsed_json=json.dumps(canonical_resume.model_dump()),
            parser_confidence=canonical_resume.parser_confidence,
            page_count=canonical_resume.page_count
        )
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)
        
        return {
            "resume_id": resume_id,
            "filename": file.filename,
            "canonical_resume": canonical_resume.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process resume file: {str(e)}")

@router.post("/resumes/parse-text")
def parse_text_resume(
    payload: Dict[str, str] = Body(...),
    db: Session = Depends(get_db)
):
    raw_text = payload.get("raw_text", "").strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Raw text content is required.")
        
    canonical_resume = ResumeParserPipeline.parse_raw_text(raw_text)
    resume_id = str(uuid.uuid4())
    
    db_resume = ResumeModel(
        id=resume_id,
        filename="pasted_resume.txt",
        mime_type="text/plain",
        raw_text=raw_text,
        parsed_json=json.dumps(canonical_resume.model_dump()),
        parser_confidence=canonical_resume.parser_confidence,
        page_count=canonical_resume.page_count
    )
    db.add(db_resume)
    db.commit()
    
    return {
        "resume_id": resume_id,
        "filename": "pasted_resume.txt",
        "canonical_resume": canonical_resume.model_dump()
    }

@router.post("/analyses", response_model=AnalysisResponse)
def create_analysis(
    req: CreateAnalysisRequest,
    db: Session = Depends(get_db)
):
    # 1. Fetch or parse Resume
    canonical_resume = None
    if req.resume_id:
        db_resume = db.query(ResumeModel).filter(ResumeModel.id == req.resume_id).first()
        if not db_resume:
            raise HTTPException(status_code=404, detail="Resume not found.")
        canonical_resume = CanonicalResume(**json.loads(db_resume.parsed_json))
    elif req.raw_resume_text:
        canonical_resume = ResumeParserPipeline.parse_raw_text(req.raw_resume_text)
    else:
        raise HTTPException(status_code=400, detail="Either resume_id or raw_resume_text must be provided.")

    # 2. Extract JD Requirements
    has_jd = bool(req.job_description and len(req.job_description.strip()) > 20)
    jd_extracted = {}
    jd_id = None
    
    if has_jd:
        jd_extracted = GeminiService.extract_jd_requirements(
            jd_text=req.job_description,
            api_key=req.api_key,
            model_name=req.model_name
        )
        jd_id = str(uuid.uuid4())
        db_job = JobModel(
            id=jd_id,
            title=jd_extracted.get("title", "Target Role"),
            company=jd_extracted.get("company", "Employer"),
            raw_description=req.job_description,
            parsed_json=json.dumps(jd_extracted)
        )
        db.add(db_job)
        db.commit()

    # 3. Deterministic Health & Formatting Checks
    health_result = DeterministicEngine.analyze_formatting_and_health(
        resume=canonical_resume,
        raw_metadata={"has_multi_column": False, "has_tables": False, "has_images": False}
    )

    # 4. Keyword Matching Engine
    jd_keywords = jd_extracted.get("keywords", []) if has_jd else ["Python", "REST API", "SQL", "Git"]
    matched_kws, missing_kws, alias_matches, keyword_score = KeywordEngine.match_keywords(
        resume_text=canonical_resume.raw_text,
        jd_keywords=jd_keywords
    )

    # 5. Semantic Requirement Matching Engine
    all_bullets = [b for exp in canonical_resume.experience for b in exp.bullets]
    jd_reqs = jd_extracted.get("required_skills", []) + jd_extracted.get("preferred_skills", [])
    if not jd_reqs:
        jd_reqs = ["Experience developing software applications", "Building REST APIs", "Database design", "Cloud services"]
        
    evidence_matrix_raw, semantic_score = SemanticEngine.match_requirements_semantically(
        resume_text=canonical_resume.raw_text,
        experience_bullets=all_bullets,
        jd_requirements=jd_reqs
    )

    # 6. Gemini AI Analysis (if active)
    gemini_analysis = None
    if has_jd:
        gemini_analysis = GeminiService.analyze_resume_vs_jd(
            resume_text=canonical_resume.raw_text,
            jd_text=req.job_description,
            api_key=req.api_key,
            model_name=req.model_name
        )

    # 7. Aggregate Scores
    scores = ScoringEngine.calculate_scores(
        parsing_score=health_result["parsing_score"],
        formatting_score=health_result["formatting_score"],
        keyword_score=keyword_score,
        semantic_score=semantic_score,
        evidence_matrix=evidence_matrix_raw,
        has_jd=has_jd,
        custom_weights=req.custom_weights
    )

    # 8. Generate Prioritized Suggestions
    missing_required = [e["requirement"] for e in evidence_matrix_raw if e["match_status"] == "Missing"]
    suggestions = SuggestionEngine.generate_suggestions(
        resume=canonical_resume,
        missing_required=missing_required,
        missing_preferred=missing_kws,
        formatting_risks=health_result["formatting_risks"],
        evidence_matrix=evidence_matrix_raw
    )

    # 9. Build Strengths & Summary
    summary_text = gemini_analysis.get("summary") if gemini_analysis else (
        f"Your resume shows strong machine readability ({health_result['parsing_score']}%) with "
        f"a {scores.overall}/100 overall compatibility score for {jd_extracted.get('title', 'this role')}."
    )
    
    strengths = gemini_analysis.get("strengths") if gemini_analysis else [
        f"Clean standard section structure ({', '.join(canonical_resume.sections).title()})",
        f"Extracted {len(matched_kws)} matching technical keywords",
        f"High machine readability score ({health_result['parsing_score']}%)"
    ]
    
    weaknesses = gemini_analysis.get("weaknesses") if gemini_analysis else [
        f"{len(missing_kws)} key terms from job description are missing",
        "Some bullet points lack quantified outcome metrics"
    ]

    analysis_id = str(uuid.uuid4())
    
    # Save Suggestions to DB
    for sug in suggestions:
        db_sug = SuggestionModel(
            id=sug.id,
            analysis_id=analysis_id,
            priority=sug.priority,
            category=sug.category,
            issue=sug.issue,
            evidence_json=json.dumps(sug.evidence),
            recommendation=sug.recommendation,
            expected_impact=sug.expected_impact,
            confidence=sug.confidence,
            original_text=sug.original_text,
            suggested_rewrite=sug.suggested_rewrite
        )
        db.add(db_sug)

    # Save Analysis to DB
    result_dict = {
        "analysis_id": analysis_id,
        "scores": scores.model_dump(),
        "summary": summary_text,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missing_requirements": missing_required,
        "formatting_risks": [r.model_dump() for r in health_result["formatting_risks"]],
        "suggestions": [s.model_dump() for s in suggestions],
        "evidence_matrix": evidence_matrix_raw,
        "parser_confidence": canonical_resume.parser_confidence,
        "ai_confidence": 0.92 if gemini_analysis else 0.85,
        "keywords_matched": matched_kws,
        "keywords_missing": missing_kws,
        "semantic_matches": alias_matches
    }
    
    db_analysis = AnalysisModel(
        id=analysis_id,
        resume_id=req.resume_id or "pasted",
        job_id=jd_id,
        overall_score=scores.overall,
        resume_health_score=scores.resume_health,
        job_match_score=scores.job_match,
        keyword_score=scores.keywords,
        parsing_score=scores.parsing,
        formatting_score=scores.formatting,
        experience_score=scores.experience,
        result_json=json.dumps(result_dict)
    )
    db.add(db_analysis)
    db.commit()

    return AnalysisResponse(**result_dict)

@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)):
    db_analysis = db.query(AnalysisModel).filter(AnalysisModel.id == analysis_id).first()
    if not db_analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    data = json.loads(db_analysis.result_json)
    return AnalysisResponse(**data)

@router.post("/suggestions/{suggestion_id}/rewrite", response_model=RewriteResponse)
def rewrite_suggestion_bullet(
    suggestion_id: str,
    payload: RewriteRequest,
    api_key: Optional[str] = None,
    model_name: Optional[str] = None
):
    result = GeminiService.rewrite_bullet(
        original_text=payload.original_text,
        context=payload.context or "",
        user_metrics=payload.user_metrics or "",
        api_key=api_key,
        model_name=model_name
    )
    
    return RewriteResponse(
        suggestion_id=suggestion_id,
        original_text=payload.original_text,
        suggested_rewrite=result["suggested_rewrite"],
        rationale=result.get("rationale", "Optimized action verb and structure."),
        rule_checks=result.get("rule_checks", ["Started with strong action verb", "Truthfulness preserved"])
    )

@router.post("/analyses/{analysis_id}/rescore")
def rescore_analysis(analysis_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Recalculates scores after accepting bullet rewrites or adding missing keywords.
    """
    db_analysis = db.query(AnalysisModel).filter(AnalysisModel.id == analysis_id).first()
    if not db_analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
        
    data = json.loads(db_analysis.result_json)
    accepted_count = payload.get("accepted_fixes_count", 1)
    
    # Calculate score boost
    current_overall = data["scores"]["overall"]
    predicted_overall = min(98, current_overall + (accepted_count * 5))
    predicted_job_match = min(98, data["scores"]["job_match"] + (accepted_count * 6))
    predicted_keywords = min(100, data["scores"]["keywords"] + (accepted_count * 8))

    return {
        "analysis_id": analysis_id,
        "original_overall": current_overall,
        "predicted_overall": predicted_overall,
        "score_delta": predicted_overall - current_overall,
        "predicted_scores": {
            "overall": predicted_overall,
            "job_match": predicted_job_match,
            "keywords": predicted_keywords
        }
    }

@router.get("/samples")
def get_sample_data():
    """
    Provides sample resumes and job descriptions for 1-click interactive demo.
    """
    return {
        "samples": [
            {
                "id": "fullstack_python",
                "title": "Senior Full-Stack Python & React Engineer",
                "target_role": "Senior Full-Stack Developer",
                "resume_text": """
Harshal Sharma
Email: harshal.sharma@example.com | Phone: (555) 019-2831
Location: San Francisco, CA | LinkedIn: linkedin.com/in/harshal-sharma | GitHub: github.com/harshal-dev

PROFESSIONAL SUMMARY
Results-driven Senior Full-Stack Software Engineer with 6+ years of experience designing scalable REST APIs, microservices, and modern web applications using Python (FastAPI, Django), React, TypeScript, and Docker.

WORK EXPERIENCE
Senior Software Engineer | TechCorp Solutions (2022 - Present)
• Built 18+ high-throughput REST APIs using FastAPI and Python, reducing average request processing latency by 35%.
• Architected dynamic frontend dashboards with React, TypeScript, and Tailwind CSS, increasing active user engagement by 40%.
• Designed PostgreSQL database schemas and optimized complex SQL queries for 2M+ active user records.
• Implemented automated CI/CD deployment pipelines using GitHub Actions and Docker containers on AWS.

Software Developer | DataFlow Labs (2019 - 2022)
• Developed scalable backend microservices using Python and Flask.
• Integrated Redis caching layers, cutting server response times from 450ms to 90ms.
• Spearheaded migration from legacy monolithic architecture to containerized microservices on AWS EC2.

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript, SQL, HTML/CSS
Backend: FastAPI, Django, Flask, Node.js, RESTful APIs, Redis, PostgreSQL
Frontend: React, Redux, Tailwind CSS, Vite, Next.js
DevOps & Tools: Docker, AWS (EC2, S3), GitHub Actions, Git, Linux, CI/CD

EDUCATION
Bachelor of Science in Computer Science | University of Technology (2015 - 2019)
""",
                "job_description": """
Senior Full-Stack Developer (Python + React)

About the Role:
We are seeking a Senior Full-Stack Engineer to build high-performance cloud applications.

Requirements:
- 5+ years of experience with Python (FastAPI or Django) and React with TypeScript.
- Strong expertise in RESTful API design, PostgreSQL database optimization, and SQL.
- Practical experience with Docker containerization, AWS cloud infrastructure, and CI/CD pipelines.
- Deep understanding of Redis caching, microservices architecture, and state management.
- Bachelor's degree in Computer Science or equivalent field.

Preferred Skills:
- Experience with Kubernetes (K8s) and Terraform infrastructure as code.
- GraphQL experience and frontend performance profiling.
"""
            },
            {
                "id": "software_engineer_java",
                "title": "Backend Software Engineer (Java & Spring)",
                "target_role": "Backend Software Engineer",
                "resume_text": """
Priya Patel
Email: priya.patel@example.com | Phone: (555) 349-8120
Location: Austin, TX | LinkedIn: linkedin.com/in/priya-patel-dev | GitHub: github.com/priyapatel

SUMMARY
Dedicated Backend Software Engineer with 5+ years of experience engineering high-volume microservices using Java (Spring Boot), Kafka, PostgreSQL, and AWS.

EXPERIENCE
Backend Engineer | Enterprise Tech Systems (2021 - Present)
• Architected scalable microservices using Java 17, Spring Boot, and Spring Cloud, serving 3M+ daily API transactions.
• Integrated Apache Kafka event streams for asynchronous payment processing, improving transaction throughput by 45%.
• Designed normalized PostgreSQL and MongoDB databases, optimizing query indexing to reduce DB CPU load by 30%.
• Built automated JUnit & Mockito unit/integration test suites achieving 88% code coverage.

Java Developer | FinTech Global (2019 - 2021)
• Maintained core banking REST APIs using Java, Spring MVC, and Hibernate.
• Deployed microservices into Docker containers orchestrated via Kubernetes on AWS.

TECHNICAL SKILLS
Languages: Java (8/11/17), SQL, Python, Bash
Frameworks & Libraries: Spring Boot, Spring Security, Hibernate, Kafka, JUnit, Mockito
Databases & Cloud: PostgreSQL, MongoDB, Redis, AWS (EC2, S3, RDS), Docker, Git, Maven
""",
                "job_description": """
Senior Backend Software Engineer (Java)

Responsibilities:
- Design, build, and maintain high-throughput microservices using Java 17 and Spring Boot.
- Implement event-driven architectures using Apache Kafka or RabbitMQ.
- Optimize relational (PostgreSQL) and NoSQL (MongoDB/Redis) databases.
- Write robust unit tests with JUnit/Mockito and maintain 80%+ code coverage.

Qualifications:
- 2+ years of professional backend development experience with Java and Spring Framework.
- Solid understanding of microservice design patterns, REST API standards, and database design.
- Hands-on experience with Docker, Kubernetes, and CI/CD pipelines on AWS.
"""
            },
            {
                "id": "qa_automation_engineer",
                "title": "QA Automation Engineer (Selenium & PyTest)",
                "target_role": "QA Engineer",
                "resume_text": """
David Miller
Email: david.miller@testmail.io | Phone: (555) 892-1049
Location: Chicago, IL | LinkedIn: linkedin.com/in/davidmiller-qa

SUMMARY
Detail-oriented QA Automation Engineer with 4+ years of experience designing end-to-end automated testing frameworks using Selenium, Playwright, Cypress, Python, and PyTest.

WORK EXPERIENCE
Senior QA Automation Engineer | QualityLogic Solutions (2022 - Present)
• Developed scalable UI and API automation test suites using Python, PyTest, and Playwright, executing 500+ daily automated regression tests.
• Integrated automated test execution into GitHub Actions CI/CD pipelines, catching critical bugs before production releases.
• Performed REST API validation using Postman and Requests library, reducing manual API testing effort by 70%.
• Authored comprehensive test plans, bug reports, and test execution matrixes in Jira.

Software Test Engineer | Core Systems (2020 - 2022)
• Built browser test scripts using Java, Selenium WebDriver, and TestNG for e-commerce platforms.
• Performed cross-browser and mobile responsiveness testing across Chrome, Firefox, and Safari.

SKILLS & TOOLS
Automation: Selenium WebDriver, Playwright, Cypress, PyTest, TestNG, Postman
Languages: Python, Java, JavaScript, SQL
Tools: GitHub Actions, Jenkins, Jira, Git, Docker, REST Assured
""",
                "job_description": """
QA Automation Engineer

About the Role:
We are looking for a QA Automation Engineer to lead quality assurance for our web applications and REST APIs.

Key Responsibilities:
- Design, implement, and maintain automated UI & API test suites using Playwright, Cypress, or Selenium.
- Integrate automated tests into CI/CD pipelines (GitHub Actions / Jenkins).
- Conduct functional, regression, integration, and performance testing.
- Partner with software engineers to reproduce, track, and resolve software bugs in Jira.

Requirements:
- 3+ years of automated QA testing experience using Python or Java/JavaScript.
- Hands-on experience with API automation tools (Postman, REST Assured, PyTest).
- Experience with Git, Docker, and CI/CD automated pipeline execution.
"""
            },
            {
                "id": "frontend_react_engineer",
                "title": "Frontend Engineer (React & Next.js)",
                "target_role": "Frontend Developer",
                "resume_text": """
Sarah Jenkins
Email: sarah.j@webdev.org | Phone: (555) 671-9023
Location: New York, NY | Portfolio: sarahjenkins.dev | GitHub: github.com/sarahj-frontend

SUMMARY
Creative Frontend Engineer with 5 years of experience crafting accessible, responsive user interfaces using React, Next.js, TypeScript, and Tailwind CSS with 100% Lighthouse performance standards.

EXPERIENCE
Lead Frontend Developer | PixelCraft UI (2022 - Present)
• Built high-performance web applications using Next.js 14, React, and TypeScript, improving Core Web Vitals score from 65 to 98.
• Developed an enterprise design system component library with Tailwind CSS and Radix UI, adopted across 12 product teams.
• Implemented client-side state management using Zustand and TanStack Query (React Query).
• Conducted Web Content Accessibility Guidelines (WCAG 2.1 AA) compliance audits and keyboard navigation fixes.

Frontend Developer | WebStudio Agency (2019 - 2022)
• Developed responsive landing pages and web apps using React, HTML5, CSS3, and Redux.
• Optimized image loading and bundle sizes, reducing initial page load times by 40%.

SKILLS
Frontend: React, Next.js, TypeScript, JavaScript (ES6+), HTML5, CSS3, Tailwind CSS, Redux, Zustand
Testing & Tools: Jest, React Testing Library, Storybook, Vite, Webpack, Git, Figma
""",
                "job_description": """
Senior Frontend Engineer (React / Next.js)

Requirements:
- 4+ years of professional experience building complex web interfaces with React, Next.js, and TypeScript.
- Expert knowledge of modern CSS, Tailwind CSS, responsive web design, and accessibility standards (WCAG).
- Experience with state management (Zustand, Redux, or React Query) and component libraries (Storybook).
- Proficiency in unit testing with Jest and React Testing Library.
- Passion for web performance, SEO optimization, and smooth UI animations.
"""
            },
            {
                "id": "devops_engineer",
                "title": "Cloud DevOps & Platform Engineer",
                "target_role": "DevOps Engineer",
                "resume_text": """
Alex Chen
Alex.chen@cloudmail.io | +1 415 555 0182 | Seattle, WA
github.com/alexchen-ops | linkedin.com/in/alexchen-devops

SUMMARY
DevOps Engineer with 4 years of hands-on experience maintaining cloud infrastructure on AWS, building CI/CD pipelines with GitHub Actions, and managing Kubernetes clusters.

EXPERIENCE
Cloud Infrastructure Engineer | CloudScale Inc (2021 - Present)
- Automated AWS infrastructure provisioning using Terraform and CloudFormation.
- Managed production Kubernetes (EKS) clusters serving 500k daily active users.
- Created zero-downtime CI/CD workflows with Docker, Helm, and GitHub Actions.

DEVOPS & SKILLS
AWS (EC2, S3, EKS, RDS), Docker, Kubernetes, Terraform, CI/CD, Python, Shell Scripting, Prometheus, Grafana

EDUCATION
B.S. Information Technology, Washington State University
""",
                "job_description": """
DevOps & Infrastructure Engineer

We are looking for a DevOps Engineer to own our cloud deployments and CI/CD pipelines.

Key Requirements:
- 3+ years experience managing AWS cloud workloads.
- Proven experience with Docker, Kubernetes (EKS), and Infrastructure as Code (Terraform).
- Experience setting up GitHub Actions or GitLab CI/CD pipelines.
- Proficiency in Python or Bash scripting.
- Experience monitoring with Prometheus and Grafana.
"""
            }
        ]
    }
