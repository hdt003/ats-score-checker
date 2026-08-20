import math
import re
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class SemanticEngine:
    @staticmethod
    def calculate_tfidf_similarity(text1: str, text2: str) -> float:
        """
        Calculates cosine similarity between two texts using TF-IDF.
        """
        if not text1.strip() or not text2.strip():
            return 0.0
        try:
            vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(sim)
        except Exception:
            return 0.0

    @staticmethod
    def match_requirements_semantically(resume_text: str, experience_bullets: List[str], jd_requirements: List[str]) -> Tuple[List[Dict[str, Any]], float]:
        """
        Compares each JD requirement against resume text & individual experience bullets.
        Returns semantic match pairs with similarity scores.
        """
        results = []
        sim_scores = []
        
        # Combine all bullets and full resume text for context search
        search_corpus = experience_bullets + [resume_text]
        
        for req in jd_requirements:
            best_score = 0.0
            best_evidence = ""
            
            for doc in search_corpus:
                score = SemanticEngine.calculate_tfidf_similarity(req, doc)
                if score > best_score:
                    best_score = score
                    best_evidence = doc
                    
            match_type = "Missing"
            if best_score >= 0.45:
                match_type = "Matched"
            elif best_score >= 0.28:
                match_type = "Partial"
            elif best_score >= 0.18:
                match_type = "Semantic"
                
            sim_scores.append(best_score)
            results.append({
                "requirement": req,
                "importance": "Required" if any(w in req.lower() for w in ['must', 'required', 'strong', 'essential']) else "Preferred",
                "match_status": match_type,
                "confidence": round(min(0.98, max(0.5, best_score * 1.8)), 2),
                "resume_evidence": [best_evidence] if best_evidence and match_type != "Missing" else [],
                "similarity_score": round(best_score, 3)
            })

        avg_similarity = sum(sim_scores) / max(1, len(sim_scores))
        semantic_match_score = round(min(100.0, avg_similarity * 150.0), 1)
        
        return results, semantic_match_score
