import React from 'react';
import { X, Sliders, ShieldCheck, CheckCircle2, Award, Target, FileText, Activity } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
  modelName?: string;
  onSaveModelName?: (model: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-gray-700/80 shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ATS Scoring Criteria</h3>
              <p className="text-xs text-gray-400">Transparent 0-100 evaluation formula</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          
          {/* Scoring Weight Distribution */}
          <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Benchmark Weight Distribution
              </span>
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                100% Score Scale
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800/80 flex items-center justify-between">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-indigo-400" /> Requirement Match
                </span>
                <strong className="text-white font-bold">25%</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800/80 flex items-center justify-between">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-cyan-400" /> Technical Keywords
                </span>
                <strong className="text-white font-bold">20%</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800/80 flex items-center justify-between">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-purple-400" /> Machine Readability
                </span>
                <strong className="text-white font-bold">20%</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800/80 flex items-center justify-between">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-amber-400" /> Experience Relevance
                </span>
                <strong className="text-white font-bold">15%</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800/80 flex items-center justify-between">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Format Safety
                </span>
                <strong className="text-white font-bold">10%</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800/80 flex items-center justify-between">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Bullet Quality
                </span>
                <strong className="text-white font-bold">10%</strong>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 text-center leading-relaxed px-2">
            The analyzer combines machine parsing validation with intelligent requirement matching to calculate your score.
          </p>

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
