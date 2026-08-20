import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ResumeUploader } from './components/ResumeUploader';
import { JobDescriptionInput } from './components/JobDescriptionInput';
import { ScoreOverview } from './components/Dashboard/ScoreOverview';
import { EvidenceMatrix } from './components/Dashboard/EvidenceMatrix';
import { FormattingRisks } from './components/Dashboard/FormattingRisks';
import { KeywordBreakdown } from './components/Dashboard/KeywordBreakdown';
import { PrioritizedFixes } from './components/Dashboard/PrioritizedFixes';
import { BulletRewriterModal } from './components/Dashboard/BulletRewriterModal';
import { Footer } from './components/Footer';

import type { CanonicalResume, AnalysisResponse, SuggestionSchema, SampleData } from './types/ats';
import { checkHealth, runAnalysis, fetchSampleDemos, rescoreAnalysis } from './services/api';
import { Sparkles, Play, RefreshCw, Printer, AlertCircle } from 'lucide-react';

export function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [modelName, setModelName] = useState<string>('gemini-2.5-flash');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [geminiActive, setGeminiActive] = useState<boolean>(false);
  
  const [samples, setSamples] = useState<SampleData[]>([]);
  const [resumeId, setResumeId] = useState<string>('');
  const [parsedResume, setParsedResume] = useState<CanonicalResume | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [rawResumeText, setRawResumeText] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [rewriterSuggestion, setRewriterSuggestion] = useState<SuggestionSchema | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    // Explicitly reset state on fresh page load / refresh
    setAnalysisResult(null);
    setParsedResume(null);
    setResumeId('');
    setRawResumeText('');
    setJobDescription('');
    setErrorMsg('');

    // Health check and load samples
    checkHealth().then((h) => {
      setGeminiActive(h.gemini_ai_status === 'configured' || apiKey.length > 5);
    });
    fetchSampleDemos().then((s) => {
      setSamples(s.samples || []);
    });
  }, [apiKey]);

  const handleResumeParsed = (id: string, canonical: CanonicalResume) => {
    setResumeId(id);
    setParsedResume(canonical);
    setRawResumeText(canonical.raw_text);
    setErrorMsg('');
  };

  const handleClearResume = () => {
    setResumeId('');
    setParsedResume(null);
    setRawResumeText('');
    setAnalysisResult(null);
  };

  const handleSelectSample = (sample: SampleData) => {
    setRawResumeText(sample.resume_text);
    setJobDescription(sample.job_description);
    setParsedResume({
      candidate: { name: sample.title, email: 'sample.candidate@example.com', phone: '(555) 019-2831', location: 'San Francisco, CA' },
      summary: 'Sample candidate resume data loaded.',
      sections: ['summary', 'experience', 'skills'],
      experience: [],
      skills: [],
      page_count: 1,
      parser_confidence: 0.95,
      raw_text: sample.resume_text
    });
    setResumeId('demo_' + sample.id);
    setAnalysisResult(null);
    setErrorMsg('');
  };

  const handleRunAnalysis = async () => {
    if (!parsedResume && !rawResumeText.trim()) {
      setErrorMsg('Please upload a resume file or paste resume text in Section 1 before running analysis.');
      return;
    }
    setErrorMsg('');
    setIsAnalyzing(true);
    setScanStep('1/5 Parsing Resume Structure & Contact Info...');

    try {
      setTimeout(() => setScanStep('2/5 Checking Formatting & Readability Risks...'), 400);
      setTimeout(() => setScanStep('3/5 Analyzing Skill Match & Technical Keywords...'), 800);
      setTimeout(() => setScanStep('4/5 Evaluating Experience Alignment & AI Fit...'), 1200);
      setTimeout(() => setScanStep('5/5 Generating Compatibility Score & Optimization Plan...'), 1600);

      const result = await runAnalysis({
        resume_id: resumeId || undefined,
        raw_resume_text: !resumeId ? rawResumeText : undefined,
        job_description: jobDescription,
        api_key: apiKey || undefined,
        model_name: modelName
      });

      setTimeout(() => {
        setAnalysisResult(result);
        setIsAnalyzing(false);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis execution failed.');
      setIsAnalyzing(false);
    }
  };

  const handleAcceptRewrite = async (suggestionId: string, rewriteText: string) => {
    if (!analysisResult) return;
    try {
      const rescored = await rescoreAnalysis(analysisResult.analysis_id, 1);
      
      // Update analysis result with boosted scores
      setAnalysisResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          scores: {
            ...prev.scores,
            overall: rescored.predicted_scores.overall,
            job_match: rescored.predicted_scores.job_match,
            keywords: rescored.predicted_scores.keywords
          },
          suggestions: prev.suggestions.map((s) =>
            s.id === suggestionId ? { ...s, status: 'accepted', suggested_rewrite: rewriteText } : s
          )
        };
      });
      setRewriterSuggestion(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-gray-100 selection:bg-indigo-500 selection:text-white">
      
      {/* Background Glow Blobs */}
      <div className="glow-bg w-[600px] h-[600px] bg-indigo-600/20 top-[-200px] left-[-100px] animate-glow no-print" />
      <div className="glow-bg w-[600px] h-[600px] bg-cyan-600/20 top-[400px] right-[-200px] animate-glow no-print" />

      {/* Header */}
      <Header
        geminiActive={geminiActive}
        onOpenSettings={() => setIsSettingsOpen(true)}
        samples={samples}
        onSelectSample={handleSelectSample}
        onReset={() => {
          handleClearResume();
          setJobDescription('');
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 shadow-lg no-print">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Dual Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
          <ResumeUploader
            onResumeParsed={handleResumeParsed}
            parsedResume={parsedResume}
            onClearResume={handleClearResume}
          />

          <JobDescriptionInput
            jobDescription={jobDescription}
            onChangeJobDescription={setJobDescription}
            samples={samples}
            onSelectSample={(sample) => {
              if (!parsedResume && !rawResumeText.trim()) {
                handleSelectSample(sample);
              } else {
                setJobDescription(sample.job_description);
              }
            }}
          />
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col items-center justify-center pt-2 no-print">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || (!resumeId && !rawResumeText.trim())}
            className="px-8 py-4 rounded-2xl font-extrabold text-sm tracking-wide bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all disabled:opacity-50 flex items-center gap-3 transform hover:scale-[1.02]"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin text-cyan-300" />
                <span>Running ATS Optimization Check...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-cyan-300 animate-pulse" />
                <span>ANALYZE ATS COMPATIBILITY</span>
                <Play className="h-4 w-4 fill-white" />
              </>
            )}
          </button>

          {/* Real-time Progress Overlay */}
          {isAnalyzing && (
            <div className="mt-4 p-3.5 rounded-xl glass-panel border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2.5 animate-pulse">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-spin" />
              <span>{scanStep}</span>
            </div>
          )}
        </div>

        {/* ATS Results Dashboard Section */}
        {analysisResult && (
          <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
            
            {/* Dedicated PDF Print Header Banner */}
            <div className="print-only mb-6 border-b-2 border-indigo-600 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                    ATS RESUME AUDIT & COMPATIBILITY REPORT
                  </h1>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Comprehensive Resume Compatibility & Role Matching Audit
                  </p>
                  {parsedResume?.candidate?.name && (
                    <p className="text-xs font-semibold text-indigo-700 mt-1">
                      Candidate: {parsedResume.candidate.name} | Contact: {parsedResume.candidate.email || 'N/A'}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-indigo-700">
                    {analysisResult.scores.overall} / 100
                  </div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Overall ATS Score</div>
                  <div className="text-[10px] text-gray-500 mt-1">Audit Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Dashboard Header Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-800 no-print">
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  ATS COMPATIBILITY DASHBOARD
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleClearResume();
                    setJobDescription('');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition-all border border-gray-700/80 hover:border-gray-600 flex items-center gap-1.5"
                  title="Clear analysis and start a new scan"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
                  <span>Start New Scan</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                  title="Export high-contrast executive PDF report"
                >
                  <Printer className="h-4 w-4 text-white" />
                  <span>Export PDF Report</span>
                </button>
              </div>
            </div>

            {/* 1. Score Overview & Radial Gauge */}
            <ScoreOverview
              scores={analysisResult.scores}
              summary={analysisResult.summary}
              strengths={analysisResult.strengths}
              weaknesses={analysisResult.weaknesses}
              aiConfidence={analysisResult.ai_confidence}
            />

            {/* 2. Requirement Evidence Matrix */}
            <EvidenceMatrix evidenceMatrix={analysisResult.evidence_matrix} />

            {/* 3. Formatting & Parse Risk Radar */}
            <FormattingRisks
              risks={analysisResult.formatting_risks}
              parsingScore={analysisResult.scores.parsing}
              formattingScore={analysisResult.scores.formatting}
            />

            {/* 4. Keyword & Skill Breakdown */}
            <KeywordBreakdown
              matchedKeywords={analysisResult.keywords_matched}
              missingKeywords={analysisResult.keywords_missing}
              semanticMatches={analysisResult.semantic_matches}
              keywordScore={analysisResult.scores.keywords}
            />

            {/* 5. Prioritized Actionable Suggestions */}
            <PrioritizedFixes
              suggestions={analysisResult.suggestions}
              onOpenRewriter={(sug) => setRewriterSuggestion(sug)}
            />

          </div>
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={setApiKey}
        modelName={modelName}
        onSaveModelName={setModelName}
      />

      {/* 1-Click Bullet Rewriter Modal */}
      <BulletRewriterModal
        suggestion={rewriterSuggestion}
        onClose={() => setRewriterSuggestion(null)}
        onAcceptRewrite={handleAcceptRewrite}
        apiKey={apiKey}
        modelName={modelName}
      />

    </div>
  );
}

export default App;
