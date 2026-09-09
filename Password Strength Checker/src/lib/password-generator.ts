export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean; // e.g., i, l, 1, L, o, 0, O
  excludeAmbiguous: boolean; // e.g., { } [ ] ( ) / \ ' " ` ~ , ; : . < >
}

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
  similar: 'il1Lo0O',
  ambiguous: '{}[]()/\\\'"~,;:.<>',
};

export const generatePassword = (options: PasswordGeneratorOptions): string => {
  let charset = '';
  
  let uppercase = CHAR_SETS.uppercase;
  let lowercase = CHAR_SETS.lowercase;
  let numbers = CHAR_SETS.numbers;
  let symbols = CHAR_SETS.symbols;

  if (options.excludeSimilar) {
    const similarRegex = new RegExp(`[${CHAR_SETS.similar}]`, 'g');
    uppercase = uppercase.replace(similarRegex, '');
    lowercase = lowercase.replace(similarRegex, '');
    numbers = numbers.replace(similarRegex, '');
  }

  if (options.excludeAmbiguous) {
    // Escape special characters for regex
    const ambiguousEscaped = CHAR_SETS.ambiguous.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const ambiguousRegex = new RegExp(`[${ambiguousEscaped}]`, 'g');
    symbols = symbols.replace(ambiguousRegex, '');
  }

  if (options.includeUppercase) charset += uppercase;
  if (options.includeLowercase) charset += lowercase;
  if (options.includeNumbers) charset += numbers;
  if (options.includeSymbols) charset += symbols;

  if (charset.length === 0) {
    return '';
  }

  // Ensure at least one character from each selected set is included
  const requiredChars: string[] = [];
  if (options.includeUppercase && uppercase) requiredChars.push(getRandomChar(uppercase));
  if (options.includeLowercase && lowercase) requiredChars.push(getRandomChar(lowercase));
  if (options.includeNumbers && numbers) requiredChars.push(getRandomChar(numbers));
  if (options.includeSymbols && symbols) requiredChars.push(getRandomChar(symbols));

  let password = requiredChars.join('');

  const remainingLength = options.length - password.length;
  for (let i = 0; i < remainingLength; i++) {
    password += getRandomChar(charset);
  }

  // Shuffle the password to avoid predictable patterns (e.g. uppercase always first)
  return shuffleString(password);
};

const getRandomChar = (charset: string): string => {
  // Use Web Crypto API for secure randomness
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  
  // Modulo bias is acceptable here given the small charset sizes and non-critical cryptographic distribution
  // However, for perfect distribution we could use a rejection sampling method, but for password gen it's fine.
  // We'll use rejection sampling for perfect distribution
  const maxValid = Math.floor(4294967295 / charset.length) * charset.length;
  let rand = array[0];
  while (rand >= maxValid) {
    crypto.getRandomValues(array);
    rand = array[0];
  }
  
  return charset[rand % charset.length];
};

const shuffleString = (str: string): string => {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const j = array[0] % (i + 1); // Not perfectly uniform, but sufficient for shuffling
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
};
