import React from 'react';

const detailedStages = [
  { id: 'queued', label: 'Research plan created' },
  { id: 'searching_1', backendStatus: 'searching', label: 'Search queries generated' },
  { id: 'searching_2', backendStatus: 'searching', label: 'Searching for credible sources' },
  { id: 'extracting_1', backendStatus: 'extracting', label: 'Sources collected' },
  { id: 'extracting_2', backendStatus: 'extracting', label: 'Filtering relevant sources' },
  { id: 'extracting_3', backendStatus: 'extracting', label: 'Extracting documents' },
  { id: 'embedding_1', backendStatus: 'embedding', label: 'Processing documents' },
  { id: 'embedding_2', backendStatus: 'embedding', label: 'Creating embeddings' },
  { id: 'analyzing_1', backendStatus: 'analyzing', label: 'Retrieving relevant evidence' },
  { id: 'analyzing_2', backendStatus: 'analyzing', label: 'Analyzing sources' },
  { id: 'generating_1', backendStatus: 'generating_1', label: 'Drafting executive summary (Pass 1/4)' },
  { id: 'generating_2', backendStatus: 'generating_2', label: 'Extracting key findings (Pass 2/4)' },
  { id: 'generating_3', backendStatus: 'generating_3', label: 'Analyzing perspectives (Pass 3/4)' },
  { id: 'generating_4', backendStatus: 'generating_4', label: 'Finalizing conclusions (Pass 4/4)' },
  { id: 'completed', label: 'Finalizing report' }
];

export const ResearchProgress: React.FC<{ currentStatus: string }> = ({ currentStatus }) => {
  const backendStages = ['queued', 'searching', 'extracting', 'embedding', 'analyzing', 'generating_1', 'generating_2', 'generating_3', 'generating_4', 'completed', 'failed'];
  const currentBackendIndex = backendStages.indexOf(currentStatus);

  return (
    <div className="w-full max-w-2xl mx-auto glass-panel p-8 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-ai-primary/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
      
      <h3 className="text-xl font-bold text-ai-text mb-8 text-center flex items-center justify-center gap-3">
        {currentStatus !== 'failed' && <span className="w-2 h-2 rounded-full bg-ai-primary animate-pulse"></span>}
        {currentStatus === 'failed' ? 'Research Failed' : 'Research in Progress'}
      </h3>
      
      <div className="space-y-4 relative">
        {/* Connection Line */}
        <div className="absolute left-4 top-4 bottom-4 w-px bg-ai-border/50 -z-10 hidden sm:block"></div>

        {detailedStages.map((stage) => {
          const stageBackendIndex = backendStages.indexOf(stage.backendStatus || stage.id);
          const isCompleted = currentBackendIndex > stageBackendIndex || currentStatus === 'completed';
          const isCurrent = currentBackendIndex === stageBackendIndex && currentStatus !== 'failed' && currentStatus !== 'completed';
          const isFailed = currentStatus === 'failed' && currentBackendIndex === stageBackendIndex;
          const isPending = currentBackendIndex < stageBackendIndex;
          
          // Don't show all generating steps if it fails early
          if (currentStatus === 'failed' && isPending) return null;

          return (
            <div 
              key={stage.id} 
              className={`flex items-center gap-4 transition-all duration-300 ${
                isCompleted ? 'text-emerald-400' : 
                isCurrent ? 'text-ai-primary font-medium scale-105 transform origin-left' : 
                isFailed ? 'text-red-400' : 'text-ai-muted/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                isCompleted ? 'bg-emerald-500/10 border-emerald-500/30' :
                isCurrent ? 'bg-ai-primary/20 border-ai-primary shadow-[0_0_15px_rgba(99,102,241,0.3)]' :
                isFailed ? 'bg-red-500/10 border-red-500/30' :
                'bg-ai-card border-ai-border/50'
              }`}>
                {isCompleted && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isCurrent && !isFailed && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {isFailed && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {!isCompleted && !isCurrent && !isFailed && (
                  <div className="w-2 h-2 rounded-full bg-ai-muted/30"></div>
                )}
              </div>
              <span className="tracking-wide text-sm md:text-base">{stage.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
