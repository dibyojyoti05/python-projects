"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Briefcase, Activity, UploadCloud } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

interface ResumeData {
  id: number;
  title: string;
  created_at: string;
}

interface MatchData {
  id: number;
  job_description_id: number;
  match_score: number;
}

interface AnalysisData {
  overall_score: number;
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const resResumes = await fetch("http://localhost:8000/api/resumes/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resData = await resResumes.json();
        setResumes(Array.isArray(resData) ? resData : []);
        
        const resMatches = await fetch("http://localhost:8000/api/history/job-matches", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const matchData = await resMatches.json();
        setMatches(Array.isArray(matchData) ? matchData : []);
        
        const resAnalyses = await fetch("http://localhost:8000/api/history/analyses", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const analysesData = await resAnalyses.json();
        setAnalyses(Array.isArray(analysesData) ? analysesData : []);
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Calculate average score
  let averageScore = 0;
  if (analyses.length > 0) {
    const totalScore = analyses.reduce((acc, curr) => acc + (curr.overall_score || 0), 0);
    averageScore = Math.round(totalScore / analyses.length);
  }

  const stats = [
    { title: "Total Resumes", value: resumes.length.toString(), icon: FileText },
    { title: "Job Matches", value: matches.length.toString(), icon: Briefcase },
    { title: "Average Score", value: `${averageScore}/100`, icon: Activity },
  ];

  if (!user) return <div className="text-center mt-20">Please log in to view the dashboard.</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your resume performance and job matches.</p>
        </div>
        <Link href="/resumes/upload">
          <Button className="gap-2">
            <UploadCloud size={16} />
            Upload New Resume
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Resumes</CardTitle>
            <CardDescription>Your latest uploaded resumes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {loading ? (
                 <p className="text-sm text-muted-foreground">Loading resumes...</p>
               ) : resumes.length === 0 ? (
                 <p className="text-sm text-muted-foreground">No resumes uploaded yet.</p>
               ) : (
                 resumes.slice(0, 5).map((resume: ResumeData) => (
                   <div key={resume.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{resume.title}</p>
                        <p className="text-sm text-muted-foreground">Uploaded {new Date(resume.created_at).toLocaleDateString()}</p>
                      </div>
                      <Link href={`/resumes/${resume.id}/analysis`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                   </div>
                 ))
               )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Job Matches</CardTitle>
            <CardDescription>Your performance against recent job descriptions.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {loading ? (
                 <p className="text-sm text-muted-foreground">Loading matches...</p>
               ) : matches.length === 0 ? (
                 <p className="text-sm text-muted-foreground">No job matches yet.</p>
               ) : (
                 matches.slice(0, 5).map((match: MatchData) => (
                   <div key={match.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">Job ID: {match.job_description_id}</p>
                        <p className="text-sm text-muted-foreground">Match Score: {match.match_score}%</p>
                      </div>
                      <Link href={`/job-match`}>
                        <Button variant="outline" size="sm">New Match</Button>
                      </Link>
                   </div>
                 ))
               )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
