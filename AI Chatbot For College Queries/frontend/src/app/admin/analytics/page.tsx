"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle, MessageSquare, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Question {
  id: number;
  question: string;
  created_at: string;
  user_id?: number;
  conversation_id?: number;
  resolved: boolean;
}

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState("unresolved");

  const fetchQuestions = async () => {
    if (!token) return;
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/analytics/unanswered`;
      if (filter !== "all") {
        url += `?resolved=${filter === "resolved"}`;
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setQuestions(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter]);

  const handleResolve = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/analytics/unanswered/${id}/resolve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-card flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Unanswered Questions</h2>
          <div className="flex gap-2">
            <select 
              className="input-field max-w-[150px]"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        <div className="text-secondary text-sm">
          These are questions asked by students that the AI assistant could not answer due to lack of information in the knowledge base. Use these to identify missing FAQs or documents.
        </div>

        <div className="flex flex-col gap-4">
          {questions.map((q) => (
            <div key={q.id} className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="text-accent-primary mt-1"><MessageSquare size={20} /></div>
                  <div>
                    <p className="font-medium text-lg">&quot;{q.question}&quot;</p>
                    <p className="text-sm text-secondary">
                      Asked on {new Date(q.created_at).toLocaleString()}
                      {q.user_id && ` • User ID: ${q.user_id}`}
                      {q.conversation_id && ` • Conversation: ${q.conversation_id}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${q.resolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {q.resolved ? "Resolved" : "Needs Action"}
                  </span>
                </div>
              </div>

              {!q.resolved && (
                <div className="flex gap-3 justify-end mt-2 pt-3 border-t border-white/5">
                  <Link 
                    href="/admin/documents" 
                    className="text-sm px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={14} /> Add Document
                  </Link>
                  <button 
                    onClick={() => handleResolve(q.id)}
                    className="text-sm px-3 py-1.5 rounded bg-accent-primary/20 text-accent-primary hover:bg-accent-primary hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle size={14} /> Mark as Resolved
                  </button>
                </div>
              )}
            </div>
          ))}

          {questions.length === 0 && (
            <div className="py-12 text-center text-secondary">
              No unanswered questions found. The AI is doing great!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
