import React from 'react';
import type { Source } from '../types/index';

export const SourceList: React.FC<{ sources: Source[] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="w-full glass-panel p-6 sticky top-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <h3 className="text-xl font-bold text-ai-text mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-ai-primary/10 flex items-center justify-center text-ai-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
        Sources Used
        <span className="ml-auto text-xs font-semibold text-ai-muted bg-ai-dark px-2 py-1 rounded-full">{sources.length}</span>
      </h3>
      <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
        {sources.map((s, idx) => {
          const domain = getDomain(s.url);
          const sourceNumber = parseInt(s.source_id.split('-')[1] || `${idx + 1}`);
          const colorIndex = sourceNumber % 5;
          const colors = [
            'bg-blue-500 text-white',
            'bg-emerald-500 text-white',
            'bg-purple-500 text-white',
            'bg-amber-500 text-white',
            'bg-rose-500 text-white'
          ];
          
          return (
            <a 
              key={idx} 
              id={s.source_id}
              href={s.url}
              target="_blank" 
              rel="noopener noreferrer"
              className="block group bg-ai-dark/40 p-4 rounded-xl border border-ai-border/50 hover:border-ai-primary/50 hover:bg-ai-dark/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-ai-primary/10 relative overflow-hidden"
              style={{ animationDelay: `${0.1 * idx}s` }}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-ai-primary/30 group-hover:bg-ai-primary transition-colors"></div>
              
              <div className="flex items-start gap-3">
                <div className={`mt-1 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${colors[colorIndex]} shadow-sm`}>
                  {sourceNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-ai-text mb-2 line-clamp-2 group-hover:text-ai-primary transition-colors text-sm">{s.title}</h4>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <span className="truncate max-w-[70%] opacity-70 group-hover:opacity-100 text-ai-muted bg-ai-card px-2 py-0.5 rounded border border-ai-border/50">
                      {domain}
                    </span>
                    <svg className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-ai-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
