import React, { useState } from 'react';
import type { SuggestionSchema } from '../../types/ats';
import { Wrench, Sparkles } from 'lucide-react';

interface PrioritizedFixesProps {
  suggestions: SuggestionSchema[];
  onOpenRewriter: (suggestion: SuggestionSchema) => void;
}

export const PrioritizedFixes: React.FC<PrioritizedFixesProps> = ({
  suggestions,
  onOpenRewriter
}) => {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredSuggestions = suggestions.filter((s) => filter === 'all' || s.priority === filter);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-extrabold uppercase">High Priority</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold uppercase">Medium Priority</span>;
      case 'low':
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase">Low Priority</span>;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-gray-800/80 shadow-xl space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Prioritized Actionable Suggestions</h3>
            <p className="text-xs text-gray-400">Evidence-backed fixes ranked by impact & confidence</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center bg-gray-900 rounded-xl p-1 border border-gray-800 text-xs no-print">
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                filter === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {filteredSuggestions.length > 0 ? (
          filteredSuggestions.map((sug, idx) => (
            <div
              key={sug.id || idx}
              className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-indigo-500/40 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getPriorityBadge(sug.priority)}
                  <span className="text-xs font-bold text-white">{sug.category.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-950 px-2 py-0.5 rounded border border-gray-800">
                  Expected Impact: <strong className="text-cyan-400">{sug.expected_impact}</strong>
                </span>
              </div>

              <p className="text-xs text-gray-200 font-semibold">{sug.issue}</p>

              {/* Evidence Quotes */}
              {sug.evidence && sug.evidence.length > 0 && (
                <div className="p-2.5 rounded-lg bg-gray-950/70 border border-gray-800/80 text-[11px] text-gray-400 space-y-1">
                  <span className="font-bold text-gray-400 block text-[10px] uppercase">Evidence Found:</span>
                  {sug.evidence.map((ev, i) => (
                    <div key={i} className="italic text-gray-300">• {ev}</div>
                  ))}
                </div>
              )}

              {/* Recommendation & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-800/60">
                <div className="text-xs text-indigo-300 font-medium">
                  <strong className="text-cyan-400">Recommendation:</strong> {sug.recommendation}
                </div>

                {/* 1-Click AI Rewrite button if applicable */}
                {(sug.original_text || sug.category === 'weak_bullet') && (
                  <button
                    onClick={() => onOpenRewriter(sug)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/50 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm no-print"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span>1-Click AI Rewrite</span>
                  </button>
                )}
              </div>

            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500 text-xs">
            No suggestions match the selected priority filter.
          </div>
        )}
      </div>

    </div>
  );
};
