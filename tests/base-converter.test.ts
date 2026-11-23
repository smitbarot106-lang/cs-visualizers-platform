import { describe, it, expect } from 'vitest';
import {
  validateBaseInput,
  parseToBigInt,
  convertAllBases,
  generateDivisionSteps,
  generatePositionalTerms,
  getEducationalExplanation,
  NUMBER_BASE_PRESETS,
} from '../src/core/tools/base-converter';

describe('Number Base Converter Unit Tests', () => {
  describe('validateBaseInput', () => {
    it('validates correct binary inputs and strips optional 0b prefix and spaces', () => {
      const res = validateBaseInput('0b1101 0010', 2);
      expect(res.isValid).toBe(true);
      expect(res.sanitized).toBe('11010010');
      expect(res.isNegative).toBe(false);
    });

    it('rejects invalid digits in binary', () => {
      const res = validateBaseInput('110201', 2);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toContain("Invalid character '2'");
    });

    it('validates octal digits (0-7) and rejects 8 or 9', () => {
      expect(validateBaseInput('0o755', 8).isValid).toBe(true);
      const invalid = validateBaseInput('789', 8);
      expect(invalid.isValid).toBe(false);
      expect(invalid.errorMessage).toContain("Invalid character '8'");
    });

    it('validates decimal digits (0-9)', () => {
      expect(validateBaseInput('1234567890', 10).isValid).toBe(true);
      expect(validateBaseInput('123a45', 10).isValid).toBe(false);
    });

    it('validates hexadecimal (0-9, a-f, A-F) and strips optional 0x prefix', () => {
      const res = validateBaseInput('0xDead_Beef', 16);
      expect(res.isValid).toBe(true);
      expect(res.sanitized).toBe('DeadBeef');
      expect(validateBaseInput('G123', 16).isValid).toBe(false);
    });

    it('handles negative signs properly', () => {
      const res = validateBaseInput('-42', 10);
      expect(res.isValid).toBe(true);
      expect(res.isNegative).toBe(true);
      expect(res.sanitized).toBe('42');
    });

    it('rejects empty input cleanly', () => {
      const res = validateBaseInput('   ', 10);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toContain('Please enter a number');
    });
  });

  describe('parseToBigInt & Precision', () => {
    it('converts base strings to exact BigInt values', () => {
      expect(parseToBigInt('1101', 2, false)).toBe(13n);
      expect(parseToBigInt('17', 8, false)).toBe(15n);
      expect(parseToBigInt('255', 10, false)).toBe(255n);
      expect(parseToBigInt('FF', 16, false)).toBe(255n);
    });

    it('handles negative numbers', () => {
      expect(parseToBigInt('42', 10, true)).toBe(-42n);
      expect(parseToBigInt('FF', 16, true)).toBe(-255n);
    });

    it('preserves full precision beyond Number.MAX_SAFE_INTEGER (9007199254740991)', () => {
      // 64-bit unsigned max = 18446744073709551615
      const hugeDec = '18446744073709551615';
      const big = parseToBigInt(hugeDec, 10, false);
      expect(big.toString()).toBe(hugeDec);
      // In Hex: FFFFFFFFFFFFFFFF
      expect(big.toString(16).toUpperCase()).toBe('FFFFFFFFFFFFFFFF');
    });
  });

  describe('convertAllBases (Synchronized Conversion)', () => {
    it('converts Decimal 42 across all four bases accurately', () => {
      const res = convertAllBases('42', 10);
      expect(res.success).toBe(true);
      expect(res.result).toBeDefined();
      expect(res.result?.decimal).toBe('42');
      expect(res.result?.binary).toBe('101010');
      expect(res.result?.octal).toBe('52');
      expect(res.result?.hexadecimal).toBe('2A');
      expect(res.result?.bitLength).toBe(6);
      expect(res.result?.byteLength).toBe(1);
    });

    it('converts Binary 11010101 to Dec 213, Oct 325, Hex D5', () => {
      const res = convertAllBases('11010101', 2);
      expect(res.success).toBe(true);
      expect(res.result?.decimal).toBe('213');
      expect(res.result?.octal).toBe('325');
      expect(res.result?.hexadecimal).toBe('D5');
    });

    it('converts Hexadecimal DEADBEEF accurately', () => {
      const res = convertAllBases('DEADBEEF', 16);
      expect(res.success).toBe(true);
      expect(res.result?.decimal).toBe('3735928559');
      expect(res.result?.hexadecimal).toBe('DEADBEEF');
      expect(res.result?.bitLength).toBe(32);
      expect(res.result?.byteLength).toBe(4);
    });

    it('converts zero properly', () => {
      const res = convertAllBases('0', 10);
      expect(res.success).toBe(true);
      expect(res.result?.binary).toBe('0');
      expect(res.result?.octal).toBe('0');
      expect(res.result?.decimal).toBe('0');
      expect(res.result?.hexadecimal).toBe('0');
      expect(res.result?.bitLength).toBe(1);
    });

    it('handles negative integers cleanly across bases', () => {
      const res = convertAllBases('-15', 10);
      expect(res.success).toBe(true);
      expect(res.result?.decimal).toBe('-15');
      expect(res.result?.binary).toBe('-1111');
      expect(res.result?.octal).toBe('-17');
      expect(res.result?.hexadecimal).toBe('-F');
    });
  });

  describe('Educational Step Generation', () => {
    it('generates mathematically exact repeated division steps for Decimal 13 to Binary', () => {
      // 13 / 2 = 6 rem 1
      // 6 / 2 = 3 rem 0
      // 3 / 2 = 1 rem 1
      // 1 / 2 = 0 rem 1
      // Remainders bottom-up: 1 1 0 1
      const steps = generateDivisionSteps(13n, 2);
      expect(steps.length).toBe(4);
      expect(steps[0]).toEqual({
        stepNumber: 1,
        dividend: '13',
        divisor: 2,
        quotient: '6',
        remainder: 1,
        remainderHex: undefined,
      });
      expect(steps[1].quotient).toBe('3');
      expect(steps[1].remainder).toBe(0);
      expect(steps[2].quotient).toBe('1');
      expect(steps[2].remainder).toBe(1);
      expect(steps[3].quotient).toBe('0');
      expect(steps[3].remainder).toBe(1);

      const reconstructed = steps.map(s => s.remainder).reverse().join('');
      expect(reconstructed).toBe('1101');
    });

    it('generates division steps for Decimal to Hexadecimal with hex digit mapping', () => {
      // 254 in Hex is FE:
      // 254 / 16 = 15 rem 14 ('E')
      // 15 / 16 = 0 rem 15 ('F')
      const steps = generateDivisionSteps(254n, 16);
      expect(steps.length).toBe(2);
      expect(steps[0].remainder).toBe(14);
      expect(steps[0].remainderHex).toBe('E');
      expect(steps[1].remainder).toBe(15);
      expect(steps[1].remainderHex).toBe('F');

      const hex = steps.map(s => s.remainderHex).reverse().join('');
      expect(hex).toBe('FE');
    });

    it('generates positional weight terms for Binary 1101 to Decimal', () => {
      // 1101:
      // pos 3: 1 * 2^3 = 8
      // pos 2: 1 * 2^2 = 4
      // pos 1: 0 * 2^1 = 0
      // pos 0: 1 * 2^0 = 1
      // Sum = 13
      const terms = generatePositionalTerms('1101', 2);
      expect(terms.length).toBe(4);
      expect(terms[0].power).toBe('2^3');
      expect(terms[0].termProduct).toBe('8');
      expect(terms[1].power).toBe('2^2');
      expect(terms[1].termProduct).toBe('4');
      expect(terms[2].power).toBe('2^1');
      expect(terms[2].termProduct).toBe('0');
      expect(terms[3].power).toBe('2^0');
      expect(terms[3].termProduct).toBe('1');

      const sum = terms.reduce((acc, t) => acc + BigInt(t.termProduct), 0n);
      expect(sum).toBe(13n);
    });

    it('provides comprehensive educational explanation for cross-base conversions', () => {
      const exp = getEducationalExplanation('42', 10, 2);
      expect(exp).not.toBeNull();
      expect(exp?.fromBase).toBe(10);
      expect(exp?.toBase).toBe(2);
      expect(exp?.output).toBe('101010');
      expect(exp?.divisionSteps?.length).toBeGreaterThan(0);

      const expFromBin = getEducationalExplanation('101010', 2, 10);
      expect(expFromBin?.expansionFormula).toContain('42');
    });
  });

  describe('Presets Validation', () => {
    it('all presets convert without error', () => {
      for (const preset of NUMBER_BASE_PRESETS) {
        const res = convertAllBases(preset.value, preset.base);
        expect(res.success).toBe(true);
        expect(res.result).toBeDefined();
      }
    });
  });
});
