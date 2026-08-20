import uuid
from app.parsers.pdf_parser import PDFParser
from app.parsers.docx_parser import DOCXParser
from app.parsers.section_extractor import SectionExtractor
from app.schemas import CanonicalResume, CandidateInfo, SkillEntry, ExperienceEntry

class ResumeParserPipeline:
    @staticmethod
    def parse_file(file_bytes: bytes, filename: str, mime_type: str) -> CanonicalResume:
        """
        Runs the full text & layout extraction pipeline for PDF, DOCX, or TXT.
        """
        filename_lower = filename.lower()
        if filename_lower.endswith('.pdf') or 'pdf' in mime_type:
            parsed_raw = PDFParser.parse_pdf(file_bytes)
        elif filename_lower.endswith('.docx') or 'officedocument' in mime_type:
            parsed_raw = DOCXParser.parse_docx(file_bytes)
        else:
            # Plain text fallback
            raw_str = file_bytes.decode('utf-8', errors='ignore')
            word_count = len(raw_str.split())
            parsed_raw = {
                "raw_text": raw_str,
                "page_count": max(1, round(word_count / 450)),
                "word_count": word_count,
                "has_images": False,
                "has_tables": False,
                "has_multi_column": False,
                "has_header_footer_text": False,
                "parser_confidence": 1.0 if word_count > 30 else 0.5,
                "success": True,
                "error": None
            }
            
        raw_text = parsed_raw.get("raw_text", "")
        contact_info = SectionExtractor.extract_contact_info(raw_text)
        sections_data = SectionExtractor.identify_sections(raw_text)
        
        detected_sections = sections_data.get("detected_sections", [])
        section_content = sections_data.get("section_content", {})
        
        # Extract summary text
        summary_text = section_content.get("summary", "")
        
        # Extract skills
        skills_text = section_content.get("skills", "")
        extracted_skills = SectionExtractor.extract_skills_from_section(skills_text) if skills_text else []
        
        # Extract experience bullets
        exp_text = section_content.get("experience", "")
        exp_bullets = SectionExtractor.parse_experience_bullets(exp_text) if exp_text else []
        
        experience_entries = []
        if exp_bullets:
            experience_entries.append(ExperienceEntry(
                company="Extracted Work History",
                title="Professional Experience",
                bullets=exp_bullets
            ))
            
        # Build CanonicalResume
        canonical = CanonicalResume(
            candidate=CandidateInfo(**contact_info),
            summary=summary_text,
            skills=[SkillEntry(**s) for s in extracted_skills],
            experience=experience_entries,
            sections=detected_sections,
            raw_text=raw_text,
            page_count=parsed_raw.get("page_count", 1),
            parser_confidence=parsed_raw.get("parser_confidence", 1.0)
        )
        
        return canonical

    @staticmethod
    def parse_raw_text(raw_text: str) -> CanonicalResume:
        """
        Parses direct text paste into CanonicalResume.
        """
        contact_info = SectionExtractor.extract_contact_info(raw_text)
        sections_data = SectionExtractor.identify_sections(raw_text)
        
        detected_sections = sections_data.get("detected_sections", [])
        section_content = sections_data.get("section_content", {})
        
        summary_text = section_content.get("summary", "")
        skills_text = section_content.get("skills", "")
        extracted_skills = SectionExtractor.extract_skills_from_section(skills_text) if skills_text else []
        exp_text = section_content.get("experience", "")
        exp_bullets = SectionExtractor.parse_experience_bullets(exp_text) if exp_text else []
        
        experience_entries = []
        if exp_bullets:
            experience_entries.append(ExperienceEntry(
                company="Work History",
                title="Professional Experience",
                bullets=exp_bullets
            ))
            
        word_count = len(raw_text.split())
        
        return CanonicalResume(
            candidate=CandidateInfo(**contact_info),
            summary=summary_text,
            skills=[SkillEntry(**s) for s in extracted_skills],
            experience=experience_entries,
            sections=detected_sections,
            raw_text=raw_text,
            page_count=max(1, round(word_count / 450)),
            parser_confidence=1.0 if word_count > 40 else 0.5
        )
