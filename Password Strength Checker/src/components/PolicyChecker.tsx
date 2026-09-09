"use client";

import { useState, useEffect } from "react";
import { PasswordPolicy, defaultPolicy, evaluatePolicy, PolicyResult } from "@/lib/password-policy";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export function PolicyChecker() {
  const [policy, setPolicy] = useState<PasswordPolicy>(defaultPolicy);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<PolicyResult | null>(null);

  useEffect(() => {
    if (!password) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(null);
      return;
    }
     
    setResult(evaluatePolicy(password, policy));
  }, [password, policy]);

  const handlePolicyChange = (key: keyof PasswordPolicy, value: string | boolean | number) => {
    setPolicy(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="policy-password">Test Password against Policy</Label>
        <Input
          id="policy-password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-lg font-mono h-12"
          placeholder="Type a password to test..."
          autoComplete="off"
        />
      </div>

      {result && (
        <Card className={`border-2 ${result.passed ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              {result.passed ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <span className="text-lg font-medium text-green-600 dark:text-green-400">Password meets all policy requirements</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="text-lg font-medium text-red-600 dark:text-red-400">Password does not meet policy requirements</span>
                </>
              )}
            </div>
            
            {!result.passed && result.errors.length > 0 && (
              <ul className="space-y-1 mt-2">
                {result.errors.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-destructive">
                    <span className="mt-1">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <div className="pt-4 space-y-6 border-t">
        <h3 className="text-lg font-medium">Policy Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Minimum Length</Label>
                <span className="font-mono text-sm">{policy.minLength}</span>
              </div>
              <Slider
                value={[policy.minLength]}
                min={1}
                max={64}
                step={1}
                onValueChange={(vals: number | readonly number[]) => handlePolicyChange('minLength', Array.isArray(vals) ? vals[0] : vals)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Max Repeated Characters</Label>
                <span className="font-mono text-sm">{policy.maxRepeatedChars === 0 ? 'None' : policy.maxRepeatedChars}</span>
              </div>
              <Slider
                value={[policy.maxRepeatedChars]}
                min={0}
                max={5}
                step={1}
                onValueChange={(vals: number | readonly number[]) => handlePolicyChange('maxRepeatedChars', Array.isArray(vals) ? vals[0] : vals)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="pol-upper" className="cursor-pointer">Require Uppercase</Label>
              <Switch 
                id="pol-upper" 
                checked={policy.requireUppercase} 
                onCheckedChange={(c) => handlePolicyChange('requireUppercase', c)} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pol-lower" className="cursor-pointer">Require Lowercase</Label>
              <Switch 
                id="pol-lower" 
                checked={policy.requireLowercase} 
                onCheckedChange={(c) => handlePolicyChange('requireLowercase', c)} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pol-num" className="cursor-pointer">Require Numbers</Label>
              <Switch 
                id="pol-num" 
                checked={policy.requireNumbers} 
                onCheckedChange={(c) => handlePolicyChange('requireNumbers', c)} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pol-sym" className="cursor-pointer">Require Symbols</Label>
              <Switch 
                id="pol-sym" 
                checked={policy.requireSymbols} 
                onCheckedChange={(c) => handlePolicyChange('requireSymbols', c)} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
