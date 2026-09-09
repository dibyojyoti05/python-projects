export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxRepeatedChars: number;
}

export interface PolicyResult {
  passed: boolean;
  errors: string[];
}

export const defaultPolicy: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  maxRepeatedChars: 2,
};

export const evaluatePolicy = (password: string, policy: PasswordPolicy): PolicyResult => {
  if (!password) {
    return { passed: false, errors: ['Password is empty'] };
  }

  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (policy.requireSymbols && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one symbol');
  }

  if (policy.maxRepeatedChars > 0) {
    const repeatRegex = new RegExp(`(.)\\1{${policy.maxRepeatedChars},}`, 'g');
    if (repeatRegex.test(password)) {
      errors.push(`Password cannot contain more than ${policy.maxRepeatedChars} identical consecutive characters`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
};
