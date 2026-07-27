/* eslint-disable no-console */
/**
 * JSON Response Parser - Secondary Mechanism
 * Detects and parses stringified JSON responses from AI that should return proper JSON objects
 */

interface ParsedResponse {
  isParsed: boolean;
  data: any;
  originalWasStringified: boolean;
  error?: string;
}

/**
 * Detects if a response is stringified JSON that should be an object
 */
function isStringifiedJson(response: any): boolean {
  if (typeof response !== 'string') {
    return false;
  }

  // Check for common patterns that indicate stringified JSON
  const patterns = [
    /^"\{.*\}"$/, // Quoted JSON object
    /^\{\\"/, // Starts with {"
    /\\"\}$/, // Ends with "}
  ];

  return patterns.some((pattern) => pattern.test(response));
}

/**
 * Attempts to parse stringified JSON with multiple strategies
 */
function parseStringifiedJson(stringifiedJson: string): any {
  // Strategy 1: Direct JSON.parse
  try {
    return JSON.parse(stringifiedJson);
  } catch (error) {
    // Continue to next strategy
  }

  // Strategy 2: Remove outer quotes and parse
  try {
    const withoutOuterQuotes = stringifiedJson.replace(/^"(.*)"$/, '$1');
    return JSON.parse(withoutOuterQuotes);
  } catch (error) {
    // Continue to next strategy
  }

  // Strategy 3: Unescape and parse
  try {
    const unescaped = stringifiedJson.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    return JSON.parse(unescaped);
  } catch (error) {
    // Continue to next strategy
  }

  // Strategy 4: Remove quotes and unescape
  try {
    const cleaned = stringifiedJson
      .replace(/^"/, '') // Remove leading quote
      .replace(/"$/, '') // Remove trailing quote
      .replace(/\\"/g, '"') // Unescape quotes
      .replace(/\\\\/g, '\\'); // Unescape backslashes
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Failed to parse stringified JSON: ${error.message}`);
  }
}

/**
 * Main parser function - detects and handles stringified JSON responses
 */
export function parseAiResponse(response: any): ParsedResponse {
  try {
    // If it's already a proper object with expected structure, return as-is
    if (typeof response === 'object' && response !== null) {
      if (response.result || response.isEditApp) {
        return {
          isParsed: true,
          data: response,
          originalWasStringified: false,
        };
      }
    }

    // Check if it's a stringified JSON
    if (isStringifiedJson(response)) {
      const parsed = parseStringifiedJson(response);

      return {
        isParsed: true,
        data: parsed,
        originalWasStringified: true,
      };
    }

    // Check if response contains stringified JSON in a field
    if (typeof response === 'object' && response.result && typeof response.result === 'string') {
      if (isStringifiedJson(response.result)) {
        const parsed = parseStringifiedJson(response.result);

        return {
          isParsed: true,
          data: {
            ...response,
            result: parsed,
          },
          originalWasStringified: true,
        };
      }
    }

    // Return original response if no parsing needed
    return {
      isParsed: false,
      data: response,
      originalWasStringified: false,
    };
  } catch (error) {
    return {
      isParsed: false,
      data: response,
      originalWasStringified: false,
      error: error.message,
    };
  }
}

/**
 * Validates that a parsed response has the expected structure
 */
export function validateResponseStructure(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check for app modification format
  if (data.result && data.result.isEditApp) {
    return true;
  }

  // Check for other valid formats
  if (data.isEditApp || data.views || data.controllers) {
    return true;
  }

  return false;
}

/**
 * Complete parsing and validation pipeline
 */
export function processAiResponse(rawResponse: any) {
  const parsed = parseAiResponse(rawResponse);

  if (parsed.originalWasStringified) {
  }

  const isValid = validateResponseStructure(parsed.data);

  if (!isValid) {
  }

  return {
    ...parsed,
    isValidStructure: isValid,
  };
}

export default {
  parseAiResponse,
  validateResponseStructure,
  processAiResponse,
  isStringifiedJson,
};
