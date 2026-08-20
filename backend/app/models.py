import datetime
import json
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ResumeModel(Base):
    __tablename__ = "resumes"
    
    id = Column(String(36), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), default="text/plain")
    raw_text = Column(Text, nullable=False)
    parsed_json = Column(Text, nullable=False) # JSON stored as string
    parser_confidence = Column(Float, default=1.0)
    page_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    analyses = relationship("AnalysisModel", back_populates="resume", cascade="all, delete-orphan")

class JobModel(Base):
    __tablename__ = "jobs"
    
    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    raw_description = Column(Text, nullable=False)
    parsed_json = Column(Text, nullable=True) # JSON stored as string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    analyses = relationship("AnalysisModel", back_populates="job", cascade="all, delete-orphan")

class AnalysisModel(Base):
    __tablename__ = "analyses"
    
    id = Column(String(36), primary_key=True, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id"), nullable=False)
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=True)
    
    overall_score = Column(Integer, default=0)
    resume_health_score = Column(Integer, default=0)
    job_match_score = Column(Integer, default=0)
    keyword_score = Column(Integer, default=0)
    parsing_score = Column(Integer, default=0)
    formatting_score = Column(Integer, default=0)
    experience_score = Column(Integer, default=0)
    
    result_json = Column(Text, nullable=False) # Detailed scores, evidence matrix, strengths, gaps
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    resume = relationship("ResumeModel", back_populates="analyses")
    job = relationship("JobModel", back_populates="analyses")
    suggestions = relationship("SuggestionModel", back_populates="analysis", cascade="all, delete-orphan")

class SuggestionModel(Base):
    __tablename__ = "suggestions"
    
    id = Column(String(36), primary_key=True, index=True)
    analysis_id = Column(String(36), ForeignKey("analyses.id"), nullable=False)
    priority = Column(String(20), default="medium") # high, medium, low
    category = Column(String(50), nullable=False)
    issue = Column(Text, nullable=False)
    evidence_json = Column(Text, nullable=True) # JSON string of list of evidence
    recommendation = Column(Text, nullable=False)
    expected_impact = Column(String(50), default="Medium")
    confidence = Column(Float, default=0.9)
    status = Column(String(20), default="pending") # pending, accepted, rejected
    original_text = Column(Text, nullable=True)
    suggested_rewrite = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    analysis = relationship("AnalysisModel", back_populates="suggestions")
