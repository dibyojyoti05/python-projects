import React, { useEffect, useState } from 'react';
import { getHistory, getResearchStatus } from '../services/api';
import type { HistoryResponse, ResearchStatusResponse } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResearch: (status: ResearchStatusResponse) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, onSelectResearch }) => {
  const [history, setHistory] = useState<HistoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleSelect = async (id: string) => {
    try {
      setLoading(true);
      const data = await getResearchStatus(id);
      onSelectResearch(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-ai-dark border-l border-ai-border/50 z-50 p-6 flex flex-col shadow-2xl animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
        <div className="flex justify-between items-center mb-8 border-b border-ai-border/50 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-ai-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Research History
          </h2>
          <button onClick={onClose} className="p-2 text-ai-muted hover:text-white bg-ai-card rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
          {loading && history.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <span className="w-6 h-6 rounded-full border-2 border-ai-primary/30 border-t-ai-primary animate-spin"></span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center text-ai-muted p-8 bg-ai-card/50 rounded-xl border border-ai-border/50">
              <p>No research history found.</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.research_id}
                onClick={() => handleSelect(item.research_id)}
                className="w-full text-left p-4 bg-ai-card/50 hover:bg-ai-card border border-ai-border/50 hover:border-ai-primary/50 rounded-xl transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-ai-text font-medium text-sm line-clamp-2 group-hover:text-ai-primary transition-colors">{item.query}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize shrink-0 ml-2 ${
                    item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-ai-primary/20 text-ai-primary'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="text-[10px] text-ai-muted flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};
