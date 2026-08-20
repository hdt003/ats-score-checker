import React, { useState } from 'react';
import type { EvidenceMatrixItem } from '../../types/ats';
import { CheckSquare, CheckCircle2, AlertCircle, HelpCircle, Search } from 'lucide-react';

interface EvidenceMatrixProps {
  evidenceMatrix: EvidenceMatrixItem[];
}

export const EvidenceMatrix: React.FC<EvidenceMatrixProps> = ({ evidenceMatrix }) => {
  const [filter, setFilter] = useState<'All' | 'Matched' | 'Partial' | 'Missing'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMatrix = evidenceMatrix.filter((item) => {
    const matchesFilter = filter === 'All' || item.match_status === filter || (filter === 'Partial' && item.match_status === 'Semantic');
    const matchesSearch = item.requirement.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Matched':
      case 'Strong':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-extrabold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Matched</span>;
      case 'Partial':
        return <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[11px] font-extrabold flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-indigo-400" /> Partial</span>;
      case 'Semantic':
        return <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-extrabold flex items-center gap-1"><HelpCircle className="h-3 w-3 text-cyan-400" /> Semantic Match</span>;
      case 'Missing':
      default:
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-extrabold flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Missing</span>;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-gray-800/80 shadow-xl space-y-4">
      
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Requirement Match Matrix</h3>
            <p className="text-xs text-gray-400">Verifies resume content against target role requirements</p>
          </div>
        </div>

        {/* Filter Buttons & Search */}
        <div className="flex items-center gap-2 no-print">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search skill requirement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center bg-gray-900 rounded-xl p-1 border border-gray-800">
            {(['All', 'Matched', 'Partial', 'Missing'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filter === f ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-800">
              <th className="py-3 px-4">Requirement</th>
              <th className="py-3 px-4">Importance</th>
              <th className="py-3 px-4">Match Status</th>
              <th className="py-3 px-4">Resume Evidence Quote</th>
              <th className="py-3 px-4 text-right">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-xs">
            {filteredMatrix.length > 0 ? (
              filteredMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-900/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">
                    {item.requirement}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.importance === 'Required' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-800 text-gray-300'
                    }`}>
                      {item.importance}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(item.match_status)}
                  </td>
                  <td className="py-3 px-4 text-gray-300 max-w-xs">
                    {item.resume_evidence.length > 0 ? (
                      <span className="italic text-gray-300 text-[11px] block bg-gray-950/60 p-2 rounded border border-gray-800/80">
                        "{item.resume_evidence[0].slice(0, 110)}{item.resume_evidence[0].length > 110 ? '...' : ''}"
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">No direct evidence found in experience</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-cyan-400 font-semibold">
                    {(item.confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No matching requirements found for selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
