import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import type { CanonicalResume } from '../types/ats';
import { uploadResumeFile, parseResumeText } from '../services/api';

interface ResumeUploaderProps {
  onResumeParsed: (resumeId: string, canonical: CanonicalResume) => void;
  parsedResume: CanonicalResume | null;
  onClearResume: () => void;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  onResumeParsed,
  parsedResume,
  onClearResume,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await uploadResumeFile(file);
      onResumeParsed(res.resume_id, res.canonical_resume);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing file upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextParse = async () => {
    if (!rawText.trim()) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await parseResumeText(rawText);
      onResumeParsed(res.resume_id, res.canonical_resume);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error parsing resume text.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-gray-800/80 shadow-xl space-y-4">
      
      {/* Component Title & Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Resume Input</h2>
            <p className="text-xs text-gray-400">PDF, DOCX, or direct body text</p>
          </div>
        </div>

        {!parsedResume && (
          <div className="flex items-center bg-gray-900/90 rounded-lg p-1 border border-gray-800">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'paste' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Paste Text
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* State A: Parsed Resume Overview */}
      {parsedResume ? (
        <div className="p-4 rounded-xl bg-gray-900/80 border border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Resume Successfully Parsed</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                {(parsedResume.parser_confidence * 100).toFixed(0)}% Confidence
              </span>
            </div>
            <button
              onClick={onClearResume}
              className="p-1 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Replace Resume"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
            <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800">
              <span className="text-gray-400 text-[10px] block">Candidate Name</span>
              <span className="font-semibold text-white truncate block">
                {parsedResume.candidate.name || 'Not specified'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800">
              <span className="text-gray-400 text-[10px] block">Contact Email</span>
              <span className="font-semibold text-cyan-300 truncate block">
                {parsedResume.candidate.email || 'Missing'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800">
              <span className="text-gray-400 text-[10px] block">Page Count</span>
              <span className="font-semibold text-indigo-300 block">
                {parsedResume.page_count} Page{parsedResume.page_count > 1 ? 's' : ''}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800">
              <span className="text-gray-400 text-[10px] block">Sections Found</span>
              <span className="font-semibold text-emerald-300 block">
                {parsedResume.sections.length} Standard
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* State B: Upload / Paste Controls */
        <div>
          {activeTab === 'upload' ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-gray-800 hover:border-gray-700 bg-gray-900/40 hover:bg-gray-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {loading ? 'Parsing Document Architecture...' : 'Drag & drop resume or click to browse'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, or TXT files up to 10MB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste plain resume text here..."
                rows={7}
                className="w-full p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
              <button
                onClick={handleTextParse}
                disabled={loading || !rawText.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20"
              >
                {loading ? 'Processing Text...' : 'Parse Resume Text'}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
