"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ShieldCheck, X } from "lucide-react";
import { analyzePassword, PasswordAnalysisResult } from "@/lib/password-analyzer";
import { StrengthMeter } from "@/components/StrengthMeter";

export function PasswordChecker() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState<PasswordAnalysisResult | null>(null);

  // Debounce the analysis slightly to avoid locking the main thread on every keystroke
  // although zxcvbn is usually fast enough for local execution.
  useEffect(() => {
    if (!password) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnalysis(analyzePassword(""));
      return;
    }
    
    const timer = setTimeout(() => {
       
      setAnalysis(analyzePassword(password));
    }, 300);

    return () => clearTimeout(timer);
  }, [password]);

  const handleClear = () => {
    setPassword("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 relative">
        <Label htmlFor="password-input">Enter a password to check its strength</Label>
        <div className="relative">
          <Input
            id="password-input"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-20 text-lg font-mono h-12"
            placeholder="Type your password here..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <div className="absolute right-1 top-1 flex items-center">
            {password && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClear}
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                aria-label="Clear password"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <ShieldCheck className="w-3 h-3 text-green-500" />
          Processed entirely locally. Your password never leaves this device.
        </p>
      </div>

      {analysis && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <StrengthMeter analysis={analysis} />
        </div>
      )}
    </div>
  );
}
