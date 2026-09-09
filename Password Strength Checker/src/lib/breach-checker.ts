export interface BreachResult {
  breached: boolean;
  count: number;
}

export const checkPasswordBreach = async (password: string): Promise<BreachResult> => {
  if (!password) {
    return { breached: false, count: 0 };
  }

  // 1. Hash the password with SHA-1
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  
  // 2. Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  // 3. Split into prefix (first 5 chars) and suffix (rest)
  const prefix = hashHex.substring(0, 5);
  const suffix = hashHex.substring(5);
  
  // 4. Query Have I Been Pwned API with the prefix (k-Anonymity model)
  // This ensures the full hash or password is NEVER sent over the network
  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) {
      throw new Error('Failed to check breach status');
    }
    const resultText = await response.text();
    
    // 5. Check if our suffix is in the returned list
    const lines = resultText.split('\n');
    for (const line of lines) {
      const [returnedSuffix, count] = line.split(':');
      if (returnedSuffix.trim() === suffix) {
        return {
          breached: true,
          count: parseInt(count.trim(), 10),
        };
      }
    }
    
    return { breached: false, count: 0 };
  } catch (error) {
    console.error("Error checking HIBP API", error);
    throw error;
  }
};
