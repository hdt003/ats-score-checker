from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Candidate Info Schema
class CandidateInfo(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    portfolio: Optional[str] = ""

# Skill Entry Schema
class SkillEntry(BaseModel):
    name: str
    category: str = "technical"
    source: str = "skills_section"

# Experience Entry Schema
class ExperienceEntry(BaseModel):
    company: Optional[str] = ""
    title: Optional[str] = ""
    location: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    bullets: List[str] = []

# Canonical Resume Schema
class CanonicalResume(BaseModel):
    candidate: CandidateInfo = Field(default_factory=CandidateInfo)
    summary: str = ""
    skills: List[SkillEntry] = []
    experience: List[ExperienceEntry] = []
    education: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    certifications: List[str] = []
    achievements: List[str] = []
    sections: List[str] = []
    raw_text: str = ""
    page_count: int = 1
    parser_confidence: float = 1.0

# Job Description Schema
class CanonicalJob(BaseModel):
    title: Optional[str] = ""
    company: Optional[str] = ""
    seniority: Optional[str] = ""
    years_experience: Optional[int] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    responsibilities: List[str] = []
    education_requirements: List[str] = []
    certifications: List[str] = []
    tools: List[str] = []
    domain_terms: List[str] = []
    soft_skills: List[str] = []
    keywords: List[str] = []

# Formatting Risk Indicator
class FormattingRisk(BaseModel):
    rule: str
    level: str  # high_risk, medium_risk, low_risk, safe
    title: str
    description: str
    recommendation: str

# Requirement Evidence Matrix Item
class EvidenceMatrixItem(BaseModel):
    requirement: str
    importance: str  # Required, Preferred, Nice-to-Have
    match_status: str  # Matched, Partial, Semantic, Missing
    exact_match: bool = False
    alias_match: bool = False
    semantic_match: bool = False
    resume_evidence: List[str] = []
    confidence: float = 0.9
    impact: str = "High"

# Suggestion Schema
class SuggestionSchema(BaseModel):
    id: Optional[str] = None
    priority: str  # high, medium, low
    category: str
    issue: str
    evidence: List[str] = []
    recommendation: str
    expected_impact: str = "Medium"
    confidence: float = 0.9
    status: str = "pending"
    original_text: Optional[str] = None
    suggested_rewrite: Optional[str] = None

# Analysis Response Schema
class ScoreBreakdown(BaseModel):
    overall: int
    resume_health: int
    job_match: int
    keywords: int
    parsing: int
    formatting: int
    experience: int

class AnalysisResponse(BaseModel):
    analysis_id: str
    scores: ScoreBreakdown
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    missing_requirements: List[str]
    formatting_risks: List[FormattingRisk]
    suggestions: List[SuggestionSchema]
    evidence_matrix: List[EvidenceMatrixItem]
    parser_confidence: float
    ai_confidence: float
    keywords_matched: List[str]
    keywords_missing: List[str]
    semantic_matches: List[Dict[str, str]]

# Request payload for starting analysis
class CreateAnalysisRequest(BaseModel):
    resume_id: Optional[str] = None
    raw_resume_text: Optional[str] = None
    job_description: Optional[str] = None
    custom_weights: Optional[Dict[str, float]] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None

# Request payload for bullet rewrite
class RewriteRequest(BaseModel):
    suggestion_id: str
    original_text: str
    context: Optional[str] = ""
    user_metrics: Optional[str] = ""

class RewriteResponse(BaseModel):
    suggestion_id: str
    original_text: str
    suggested_rewrite: str
    rationale: str
    rule_checks: List[str]
