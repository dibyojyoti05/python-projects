import { useState } from 'react';
import { useResearch } from './hooks/useResearch';
import { ResearchProgress } from './components/ResearchProgress';
import { ResearchReport } from './components/ResearchReport';
import { SourceList } from './components/SourceList';
import { ResearchPlanViewer } from './components/ResearchPlanViewer';
import { HistorySidebar } from './components/HistorySidebar';
import type { ResearchPlan, ResearchStatusResponse } from './types';

function App() {
  const [query, setQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const { requestPlan, start, status, setStatus, setResearchId, error, plan, setPlan, isPlanning } = useResearch();

  const handleStart = () => {
    if (query.trim()) {
      requestPlan(query);
    }
  };

  const handleAcceptPlan = (approvedPlan: ResearchPlan) => {
    setPlan(null); // Clear plan to show progress
    start(query, approvedPlan);
  };

  const handleSelectHistory = (historyStatus: ResearchStatusResponse) => {
    setQuery(historyStatus.query);
    setPlan(null);
    setResearchId(historyStatus.research_id);
    setStatus(historyStatus);
  };

  const isResearching = status && status.status !== 'completed' && status.status !== 'failed';
  const hasCompleted = status && status.status === 'completed';

  return (
    <div className="min-h-screen font-sans overflow-x-hidden selection:bg-ai-primary/30">
      
      {/* Top Navigation */}
      <nav className="absolute top-0 w-full p-4 md:p-8 flex justify-end z-30 print:hidden">
        <button 
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 px-4 py-2 glass-panel hover:bg-ai-dark/50 transition-colors text-ai-muted hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          History
        </button>
      </nav>

      <HistorySidebar 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        onSelectResearch={handleSelectHistory} 
      />

      <div className="max-w-6xl mx-auto space-y-12 p-4 md:p-8">
        
        {/* Header and Search Box */}
        <div className="text-center space-y-6 max-w-3xl mx-auto pt-16 relative print:hidden">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ai-primary/20 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            <span className="text-ai-text">AI </span>
            <span className="text-gradient">Research</span>
            <span className="text-ai-text"> Assistant</span>
          </h1>
          <p className="text-xl text-ai-muted font-light">
            Research smarter. Understand sources. Build better research.
          </p>
          
          <div className="mt-12 glass-panel p-2 flex flex-col md:flex-row items-center gap-2 animate-fade-in-up transition-all focus-within:shadow-[0_0_30px_rgba(99,102,241,0.15)] focus-within:border-ai-primary/50">
            <textarea 
              className="w-full p-4 bg-transparent text-ai-text rounded-xl focus:outline-none resize-none placeholder-ai-muted/60"
              rows={2}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to research? (e.g., Impact of artificial intelligence on education)"
              disabled={isResearching as boolean}
            ></textarea>
            <button 
              onClick={handleStart}
              disabled={isResearching as boolean || isPlanning || !query.trim()}
              className="bg-ai-primary hover:bg-ai-primaryHover disabled:bg-ai-border disabled:text-ai-muted text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 w-full md:w-auto h-full min-w-[160px] shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:shadow-none"
            >
              {isPlanning ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Planning
                </span>
              ) : isResearching ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Researching
                </span>
              ) : 'Start Research'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="glass-panel border-red-500/30 bg-red-900/10 text-red-400 p-4 rounded-xl text-center animate-fade-in-up">
            {error}
          </div>
        )}

        {/* Progress State */}
        {status && !hasCompleted && !plan && (
          <div className="animate-fade-in-up">
            <ResearchProgress currentStatus={status.status} />
          </div>
        )}

        {/* Plan Review State */}
        {plan && !status && (
          <div className="animate-fade-in-up">
            <ResearchPlanViewer plan={plan} onAccept={handleAcceptPlan} />
          </div>
        )}

        {/* Results State */}
        {hasCompleted && status?.report && (
          <div className="grid md:grid-cols-3 gap-8 items-start animate-fade-in-up print:block" style={{animationDelay: '0.2s'}}>
            <div className="md:col-span-2 print:col-span-1">
              <ResearchReport data={status.report} />
            </div>
            <div className="md:col-span-1 space-y-6 print:hidden">
              <SourceList sources={status.sources || []} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
