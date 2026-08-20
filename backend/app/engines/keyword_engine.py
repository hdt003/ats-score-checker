import re
from typing import List, Dict, Set, Tuple

# Synonym & Alias Mapping Dictionary
SKILL_ALIASES: Dict[str, str] = {
    # Web & Languages
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    
    # Backend & Frameworks
    "fastapi": "FastAPI",
    "flask": "Flask",
    "django": "Django",
    "express": "Express.js",
    "expressjs": "Express.js",
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "spring boot": "Spring Boot",
    
    # Cloud & DevOps
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud",
    "google cloud": "Google Cloud",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "docker": "Docker",
    "containers": "Docker",
    "containerization": "Docker",
    "terraform": "Terraform",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "continuous integration": "CI/CD",
    "continuous deployment": "CI/CD",
    "github actions": "GitHub Actions",
    
    # Databases
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "mysql": "MySQL",
    "sql": "SQL",
    
    # AI / Data
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "ai": "Artificial Intelligence",
    "artificial intelligence": "Artificial Intelligence",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "scikit-learn": "Scikit-Learn",
    "pandas": "Pandas",
    "numpy": "NumPy"
}

class KeywordEngine:
    @staticmethod
    def normalize_skill(term: str) -> str:
        """
        Maps a term to its canonical normalized form using SKILL_ALIASES or standard title case.
        """
        clean = term.strip().lower()
        if clean in SKILL_ALIASES:
            return SKILL_ALIASES[clean]
        return term.strip().title()

    @staticmethod
    def match_keywords(resume_text: str, jd_keywords: List[str]) -> Tuple[List[str], List[str], List[Dict[str, str]], float]:
        """
        Performs Stage 1 (Exact) and Stage 2 (Alias Normalization) keyword matching.
        Returns: (matched_keywords, missing_keywords, alias_matches, keyword_score)
        """
        resume_lower = resume_text.lower()
        matched = []
        missing = []
        alias_matches = []
        
        for kw in jd_keywords:
            kw_clean = kw.strip()
            if not kw_clean:
                continue
                
            norm_kw = KeywordEngine.normalize_skill(kw_clean)
            pattern = r'\b' + re.escape(kw_clean.lower()) + r'\b'
            norm_pattern = r'\b' + re.escape(norm_kw.lower()) + r'\b'
            
            if re.search(pattern, resume_lower):
                matched.append(kw_clean)
            elif re.search(norm_pattern, resume_lower):
                matched.append(kw_clean)
                alias_matches.append({
                    "jd_term": kw_clean,
                    "matched_alias": norm_kw
                })
            else:
                missing.append(kw_clean)

        total = len(jd_keywords)
        if total == 0:
            score = 100.0
        else:
            score = round((len(matched) / total) * 100, 1)

        return matched, missing, alias_matches, score
