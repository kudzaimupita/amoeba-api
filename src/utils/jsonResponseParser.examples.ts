/* eslint-disable no-console */
import { processAiResponse } from './jsonResponseParser';

// Test the JSON response parser with examples of what AI returns vs what's needed

// Example 1: Stringified JSON (what AI incorrectly returns)
const stringifiedResponse = '{"result":{"isEditApp":true,"views":[{"name":"Movie Listing","id":"movie-listing"}]}}';

// Example 2: Quoted stringified JSON (another AI error pattern)
const quotedStringifiedResponse = '{"result":{"isEditApp":true,"views":[{"name":"Movie Listing"}]}}';

// Example 3: Proper JSON object (what we want)
const properResponse = {
  result: {
    isEditApp: true,
    views: [{ name: 'Movie Listing', id: 'movie-listing' }],
  },
  description: 'Added movie listing view',
};

// Test function
export function testJsonParser() {
  // Test 1: Stringified JSON
  const result1 = processAiResponse(stringifiedResponse);

  // Test 2: Quoted stringified JSON
  const result2 = processAiResponse(quotedStringifiedResponse);

  // Test 3: Proper JSON (should pass through unchanged)
  const result3 = processAiResponse(properResponse);
}

// Usage example for developers
export function exampleUsage() {
}

export default {
  testJsonParser,
  exampleUsage,
};
