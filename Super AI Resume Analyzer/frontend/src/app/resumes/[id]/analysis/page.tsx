"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import React, { use, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface ReportData {
  version_id?: number;
  analysis: {
    overall_score: number;
    ats_score: number;
    component_scores: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
}

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState("");
  
  const [rewritingSection, setRewritingSection] = useState(false);
  const [sectionText, setSectionText] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  
  const { token } = useAuth();
  
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!token) return;
      try {
        const res = await fetch(`http://localhost:8000/api/resumes/${unwrappedParams.id}/report`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } catch (e) {
        console.error("Failed to fetch analysis", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [unwrappedParams.id, token]);

  const handleGenerateSummary = async () => {
    if (!token || !report || !report.version_id) return;
    setGeneratingSummary(true);
    try {
      const res = await fetch(`http://localhost:8000/api/writing/${report.version_id}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ style: "Professional" })
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
      } else {
        alert(data.detail || "Failed to generate summary");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating summary");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleRewriteSection = async () => {
    if (!token || !sectionText) return;
    setRewritingSection(true);
    try {
      const res = await fetch(`http://localhost:8000/api/writing/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ section_text: sectionText, style: "Professional" })
      });
      const data = await res.json();
      if (res.ok) {
        setRewrittenText(data.rewritten_text);
      } else {
        alert(data.detail || "Failed to rewrite section");
      }
    } catch (e) {
      console.error(e);
      alert("Error rewriting section");
    } finally {
      setRewritingSection(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading analysis...</div>;
  if (!report) return <div className="text-center py-20">Analysis not found.</div>;
  
  const mockAnalysis = report.analysis; 

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Resume Analysis</h2>
        <p className="text-muted-foreground">Detailed breakdown of your resume&apos;s performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold">{mockAnalysis.overall_score}</div>
              <div className="text-sm text-muted-foreground mb-1">/ 100</div>
            </div>
            <Progress value={mockAnalysis.overall_score} className="mt-4" />
          </CardContent>
        </Card>
        
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ATS Compatibility</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold">{mockAnalysis.ats_score}</div>
              <div className="text-sm text-muted-foreground mb-1">/ 100</div>
            </div>
            <Progress value={mockAnalysis.ats_score} className="mt-4 [&>div]:bg-green-500" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scores">Component Scores</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2">
                  {mockAnalysis.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="text-red-500" /> Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2">
                  {mockAnalysis.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Card>
             <CardHeader>
                <CardTitle>Actionable Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mockAnalysis.suggestions?.map((s: string, i: number) => (
                    <li key={i} className="flex gap-3 bg-muted p-3 rounded-md">
                      <div className="flex-shrink-0 mt-0.5"><Badge variant="outline">{i+1}</Badge></div>
                      <div>{s}</div>
                    </li>
                  ))}
                </ul>
              </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scores">
          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
              <CardDescription>How your resume performed in specific categories.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockAnalysis.component_scores && Object.entries(mockAnalysis.component_scores).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="capitalize font-medium">{key}</span>
                    <span>{String(value)}/100</span>
                  </div>
                  <Progress value={Number(value) || 0} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-tools">
           <Card>
            <CardHeader>
              <CardTitle>AI Writing Assistants</CardTitle>
              <CardDescription>Let AI help you rewrite and improve sections of your resume.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="border rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Summary Generator</h3>
                  <p className="text-sm text-muted-foreground">Generate a professional summary based on your extracted experience.</p>
                  
                  {summary ? (
                    <div className="space-y-2">
                      <Label>Generated Summary</Label>
                      <Textarea 
                        className="min-h-[150px] text-sm" 
                        value={summary} 
                        onChange={(e) => setSummary(e.target.value)}
                      />
                    </div>
                  ) : (
                    <Button onClick={handleGenerateSummary} disabled={generatingSummary} className="w-full">
                      {generatingSummary ? "Generating..." : "Generate Summary"}
                    </Button>
                  )}
                </div>
                
                <div className="border rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Section Rewriter</h3>
                  <p className="text-sm text-muted-foreground">Paste a bullet point and let AI rewrite it to be more impactful.</p>
                  
                  <div className="space-y-3">
                    <Textarea 
                      placeholder="Paste bullet point here..." 
                      className="text-sm"
                      value={sectionText}
                      onChange={(e) => setSectionText(e.target.value)}
                    />
                    <Button onClick={handleRewriteSection} disabled={rewritingSection || !sectionText} className="w-full">
                      {rewritingSection ? "Rewriting..." : "Rewrite Section"}
                    </Button>
                    
                    {rewrittenText && (
                      <div className="mt-4 p-3 bg-muted rounded-md border">
                        <Label className="mb-2 block text-xs uppercase text-muted-foreground">Rewritten Result</Label>
                        <p className="text-sm">{rewrittenText}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
