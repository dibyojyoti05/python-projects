import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, Check, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AI() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: (expensePayload: any) => api.post('/expenses', expensePayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/expenses');
      }, 1200);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to save expense');
    }
  });

  const handleParse = async (inputText?: string) => {
    const promptText = inputText || text;
    if (!promptText.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setSaveSuccess(false);

    try {
      const res = await api.post('/ai/parse-expense', { text: promptText });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to parse AI expense');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = () => {
    if (!result) return;

    // Match parsed category name with user's categories
    let matchedCategoryId = null;
    if (categories && result.category) {
      const found = categories.find(
        (c: any) => c.name.toLowerCase().includes(result.category.toLowerCase()) ||
                    result.category.toLowerCase().includes(c.name.toLowerCase())
      );
      if (found) matchedCategoryId = found.id || found._id;
      else if (categories.length > 0) matchedCategoryId = categories[0].id || categories[0]._id;
    }

    const payload = {
      amount: Number(result.amount),
      merchant: result.merchant || 'Store',
      categoryId: matchedCategoryId,
      date: result.date || new Date().toISOString(),
      paymentMethod: result.paymentMethod || 'UPI',
      type: result.type || 'expense',
      description: result.description || text,
      notes: 'Logged via AI Assistant'
    };

    saveMutation.mutate(payload);
  };

  const samplePrompts = [
    'Spent 450 on Coffee at Starbucks today via UPI',
    'Paid 1850 for Groceries at Nature Basket via Credit Card',
    'Debited 350 for Uber ride using UPI',
    'Received 75000 Salary from TechCorp via Net Banking'
  ];

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
          <Sparkles className="h-7 w-7 text-primary" />
          <span>AI Expense Assistant</span>
        </h1>
        <p className="text-muted-foreground">
          Extract transaction details instantly from SMS alerts, receipts, or plain English sentences.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Natural Language Expense Parser</CardTitle>
          <CardDescription>
            Paste your bank SMS alert or type what you spent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full min-h-[110px] p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow"
            placeholder="e.g. Paid 850 at Pizza Hut for dinner with friends via UPI..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* Preset Prompts */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Test Prompts:
            </span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setText(sample);
                    handleParse(sample);
                  }}
                  className="text-xs px-2.5 py-1 rounded-md border bg-muted/40 hover:bg-accent text-left transition-colors"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => handleParse()}
              disabled={loading || !text.trim()}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>{loading ? 'Analyzing Text...' : 'Parse Transaction'}</span>
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Result Card */}
          {result && (
            <div className="mt-6 p-5 rounded-xl border bg-card text-card-foreground shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Extracted Details
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                    result.type === 'expense' ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'
                  }`}
                >
                  {result.type || 'expense'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block">Amount</span>
                  <span className="text-xl font-bold">₹{Number(result.amount).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Merchant / Payee</span>
                  <span className="text-sm font-semibold">{result.merchant}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Detected Category</span>
                  <span className="text-sm font-semibold">{result.category || 'General'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Payment Method</span>
                  <span className="text-sm font-semibold">{result.paymentMethod || 'UPI'}</span>
                </div>
              </div>

              {saveSuccess ? (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Transaction saved successfully! Redirecting to expenses...</span>
                </div>
              ) : (
                <div className="pt-2 flex items-center gap-3">
                  <Button
                    onClick={handleSaveExpense}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    <span>{saveMutation.isPending ? 'Saving...' : 'Save as Transaction'}</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
