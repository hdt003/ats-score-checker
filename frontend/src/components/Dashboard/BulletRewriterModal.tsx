import { useState } from 'react';
import { X, Sparkles, Check, ShieldCheck, RefreshCw } from 'lucide-react';
import type { SuggestionSchema } from '../../types/ats';
import { rewriteBulletPoint } from '../../services/api';

interface BulletRewriterModalProps {
  suggestion: SuggestionSchema | null;
  onClose: () => void;
  onAcceptRewrite: (suggestionId: string, rewriteText: string) => void;
  apiKey?: string;
  modelName?: string;
}

export const BulletRewriterModal: React.FC<BulletRewriterModalProps> = ({
  suggestion,
  onClose,
  onAcceptRewrite,
  apiKey,
  modelName,
}) => {
  const [userMetrics, setUserMetrics] = useState('');
  const [loading, setLoading] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<{
    suggested_rewrite: string;
    rationale: string;
    rule_checks: string[];
  } | null>(null);

  if (!suggestion) return null;

  const handleGenerateRewrite = async () => {
    setLoading(true);
    try {
      const res = await rewriteBulletPoint({
        suggestion_id: suggestion.id,
        original_text: suggestion.original_text || suggestion.issue,
        user_metrics: userMetrics,
        api_key: apiKey,
        model_name: modelName
      });
      setRewriteResult({
        suggested_rewrite: res.suggested_rewrite,
        rationale: res.rationale,
        rule_checks: res.rule_checks || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentRewrite = rewriteResult?.suggested_rewrite || suggestion.suggested_rewrite || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel rounded-2xl border border-gray-700/80 shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">1-Click AI Resume Bullet Optimizer</h3>
              <p className="text-xs text-gray-400">Enhance action verbs & structure without inventing fake facts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Original vs Suggested Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Original Bullet */}
          <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800 space-y-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Original Bullet Text
            </span>
            <p className="text-xs text-gray-300 italic leading-relaxed">
              "{suggestion.original_text || suggestion.issue}"
            </p>
          </div>

          {/* AI Optimized Bullet */}
          <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/40 space-y-2 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AI Optimized Version
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(currentRewrite);
                  alert('Rewritten bullet copied to clipboard!');
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-cyan-300 border border-indigo-500/30 transition-all font-semibold flex items-center gap-1"
                title="Copy bullet text to paste into your resume document"
              >
                Copy Bullet Text
              </button>
            </div>
            <p className="text-xs text-white font-semibold leading-relaxed">
              "{currentRewrite}"
            </p>
          </div>

        </div>

        {/* User Optional Metric Prompt */}
        <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
          <label className="text-xs font-semibold text-gray-300 block">
            Add Verified Metric (Optional):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. reduced latency by 35% or managed 10k daily users"
              value={userMetrics}
              onChange={(e) => setUserMetrics(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleGenerateRewrite}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-cyan-300 border border-gray-700 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          </div>
          <p className="text-[10px] text-gray-400">
            Rule Guard: The engine strictly avoids hallucinating fake numbers or employers.
          </p>
        </div>

        {/* Rule Checks & Rationale */}
        {rewriteResult?.rule_checks && (
          <div className="flex flex-wrap gap-2 pt-1">
            {rewriteResult.rule_checks.map((rule, idx) => (
              <span key={idx} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                {rule}
              </span>
            ))}
          </div>
        )}

        {/* Footer Action */}
        <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
          <span className="text-[11px] text-cyan-300 font-semibold">
            Accepting will boost predicted Job Match score.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => onAcceptRewrite(suggestion.id, currentRewrite)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Accept Fix & Re-Score</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
