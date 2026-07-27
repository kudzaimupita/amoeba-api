/* eslint-disable default-case */
/* eslint-disable prettier/prettier */
/**
 * Detection system for Claude response types
 * Analyzes JSON structure to determine the operation type
 */

// Operation type constants
const OP_TYPES = {
  VIEW_STYLES_UPDATE: 'VIEW_STYLES_UPDATE',
  LAYOUT_UPDATE: 'LAYOUT_UPDATE',
  NEW_APP_GENERATION: 'NEW_APP_GENERATION',
  NEW_VIEW_GENERATION: 'NEW_VIEW_GENERATION',
  NEW_ELEMENT_GENERATION: 'NEW_ELEMENT_GENERATION',
  ELEMENT_UPDATE: 'ELEMENT_UPDATE',
  MULTI_ELEMENT_GENERATION: 'MULTI_ELEMENT_GENERATION',
  GROUP_UPDATE: 'GROUP_UPDATE',
};

/**
 * Extract JSON from Claude's text response
 * @param {string} text - Raw text from Claude
 * @returns {Object|null} Parsed JSON or null if not found
 */
export function extractJsonFromText(text) {
  try {
    // Try multiple patterns to extract JSON

    // Pattern 1: JSON in code blocks
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const codeBlockMatch = text.match(codeBlockRegex);

    if (codeBlockMatch && codeBlockMatch[1]) {
      return JSON.parse(codeBlockMatch[1].trim());
    }

    // Pattern 2: Find JSON object in text (looks for curly braces)
    const jsonObjectRegex = /(\{[\s\S]*\})/;
    const jsonMatch = text.match(jsonObjectRegex);

    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Pattern 3: Try parsing the entire text as JSON
    return JSON.parse(text.trim());
  } catch (error) {
    return null;
  }
}

/**
 * Determine operation type based on response structure
 * @param {Object} jsonData - The parsed JSON object
 * @returns {string|null} The operation type or null if unknown
 */
export function determineOperationType(jsonData) {
  if (!jsonData) return null;

  // Check for view styles update
  if (jsonData.view && jsonData.view.styles && !jsonData.view.elements) {
    return OP_TYPES.VIEW_STYLES_UPDATE;
  }

  // Check for new element generation
  if (jsonData.elements && Array.isArray(jsonData.elements)) {
    // If all elements have parent-child relationships and there are multiple elements,
    // it might be a multi-element generation
    if (jsonData.elements.length > 1 && jsonData.elements.some((el) => el.parent || el.isGroup)) {
      return OP_TYPES.MULTI_ELEMENT_GENERATION;
    }
    return OP_TYPES.NEW_ELEMENT_GENERATION;
  }

  // Check for element update
  if (jsonData.element && (jsonData.element.changes || jsonData.element.i)) {
    return OP_TYPES.ELEMENT_UPDATE;
  }

  // Check for new view generation
  if (jsonData.view && jsonData.view.elements) {
    return OP_TYPES.NEW_VIEW_GENERATION;
  }

  // Check for app generation
  if (jsonData.app && (jsonData.app.views || jsonData.app.name)) {
    return OP_TYPES.NEW_APP_GENERATION;
  }

  // Check for layout updates
  if (jsonData.layout && (jsonData.layout.elements || jsonData.layout.type)) {
    return OP_TYPES.LAYOUT_UPDATE;
  }

  // Check for group updates
  if (jsonData.group && jsonData.group.elements) {
    return OP_TYPES.GROUP_UPDATE;
  }

  // Try checking with less structure-dependent methods
  if (Object.keys(jsonData).length === 1) {
    const key = Object.keys(jsonData)[0];

    switch (key) {
      case 'view':
        return 'view' in jsonData.view ? OP_TYPES.NEW_VIEW_GENERATION : OP_TYPES.VIEW_STYLES_UPDATE;
      case 'app':
        return OP_TYPES.NEW_APP_GENERATION;
      case 'elements':
        return OP_TYPES.NEW_ELEMENT_GENERATION;
      case 'element':
        return OP_TYPES.ELEMENT_UPDATE;
      case 'layout':
        return OP_TYPES.LAYOUT_UPDATE;
      case 'group':
        return OP_TYPES.GROUP_UPDATE;
    }
  }

  return null;
}

/**
 * Process Claude's response to determine operation type and extract data
 * @param {string} claudeResponse - The raw text response from Claude
 * @returns {Object} Operation type and extracted data
 */
export function processClaudeResponse(claudeResponse) {
  // Extract JSON data from the response
  const extractedJson = extractJsonFromText(claudeResponse);

  if (!extractedJson) {
    return {
      operationType: null,
      data: null,
      error: 'Failed to extract JSON from response',
    };
  }

  // Determine operation type based on the structure
  const operationType = determineOperationType(extractedJson);

  return {
    operationType,
    data: extractedJson,
    error: !operationType ? 'Could not determine operation type' : null,
  };
}

/**
 * Creates a properly formatted response with operation type
 * @param {string} operationType - The detected operation type
 * @param {Object} data - The extracted data
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Formatted response object
 */
export function createTypedResponse(operationType, data, metadata = {}) {
  return {
    operationType,
    timestamp: new Date().toISOString(),
    data,
    metadata,
  };
}
