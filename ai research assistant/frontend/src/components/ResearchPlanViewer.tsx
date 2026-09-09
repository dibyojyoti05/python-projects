import React, { useState } from 'react';
import type { ResearchPlan } from '../types/index';
import { ResearchPlanEditor } from './ResearchPlanEditor';

interface ResearchPlanViewerProps {
  plan: ResearchPlan;
  onAccept: (plan: ResearchPlan) => void;
}

export const ResearchPlanViewer: React.FC<ResearchPlanViewerProps> = ({ plan: initialPlan, onAccept }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<ResearchPlan>(initialPlan);

  const handleSaveEdit = (editedPlan: ResearchPlan) => {
    setCurrentPlan(editedPlan);
    setIsEditing(false);
  };

  if (isEditing) {
    return <ResearchPlanEditor plan={currentPlan} onSave={handleSaveEdit} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className="w-full glass-panel p-6 md:p-10 space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2 border-b border-ai-border/50 pb-6">
        <h2 className="text-sm font-semibold text-ai-primary uppercase tracking-wider">Research Plan</h2>
        <div className="max-h-[15vh] overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-ai-border scrollbar-track-transparent">
          <h3 className="text-lg md:text-xl font-medium text-ai-text/90 leading-relaxed max-w-4xl mx-auto">
            {currentPlan.topic.replace(/\*\*/g, '')}
          </h3>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-ai-dark/40 p-5 rounded-2xl border border-ai-primary/20">
            <h4 className="text-sm font-semibold text-ai-muted mb-2 uppercase tracking-wide">Recommended Approach</h4>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🧠</span>
              <span className="text-xl font-bold text-ai-text capitalize">{currentPlan.research_depth} Research</span>
            </div>
            <p className="text-ai-muted text-sm leading-relaxed">{currentPlan.reasoning}</p>
          </div>

          <div className="bg-ai-dark/40 p-5 rounded-2xl border border-ai-border/50">
            <h4 className="text-sm font-semibold text-ai-muted mb-4 uppercase tracking-wide">Plan Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-ai-text">{currentPlan.target_pages} <span className="text-base font-normal text-ai-muted">pages</span></div>
                <div className="text-xs text-ai-muted mt-1">≈ {currentPlan.target_words.toLocaleString()} words</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-ai-text">{currentPlan.minimum_sources}-{currentPlan.maximum_sources} <span className="text-base font-normal text-ai-muted">sources</span></div>
                <div className="text-xs text-ai-muted mt-1">
                  {currentPlan.source_recency_years > 0 ? `Last ${currentPlan.source_recency_years} years` : 'Any recency'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-ai-dark/40 p-5 rounded-2xl border border-ai-border/50">
            <h4 className="text-sm font-semibold text-ai-muted mb-4 uppercase tracking-wide">Source Strategy</h4>
            <div className="flex flex-wrap gap-2">
              {currentPlan.source_types.map(type => (
                <span key={type} className="bg-ai-primary/10 text-ai-primary text-xs px-3 py-1.5 rounded-full capitalize border border-ai-primary/20">
                  {type.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-ai-dark/40 p-5 rounded-2xl border border-ai-border/50">
            <h4 className="text-sm font-semibold text-ai-muted mb-4 uppercase tracking-wide">Analysis Options</h4>
            <ul className="space-y-3 text-sm text-ai-text">
              <li className="flex items-center gap-3">
                <span className={currentPlan.include_statistics ? "text-emerald-400" : "text-ai-muted"}>{currentPlan.include_statistics ? '✓' : '✗'}</span> Include statistics
              </li>
              <li className="flex items-center gap-3">
                <span className={currentPlan.compare_sources ? "text-emerald-400" : "text-ai-muted"}>{currentPlan.compare_sources ? '✓' : '✗'}</span> Compare sources
              </li>
              <li className="flex items-center gap-3">
                <span className={currentPlan.identify_research_gaps ? "text-emerald-400" : "text-ai-muted"}>{currentPlan.identify_research_gaps ? '✓' : '✗'}</span> Identify research gaps
              </li>
              <li className="flex items-center gap-3">
                <span className={currentPlan.include_future_trends ? "text-emerald-400" : "text-ai-muted"}>{currentPlan.include_future_trends ? '✓' : '✗'}</span> Include future trends
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-ai-border/30 text-sm">
              <span className="text-ai-muted">Citation Style:</span> <span className="font-semibold text-ai-text">{currentPlan.citation_style}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-ai-border/50">
        <button 
          onClick={() => setIsEditing(true)}
          className="px-6 py-3 rounded-xl border border-ai-border hover:border-ai-primary/50 text-ai-text bg-ai-dark/50 hover:bg-ai-dark transition-all"
        >
          Edit Plan
        </button>
        <button 
          onClick={() => onAccept(currentPlan)}
          className="px-8 py-3 rounded-xl bg-ai-primary hover:bg-ai-primaryHover text-white font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
        >
          Start Research
        </button>
      </div>
    </div>
  );
};
