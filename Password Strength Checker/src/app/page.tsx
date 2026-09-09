import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordChecker } from "@/components/PasswordChecker";
import { PasswordGenerator } from "@/components/PasswordGenerator";
import { PassphraseGenerator } from "@/components/PassphraseGenerator";
import { PolicyChecker } from "@/components/PolicyChecker";
import { BreachChecker } from "@/components/BreachChecker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Shield, Lock, KeyRound, Type, FileCheck, Search, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-8">
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">VaultGuard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
            <Lock className="w-4 h-4" />
            100% Local Processing
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="w-full max-w-5xl flex-1 flex flex-col">
        <Tabs defaultValue="checker" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1 bg-muted/50 rounded-xl mb-8 gap-1">
            <TabsTrigger value="checker" className="py-2.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 mr-2 hidden sm:block" /> Checker
            </TabsTrigger>
            <TabsTrigger value="generator" className="py-2.5 rounded-lg">
              <KeyRound className="w-4 h-4 mr-2 hidden sm:block" /> Generator
            </TabsTrigger>
            <TabsTrigger value="passphrase" className="py-2.5 rounded-lg">
              <Type className="w-4 h-4 mr-2 hidden sm:block" /> Passphrase
            </TabsTrigger>
            <TabsTrigger value="policy" className="py-2.5 rounded-lg">
              <FileCheck className="w-4 h-4 mr-2 hidden sm:block" /> Policy
            </TabsTrigger>
            <TabsTrigger value="breach" className="py-2.5 rounded-lg">
              <Search className="w-4 h-4 mr-2 hidden sm:block" /> Breach
            </TabsTrigger>
            <TabsTrigger value="privacy" className="py-2.5 rounded-lg">
              <Lock className="w-4 h-4 mr-2 hidden sm:block" /> Privacy
            </TabsTrigger>
          </TabsList>

          <div className="bg-card border shadow-sm rounded-xl p-4 sm:p-8 relative overflow-hidden min-h-[500px]">
            <TabsContent value="checker" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Password Strength Checker</h2>
                  <p className="text-muted-foreground">Test your password against advanced cracking algorithms without it ever leaving your device.</p>
                </div>
                <PasswordChecker />
              </div>
            </TabsContent>

            <TabsContent value="generator" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Secure Password Generator</h2>
                  <p className="text-muted-foreground">Generate cryptographically secure, random passwords directly in your browser.</p>
                </div>
                <PasswordGenerator />
              </div>
            </TabsContent>

            <TabsContent value="passphrase" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Diceware Passphrase</h2>
                  <p className="text-muted-foreground">Generate memorable yet mathematically strong passphrases using the EFF wordlist.</p>
                </div>
                <PassphraseGenerator />
              </div>
            </TabsContent>

            <TabsContent value="policy" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Policy Validator</h2>
                  <p className="text-muted-foreground">Define and validate against custom organizational password policies.</p>
                </div>
                <PolicyChecker />
              </div>
            </TabsContent>

            <TabsContent value="breach" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Breach Check</h2>
                  <p className="text-muted-foreground">Check if your password has been exposed using the privacy-preserving k-Anonymity model.</p>
                </div>
                <BreachChecker />
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="max-w-3xl mx-auto space-y-6 text-sm">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Privacy Center</h2>
                  <p className="text-muted-foreground">Your data is yours. Here is exactly how this application handles your passwords.</p>
                </div>
                
                <div className="grid gap-6">
                  <div className="p-5 border rounded-lg bg-muted/20">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Lock className="w-5 h-5 text-primary"/> 100% Local Processing</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Every single password you type into the checker or generator is processed entirely within your web browser using JavaScript. We do not have a server that receives your plaintext passwords. 
                    </p>
                  </div>

                  <div className="p-5 border rounded-lg bg-muted/20">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><ShieldCheck className="w-5 h-5 text-primary"/> Cryptographically Secure</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Our generators do not use standard predictable randomness (like <code>Math.random()</code>). They use the <strong>Web Crypto API</strong>, drawing randomness from your device&apos;s hardware RNG.
                    </p>
                  </div>

                  <div className="p-5 border rounded-lg bg-muted/20">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Search className="w-5 h-5 text-primary"/> Anonymous Breach Checking</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      When checking for breached passwords, we mathematically hash your password using SHA-1 locally. We then send <strong>only the first 5 characters</strong> of the hash over the network to Have I Been Pwned. The server returns thousands of potential matches, and your browser checks if the rest of your hash is among them. The API never knows which specific password you searched for.
                    </p>
                  </div>

                  <div className="p-5 border rounded-lg bg-muted/20">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><FileCheck className="w-5 h-5 text-primary"/> No Logs, No Storage</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We never store your passwords in your browser&apos;s local storage, cookies, or any database. If you refresh the page, all your entered data disappears instantly.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

          </div>
        </Tabs>
      </main>

      <footer className="w-full max-w-5xl mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
        <p>Built with Next.js, zxcvbn-ts, and Web Crypto API. Privacy First.</p>
      </footer>
    </div>
  );
}
