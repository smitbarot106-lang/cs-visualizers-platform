/**
 * Number Base Converter & Mathematical Explanation Engine
 * Supports Binary (Base 2), Octal (Base 8), Decimal (Base 10), and Hexadecimal (Base 16).
 * Uses BigInt for arbitrary-precision integer calculations to eliminate precision loss.
 * Pure TypeScript implementation for client-side execution.
 */

export type NumberBase = 2 | 8 | 10 | 16;

export interface BaseValidationResult {
  isValid: boolean;
  errorMessage?: string;
  sanitized: string;
  isNegative: boolean;
}

export interface DivisionStep {
  stepNumber: number;
  dividend: string;
  divisor: number;
  quotient: string;
  remainder: number;
  remainderHex?: string;
}

export interface PositionalTerm {
  position: number;
  digit: string;
  decimalValue: number;
  power: string;
  termProduct: string;
}

export interface BaseExplanation {
  fromBase: NumberBase;
  toBase: NumberBase;
  input: string;
  output: string;
  isNegative: boolean;
  divisionSteps?: DivisionStep[];
  positionalTerms?: PositionalTerm[];
  expansionFormula?: string;
  groupingExplanation?: string;
}

export interface MultiBaseResult {
  binary: string;
  octal: string;
  decimal: string;
  hexadecimal: string;
  isNegative: boolean;
  valueBigInt: bigint;
  bitLength: number;
  byteLength: number;
}

const BASE_VALIDATORS: Record<NumberBase, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-fA-F]+$/,
};

const BASE_NAMES: Record<NumberBase, string> = {
  2: 'Binary (Base 2)',
  8: 'Octal (Base 8)',
  10: 'Decimal (Base 10)',
  16: 'Hexadecimal (Base 16)',
};

export const HEX_DIGIT_MAP: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15,
};

export const DEC_TO_HEX_MAP = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Validates and sanitizes a string input for a specified radix.
 */
export function validateBaseInput(input: string, base: NumberBase): BaseValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      errorMessage: 'Please enter a number.',
      sanitized: '',
      isNegative: false,
    };
  }

  let isNegative = false;
  let digits = trimmed;

  if (trimmed.startsWith('-')) {
    isNegative = true;
    digits = trimmed.slice(1).trim();
  } else if (trimmed.startsWith('+')) {
    digits = trimmed.slice(1).trim();
  }

  // Strip standard prefixes if present (e.g. 0b, 0o, 0x)
  if (base === 2 && digits.toLowerCase().startsWith('0b')) {
    digits = digits.slice(2);
  } else if (base === 8 && digits.toLowerCase().startsWith('0o')) {
    digits = digits.slice(2);
  } else if (base === 16 && digits.toLowerCase().startsWith('0x')) {
    digits = digits.slice(2);
  }

  // Strip internal formatting spaces or underscores for readability (e.g. 1101 0101 or 1_000_000)
  digits = digits.replace(/[\s_]/g, '');

  if (!digits) {
    return {
      isValid: false,
      errorMessage: `No digits provided for ${BASE_NAMES[base]}.`,
      sanitized: '',
      isNegative,
    };
  }

  if (!BASE_VALIDATORS[base].test(digits)) {
    let invalidChar = '';
    for (const char of digits) {
      if (!BASE_VALIDATORS[base].test(char)) {
        invalidChar = char;
        break;
      }
    }
    return {
      isValid: false,
      errorMessage: `Invalid character '${invalidChar}' for ${BASE_NAMES[base]}. Allowed: ${
        base === 2 ? '0, 1' : base === 8 ? '0–7' : base === 10 ? '0–9' : '0–9, A–F'
      }.`,
      sanitized: digits,
      isNegative,
    };
  }

  return {
    isValid: true,
    sanitized: digits,
    isNegative,
  };
}

/**
 * Parses any supported base string into an exact BigInt.
 */
export function parseToBigInt(sanitizedDigits: string, base: NumberBase, isNegative: boolean): bigint {
  let result = 0n;
  const radix = BigInt(base);

  for (let i = 0; i < sanitizedDigits.length; i++) {
    const char = sanitizedDigits[i];
    const value = BigInt(HEX_DIGIT_MAP[char] ?? 0);
    result = result * radix + value;
  }

  return isNegative ? -result : result;
}

/**
 * Converts a BigInt into all 4 standard radix representations with metadata.
 */
export function convertAllBases(input: string, sourceBase: NumberBase): {
  success: boolean;
  result?: MultiBaseResult;
  errorMessage?: string;
} {
  const validation = validateBaseInput(input, sourceBase);
  if (!validation.isValid) {
    return {
      success: false,
      errorMessage: validation.errorMessage,
    };
  }

  try {
    const bigVal = parseToBigInt(validation.sanitized, sourceBase, validation.isNegative);
    const absVal = bigVal < 0n ? -bigVal : bigVal;
    const signPrefix = validation.isNegative && bigVal !== 0n ? '-' : '';

    const binary = signPrefix + absVal.toString(2);
    const octal = signPrefix + absVal.toString(8);
    const decimal = signPrefix + absVal.toString(10);
    const hexadecimal = signPrefix + absVal.toString(16).toUpperCase();

    // Calculate bit and byte length for magnitude reference
    const bitLength = absVal === 0n ? 1 : absVal.toString(2).length;
    const byteLength = Math.ceil(bitLength / 8);

    return {
      success: true,
      result: {
        binary,
        octal,
        decimal,
        hexadecimal,
        isNegative: validation.isNegative && bigVal !== 0n,
        valueBigInt: bigVal,
        bitLength,
        byteLength,
      },
    };
  } catch (err) {
    return {
      success: false,
      errorMessage: err instanceof Error ? err.message : 'Error converting number base.',
    };
  }
}

/**
 * Generates the repeated division-by-radix steps for Decimal -> Base N (2, 8, 16).
 */
export function generateDivisionSteps(decimalAbs: bigint, targetBase: NumberBase): DivisionStep[] {
  if (targetBase === 10) return [];
  if (decimalAbs === 0n) {
    return [{
      stepNumber: 1,
      dividend: '0',
      divisor: targetBase,
      quotient: '0',
      remainder: 0,
      remainderHex: '0',
    }];
  }

  const steps: DivisionStep[] = [];
  let current = decimalAbs;
  const radix = BigInt(targetBase);
  let stepNumber = 1;

  // Safeguard step limit for display purposes (max 128 division rows)
  while (current > 0n && stepNumber <= 128) {
    const quotient = current / radix;
    const remainderBig = current % radix;
    const remainder = Number(remainderBig);
    const remainderHex = targetBase === 16 ? DEC_TO_HEX_MAP[remainder] : undefined;

    steps.push({
      stepNumber,
      dividend: current.toString(),
      divisor: targetBase,
      quotient: quotient.toString(),
      remainder,
      remainderHex,
    });

    current = quotient;
    stepNumber++;
  }

  return steps;
}

/**
 * Generates positional weight expansion terms for Base N -> Decimal.
 */
export function generatePositionalTerms(sanitizedDigits: string, fromBase: NumberBase): PositionalTerm[] {
  if (fromBase === 10) return [];

  const terms: PositionalTerm[] = [];
  const len = sanitizedDigits.length;

  for (let i = 0; i < len; i++) {
    const digitChar = sanitizedDigits[i];
    const decimalValue = HEX_DIGIT_MAP[digitChar] ?? 0;
    const position = len - 1 - i;
    const power = `${fromBase}^${position}`;
    const weight = BigInt(fromBase) ** BigInt(position);
    const termProduct = (BigInt(decimalValue) * weight).toString();

    terms.push({
      position,
      digit: digitChar.toUpperCase(),
      decimalValue,
      power,
      termProduct,
    });
  }

  return terms;
}

/**
 * Formats grouped bit-chunks for Binary to Hex (4-bit nibbles) or Octal (3-bit chunks).
 */
export function generateGroupingExplanation(binaryDigits: string, targetBase: 8 | 16): string {
  const chunkSize = targetBase === 16 ? 4 : 3;
  const targetName = targetBase === 16 ? 'Hexadecimal' : 'Octal';

  // Pad to multiple of chunkSize
  const remainder = binaryDigits.length % chunkSize;
  const padded = remainder === 0 ? binaryDigits : '0'.repeat(chunkSize - remainder) + binaryDigits;

  const chunks: string[] = [];
  const mappedDigits: string[] = [];

  for (let i = 0; i < padded.length; i += chunkSize) {
    const chunk = padded.slice(i, i + chunkSize);
    chunks.push(chunk);
    const val = parseInt(chunk, 2);
    mappedDigits.push(targetBase === 16 ? DEC_TO_HEX_MAP[val] ?? '0' : String(val));
  }

  return `Binary to ${targetName} direct mapping: Group binary digits into ${chunkSize}-bit chunks (from right to left, zero-padded on the left):\n` +
    chunks.map((c, idx) => `[ ${c}₂ = ${mappedDigits[idx]} ]`).join('  ') +
    `  =>  ${mappedDigits.join('')}`;
}

/**
 * Assembles a comprehensive, beginner-friendly mathematical explanation
 * for any conversion between the 4 number bases.
 */
export function getEducationalExplanation(
  input: string,
  fromBase: NumberBase,
  toBase: NumberBase
): BaseExplanation | null {
  const validation = validateBaseInput(input, fromBase);
  if (!validation.isValid) return null;

  const bigVal = parseToBigInt(validation.sanitized, fromBase, validation.isNegative);
  const absVal = bigVal < 0n ? -bigVal : bigVal;
  const signPrefix = validation.isNegative && bigVal !== 0n ? '-' : '';

  let output = '';
  if (toBase === 2) output = signPrefix + absVal.toString(2);
  else if (toBase === 8) output = signPrefix + absVal.toString(8);
  else if (toBase === 10) output = signPrefix + absVal.toString(10);
  else if (toBase === 16) output = signPrefix + absVal.toString(16).toUpperCase();

  const isNeg = validation.isNegative && bigVal !== 0n;

  // Case 1: Same base
  if (fromBase === toBase) {
    return {
      fromBase,
      toBase,
      input,
      output,
      isNegative: isNeg,
    };
  }

  // Case 2: From Base N to Decimal (Positional Weight Expansion)
  if (toBase === 10) {
    const terms = generatePositionalTerms(validation.sanitized, fromBase);
    const formula = terms
      .map(t => `${t.decimalValue} × ${fromBase}^${t.position}`)
      .join(' + ') + ` = ${absVal.toString()}`;

    return {
      fromBase,
      toBase,
      input,
      output,
      isNegative: isNeg,
      positionalTerms: terms,
      expansionFormula: formula,
    };
  }

  // Case 3: From Decimal to Base N (Repeated Division)
  if (fromBase === 10) {
    const divisionSteps = generateDivisionSteps(absVal, toBase);
    return {
      fromBase,
      toBase,
      input,
      output,
      isNegative: isNeg,
      divisionSteps,
    };
  }

  // Case 4: Binary <-> Hex or Binary <-> Octal (Groupings)
  if (fromBase === 2 && (toBase === 16 || toBase === 8)) {
    const grouping = generateGroupingExplanation(validation.sanitized, toBase);
    const divisionSteps = generateDivisionSteps(absVal, toBase);
    return {
      fromBase,
      toBase,
      input,
      output,
      isNegative: isNeg,
      groupingExplanation: grouping,
      divisionSteps,
    };
  }

  // Case 5: Cross-base conversion via Decimal intermediate
  const positionalTerms = generatePositionalTerms(validation.sanitized, fromBase);
  const divisionSteps = generateDivisionSteps(absVal, toBase);

  return {
    fromBase,
    toBase,
    input,
    output,
    isNegative: isNeg,
    positionalTerms,
    divisionSteps,
  };
}

/**
 * Pre-configured presets for exploration and testing.
 */
export const NUMBER_BASE_PRESETS = [
  { label: 'Number 42 (Answer to Life)', value: '42', base: 10 as NumberBase },
  { label: 'Byte Max 255 (0xFF)', value: '255', base: 10 as NumberBase },
  { label: 'Kibi 1024 (0b10000000000)', value: '1024', base: 10 as NumberBase },
  { label: '32-Bit Max (4,294,967,295)', value: '4294967295', base: 10 as NumberBase },
  { label: '64-Bit BigInt (18,446,744,073,709,551,615)', value: '18446744073709551615', base: 10 as NumberBase },
  { label: 'Hex 0xDEADBEEF', value: 'DEADBEEF', base: 16 as NumberBase },
  { label: 'Binary 11010101', value: '11010101', base: 2 as NumberBase },
  { label: 'Negative Decimal -128', value: '-128', base: 10 as NumberBase },
];
