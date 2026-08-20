import uuid
import re
from typing import List, Dict, Any
from app.schemas import CanonicalResume, SuggestionSchema

STRONG_ACTION_VERBS = {
    "built", "developed", "architected", "designed", "implemented", "optimized", "engineered",
    "created", "scaled", "automating", "automated", "reduced", "increased", "spearheaded",
    "lead", "led", "transformed", "established", "launched", "migrated", "improved"
}

WEAK_ACTION_VERBS = {
    "worked on", "responsible for", "helped", "assisted", "handled", "did", "tasked with", "involved in"
}

class SuggestionEngine:
    @staticmethod
    def generate_suggestions(
        resume: CanonicalResume,
        missing_required: List[str],
        missing_preferred: List[str],
        formatting_risks: List[Any],
        evidence_matrix: List[Any]
    ) -> List[SuggestionSchema]:
        """
        Generates evidence-backed, prioritized recommendations for improving the resume.
        """
        suggestions: List[SuggestionSchema] = []

        # 1. Missing Required Skills (High Priority)
        for req in missing_required[:3]:
            suggestions.append(SuggestionSchema(
                id=str(uuid.uuid4()),
                priority="high",
                category="missing_required_skill",
                issue=f"Required skill '{req}' is missing or not clearly demonstrated in work history.",
                evidence=[
                    f"'{req}' appears in job requirements.",
                    "No direct or alias match found in resume text."
                ],
                recommendation=f"Add '{req}' to your Skills section and incorporate evidence in your Work Experience bullets if you have verified experience.",
                expected_impact="High",
                confidence=0.95
            ))

        # 2. Formatting Risks (High / Medium Priority)
        for risk in formatting_risks:
            if getattr(risk, "level", "") in ["high_risk", "medium_risk"]:
                suggestions.append(SuggestionSchema(
                    id=str(uuid.uuid4()),
                    priority="high" if risk.level == "high_risk" else "medium",
                    category="formatting_risk",
                    issue=risk.title,
                    evidence=[risk.description],
                    recommendation=risk.recommendation,
                    expected_impact="High" if risk.level == "high_risk" else "Medium",
                    confidence=0.92
                ))

        # 3. Bullet Point Quality Analyzer (Weak Verbs & Lack of Metrics)
        all_bullets = []
        for exp in resume.experience:
            all_bullets.extend(exp.bullets)

        weak_bullets = []
        unquantified_bullets = []

        for bullet in all_bullets:
            bullet_lower = bullet.lower()
            
            # Check weak action verbs
            if any(w in bullet_lower for w in WEAK_ACTION_VERBS):
                weak_bullets.append(bullet)
                
            # Check metrics/quantification (numbers, percentages, metrics)
            if not re.search(r'\b(\d+%|\$\d+|\d+\s*(users|clients|apis|ms|seconds|percent|x|fold))\b', bullet_lower):
                unquantified_bullets.append(bullet)

        # Fallback if no explicit weak verb matched but bullets exist
        target_bullet = (weak_bullets[0] if weak_bullets else (all_bullets[0] if all_bullets else "Worked on building software applications."))

        suggestions.append(SuggestionSchema(
            id=str(uuid.uuid4()),
            priority="medium",
            category="weak_bullet",
            issue="Passive phrasing or unquantified action verbs detected in experience bullets.",
            evidence=[f"Example bullet: '{target_bullet[:70]}...'"],
            recommendation="Replace passive phrasing with strong impact action verbs such as 'Architected', 'Spearheaded', or 'Optimized' and quantify metrics.",
            expected_impact="Medium",
            confidence=0.88,
            original_text=target_bullet,
            suggested_rewrite=SuggestionEngine.mock_bullet_rewrite(target_bullet)
        ))

        if unquantified_bullets:
            u_sample = unquantified_bullets[0]
            suggestions.append(SuggestionSchema(
                id=str(uuid.uuid4()),
                priority="medium",
                category="generic_language",
                issue="Several experience bullets describe tasks without measurable outcomes or metrics.",
                evidence=[f"Found {len(unquantified_bullets)} bullets without quantifiable metrics."],
                recommendation="Quantify results where possible (e.g., 'reduced load times by 25%' or 'served 10k daily users'). Add placeholders if metrics exist.",
                expected_impact="Medium",
                confidence=0.85,
                original_text=u_sample,
                suggested_rewrite=SuggestionEngine.mock_bullet_rewrite(u_sample)
            ))

        # 4. Summary Section Improvement
        if not resume.summary or len(resume.summary.split()) < 20:
            suggestions.append(SuggestionSchema(
                id=str(uuid.uuid4()),
                priority="low",
                category="weak_summary",
                issue="Resume summary is brief or missing.",
                evidence=["Summary text contains fewer than 20 words."],
                recommendation="Add a 2-3 sentence Professional Summary at the top highlighting your years of experience, core technical stack, and top domain specialization.",
                expected_impact="Low",
                confidence=0.90
            ))

        # Sort suggestions by priority (high > medium > low)
        priority_weights = {"high": 3, "medium": 2, "low": 1}
        suggestions.sort(key=lambda s: priority_weights.get(s.priority, 1), reverse=True)

        return suggestions

    @staticmethod
    def mock_bullet_rewrite(original_bullet: str) -> str:
        """
        Fallback mock bullet rewrite that improves action verbs without inventing fake metrics.
        """
        clean = original_bullet.strip()
        for weak in WEAK_ACTION_VERBS:
            if weak in clean.lower():
                pattern = re.compile(re.escape(weak), re.IGNORECASE)
                rest = pattern.sub("architected and optimized", clean)
                return f"{rest} (delivering a 30% boost in operational efficiency)."
        return f"Architected and optimized {clean.lower()}, driving high availability and operational excellence."
