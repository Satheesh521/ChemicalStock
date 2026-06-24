/**
 * 🛡️ SAFE Stock Calculation Utilities
 * 
 * Features:
 * - Avoids JavaScript floating point errors using integer arithmetic
 * - Null/undefined guards at every function
 * - Type validation for all inputs
 * - Precise to 4 decimal places
 * 
 * ⚠️ Every function is defensive against:
 *    - null / undefined inputs
 *    - NaN values
 *    - Non-numeric strings
 *    - Infinite values
 */

// ============================================
// SAFE: Convert value to number
// ============================================
function toNumber(value, defaultValue = 0) {
  try {
    // Short-circuit: falsy values
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }

    // For strings, parse them
    if (typeof value === 'string') {
      const num = parseFloat(value);
      // Check for NaN
      if (isNaN(num) || !isFinite(num)) {
        console.warn('⚠️ Invalid number string:', value);
        return defaultValue;
      }
      return num;
    }

    // For numbers, validate
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        console.warn('⚠️ Invalid number:', value);
        return defaultValue;
      }
      return value;
    }

    // Unknown type
    console.warn('⚠️ Unexpected type for number:', typeof value, value);
    return defaultValue;

  } catch (err) {
    console.error('❌ Error converting to number:', err);
    return defaultValue;
  }
}

// ============================================
// SAFE: Precise Subtraction
// ============================================
export function preciseSubtract(base, ...values) {
  try {
    const PRECISION = 10000; // 4 decimal places max

    let base_num = toNumber(base, 0);
    let result = Math.round(base_num * PRECISION);

    for (const val of values) {
      const num = toNumber(val, 0);
      result -= Math.round(num * PRECISION);
    }

    return result / PRECISION;

  } catch (err) {
    console.error('❌ preciseSubtract error:', err);
    return 0;
  }
}

// ============================================
// SAFE: Precise Addition
// ============================================
export function preciseAdd(base, ...values) {
  try {
    const PRECISION = 10000;

    let base_num = toNumber(base, 0);
    let result = Math.round(base_num * PRECISION);

    for (const val of values) {
      const num = toNumber(val, 0);
      result += Math.round(num * PRECISION);
    }

    return result / PRECISION;

  } catch (err) {
    console.error('❌ preciseAdd error:', err);
    return 0;
  }
}

// ============================================
// SAFE: Precise Multiplication
// ============================================
export function preciseMultiply(a, b) {
  try {
    const PRECISION = 10000;

    const a_num = toNumber(a, 0);
    const b_num = toNumber(b, 0);

    const result = (Math.round(a_num * PRECISION) * Math.round(b_num * PRECISION)) / (PRECISION * PRECISION);

    if (!isFinite(result)) {
      throw new Error('Result is not finite');
    }

    return result;

  } catch (err) {
    console.error('❌ preciseMultiply error:', err);
    return 0;
  }
}

// ============================================
// SAFE: Precise Division
// ============================================
export function preciseDivide(a, b) {
  try {
    const PRECISION = 10000;

    const a_num = toNumber(a, 0);
    const b_num = toNumber(b, 0);

    // CRITICAL: Guard against division by zero
    if (b_num === 0) {
      console.warn('⚠️ Division by zero prevented');
      return 0;
    }

    const result = (Math.round(a_num * PRECISION) / Math.round(b_num * PRECISION));

    if (!isFinite(result)) {
      throw new Error('Result is not finite');
    }

    return result;

  } catch (err) {
    console.error('❌ preciseDivide error:', err);
    return 0;
  }
}

// ============================================
// SAFE: Format Stock Value for Display
// ============================================
export function formatStock(value) {
  try {
    // STEP 1: Convert to valid number
    const num = toNumber(value, 0);

    // STEP 2: If zero, return early
    if (num === 0) {
      return '0';
    }

    // STEP 3: Round to 4 decimal places
    const rounded = Math.round(num * 10000) / 10000;

    // STEP 4: Convert to string
    let result = rounded.toString();

    // STEP 5: Remove trailing zeros
    if (result.includes('.')) {
      result = result.replace(/\.?0+$/, '');

      // STEP 6: Preserve decimal point if original had decimals
      if (!result.includes('.') && num.toString().includes('.')) {
        result = result + '.0';
      }
    }

    return result;

  } catch (err) {
    console.error('❌ formatStock error:', err);
    return '0';
  }
}

// ============================================
// SAFE: Format Stock with Unit
// ============================================
export function formatStockWithUnit(value, unit = 'kg') {
  try {
    // Validate unit
    const validUnit = (typeof unit === 'string' && unit.trim()) ? unit.trim() : 'kg';

    return `${formatStock(value)} ${validUnit}`;

  } catch (err) {
    console.error('❌ formatStockWithUnit error:', err);
    return `0 ${unit || 'kg'}`;
  }
}

// ============================================
// SAFE: Parse Stock Value from API
// ============================================
export function parseStockValue(value) {
  try {
    // Direct number
    if (typeof value === 'number') {
      const num = toNumber(value, 0);
      return num;
    }

    // String number
    if (typeof value === 'string') {
      const num = toNumber(value, 0);
      return num;
    }

    // Null/undefined/other
    console.warn('⚠️ Unexpected stock value type:', typeof value, value);
    return 0;

  } catch (err) {
    console.error('❌ parseStockValue error:', err);
    return 0;
  }
}

// ============================================
// SAFE: Calculate Current Stock
// ============================================
export function calculateCurrentStock(totalStock, stockOutValues) {
  try {
    // Convert total to number
    const total = toNumber(totalStock, 0);

    // Check if stockOutValues is an array
    if (!Array.isArray(stockOutValues)) {
      // Single value
      const out = toNumber(stockOutValues, 0);
      return preciseSubtract(total, out);
    }

    // Array of values - filter out null/undefined first
    const validOutValues = stockOutValues
      .filter(v => v !== null && v !== undefined)
      .map(v => toNumber(v, 0));

    return preciseSubtract(total, ...validOutValues);

  } catch (err) {
    console.error('❌ calculateCurrentStock error:', err);
    return 0;
  }
}

// ============================================
// SAFE: Validate Stock Value
// ============================================
export function validateStockValue(value) {
  try {
    const num = toNumber(value, null);

    if (num === null) {
      return false;
    }

    // Must be a valid number that's not negative
    return !isNaN(num) && num >= 0 && isFinite(num);

  } catch (err) {
    console.error('❌ validateStockValue error:', err);
    return false;
  }
}

// ============================================
// SAFE: Convert Between Units
// ============================================
export function convertToKg(value, unit = 'kg') {
  try {
    const num = toNumber(value, 0);

    // Validate unit
    const normalizedUnit = (typeof unit === 'string') ? unit.toLowerCase().trim() : 'kg';

    switch (normalizedUnit) {
      case 'g':
        return num / 1000;
      case 'mg':
        return num / 1000000;
      case 'l':
        return num; // Assuming 1L = 1kg for liquids
      case 'ml':
        return num / 1000; // Assuming 1ml = 1g for liquids
      case 'kg':
      default:
        return num;
    }

  } catch (err) {
    console.error('❌ convertToKg error:', err);
    return 0;
  }
}

// ============================================
// SAFE: Get Optimal Unit for Display
// ============================================
export function getOptimalUnit(value) {
  try {
    const num = toNumber(value, 0);

    if (num >= 1) {
      return { value: num, unit: 'kg' };
    } else if (num >= 0.001) {
      return { value: num * 1000, unit: 'g' };
    } else {
      return { value: num * 1000000, unit: 'mg' };
    }

  } catch (err) {
    console.error('❌ getOptimalUnit error:', err);
    return { value: 0, unit: 'kg' };
  }
}

// ============================================
// SAFE: Format with Optimal Unit
// ============================================
export function formatStockOptimal(value) {
  try {
    const { value: optimalValue, unit } = getOptimalUnit(value);
    return formatStockWithUnit(optimalValue, unit);

  } catch (err) {
    console.error('❌ formatStockOptimal error:', err);
    return '0 kg';
  }
}

// ============================================
// EXPORTS FOR CONVENIENCE
// ============================================

export default {
  // Arithmetic
  preciseAdd,
  preciseSubtract,
  preciseMultiply,
  preciseDivide,

  // Formatting
  formatStock,
  formatStockWithUnit,
  formatStockOptimal,

  // Parsing
  parseStockValue,
  toNumber,

  // Calculations
  calculateCurrentStock,
  convertToKg,
  getOptimalUnit,

  // Validation
  validateStockValue,
};
