"use client";

import { useState } from "react";
import { checkPasswordBreach, BreachResult } from "@/lib/breach-checker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck, Loader2, Info } from "lucide-react";
// Removed unused Tooltip imports

export function BreachChecker() {
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<BreachResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!password) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await checkPasswordBreach(password);
      setResult(res);
    } catch {
      setError("Failed to check breach status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPassword("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Privacy Guarantee</p>
            <p className="text-muted-foreground">
              Your password is <strong>never</strong> sent to any server. It is mathematically hashed in your browser, 
              and only the first 5 characters of the hash are sent to the <em>Have I Been Pwned</em> database (k-Anonymity model).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="breach-password">Password to Check</Label>
          <div className="flex gap-2">
            <Input
              id="breach-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setResult(null);
                setError(null);
              }}
              className="text-lg font-mono h-12"
              placeholder="Type your password..."
              autoComplete="off"
            />
            <Button onClick={handleCheck} disabled={!password || loading} className="h-12 px-6">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Check
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-2 mt-4">
            {result.breached ? (
              <Card className="border-red-500/50 bg-red-500/10">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6" /> Oh no — pwned!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    This password has been seen <strong>{result.count.toLocaleString()}</strong> times in data breaches. 
                    You should never use this password for any account.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={handleClear}>Clear and Try Another</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-green-500/50 bg-green-500/10">
                <CardHeader>
                  <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6" /> Good news — no pwnage found!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    This password was not found in any known data breaches. 
                    Remember, &quot;not found&quot; doesn&apos;t mean it&apos;s impossible to guess, just that it hasn&apos;t been leaked publicly yet.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={handleClear}>Clear and Try Another</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
