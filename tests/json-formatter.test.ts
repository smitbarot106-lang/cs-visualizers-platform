import { describe, it, expect } from 'vitest';
import {
  validateJson,
  formatJson,
  minifyJson,
  indexToLineCol,
  generateErrorSnippet,
  JSON_SAMPLE_PRESETS,
  MAX_JSON_BYTE_SIZE,
} from '../src/core/tools/json-formatter';

describe('JSON Formatter & Validator Unit Tests', () => {
  describe('indexToLineCol & generateErrorSnippet', () => {
    it('converts character index to 1-based line and column correctly', () => {
      const text = 'line 1\nline 2\nline 3';
      // index 0 -> line 1, col 1
      expect(indexToLineCol(text, 0)).toEqual({ line: 1, column: 1 });
      // index 6 -> '\n' at end of line 1
      expect(indexToLineCol(text, 6)).toEqual({ line: 1, column: 7 });
      // index 7 -> 'l' of line 2 -> line 2, col 1
      expect(indexToLineCol(text, 7)).toEqual({ line: 2, column: 1 });
      // index 12 -> '2' of line 2 -> line 2, col 6
      expect(indexToLineCol(text, 12)).toEqual({ line: 2, column: 6 });
    });

    it('clamps negative or out-of-bounds indices safely', () => {
      const text = 'hello';
      expect(indexToLineCol(text, -10)).toEqual({ line: 1, column: 1 });
      expect(indexToLineCol(text, 999)).toEqual({ line: 1, column: 6 });
    });

    it('generates an ASCII snippet with caret pointing to the error column', () => {
      const text = '{\n  "key": invalid\n}';
      const snippet = generateErrorSnippet(text, 2, 10);
      expect(snippet).toContain('2 |   "key": invalid');
      expect(snippet).toContain('^');
    });
  });

  describe('validateJson', () => {
    it('validates simple and nested JSON objects', () => {
      const valid = '{"name": "Alice", "age": 30, "active": true, "data": null}';
      const result = validateJson(valid);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.stats).toBeDefined();
      expect(result.stats?.type).toBe('object');
      expect(result.stats?.keyCount).toBe(4);
    });

    it('validates JSON arrays correctly', () => {
      const validArr = '[1, 2, 3, "four", false, null]';
      const result = validateJson(validArr);
      expect(result.isValid).toBe(true);
      expect(result.stats?.type).toBe('array');
      expect(result.stats?.elementCount).toBe(6);
    });

    it('validates standalone primitive literals correctly', () => {
      expect(validateJson('"a string"').isValid).toBe(true);
      expect(validateJson('42.5').isValid).toBe(true);
      expect(validateJson('true').isValid).toBe(true);
      expect(validateJson('null').isValid).toBe(true);
    });

    it('handles Unicode, multilingual text, and escaped characters', () => {
      const unicodeSample = JSON_SAMPLE_PRESETS.unicode;
      const result = validateJson(unicodeSample);
      expect(result.isValid).toBe(true);
    });

    it('rejects empty and whitespace-only strings gracefully', () => {
      const emptyResult = validateJson('');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.error?.message).toContain('Input is empty');

      const wsResult = validateJson('    \n\t   ');
      expect(wsResult.isValid).toBe(false);
      expect(wsResult.error?.message).toContain('Input is empty');
    });

    it('diagnoses trailing comma errors with helpful guidance', () => {
      const invalid = '{\n  "a": 1,\n  "b": 2,\n}';
      const result = validateJson(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.suggestion.toLowerCase()).toContain('trailing comma');
    });

    it('diagnoses single quotes instead of double quotes', () => {
      const invalid = "{\n  'name': 'value'\n}";
      const result = validateJson(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error?.suggestion).toContain('double quotes');
    });

    it('diagnoses unquoted keys', () => {
      const invalid = '{\n  name: "value"\n}';
      const result = validateJson(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error?.suggestion).toContain('double quotes');
    });

    it('diagnoses unsupported JavaScript/Python comments', () => {
      const invalid = '{\n  // this is a comment\n  "key": "value"\n}';
      const result = validateJson(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error?.suggestion).toContain('comments');
    });

    it('diagnoses non-standard Python literals like True, False, None', () => {
      const invalid = '{\n  "active": True\n}';
      const result = validateJson(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error?.suggestion).toContain('true');
    });

    it('detects unclosed brackets and braces', () => {
      const invalid = '{"items": [1, 2, 3}';
      const result = validateJson(invalid);
      expect(result.isValid).toBe(false);
      expect(result.error?.suggestion).toMatch(/bracket|brace/i);
    });

    it('enforces maximum byte size safeguard', () => {
      // Mock text that exceeds MAX_JSON_BYTE_SIZE
      const oversized = 'a'.repeat(MAX_JSON_BYTE_SIZE + 10);
      const result = validateJson(oversized);
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain('exceeds the 5 MB');
    });
  });

  describe('formatJson', () => {
    it('formats valid JSON with 2-space indentation by default', () => {
      const minified = '{"a":1,"b":[2,3],"c":{"d":true}}';
      const result = formatJson(minified);
      expect(result.success).toBe(true);
      expect(result.output).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ],\n  "c": {\n    "d": true\n  }\n}');
    });

    it('formats valid JSON with 4-space indentation when requested', () => {
      const minified = '{"a":1}';
      const result = formatJson(minified, { indent: 4 });
      expect(result.success).toBe(true);
      expect(result.output).toBe('{\n    "a": 1\n}');
    });

    it('returns error and empty output when formatting invalid JSON', () => {
      const invalid = '{"a": 1,}';
      const result = formatJson(invalid);
      expect(result.success).toBe(false);
      expect(result.output).toBe('');
      expect(result.error).toBeDefined();
    });
  });

  describe('minifyJson', () => {
    it('removes all unnecessary whitespace, indentations, and line breaks', () => {
      const pretty = `{\n  "title": "CS Visualizers",\n  "count": 42,\n  "list": [\n    1,\n    2\n  ]\n}`;
      const result = minifyJson(pretty);
      expect(result.success).toBe(true);
      expect(result.output).toBe('{"title":"CS Visualizers","count":42,"list":[1,2]}');
    });

    it('returns error when minifying invalid JSON', () => {
      const invalid = '{ broken: json }';
      const result = minifyJson(invalid);
      expect(result.success).toBe(false);
      expect(result.output).toBe('');
      expect(result.error).toBeDefined();
    });
  });

  describe('Sample presets integrity', () => {
    it('all predefined valid sample presets pass validation and formatting', () => {
      expect(validateJson(JSON_SAMPLE_PRESETS.simple).isValid).toBe(true);
      expect(validateJson(JSON_SAMPLE_PRESETS.nested).isValid).toBe(true);
      expect(validateJson(JSON_SAMPLE_PRESETS.unicode).isValid).toBe(true);
    });

    it('invalidSample preset intentionally fails validation and provides diagnostics', () => {
      const res = validateJson(JSON_SAMPLE_PRESETS.invalidSample);
      expect(res.isValid).toBe(false);
      expect(res.error).toBeDefined();
    });
  });
});
