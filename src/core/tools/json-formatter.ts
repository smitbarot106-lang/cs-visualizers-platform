/**
 * JSON Formatter, Minifier & Diagnostic Engine
 * Pure TypeScript implementation for client-side execution.
 * Zero external dependencies, zero network requests.
 */

export type JsonDataType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonFormatOptions {
  indent: 2 | 4;
}

export interface JsonDiagnostic {
  line: number;
  column: number;
  position: number;
  isExact: boolean;
  message: string;
  suggestion: string;
  snippet: string;
  nearToken?: string;
}

export interface JsonValidationResult {
  isValid: boolean;
  error?: JsonDiagnostic;
  stats?: {
    byteSize: number;
    characterCount: number;
    lineCount: number;
    type: JsonDataType;
    keyCount?: number;
    elementCount?: number;
  };
}

export interface JsonFormatResult {
  success: boolean;
  output: string;
  error?: JsonDiagnostic;
  stats?: JsonValidationResult['stats'];
}

export const MAX_JSON_BYTE_SIZE = 5 * 1024 * 1024; // 5 MB safe limit for browser main thread

/**
 * Converts a 0-based character index to 1-based line and column numbers.
 */
export function indexToLineCol(text: string, index: number): { line: number; column: number } {
  const safeIndex = Math.max(0, Math.min(index, text.length));
  let line = 1;
  let lastLineStart = 0;

  for (let i = 0; i < safeIndex; i++) {
    if (text[i] === '\n') {
      line++;
      lastLineStart = i + 1;
    }
  }

  const column = safeIndex - lastLineStart + 1;
  return { line, column };
}

/**
 * Generates an accessible ASCII code snippet showing the line of the error
 * with a caret indicator (^) pointing to the problematic column.
 */
export function generateErrorSnippet(text: string, line: number, column: number): string {
  const lines = text.split('\n');
  if (lines.length === 0) return '';

  const targetLineIdx = Math.max(0, Math.min(line - 1, lines.length - 1));
  const targetLine = lines[targetLineIdx] ?? '';
  const lineNumStr = String(targetLineIdx + 1);
  const padWidth = Math.max(3, lineNumStr.length);

  const prefix = `${lineNumStr.padStart(padWidth)} | `;
  const caretPadding = ' '.repeat(Math.max(0, column - 1));
  const pointerLine = `${' '.repeat(prefix.length)}${caretPadding}^`;

  const prevLineIdx = targetLineIdx - 1;
  const nextLineIdx = targetLineIdx + 1;

  const result: string[] = [];
  if (prevLineIdx >= 0) {
    const prevNumStr = String(prevLineIdx + 1).padStart(padWidth);
    result.push(`${prevNumStr} | ${lines[prevLineIdx]}`);
  }
  result.push(`${prefix}${targetLine}`);
  result.push(pointerLine);
  if (nextLineIdx < lines.length) {
    const nextNumStr = String(nextLineIdx + 1).padStart(padWidth);
    result.push(`${nextNumStr} | ${lines[nextLineIdx]}`);
  }

  return result.join('\n');
}

/**
 * Diagnoses a JSON syntax error by inspecting standard error messages
 * and applying heuristic pattern analysis to pinpoint common beginner mistakes.
 */
export function diagnoseJsonError(input: string, nativeError: Error): JsonDiagnostic {
  const rawMsg = nativeError.message;
  let line = 1;
  let column = 1;
  let position = 0;
  let isExact = false;
  let suggestion = 'Check for syntax errors such as unquoted keys, missing commas, or unclosed braces.';

  // 1. Check for modern V8 "at line X column Y" format
  const lineColMatch = rawMsg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineColMatch && lineColMatch[1] && lineColMatch[2]) {
    line = parseInt(lineColMatch[1], 10);
    column = parseInt(lineColMatch[2], 10);
    isExact = true;
  } else {
    // 2. Check for "at position X" format
    const posMatch = rawMsg.match(/position\s+(\d+)/i);
    if (posMatch && posMatch[1]) {
      position = parseInt(posMatch[1], 10);
      const loc = indexToLineCol(input, position);
      line = loc.line;
      column = loc.column;
      isExact = true;
    }
  }

  // 3. Heuristic pattern checks to provide specific, beginner-friendly explanations
  // Check A: Single quotes instead of double quotes
  const singleQuoteMatch = input.search(/'(?:[^'\\]|\\.)*'/);
  if (singleQuoteMatch !== -1) {
    const sqLoc = indexToLineCol(input, singleQuoteMatch);
    if (!isExact || Math.abs(sqLoc.line - line) <= 1) {
      suggestion = 'JSON requires double quotes (") for all string literals and object keys. Single quotes (\') are not allowed in JSON.';
      if (!isExact) {
        line = sqLoc.line;
        column = sqLoc.column;
      }
    }
  }

  // Check B: Trailing comma in objects or arrays
  const trailingCommaMatch = input.search(/,\s*([}\]])/);
  if (trailingCommaMatch !== -1) {
    const tcLoc = indexToLineCol(input, trailingCommaMatch);
    if (!isExact || Math.abs(tcLoc.line - line) <= 1) {
      suggestion = 'Trailing commas are not allowed in standard JSON before a closing brace `}` or bracket `]`. Remove the trailing comma.';
      if (!isExact) {
        line = tcLoc.line;
        column = tcLoc.column;
      }
    }
  }

  // Check C: JavaScript/Python comments (// or /* */)
  const commentMatch = input.search(/\/\/|\/\*/);
  if (commentMatch !== -1) {
    const cLoc = indexToLineCol(input, commentMatch);
    suggestion = 'Standard JSON does not support comments (`//` or `/* */`). Remove comments before validating.';
    if (!isExact) {
      line = cLoc.line;
      column = cLoc.column;
    }
  }

  // Check D: Unquoted keys (e.g. { name: "value" })
  const unquotedKeyMatch = input.search(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/);
  if (unquotedKeyMatch !== -1) {
    const ukLoc = indexToLineCol(input, unquotedKeyMatch);
    if (!isExact || Math.abs(ukLoc.line - line) <= 1) {
      suggestion = 'All object property keys must be wrapped in double quotes: e.g., `"key": "value"`.';
      if (!isExact) {
        line = ukLoc.line;
        column = ukLoc.column;
      }
    }
  }

  // Check E: Python / non-standard literals: True, False, None, undefined, NaN
  const nonStandardMatch = input.search(/\b(True|False|None|undefined|NaN)\b/);
  if (nonStandardMatch !== -1) {
    const nsLoc = indexToLineCol(input, nonStandardMatch);
    suggestion = 'JSON only allows lowercase `true`, `false`, and `null`. Python literals (True, False, None) or JavaScript undefined/NaN are invalid.';
    if (!isExact) {
      line = nsLoc.line;
      column = nsLoc.column;
    }
  }

  // Check F: Bracket/brace mismatch
  let openBrace = 0;
  let closeBrace = 0;
  let openBracket = 0;
  let closeBracket = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '{') openBrace++;
    else if (char === '}') closeBrace++;
    else if (char === '[') openBracket++;
    else if (char === ']') closeBracket++;
  }
  if (openBrace > closeBrace) {
    suggestion += ` Mismatched braces: found ${openBrace} open '{' but only ${closeBrace} closed '}'.`;
  } else if (closeBrace > openBrace) {
    suggestion += ` Extra closing brace '}': found ${closeBrace} closed '}' but only ${openBrace} open '{'.`;
  }
  if (openBracket > closeBracket) {
    suggestion += ` Mismatched brackets: found ${openBracket} open '[' but only ${closeBracket} closed ']'.`;
  } else if (closeBracket > openBracket) {
    suggestion += ` Extra closing bracket ']': found ${closeBracket} closed ']' but only ${openBracket} open '['.`;
  }

  const snippet = generateErrorSnippet(input, line, column);

  return {
    line,
    column,
    position,
    isExact,
    message: rawMsg,
    suggestion,
    snippet,
  };
}

/**
 * Validates a JSON string and computes structural statistics.
 */
export function validateJson(input: string): JsonValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: {
        line: 1,
        column: 1,
        position: 0,
        isExact: true,
        message: 'Input is empty.',
        suggestion: 'Enter or paste a valid JSON string (e.g. {"key": "value"} or [1, 2, 3]).',
        snippet: '1 | (empty input)\n    ^',
      },
    };
  }

  const byteSize = new TextEncoder().encode(input).length;
  if (byteSize > MAX_JSON_BYTE_SIZE) {
    return {
      isValid: false,
      error: {
        line: 1,
        column: 1,
        position: 0,
        isExact: true,
        message: `Input size (${(byteSize / (1024 * 1024)).toFixed(2)} MB) exceeds the 5 MB in-browser safety limit.`,
        suggestion: 'Reduce the input payload to prevent browser tab responsiveness degradation.',
        snippet: '',
      },
    };
  }

  try {
    const parsed = JSON.parse(input);
    let type: JsonDataType = 'object';
    let keyCount: number | undefined;
    let elementCount: number | undefined;

    if (parsed === null) {
      type = 'null';
    } else if (Array.isArray(parsed)) {
      type = 'array';
      elementCount = parsed.length;
    } else if (typeof parsed === 'object') {
      type = 'object';
      keyCount = Object.keys(parsed).length;
    } else if (typeof parsed === 'string') {
      type = 'string';
    } else if (typeof parsed === 'number') {
      type = 'number';
    } else if (typeof parsed === 'boolean') {
      type = 'boolean';
    }

    return {
      isValid: true,
      stats: {
        byteSize,
        characterCount: input.length,
        lineCount: input.split('\n').length,
        type,
        keyCount,
        elementCount,
      },
    };
  } catch (err) {
    const error = diagnoseJsonError(input, err instanceof Error ? err : new Error(String(err)));
    return {
      isValid: false,
      error,
    };
  }
}

/**
 * Formats a valid JSON string with selected space indentation (2 or 4 spaces).
 */
export function formatJson(input: string, options: JsonFormatOptions = { indent: 2 }): JsonFormatResult {
  const validation = validateJson(input);
  if (!validation.isValid) {
    return {
      success: false,
      output: '',
      error: validation.error,
    };
  }

  try {
    const parsed = JSON.parse(input);
    const space = options.indent === 4 ? 4 : 2;
    const formatted = JSON.stringify(parsed, null, space);
    return {
      success: true,
      output: formatted,
      stats: validation.stats,
    };
  } catch (err) {
    const error = diagnoseJsonError(input, err instanceof Error ? err : new Error(String(err)));
    return {
      success: false,
      output: '',
      error,
    };
  }
}

/**
 * Minifies a valid JSON string by stripping all non-essential whitespace.
 */
export function minifyJson(input: string): JsonFormatResult {
  const validation = validateJson(input);
  if (!validation.isValid) {
    return {
      success: false,
      output: '',
      error: validation.error,
    };
  }

  try {
    const parsed = JSON.parse(input);
    const minified = JSON.stringify(parsed);
    return {
      success: true,
      output: minified,
      stats: validation.stats,
    };
  } catch (err) {
    const error = diagnoseJsonError(input, err instanceof Error ? err : new Error(String(err)));
    return {
      success: false,
      output: '',
      error,
    };
  }
}

/**
 * Ready-to-use sample presets for learning and testing.
 */
export const JSON_SAMPLE_PRESETS = {
  simple: JSON.stringify({
    title: 'Computer Science Visualizers Platform',
    version: '1.0.0',
    openSource: true,
    languages: ['TypeScript', 'Astro'],
    privacy: { clientSideOnly: true, tracking: null },
  }, null, 2),

  nested: JSON.stringify({
    platform: 'CS Visualizers',
    algorithms: [
      { id: 'binary-search', timeComplexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' }, inV1: true },
      { id: 'bubble-sort', timeComplexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' }, inV1: true },
      { id: 'bfs-dfs', timeComplexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' }, inV1: true },
    ],
    metadata: {
      tags: ['computer science', 'algorithms', 'education'],
      stats: { totalUsers: 0, telemetryCollected: 0 },
    },
  }, null, 2),

  unicode: JSON.stringify({
    greetings: {
      english: 'Hello, World!',
      hindi: 'नमस्ते दुनिया',
      japanese: 'こんにちは世界',
      emoji: '🚀 🧠 💻',
    },
    symbols: ['∑', 'π', 'Ω', '√', '≠', '≤', '≥'],
    escapedCharacters: 'Quotes: "inside" and \\slashes\\ and \ttabs\nnewlines',
  }, null, 2),

  invalidSample: `{
  "name": 'CS Visualizers',
  "version": 1.0,
  "features": [
    "sorting",
    "binary search",
  ],
  status: active
}`,
};
