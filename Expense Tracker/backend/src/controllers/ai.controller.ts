import { Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth.middleware';
import { format } from 'date-fns';

export const parseExpenseWithAI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: { code: 'INVALID_DATA', message: 'Text prompt is required' } });
      return;
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const apiKey = process.env.AI_API_KEY;

    // If a valid AI API key is configured, call Gemini API
    if (apiKey && apiKey !== 'your_ai_api_key_here' && apiKey.length > 10) {
      try {
        const prompt = `
        Extract expense or income details from this natural language text: "${text}".
        Return ONLY a valid JSON object without any markdown wrapping or backticks.
        Keys required:
        - "amount": number (positive, e.g. 250.50)
        - "type": "expense" or "income"
        - "category": string (e.g. Food & Dining, Groceries, Transport, Shopping, Utilities & Bills, Salary & Income, etc.)
        - "merchant": string (the place, vendor, store or source of income)
        - "date": string in YYYY-MM-DD format (today is ${todayStr} if not specified)
        - "paymentMethod": string (e.g. UPI, Cash, Credit Card, Debit Card, Net Banking)
        - "description": string (brief summary)
        `;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }]
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        let resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedData = JSON.parse(resultText);
        res.json(parsedData);
        return;
      } catch (geminiError) {
        console.warn('Gemini API call failed, using intelligent heuristic NLP fallback:', geminiError);
        // Fall back to heuristic rule-based extractor below
      }
    }

    // Intelligent heuristic NLP parser for common banking SMS / natural phrases
    // Example: "Spent 500 on Food at McDonalds today via UPI"
    // Example: "Debited INR 1250.00 at Uber via Credit Card"
    const amountMatch = text.match(/(?:spent|debited|paid|rs\.?|inr|₹|\$)\s*([\d,]+(?:\.\d{1,2})?)/i) 
      || text.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:rs|inr|rupees|spent|paid)/i)
      || text.match(/\b\d+(\.\d{1,2})?\b/);

    const rawAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 100;

    // Detect payment method
    let paymentMethod = 'UPI';
    if (/cash/i.test(text)) paymentMethod = 'Cash';
    else if (/credit\s*card/i.test(text)) paymentMethod = 'Credit Card';
    else if (/debit\s*card/i.test(text)) paymentMethod = 'Debit Card';
    else if (/net\s*banking/i.test(text)) paymentMethod = 'Net Banking';
    else if (/upi|gpay|phonepe|paytm/i.test(text)) paymentMethod = 'UPI';

    // Detect merchant
    let merchant = 'Store';
    const atMatch = text.match(/(?:at|to|for|from)\s+([A-Za-z0-9\s&'-]+?)(?:\s+(?:via|on|today|yesterday|using)|\.|$)/i);
    if (atMatch && atMatch[1].trim().length > 1) {
      merchant = atMatch[1].trim().replace(/(?:food|transport|groceries|shopping)/i, '').trim() || atMatch[1].trim();
    }

    // Detect category
    let category = 'Food & Dining';
    const lower = text.toLowerCase();
    if (/grocery|groceries|supermarket|vegetables|milk|fruits/i.test(lower)) category = 'Groceries';
    else if (/uber|ola|cab|auto|fuel|petrol|diesel|metro|train|flight|bus/i.test(lower)) category = 'Transport';
    else if (/electricity|water|wifi|broadband|recharge|bill|rent/i.test(lower)) category = 'Utilities & Bills';
    else if (/amazon|flipkart|clothes|shoes|myntra|zara|shopping/i.test(lower)) category = 'Shopping';
    else if (/doctor|medicine|pharmacy|hospital|clinic/i.test(lower)) category = 'Healthcare';
    else if (/netflix|movie|cinema|game|spotify|entertainment/i.test(lower)) category = 'Entertainment';
    else if (/salary|credited|dividend|bonus|interest/i.test(lower)) category = 'Salary & Income';

    const type = /credited|received|salary|income/i.test(lower) ? 'income' : 'expense';

    res.json({
      amount: rawAmount,
      type,
      category,
      merchant,
      date: todayStr,
      paymentMethod,
      description: text.trim()
    });
  } catch (error: any) {
    console.error('AI parse error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to extract expense details' } });
  }
};
