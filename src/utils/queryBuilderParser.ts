import { ObjectId } from 'mongodb';

export interface QueryBuilderFilter {
  field: string;
  operator: string;
  value: any;
}

export interface ParsedFilters {
  mongoFilter: any;
  combinator: 'and' | 'or';
  filters: QueryBuilderFilter[];
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Process and convert value based on type
 */
function processValue(value: any, field: string): any {
  if (value === null || value === undefined) {
    return value;
  }

  // Convert string to appropriate type
  if (typeof value === 'string') {
    // Check for ObjectId fields
    if (field === '_id' || field === 'id' || field.endsWith('_id')) {
      try {
        return new ObjectId(value);
      } catch {
        return value; // Return as string if not valid ObjectId
      }
    }

    // Check for numeric values
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Check for boolean values
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Check for dates (ISO format)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
  }

  return value;
}

/**
 * Build MongoDB condition for a single field
 */
function buildFieldCondition(field: string, operator: string, value: any): any {
  // Handle different value types
  const processedValue = processValue(value, field);

  switch (operator) {
    case '=':
    case 'equals':
      return { [field]: processedValue };

    case '!=':
    case 'notEquals':
      return { [field]: { $ne: processedValue } };

    case '>':
    case 'greaterThan':
      return { [field]: { $gt: processedValue } };

    case '>=':
    case 'greaterThanOrEqual':
      return { [field]: { $gte: processedValue } };

    case '<':
    case 'lessThan':
      return { [field]: { $lt: processedValue } };

    case '<=':
    case 'lessThanOrEqual':
      return { [field]: { $lte: processedValue } };

    case 'contains':
    case 'like':
      return { [field]: { $regex: processedValue, $options: 'i' } };

    case 'notContains':
    case 'notLike':
      return { [field]: { $not: { $regex: processedValue, $options: 'i' } } };

    case 'startsWith':
      return { [field]: { $regex: `^${escapeRegex(processedValue)}`, $options: 'i' } };

    case 'endsWith':
      return { [field]: { $regex: `${escapeRegex(processedValue)}$`, $options: 'i' } };

    case 'in': {
      const inValues = Array.isArray(processedValue) ? processedValue : [processedValue];
      return { [field]: { $in: inValues.map((v) => processValue(v, field)) } };
    }
    case 'notIn': {
      const notInValues = Array.isArray(processedValue) ? processedValue : [processedValue];
      return { [field]: { $nin: notInValues.map((v) => processValue(v, field)) } };
    }

    case 'between':
      if (Array.isArray(processedValue) && processedValue.length === 2) {
        return { [field]: { $gte: processValue(processedValue[0], field), $lte: processValue(processedValue[1], field) } };
      }
      return { [field]: processedValue };

    case 'null':
    case 'isEmpty':
      return { [field]: { $in: [null, undefined, ''] } };

    case 'notNull':
    case 'isNotEmpty':
      return { [field]: { $nin: [null, undefined, ''] } };

    case 'exists':
      return { [field]: { $exists: true } };

    case 'notExists':
      return { [field]: { $exists: false } };

    default:
      // eslint-disable-next-line no-console
      return { [field]: processedValue };
  }
}

/**
 * Convert React Query Builder filters to MongoDB query format
 */
function buildMongoFilter(filters: QueryBuilderFilter[], combinator: 'and' | 'or'): any {
  if (filters.length === 0) return {};

  const mongoConditions = filters.map((filter) => {
    const { field, operator, value } = filter;
    return buildFieldCondition(field, operator, value);
  });

  if (mongoConditions.length === 1) {
    return mongoConditions[0];
  }

  // Multiple conditions
  if (combinator === 'or') {
    return { $or: mongoConditions };
  }
  return { $and: mongoConditions };
}

/**
 * Parse React Query Builder filters from URL query parameters
 * Supports: filter_0_field, filter_0_operator, filter_0_value, filter_combinator
 */
export function parseQueryBuilderFilters(query: any): ParsedFilters {
  const filters: QueryBuilderFilter[] = [];
  const combinator = (query.filter_combinator || 'and') as 'and' | 'or';

  // Extract filter parameters
  Object.keys(query).forEach((key) => {
    const filterMatch = key.match(/^filter_(\d+)_(field|operator|value)$/);
    if (filterMatch) {
      const [, index, type] = filterMatch;
      const filterIndex = parseInt(index, 10);

      // Ensure filter exists at this index
      if (!filters[filterIndex]) {
        filters[filterIndex] = { field: '', operator: '', value: '' };
      }

      filters[filterIndex][type as keyof QueryBuilderFilter] = query[key];
    }
  });

  // Filter out incomplete filters
  const validFilters = filters.filter((f) => f.field && f.operator && f.value !== undefined);

  // Convert to MongoDB filter
  const mongoFilter = buildMongoFilter(validFilters, combinator);

  return {
    mongoFilter,
    combinator,
    filters: validFilters,
  };
}

/**
 * Debug function to log parsed filters
 */
export function logParsedFilters(parsed: ParsedFilters): void {
  /* eslint-disable no-console */
  parsed.filters.forEach((filter, i) => {});
  /* eslint-enable no-console */
}
