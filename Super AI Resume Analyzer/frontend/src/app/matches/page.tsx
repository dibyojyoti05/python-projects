"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, ChevronRight, Briefcase, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface MatchItem {
  id: number;
  overall_score: number;
  skill_score?: number;
  semantic_score?: number;
  job?: {
    id: number;
    title: string;
    company: string;
  };
  analysis_details?: string;
  created_at?: string;
}

export default function JobMatches() {
  const { token, user } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:8000/api/matches/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMatches(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load matches", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [token]);

  if (!user) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">Please log in to view job matches</h2>
        <Link href="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Job Matches</h1>
          <p className="text-muted-foreground text-sm">See how your resume stacks up against target roles.</p>
        </div>
        <Link href="/job-match">
          <Button className="gap-2">
            <Plus size={16} /> New Match Analysis
          </Button>
        </Link>
      </header>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading matches...</div>
      ) : matches.length === 0 ? (
        <div className="border border-dashed rounded-xl p-12 text-center space-y-4">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No job matches yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Analyze your resume against a target job description to view match scores and skill gap insights.
          </p>
          <Link href="/job-match">
            <Button>Run Your First Match</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map(match => {
            const score = Math.round(match.overall_score);
            let matchedSkills: string[] = [];
            let missingSkills: string[] = [];
            if (match.analysis_details) {
              try {
                const parsed = JSON.parse(match.analysis_details);
                matchedSkills = parsed.matched_skills || [];
                missingSkills = parsed.missing_skills || [];
              } catch {
                // fallback
              }
            }

            return (
              <div
                key={match.id}
                className="bg-card border rounded-xl p-6 flex items-center justify-between hover:border-primary/50 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center relative flex-shrink-0">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
                      <path
                        className="text-muted"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={score > 80 ? "text-green-500" : score > 60 ? "text-yellow-500" : "text-orange-500"}
                        strokeDasharray={`${score}, 100`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="text-sm font-bold relative z-10">{score}%</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">{match.job?.title || "Target Role"}</h3>
                    <p className="text-sm text-muted-foreground">{match.job?.company || "Company"}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {matchedSkills.slice(0, 4).map(s => (
                        <span key={s} className="text-xs bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                          ✓ {s}
                        </span>
                      ))}
                      {missingSkills.slice(0, 3).map(s => (
                        <span key={s} className="text-xs bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
                          ✕ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Link href="/job-match">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Details <ChevronRight size={16} />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
