"use client";

import { useState, useEffect, useCallback } from "react";
import { generatePassphrase, PassphraseGeneratorOptions } from "@/lib/passphrase-generator";
import { analyzePassword, PasswordAnalysisResult } from "@/lib/password-analyzer";
import { StrengthMeter } from "@/components/StrengthMeter";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PassphraseGenerator() {
  const [options, setOptions] = useState<PassphraseGeneratorOptions>({
    numWords: 4,
    separator: "-",
    capitalize: false,
    includeNumber: false,
  });

  const [passphrase, setPassphrase] = useState("");
  const [analysis, setAnalysis] = useState<PasswordAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    const newPassphrase = generatePassphrase(options);
    setPassphrase(newPassphrase);
    setAnalysis(analyzePassword(newPassphrase));
    setCopied(false);
  }, [options]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleGenerate();
  }, [handleGenerate]);

  const handleCopy = async () => {
    if (!passphrase) return;
    try {
      await navigator.clipboard.writeText(passphrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy passphrase", err);
    }
  };

  const handleOptionChange = (key: keyof PassphraseGeneratorOptions, value: string | boolean | number) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Input
          type="text"
          value={passphrase}
          readOnly
          className="pr-24 text-lg font-mono h-14 bg-muted/50"
          aria-label="Generated passphrase"
        />
        <div className="absolute right-1 top-2 flex gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleGenerate}
            aria-label="Regenerate passphrase"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="default" 
            size="icon"
            onClick={handleCopy}
            aria-label="Copy passphrase"
            className={copied ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Number of Words</Label>
            <span className="font-mono text-sm">{options.numWords}</span>
          </div>
          <Slider
            value={[options.numWords]}
            min={3}
            max={12}
            step={1}
            onValueChange={(vals: number | readonly number[]) => handleOptionChange('numWords', Array.isArray(vals) ? vals[0] : vals)}
            aria-label="Number of words"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="capitalize" className="cursor-pointer">Capitalize Words</Label>
              <Switch 
                id="capitalize" 
                checked={options.capitalize} 
                onCheckedChange={(c) => handleOptionChange('capitalize', c)} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-number" className="cursor-pointer">Include Number</Label>
              <Switch 
                id="include-number" 
                checked={options.includeNumber} 
                onCheckedChange={(c) => handleOptionChange('includeNumber', c)} 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="separator">Separator</Label>
              <select 
                id="separator"
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={options.separator}
                onChange={(e) => handleOptionChange('separator', e.target.value)}
              >
                <option value="-">Hyphen (-)</option>
                <option value="_">Underscore (_)</option>
                <option value=".">Period (.)</option>
                <option value=" ">Space ( )</option>
                <option value="">None</option>
              </select>
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
