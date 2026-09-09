"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    
    // Create FormData for the backend API
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to upload");
      }

      const res = await fetch("http://localhost:8000/api/resumes/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload resume");
      }

      const data = await res.json();
      
      setUploadSuccess(true);
      const targetId = data.resume_id || data.id;
      setTimeout(() => {
        router.push(`/resumes/${targetId}/analysis`);
      }, 1000);
    } catch (error) {
      console.error("Upload failed", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload Resume</CardTitle>
          <CardDescription>
            Upload your resume (PDF, DOCX, or TXT) to get an AI-powered analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <div className="space-y-2">
                <h3 className="text-xl font-medium">Upload Successful!</h3>
                <p className="text-muted-foreground">Redirecting to analysis...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Resume Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g., Software Engineer 2024" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">Resume File</Label>
                <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-4 transition-colors hover:bg-muted/50">
                  <UploadCloud className="w-10 h-10 text-muted-foreground" />
                  <div className="text-center">
                    <Button variant="secondary" type="button" onClick={() => document.getElementById('file')?.click()}>
                      Choose File
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      {file ? file.name : "or drag and drop here"}
                    </p>
                  </div>
                  <input 
                    id="file" 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={!file || isUploading}>
                {isUploading ? "Uploading & Analyzing..." : "Upload & Analyze"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
