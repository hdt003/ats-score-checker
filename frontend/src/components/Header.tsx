import React from 'react';
import { Settings, Sparkles, FileText } from 'lucide-react';
import type { SampleData } from '../types/ats';

interface HeaderProps {
  geminiActive: boolean;
  onOpenSettings: () => void;
  samples: SampleData[];
  onSelectSample: (sample: SampleData) => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  geminiActive,
  onOpenSettings,
  samples,
  onSelectSample,
  onReset
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-gray-800/80 px-4 lg:px-8 py-3.5 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-gray-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">
                ATS RESUME <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">ANALYZER</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium hidden sm:block">
              AI-Powered Resume Optimization & Job Matching
            </p>
          </div>
        </div>

        {/* Action Controls & AI Status */}
        <div className="flex items-center gap-3">
          
          {/* Sample Resumes Dropdown */}
          {samples.length > 0 && (
            <div className="relative group hidden md:block">
              <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 bg-gray-800/60 hover:bg-gray-800 px-3 py-2 rounded-lg border border-gray-700/60 transition-all cursor-pointer">
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                <span>Try Demo Resumes</span>
              </button>
              <div className="absolute right-0 mt-1 w-64 glass-panel rounded-xl p-2 hidden group-hover:block border border-gray-700/80 shadow-2xl z-50">
                <div className="text-[11px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">
                  Select Sample Scenario
                </div>
                {samples.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => onSelectSample(sample)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-indigo-600/30 hover:text-white text-gray-300 transition-colors flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="font-semibold text-indigo-300">{sample.title}</span>
                    <span className="text-[10px] text-gray-400">{sample.target_role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scoring Criteria Modal Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs font-semibold border border-gray-700/70 transition-all hover:border-gray-600 cursor-pointer"
            title="View Scoring Criteria"
          >
            <Settings className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Criteria</span>
          </button>

          {/* AI Status Badge (Kept Far Right) */}
          <div className="flex items-center gap-2">
            {geminiActive ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm shadow-emerald-500/10">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">AI Optimization Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Smart Analyzer Active</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
