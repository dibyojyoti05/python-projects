import React, { useState } from 'react';
import type { ResearchPlan } from '../types/index';

interface ResearchPlanEditorProps {
  plan: ResearchPlan;
  onSave: (plan: ResearchPlan) => void;
  onCancel: () => void;
}

export const ResearchPlanEditor: React.FC<ResearchPlanEditorProps> = ({ plan: initialPlan, onSave, onCancel }) => {
  const [plan, setPlan] = useState<ResearchPlan>(initialPlan);

  const handleChange = (field: keyof ResearchPlan, value: any) => {
    setPlan(prev => {
      const newPlan = { ...prev, [field]: value };
      // Auto-update words when pages change
      if (field === 'target_pages') {
        newPlan.target_words = value * 450;
      }
      return newPlan;
    });
  };

  const handleSourceTypeToggle = (type: string) => {
    setPlan(prev => {
      const types = prev.source_types.includes(type)
        ? prev.source_types.filter(t => t !== type)
        : [...prev.source_types, type];
      return { ...prev, source_types: types.length ? types : ['general'] };
    });
  };

  const allSourceTypes = ["academic", "industry_reports", "official", "technology_publications", "news", "general"];

  return (
    <div className="w-full glass-panel p-6 md:p-10 space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2 border-b border-ai-border/50 pb-6">
        <h2 className="text-2xl font-bold text-ai-text">Edit Research Plan</h2>
        <p className="text-ai-muted text-sm">Customize how the AI will approach your research.</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-ai-muted uppercase">Research Depth</label>
          <div className="flex flex-wrap gap-3">
            {['quick', 'standard', 'deep', 'comprehensive'].map(depth => (
              <button 
                key={depth}
                onClick={() => handleChange('research_depth', depth)}
                className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${plan.research_depth === depth ? 'bg-ai-primary text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-ai-dark border border-ai-border hover:border-ai-primary/50 text-ai-text'}`}
              >
                {depth}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-ai-muted uppercase block">Length & Sources</label>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-ai-text">Target Pages</span>
                <span className="text-ai-primary font-bold">{plan.target_pages}</span>
              </div>
              <input type="range" min="1" max="15" value={plan.target_pages} onChange={(e) => handleChange('target_pages', parseInt(e.target.value))} className="w-full accent-ai-primary" />
              <div className="text-xs text-ai-muted text-right">≈ {plan.target_words} words</div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-ai-text">Maximum Sources</span>
                <span className="text-ai-primary font-bold">{plan.maximum_sources}</span>
              </div>
              <input type="range" min="3" max="50" value={plan.maximum_sources} onChange={(e) => {
                const max = parseInt(e.target.value);
                handleChange('maximum_sources', max);
                if (plan.minimum_sources > max) handleChange('minimum_sources', max);
              }} className="w-full accent-ai-primary" />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm text-ai-text block">Recency (Years)</label>
              <select 
                value={plan.source_recency_years} 
                onChange={(e) => handleChange('source_recency_years', parseInt(e.target.value))}
                className="w-full bg-ai-dark border border-ai-border text-ai-text rounded-lg p-2 outline-none focus:border-ai-primary"
              >
                <option value={0}>Any time</option>
                <option value={1}>Last 1 year</option>
                <option value={3}>Last 3 years</option>
                <option value={5}>Last 5 years</option>
                <option value={10}>Last 10 years</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-ai-muted uppercase block">Analysis Features</label>
            <div className="space-y-3">
              {[
                { id: 'include_statistics', label: 'Include Statistics' },
                { id: 'compare_sources', label: 'Compare Sources' },
                { id: 'identify_research_gaps', label: 'Identify Research Gaps' },
                { id: 'include_future_trends', label: 'Include Future Trends' }
              ].map(feature => (
                <label key={feature.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${plan[feature.id as keyof ResearchPlan] ? 'bg-ai-primary border-ai-primary' : 'bg-ai-dark border-ai-border group-hover:border-ai-primary/50'}`}>
                    {plan[feature.id as keyof ResearchPlan] && <span className="text-white text-xs">✓</span>}
                  </div>
                  <input type="checkbox" className="hidden" checked={plan[feature.id as keyof ResearchPlan] as boolean} onChange={(e) => handleChange(feature.id as keyof ResearchPlan, e.target.checked)} />
                  <span className="text-sm text-ai-text group-hover:text-white transition-colors">{feature.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-sm text-ai-text block">Citation Style</label>
              <select 
                value={plan.citation_style} 
                onChange={(e) => handleChange('citation_style', e.target.value)}
                className="w-full bg-ai-dark border border-ai-border text-ai-text rounded-lg p-2 outline-none focus:border-ai-primary"
              >
                <option value="APA">APA</option>
                <option value="MLA">MLA</option>
                <option value="Chicago">Chicago</option>
                <option value="IEEE">IEEE</option>
                <option value="Numbered">Numbered [1]</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-ai-border/30">
          <label className="text-sm font-semibold text-ai-muted uppercase block">Source Types</label>
          <div className="flex flex-wrap gap-2">
            {allSourceTypes.map(type => {
              const isActive = plan.source_types.includes(type);
              return (
                <button 
                  key={type}
                  onClick={() => handleSourceTypeToggle(type)}
                  className={`px-3 py-1.5 rounded-full text-xs capitalize border transition-all ${isActive ? 'bg-ai-primary/20 text-ai-primary border-ai-primary/50' : 'bg-ai-dark text-ai-muted border-ai-border hover:border-ai-primary/30'}`}
                >
                  {type.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-ai-border/50">
        <button 
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl text-ai-muted hover:text-white hover:bg-ai-dark transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={() => onSave(plan)}
          className="px-8 py-2.5 rounded-xl bg-ai-primary hover:bg-ai-primaryHover text-white font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
