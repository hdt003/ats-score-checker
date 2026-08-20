import React, { useState } from 'react';
import type { KeywordMatch, SemanticMatch } from '../../types/ats';
import { Tag, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface KeywordBreakdownProps {
  matchedKeywords: (KeywordMatch | string)[];
  missingKeywords: (KeywordMatch | string)[];
  semanticMatches: (SemanticMatch | any)[];
  keywordScore?: number;
}

export const KeywordBreakdown: React.FC<KeywordBreakdownProps> = ({
  matchedKeywords = [],
  missingKeywords = [],
  semanticMatches = [],
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'matched' | 'missing' | 'semantic'>('all');

  const getKeywordText = (item: any): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.keyword || item.name || item.jd_keyword || item.jd_term || String(item);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-gray-800/80 shadow-xl space-y-4">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Skill & Keyword Match Breakdown</h3>
            <p className="text-xs text-gray-400">Skill match, keyword coverage, and related term analysis</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-gray-900 rounded-xl p-1 border border-gray-800 text-xs no-print">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            All ({matchedKeywords.length + missingKeywords.length + semanticMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('matched')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'matched' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Matched ({matchedKeywords.length})
          </button>
          <button
            onClick={() => setActiveTab('missing')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'missing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Missing ({missingKeywords.length})
          </button>
          <button
            onClick={() => setActiveTab('semantic')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'semantic' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Related Terms ({semanticMatches.length})
          </button>
        </div>
      </div>

      {/* Grid of Skill Pills */}
      <div className="flex flex-wrap gap-2 pt-2">
        
        {/* Matched Pills */}
        {(activeTab === 'all' || activeTab === 'matched') &&
          matchedKeywords.map((kw, i) => {
            const text = getKeywordText(kw);
            const foundAs = typeof kw === 'object' ? kw?.found_as : null;
            return (
              <span
                key={`match-${i}`}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>{text}</span>
                {foundAs && foundAs.toLowerCase() !== text.toLowerCase() && (
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    (alias: {foundAs})
                  </span>
                )}
              </span>
            );
          })}

        {/* Missing Pills */}
        {(activeTab === 'all' || activeTab === 'missing') &&
          missingKeywords.map((kw, i) => {
            const text = getKeywordText(kw);
            const isRequired = typeof kw === 'object' ? kw?.is_required : true;
            return (
              <span
                key={`miss-${i}`}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>{text}</span>
                {isRequired && (
                  <span className="text-[9px] text-rose-400 font-extrabold uppercase bg-rose-950/80 px-1.5 py-0.5 rounded">
                    Required
                  </span>
                )}
              </span>
            );
          })}

        {/* Semantic / Related Term Pills */}
        {(activeTab === 'all' || activeTab === 'semantic') &&
          semanticMatches.map((kw, i) => {
            const jdKeyword = typeof kw === 'string' ? kw : (kw?.jd_keyword || kw?.jd_term || '');
            const concept = typeof kw === 'object' ? (kw?.resume_concept || kw?.matched_alias || '') : '';
            const score = typeof kw === 'object' && kw?.similarity_score ? (kw.similarity_score * 100).toFixed(0) : null;
            return (
              <span
                key={`sem-${i}`}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                <span>{jdKeyword}</span>
                {concept && (
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded">
                    ≈ {concept} {score ? `(${score}%)` : ''}
                  </span>
                )}
              </span>
            );
          })}

      </div>

    </div>
  );
};
