import wordlist from './wordlist.json';

export interface PassphraseGeneratorOptions {
  numWords: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
}

export const generatePassphrase = (options: PassphraseGeneratorOptions): string => {
  const words: string[] = [];
  
  for (let i = 0; i < options.numWords; i++) {
    let word = getRandomWord();
    if (options.capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    words.push(word);
  }

  if (options.includeNumber) {
    // Add a random number (0-9) to one of the words or as an extra segment
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const num = array[0] % 10;
    
    crypto.getRandomValues(array);
    const position = array[0] % (words.length + 1);
    
    if (position === words.length) {
      words.push(num.toString());
    } else {
      words[position] += num.toString();
    }
  }

  return words.join(options.separator);
};

const getRandomWord = (): string => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  
  // Rejection sampling for uniform distribution
  const maxValid = Math.floor(4294967295 / wordlist.length) * wordlist.length;
  let rand = array[0];
  while (rand >= maxValid) {
    crypto.getRandomValues(array);
    rand = array[0];
  }
  
  return wordlist[rand % wordlist.length];
};
