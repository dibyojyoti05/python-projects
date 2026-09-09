"use client";

import { motion } from "framer-motion";
import { getScoreColor, getScoreLabel, PasswordAnalysisResult } from "@/lib/password-analyzer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StrengthMeterProps {
  analysis: PasswordAnalysisResult;
}

export function StrengthMeter({ analysis }: StrengthMeterProps) {
  const score = analysis.score;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  // Generate 4 segments for the strength bar
  const segments = [1, 2, 3, 4];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span>Password Strength</span>
          <Badge variant={score >= 3 ? "default" : "destructive"}>
            {label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Strength Bar */}
        <div className="flex gap-1 h-2 mb-4">
          {segments.map((segment) => {
            const isActive = score >= segment || (score === 0 && segment === 1 && analysis.guesses > 0);
            const segmentColor = isActive ? color : "bg-muted";
            
            return (
              <motion.div
                key={segment}
                className={`flex-1 rounded-full ${segmentColor}`}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.3, delay: segment * 0.1 }}
                style={{ transformOrigin: "left" }}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <div className="text-muted-foreground flex items-center gap-1">
              Entropy
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Information entropy represents the unpredictability of the password. 
                    More bits mean it&apos;s harder to guess. &gt;60 bits is generally considered strong.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="font-mono">{analysis.entropyBits} bits</div>
          </div>
          <div>
            <div className="text-muted-foreground flex items-center gap-1">
              Offline Crack Time
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Estimated time to crack offline using fast hashing (10 billion guesses/sec). 
                    Actual time depends on the specific hashing algorithm used by the breached service.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="font-mono">
              {analysis.crackTimesDisplay ? analysis.crackTimesDisplay.offlineFastHashing1e10PerSecond : 'N/A'}
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        {analysis.feedback.warning && (
          <div className="mb-3 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{analysis.feedback.warning}</p>
          </div>
        )}

        {analysis.feedback.suggestions.length > 0 && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Suggestions
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              {analysis.feedback.suggestions.map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
