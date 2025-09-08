// src/utils/paymasterValidation.ts
import { ValidationWarning } from '../types/attestation';

// Valid paymaster categories
const VALID_PAYMASTER_CATEGORIES = [
  'verifying',
  'token', 
  'verifying_and_token'
];

// Calculate Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
};

// Get smart paymaster category suggestions based on user input
export const getSmartPaymasterSuggestions = (value: string): string[] => {
  if (!value) return [];
  
  const normalizedValue = value.toLowerCase().trim();
  const suggestions: { category: string; score: number }[] = [];
  
  VALID_PAYMASTER_CATEGORIES.forEach(category => {
    let score = 0;
    
    // Exact match (highest priority)
    if (category === normalizedValue) {
      score = 100;
    }
    // Contains match
    else if (category.includes(normalizedValue) || normalizedValue.includes(category)) {
      const lengthRatio = Math.min(category.length, normalizedValue.length) / 
                         Math.max(category.length, normalizedValue.length);
      if (lengthRatio > 0.4) {
        score = 80 + (lengthRatio * 15);
      }
    }
    // Levenshtein distance for close typos
    else {
      const distance = levenshteinDistance(normalizedValue, category);
      const maxLength = Math.max(normalizedValue.length, category.length);
      const similarity = 1 - (distance / maxLength);
      
      if (similarity > 0.6) { // 60% similarity threshold
        score = similarity * 75;
      }
    }
    
    if (score > 50) { // Only include good matches
      suggestions.push({ category, score });
    }
  });
  
  // Sort by score and return top 3 suggestions
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.category);
};

// Check if a paymaster category value might be a common alias or misspelling
const getPaymasterAliases = (): { [key: string]: string } => {
  return {
    // Common aliases and misspellings
    'verify': 'verifying',
    'verification': 'verifying',
    'verifier': 'verifying',
    'tokens': 'token',
    'token_paymaster': 'token',
    'verifying_token': 'verifying_and_token',
    'token_and_verifying': 'verifying_and_token',
    'both': 'verifying_and_token',
    'hybrid': 'verifying_and_token'
  };
};

// Convert common aliases to proper paymaster category IDs
export const convertPaymasterAlias = (value: string): string => {
  if (!value) return value;
  
  const normalizedValue = value.toLowerCase().trim();
  const aliases = getPaymasterAliases();
  
  // Check direct aliases first
  if (aliases[normalizedValue]) {
    return aliases[normalizedValue];
  }
  
  // If it's already a valid paymaster category ID, return it
  if (VALID_PAYMASTER_CATEGORIES.includes(value)) {
    return value;
  }
  
  return value; // Return original if no conversion found
};

// Validate paymaster category field and provide suggestions
export const validatePaymasterField = async (field: string, value: string): Promise<ValidationWarning[]> => {
  if (!value || field !== 'paymaster_category') return [];

  const warnings: ValidationWarning[] = [];
  
  // Check if it's a valid paymaster category ID
  if (!VALID_PAYMASTER_CATEGORIES.includes(value)) {
    // Try to convert common aliases
    const convertedValue = convertPaymasterAlias(value);
    
    if (convertedValue !== value && VALID_PAYMASTER_CATEGORIES.includes(convertedValue)) {
      // Suggest the converted value
      warnings.push({
        message: `"${value}" might be "${convertedValue}". Click to apply the suggestion.`,
        suggestions: [convertedValue],
        isConversion: true
      });
    } else {
      // Get smart suggestions for invalid paymaster categories
      const smartSuggestions = getSmartPaymasterSuggestions(value);
      
      if (smartSuggestions.length > 0) {
        warnings.push({
          message: `Invalid paymaster category: "${value}". Did you mean one of these?`,
          suggestions: smartSuggestions
        });
      } else {
        warnings.push({
          message: `Invalid paymaster category: "${value}". Please select from the available categories.`,
          suggestions: ['verifying'] // Fallback to 'verifying' category
        });
      }
    }
  }
  
  return warnings;
};

// Get paymaster category display info for UI
export const getPaymasterDisplayInfo = (categoryId: string): { name: string; description?: string } | null => {
  const displayMap: { [key: string]: { name: string; description: string } } = {
    'verifying': {
      name: 'Verifying',
      description: 'Paymaster that only verifies transactions'
    },
    'token': {
      name: 'Token',
      description: 'Paymaster that accepts tokens as payment'
    },
    'verifying_and_token': {
      name: 'Verifying and Token',
      description: 'Paymaster that both verifies transactions and accepts tokens'
    }
  };
  
  return displayMap[categoryId] || null;
};
