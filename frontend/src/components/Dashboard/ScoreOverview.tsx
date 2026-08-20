import type { ScoreBreakdown } from '../../types/ats';
import { ShieldCheck, Sparkles, CheckCircle2, AlertTriangle, Briefcase, Activity, Award } from 'lucide-react';

interface ScoreOverviewProps {
  scores: ScoreBreakdown;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  aiConfidence: number;
}

export const ScoreOverview: React.FC<ScoreOverviewProps> = ({
  scores,
  summary,
  strengths,
  weaknesses,
  aiConfidence
}) => {
  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'EXCELLENT', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 80) return { label: 'STRONG MATCH', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    if (score >= 70) return { label: 'GOOD MATCH', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
    if (score >= 60) return { label: 'NEEDS IMPROVEMENT', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'HIGH RISK', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  const badge = getScoreBadge(scores.overall);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-gray-800/80 shadow-2xl space-y-6">
      
      {/* Top Banner & Main Score Radial Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        
        {/* Main Gauge Score Box */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800 shadow-inner relative overflow-hidden">
          
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG Circular Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                stroke="currentColor" strokeWidth="8"
                className="text-gray-800/60 fill-none"
              />
              <circle
                cx="50" cy="50" r="42"
                stroke="url(#scoreGradient)" strokeWidth="8"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * scores.overall) / 100}
                strokeLinecap="round"
                className="fill-none transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {scores.overall}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">OUT OF 100</span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold tracking-wider border ${badge.color}`}>
              {badge.label}
            </span>
            <p className="text-[11px] text-gray-400 mt-2">Overall ATS Compatibility Score</p>
          </div>
        </div>

        {/* Executive Summary & AI Confidence */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Executive Compatibility Analysis</h3>
            </div>
            <span className="text-[11px] text-gray-400 bg-gray-900 px-2.5 py-1 rounded-full border border-gray-800">
              Confidence: <strong className="text-cyan-400">{(aiConfidence * 100).toFixed(0)}%</strong>
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-4 rounded-xl border border-gray-800/80 font-normal">
            {summary}
          </p>

          {/* Strengths and Weaknesses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle2 className="h-3.5 w-3.5" /> Key Strengths
              </span>
              <ul className="space-y-1 text-xs text-gray-300">
                {strengths.slice(0, 3).map((st, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="h-3.5 w-3.5" /> Primary Gaps
              </span>
              <ul className="space-y-1 text-xs text-gray-300">
                {weaknesses.slice(0, 3).map((wk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{wk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Sub-score Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        {[
          { title: 'Resume Health', val: scores.resume_health, icon: Activity, color: 'text-emerald-400' },
          { title: 'Job Match', val: scores.job_match, icon: Award, color: 'text-indigo-400' },
          { title: 'Keyword Coverage', val: scores.keywords, icon: Sparkles, color: 'text-cyan-400' },
          { title: 'Formatting Safety', val: scores.formatting, icon: ShieldCheck, color: 'text-purple-400' },
          { title: 'Experience Match', val: scores.experience, icon: Briefcase, color: 'text-amber-400' },
          { title: 'Structure Score', val: scores.parsing, icon: CheckCircle2, color: 'text-blue-400' }
        ].map((item, idx) => (
          <div key={idx} className="glass-card p-3 rounded-xl border border-gray-800 text-center space-y-1">
            <item.icon className={`h-4 w-4 mx-auto ${item.color}`} />
            <div className="text-lg font-extrabold text-white">{item.val}</div>
            <div className="text-[10px] text-gray-400 font-medium truncate">{item.title}</div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${item.val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
