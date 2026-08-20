export interface CandidateInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface SkillEntry {
  name: string;
  category: string;
  source: string;
}

export interface ExperienceEntry {
  company?: string;
  title?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  bullets: string[];
}

export interface CanonicalResume {
  candidate: CandidateInfo;
  summary: string;
  skills: SkillEntry[];
  experience: ExperienceEntry[];
  sections: string[];
  raw_text: string;
  page_count: number;
  parser_confidence: number;
}

export interface ScoreBreakdown {
  overall: number;
  resume_health: number;
  job_match: number;
  keywords: number;
  parsing: number;
  formatting: number;
  experience: number;
}

export interface FormattingRisk {
  rule: string;
  level: 'high_risk' | 'medium_risk' | 'low_risk' | 'safe';
  title: string;
  description: string;
  recommendation: string;
}

export interface EvidenceMatrixItem {
  requirement: string;
  importance: string;
  match_status: 'Matched' | 'Partial' | 'Semantic' | 'Missing';
  exact_match?: boolean;
  alias_match?: boolean;
  semantic_match?: boolean;
  resume_evidence: string[];
  confidence: number;
  impact: string;
}

export interface SuggestionSchema {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  evidence: string[];
  recommendation: string;
  expected_impact: string;
  confidence: number;
  status?: string;
  original_text?: string;
  suggested_rewrite?: string;
}

export interface AnalysisResponse {
  analysis_id: string;
  scores: ScoreBreakdown;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_requirements: string[];
  formatting_risks: FormattingRisk[];
  suggestions: SuggestionSchema[];
  evidence_matrix: EvidenceMatrixItem[];
  parser_confidence: number;
  ai_confidence: number;
  keywords_matched: string[];
  keywords_missing: string[];
  semantic_matches: { jd_term: string; matched_alias: string }[];
}

export interface KeywordMatch {
  keyword: string;
  is_required?: boolean;
  found_as?: string;
}

export interface SemanticMatch {
  jd_keyword: string;
  resume_concept: string;
  similarity_score: number;
}

export interface SampleData {
  id: string;
  title: string;
  target_role: string;
  resume_text: string;
  job_description: string;
}
