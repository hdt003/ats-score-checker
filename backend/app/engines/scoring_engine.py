from typing import Dict, Any, List
from app.config import settings
from app.schemas import ScoreBreakdown

class ScoringEngine:
    @staticmethod
    def calculate_scores(
        parsing_score: int,
        formatting_score: int,
        keyword_score: float,
        semantic_score: float,
        evidence_matrix: List[Any],
        has_jd: bool = True,
        custom_weights: Dict[str, float] = None
    ) -> ScoreBreakdown:
        """
        Calculates transparent 0-100 score metrics based on weighted formula from the product plan.
        """
        weights = custom_weights or settings.SCORING_WEIGHTS
        
        # Calculate Requirement Score based on evidence matrix
        if evidence_matrix:
            matched_count = sum(1 for e in evidence_matrix if getattr(e, "match_status", "") in ["Matched", "Strong"])
            partial_count = sum(1 for e in evidence_matrix if getattr(e, "match_status", "") in ["Partial", "Semantic"])
            total_reqs = len(evidence_matrix)
            req_score = round(((matched_count + 0.6 * partial_count) / max(1, total_reqs)) * 100)
        else:
            req_score = int(keyword_score)
            
        req_score = max(0, min(100, req_score))
        
        # Experience relevance score (blend of semantic match and keyword match)
        experience_score = int(0.6 * semantic_score + 0.4 * keyword_score)
        experience_score = max(0, min(100, experience_score))
        
        # Achievement score (bullet quality & quantification)
        achievement_score = int(0.5 * experience_score + 0.5 * formatting_score)
        achievement_score = max(0, min(100, achievement_score))
        
        # Overall ATS Compatibility Score formula
        overall = round(
            parsing_score * weights.get("parsing", 0.20) +
            keyword_score * weights.get("keywords", 0.20) +
            req_score * weights.get("requirements", 0.25) +
            experience_score * weights.get("experience", 0.15) +
            achievement_score * weights.get("achievements", 0.10) +
            formatting_score * weights.get("formatting", 0.10)
        )
        overall = max(10, min(100, overall))

        # Job Match Score
        job_match = int(0.5 * req_score + 0.3 * keyword_score + 0.2 * experience_score) if has_jd else 0
        job_match = max(0, min(100, job_match))

        # Resume Health Score
        resume_health = int(0.35 * parsing_score + 0.35 * formatting_score + 0.30 * achievement_score)
        resume_health = max(10, min(100, resume_health))

        return ScoreBreakdown(
            overall=overall,
            resume_health=resume_health,
            job_match=job_match,
            keywords=int(keyword_score),
            parsing=parsing_score,
            formatting=formatting_score,
            experience=experience_score
        )
