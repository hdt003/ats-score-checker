import re
from typing import Dict, List, Any

# Dictionary of standard section header regexes
SECTION_PATTERNS = {
    "summary": [
        r"^\s*(professional\s+)?summary\b",
        r"^\s*about\s+me\b",
        r"^\s*profile\b",
        r"^\s*executive\s+summary\b",
        r"^\s*career\s+objective\b"
    ],
    "experience": [
        r"^\s*(work|professional|employment)\s+experience\b",
        r"^\s*experience\b",
        r"^\s*work\s+history\b",
        r"^\s*career\s+history\b"
    ],
    "education": [
        r"^\s*education\b",
        r"^\s*academic\s+background\b",
        r"^\s*academic\s+qualifications\b"
    ],
    "skills": [
        r"^\s*(technical\s+)?skills\b",
        r"^\s*core\s+competencies\b",
        r"^\s*technologies\b",
        r"^\s*areas\s+of\s+expertise\b"
    ],
    "projects": [
        r"^\s*projects\b",
        r"^\s*personal\s+projects\b",
        r"^\s*key\s+projects\b"
    ],
    "certifications": [
        r"^\s*certifications?\b",
        r"^\s*licenses?\b",
        r"^\s*certificates?\b"
    ],
    "achievements": [
        r"^\s*achievements?\b",
        r"^\s*honors?\s*(&|and)?\s*awards?\b",
        r"^\s*awards?\b"
    ]
}

class SectionExtractor:
    @staticmethod
    def extract_contact_info(text: str) -> Dict[str, str]:
        """
        Regex-based extraction for email, phone, links, location, and name.
        """
        # Email
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
        email = email_match.group(0) if email_match else ""
        
        # Phone (various US & international formats)
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', text)
        phone = phone_match.group(0).strip() if phone_match else ""
        
        # LinkedIn
        linkedin_match = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+', text, re.IGNORECASE)
        linkedin = linkedin_match.group(0) if linkedin_match else ""
        
        # GitHub
        github_match = re.search(r'(https?://)?(www\.)?github\.com/[a-zA-Z0-9_-]+', text, re.IGNORECASE)
        github = github_match.group(0) if github_match else ""
        
        # Portfolio
        portfolio_match = re.search(r'https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/[a-zA-Z0-9_-]*)*', text)
        portfolio = ""
        if portfolio_match and portfolio_match.group(0) not in [linkedin, github]:
            portfolio = portfolio_match.group(0)
            
        # Name heuristic: First non-empty line of text that isn't an email/URL
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        name = ""
        for line in lines[:5]:
            if "@" not in line and "http" not in line and not re.search(r'\d{5}', line) and len(line) < 40:
                name = line
                break

        # Location heuristic (e.g. City, State or Country)
        location_match = re.search(r'([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\b)|([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)', text)
        location = location_match.group(0) if location_match else ""

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "location": location,
            "linkedin": linkedin,
            "github": github,
            "portfolio": portfolio
        }

    @staticmethod
    def identify_sections(text: str) -> Dict[str, Any]:
        """
        Splits text into standard sections based on heading patterns.
        """
        lines = text.split('\n')
        sections_found = {}
        current_section = "header"
        section_lines = {"header": []}
        
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
                
            matched_section = None
            if len(line_str) < 50:  # Heading length limit
                for sec_key, patterns in SECTION_PATTERNS.items():
                    for pat in patterns:
                        if re.search(pat, line_str, re.IGNORECASE):
                            matched_section = sec_key
                            break
                    if matched_section:
                        break
            
            if matched_section:
                current_section = matched_section
                if current_section not in section_lines:
                    section_lines[current_section] = []
                sections_found[current_section] = True
            else:
                if current_section not in section_lines:
                    section_lines[current_section] = []
                section_lines[current_section].append(line_str)

        # Convert line lists to string content
        section_content = {k: "\n".join(v) for k, v in section_lines.items()}
        
        return {
            "detected_sections": list(sections_found.keys()),
            "section_content": section_content
        }

    @staticmethod
    def parse_experience_bullets(exp_text: str) -> List[Dict[str, Any]]:
        """
        Parses work experience block into structured bullets and job entries.
        """
        lines = [line.strip() for line in exp_text.split('\n') if line.strip()]
        bullets = []
        for line in lines:
            # Check if line looks like a bullet
            if line.startswith(('-', '•', '*', '▪', '▸', '–')):
                clean_line = line.lstrip('-•*▪▸– ').strip()
                if clean_line:
                    bullets.append(clean_line)
            elif len(line) > 20: # Paragraph line
                bullets.append(line)
                
        return bullets

    @staticmethod
    def extract_skills_from_section(skills_text: str) -> List[Dict[str, str]]:
        """
        Extracts individual skill keywords from skills section text.
        """
        raw_skills = re.split(r'[,|•\n\t/–]', skills_text)
        skills = []
        for s in raw_skills:
            clean = s.strip()
            # Filter out non-skill sentences
            if clean and len(clean) < 35 and not clean.lower().startswith(('skills', 'proficient', 'experience')):
                skills.append({
                    "name": clean,
                    "category": "technical",
                    "source": "skills_section"
                })
        return skills
