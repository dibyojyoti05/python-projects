import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-primary">
          Elevate Your Career with AI Resume Intelligence
        </h1>
        <p className="text-xl text-muted-foreground">
          Upload your resume and job description to get a comprehensive analysis, ATS compatibility score, tailored improvement suggestions, and a custom cover letter.
        </p>
      </div>
      
      <div className="flex gap-4">
        <Link href="/resumes/upload">
          <Button size="lg" className="px-8 text-lg font-semibold">
            Upload Resume
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button size="lg" variant="outline" className="px-8 text-lg font-semibold">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
