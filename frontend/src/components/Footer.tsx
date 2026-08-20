import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full glass-panel border-t border-gray-800/80 mt-16 py-8 px-4 lg:px-8 no-print">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-400">
        
        {/* Left Column */}
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 font-bold text-white">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>ATS Resume Analyzer & Match Engine</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Smart, confidential resume parsing and AI-driven career matching.
          </p>
        </div>

        {/* Center Evidence-Based Positioning Notice */}
        <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-[11px] max-w-lg text-center leading-relaxed">
          <strong className="text-gray-300">Privacy & Security Promise:</strong> Your resume data is analyzed securely to evaluate formatting readability, keyword coverage, and role relevance.
        </div>

        {/* Right Badge */}
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="px-3 py-1 rounded-full bg-gray-900 border border-gray-800 font-semibold text-gray-300">
            Professional Edition
          </span>
        </div>

      </div>
    </footer>
  );
};

