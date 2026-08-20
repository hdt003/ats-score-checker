import React from 'react';
import type { FormattingRisk } from '../../types/ats';
import { ShieldAlert, CheckCircle2, AlertTriangle, Info, FileCheck } from 'lucide-react';

interface FormattingRisksProps {
  risks: FormattingRisk[];
  parsingScore: number;
  formattingScore: number;
}

export const FormattingRisks: React.FC<FormattingRisksProps> = ({
  risks,
  parsingScore,
  formattingScore
}) => {
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high_risk':
        return <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />;
      case 'medium_risk':
        return <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />;
      case 'safe':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-cyan-400 shrink-0" />;
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'high_risk':
        return 'bg-rose-500/10 border-rose-500/30';
      case 'medium_risk':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'safe':
        return 'bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'bg-gray-900 border-gray-800';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-gray-800/80 shadow-xl space-y-4">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Format & Readability Analysis</h3>
            <p className="text-xs text-gray-400">Checks layout structure, section headings, and font readability</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
            Safety Score: {formattingScore}/100
          </span>
        </div>
      </div>

      {/* Grid of Risk Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {risks.map((risk, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${getRiskBg(risk.level)} space-y-2 transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-start gap-2.5">
              {getRiskIcon(risk.level)}
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  {risk.title}
                  <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-extrabold bg-gray-900 text-gray-300">
                    {risk.level.replace('_', ' ')}
                  </span>
                </h4>
                <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">{risk.description}</p>
              </div>
            </div>

            {risk.level !== 'safe' && (
              <div className="mt-2 pt-2 border-t border-gray-800/60 text-[11px] text-indigo-300 flex items-start gap-1.5">
                <span className="font-bold text-cyan-400 shrink-0">Recommendation:</span>
                <span>{risk.recommendation}</span>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
