import React from 'react';
import { Briefcase, Sparkles } from 'lucide-react';
import type { SampleData } from '../types/ats';

interface JobDescriptionInputProps {
  jobDescription: string;
  onChangeJobDescription: (jd: string) => void;
  samples: SampleData[];
  onSelectSample: (sample: SampleData) => void;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  jobDescription,
  onChangeJobDescription,
  samples,
  onSelectSample,
}) => {
  const wordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-gray-800/80 shadow-xl space-y-4">
      
      {/* Component Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Job Description Target</h2>
            <p className="text-xs text-gray-400">Paste job posting requirements & skills</p>
          </div>
        </div>

        {wordCount > 0 && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {wordCount} Words
          </span>
        )}
      </div>

      {/* Preset Quick Select Pills */}
      {samples.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] text-gray-400 font-semibold shrink-0">Quick Presets:</span>
          {samples.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              title={`Load target job description for ${sample.target_role}`}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-900/90 border border-gray-800 text-gray-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-all shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span>{sample.target_role}</span>
            </button>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={jobDescription}
        onChange={(e) => onChangeJobDescription(e.target.value)}
        placeholder="Paste full job description text here (Responsibilities, Required Skills, Technologies)..."
        rows={7}
        className="w-full p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
      />

    </div>
  );
};
