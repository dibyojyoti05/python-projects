"use client";

import { useState, useEffect, useCallback } from "react";
import { generatePassword, PasswordGeneratorOptions } from "@/lib/password-generator";
import { analyzePassword, PasswordAnalysisResult } from "@/lib/password-analyzer";
import { StrengthMeter } from "@/components/StrengthMeter";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  });

  const [password, setPassword] = useState("");
  const [analysis, setAnalysis] = useState<PasswordAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    // Ensure at least one char set is selected
    if (!options.includeUppercase && !options.includeLowercase && !options.includeNumbers && !options.includeSymbols) {
      setOptions(prev => ({ ...prev, includeLowercase: true }));
      return;
    }
    
    const newPassword = generatePassword(options);
    setPassword(newPassword);
    setAnalysis(analyzePassword(newPassword));
    setCopied(false);
  }, [options]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleGenerate();
  }, [handleGenerate]);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy password", err);
    }
  };

  const handleOptionChange = (key: keyof PasswordGeneratorOptions, value: string | boolean | number) => {
    setOptions(prev => {
      const next = { ...prev, [key]: value };
      // Prevent unchecking all character types
      if (!next.includeUppercase && !next.includeLowercase && !next.includeNumbers && !next.includeSymbols) {
        return prev;
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Input
          type="text"
          value={password}
          readOnly
          className="pr-24 text-lg font-mono h-14 bg-muted/50"
          aria-label="Generated password"
        />
        <div className="absolute right-1 top-2 flex gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleGenerate}
            aria-label="Regenerate password"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="default" 
            size="icon"
            onClick={handleCopy}
            aria-label="Copy password"
            className={copied ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Password Length</Label>
            <span className="font-mono text-sm">{options.length}</span>
          </div>
          <Slider
            value={[options.length]}
            min={8}
            max={128}
            step={1}
            onValueChange={(vals: number | readonly number[]) => handleOptionChange('length', Array.isArray(vals) ? vals[0] : vals)}
            aria-label="Password length"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="uppercase" className="cursor-pointer">Uppercase (A-Z)</Label>
              <Switch 
                id="uppercase" 
                checked={options.includeUppercase} 
                onCheckedChange={(c) => handleOptionChange('includeUppercase', c)} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="lowercase" className="cursor-pointer">Lowercase (a-z)</Label>
              <Switch 
                id="lowercase" 
                checked={options.includeLowercase} 
                onCheckedChange={(c) => handleOptionChange('includeLowercase', c)} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="numbers" className="cursor-pointer">Numbers (0-9)</Label>
              <Switch 
                id="numbers" 
                checked={options.includeNumbers} 
                onCheckedChange={(c) => handleOptionChange('includeNumbers', c)} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="symbols" className="cursor-pointer">Symbols (!@#$)</Label>
              <Switch 
                id="symbols" 
                checked={options.includeSymbols} 
                onCheckedChange={(c) => handleOptionChange('includeSymbols', c)} 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="similar" className="cursor-pointer">Exclude Similar</Label>
                <p className="text-xs text-muted-foreground">e.g. i, l, 1, L, o, 0, O</p>
              </div>
              <Switch 
                id="similar" 
                checked={options.excludeSimilar} 
                onCheckedChange={(c) => handleOptionChange('excludeSimilar', c)} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ambiguous" className="cursor-pointer">Exclude Ambiguous</Label>
                <p className="text-xs text-muted-foreground">e.g. {'{}[]()/\\\'"~,;:.<>'}</p>
              </div>
              <Switch 
                id="ambiguous" 
                checked={options.excludeAmbiguous} 
                onCheckedChange={(c) => handleOptionChange('excludeAmbiguous', c)} 
              />
            </div>
          </div>
        </div>
      </div>

      {analysis && (
        <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <StrengthMeter analysis={analysis} />
        </div>
      )}
    </div>
  );
}
