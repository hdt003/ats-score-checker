import type { AnalysisResponse, CanonicalResume, SampleData } from '../types/ats';

const API_BASE_URL = 'http://localhost:8000/api';

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', gemini_ai_status: 'demo_fallback_mode' };
  }
}

export async function uploadResumeFile(file: File): Promise<{ resume_id: string; filename: string; canonical_resume: CanonicalResume }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE_URL}/resumes/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to upload resume file.');
  }
  
  return await res.json();
}

export async function parseResumeText(rawText: string): Promise<{ resume_id: string; filename: string; canonical_resume: CanonicalResume }> {
  const res = await fetch(`${API_BASE_URL}/resumes/parse-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText }),
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to parse text resume.');
  }
  
  return await res.json();
}

export async function runAnalysis(payload: {
  resume_id?: string;
  raw_resume_text?: string;
  job_description?: string;
  api_key?: string;
  model_name?: string;
}): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/analyses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Analysis request failed.');
  }
  
  return await res.json();
}

export async function rewriteBulletPoint(payload: {
  suggestion_id: string;
  original_text: string;
  context?: string;
  user_metrics?: string;
  api_key?: string;
  model_name?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/suggestions/${payload.suggestion_id}/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Bullet rewrite failed.');
  }
  
  return await res.json();
}

export async function rescoreAnalysis(analysisId: string, acceptedFixesCount: number) {
  const res = await fetch(`${API_BASE_URL}/analyses/${analysisId}/rescore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accepted_fixes_count: acceptedFixesCount }),
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Rescore failed.');
  }
  
  return await res.json();
}

export async function fetchSampleDemos(): Promise<{ samples: SampleData[] }> {
  try {
    const res = await fetch(`${API_BASE_URL}/samples`);
    return await res.json();
  } catch (err) {
    return { samples: [] };
  }
}
