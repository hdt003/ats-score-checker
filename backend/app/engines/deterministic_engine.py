import re
from typing import List, Dict, Any
from app.schemas import CanonicalResume, FormattingRisk

class DeterministicEngine:
    @staticmethod
    def analyze_formatting_and_health(resume: CanonicalResume, raw_metadata: dict = None) -> Dict[str, Any]:
        """
        Runs deterministic checks on formatting, document structure, sections, contact details, and dates.
        """
        metadata = raw_metadata or {}
        raw_text = resume.raw_text
        word_count = len(raw_text.split())
        page_count = resume.page_count
        
        risks: List[FormattingRisk] = []
        
        # 1. Multi-Column Layout Check
        if metadata.get("has_multi_column"):
            risks.append(FormattingRisk(
                rule="multi_column_layout",
                level="high_risk",
                title="Complex Multi-Column Layout Detected",
                description="Text is arranged in multiple parallel columns, which can cause ATS parsers to mix text across columns horizontally.",
                recommendation="Use a standard single-column document layout to guarantee chronological reading order."
            ))
        else:
            risks.append(FormattingRisk(
                rule="multi_column_layout",
                level="safe",
                title="Single Column Layout",
                description="Clean, linear text structure detected.",
                recommendation="Maintain single-column structure."
            ))
            
        # 2. Table / Grid Structure Check
        if metadata.get("has_tables"):
            risks.append(FormattingRisk(
                rule="tables_detected",
                level="medium_risk",
                title="Tables / Cell Grids Detected",
                description="Some older ATS systems skip or re-order text contained inside document table borders.",
                recommendation="Format sections using standard tabs, bullet points, and margin spacing instead of nested tables."
            ))
            
        # 3. Text Extraction & Graphics Check
        if metadata.get("has_images"):
            risks.append(FormattingRisk(
                rule="images_or_graphics",
                level="medium_risk",
                title="Embedded Graphics / Icons",
                description="Graphic elements or image icons detected. Ensure no critical skill or contact info is embedded inside images.",
                recommendation="Keep all contact information and skill keywords in plain text."
            ))
            
        # 4. Critical Section Coverage Check
        essential_sections = ["experience", "education", "skills"]
        missing_essential = [sec for sec in essential_sections if sec not in resume.sections]
        if missing_essential:
            risks.append(FormattingRisk(
                rule="standard_section_headings",
                level="high_risk",
                title=f"Missing Standard Headings: {', '.join(missing_essential).upper()}",
                description="ATS algorithms search for standard headings like 'Work Experience', 'Education', and 'Skills'.",
                recommendation=f"Add clear, standard section headings for: {', '.join(missing_essential).title()}."
            ))
        else:
            risks.append(FormattingRisk(
                rule="standard_section_headings",
                level="safe",
                title="Standard Section Structure",
                description="Found standard Experience, Education, and Skills headings.",
                recommendation="Structure looks standard and machine-readable."
            ))

        # 5. Contact Information Completeness Check
        c = resume.candidate
        contact_issues = []
        if not c.email:
            contact_issues.append("Email address")
        if not c.phone:
            contact_issues.append("Phone number")
        if not c.linkedin:
            contact_issues.append("LinkedIn profile link")
            
        if contact_issues:
            risks.append(FormattingRisk(
                rule="contact_completeness",
                level="medium_risk" if len(contact_issues) == 1 else "high_risk",
                title="Incomplete Contact Information",
                description=f"Could not extract: {', '.join(contact_issues)}.",
                recommendation="Place Email, Phone, Location, and LinkedIn link at the top of your resume in plain body text."
            ))

        # 6. Page Length Heuristic
        if page_count > 3:
            risks.append(FormattingRisk(
                rule="page_length",
                level="medium_risk",
                title="Excessive Document Length",
                description=f"Resume spans {page_count} pages. Standard ATS and recruiter preferences lean toward 1-2 pages.",
                recommendation="Trim experience to the most recent and relevant 10-15 years, targeting 1 to 2 pages."
            ))
        elif word_count < 150:
            risks.append(FormattingRisk(
                rule="document_word_count",
                level="high_risk",
                title="Very Short Resume Text",
                description=f"Only {word_count} words parsed from resume. This may indicate an image-based PDF scan or missing details.",
                recommendation="Ensure your PDF contains selectable plain text rather than scanned raster images."
            ))

        # 7. Date Format & Timeline Consistency Check
        date_matches = re.findall(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)?\s*20\d{2}\b', raw_text, re.IGNORECASE)
        numeric_dates = re.findall(r'\b(0[1-9]|1[0-2])/(20\d{2})\b', raw_text)
        
        if not date_matches and not numeric_dates:
            risks.append(FormattingRisk(
                rule="date_consistency",
                level="medium_risk",
                title="Non-Standard Date Formats",
                description="Could not detect standard month/year date patterns (e.g., 'Jan 2022' or '05/2021').",
                recommendation="Use clear, consistent date formats like 'MM/YYYY' or 'Month YYYY' for all position start/end dates."
            ))

        # Calculate scores
        # Formatting score starts at 100, drops per risk level
        formatting_score = 100
        for r in risks:
            if r.level == "high_risk":
                formatting_score -= 25
            elif r.level == "medium_risk":
                formatting_score -= 12
            elif r.level == "low_risk":
                formatting_score -= 5
        formatting_score = max(30, min(100, formatting_score))

        # Parsing score calculation
        parsing_score = int(resume.parser_confidence * 100)
        if metadata.get("has_multi_column"):
            parsing_score -= 15
        if word_count < 150:
            parsing_score -= 30
        parsing_score = max(20, min(100, parsing_score))

        # Resume Health Score
        health_score = int(
            parsing_score * 0.25 +
            formatting_score * 0.25 +
            (100 if not contact_issues else 60) * 0.20 +
            (100 if not missing_essential else 50) * 0.20 +
            (90 if page_count in [1, 2] else 70) * 0.10
        )
        health_score = max(30, min(100, health_score))

        return {
            "formatting_score": formatting_score,
            "parsing_score": parsing_score,
            "resume_health_score": health_score,
            "formatting_risks": risks,
            "contact_issues": contact_issues,
            "word_count": word_count,
            "page_count": page_count
        }
