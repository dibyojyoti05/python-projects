"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

interface ResumeData {
  id: number;
  title: string;
  latest_version_id?: number;
}

interface MatchResults {
  job_id: number;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
}

export default function JobMatchPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedResume, setSelectedResume] = useState("");
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<MatchResults | null>(null);
  
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  const { token } = useAuth();

  useEffect(() => {
    const fetchResumes = async () => {
      if (!token) return;
      try {
        const res = await fetch("http://localhost:8000/api/resumes/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setResumes(data);
          if (data.length > 0) {
            setSelectedResume(data[0].id.toString());
          }
        }
      } catch (e) {
        console.error("Failed to fetch resumes", e);
      }
    };
    fetchResumes();
  }, [token]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedResume) return;
    
    setIsAnalyzing(true);
    setCoverLetter(""); // reset cover letter on new analysis
    
    try {
      // 1. Create Job Description
      const jobRes = await fetch("http://localhost:8000/api/jobs/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: jobTitle, company: companyName, description: jobDescription })
      });
      const jobData = await jobRes.json();
      
      // 2. Match Job with selected resume
      const matchRes = await fetch(`http://localhost:8000/api/jobs/${jobData.id}/match/${selectedResume}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const matchData = await matchRes.json();
      
      setResults({ ...matchData, job_id: jobData.id });
    } catch (e: unknown) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to analyze match");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!token || !results || !results.job_id || !selectedResume) return;
    
    setIsGeneratingCoverLetter(true);
    try {
      const resume = resumes.find(r => r.id.toString() === selectedResume);
      if (!resume) {
        throw new Error("Could not find selected resume.");
      }
      
      const res = await fetch(`http://localhost:8000/api/writing/${resume.id}/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ job_id: results.job_id, company_name: companyName })
      });
      
      const data = await res.json();
      if (res.ok) {
        setCoverLetter(data.cover_letter);
      } else {
        throw new Error(data.detail || "Failed to generate cover letter");
      }
    } catch (e: unknown) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to generate cover letter");
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Job Match Analyzer</h2>
        <p className="text-muted-foreground">Compare your resume against a specific job description to find gaps.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Paste the job you want to apply for.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resume">Select Resume</Label>
                <select 
                  id="resume"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  required
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id.toString()}>{r.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g., Senior Frontend Developer" 
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input 
                  id="company" 
                  placeholder="e.g., Tech Corp" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Paste the full job description here..." 
                  className="min-h-[250px]"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isAnalyzing || resumes.length === 0}>
                {isAnalyzing ? "Analyzing Match..." : "Analyze Match"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="col-span-1 space-y-6">
          {results ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Match Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-4 mb-2">
                    <div className="text-5xl font-bold text-primary">{results.match_score}%</div>
                  </div>
                  <Progress value={results.match_score} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-4">
                    Your resume is a decent match for this role, but there are some key skills missing.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Skills Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-green-600 mb-2">Matched Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.matched_skills?.map((s: string) => (
                        <Badge key={s} variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-red-600 mb-2">Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.missing_skills?.map((s: string) => (
                        <Badge key={s} variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Action Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-4 space-y-2 text-sm mb-6">
                    {results.recommendations?.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  
                  {coverLetter ? (
                    <div className="mt-6 space-y-2">
                      <Label>Generated Cover Letter</Label>
                      <Textarea 
                        className="min-h-[300px] text-sm font-mono" 
                        value={coverLetter} 
                        onChange={(e) => setCoverLetter(e.target.value)}
                      />
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={handleGenerateCoverLetter}
                      disabled={isGeneratingCoverLetter}
                    >
                      {isGeneratingCoverLetter ? "Generating..." : "Generate Cover Letter"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-10 text-center border-dashed bg-muted/30 min-h-[500px]">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <h3 className="text-lg font-medium mb-1">Waiting for details</h3>
              <p className="text-sm text-muted-foreground">Paste a job description and click analyze to see how well you match.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
