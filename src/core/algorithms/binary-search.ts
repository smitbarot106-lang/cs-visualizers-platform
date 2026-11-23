/**
 * Binary Search Step Generator
 * Produces deterministic, immutable micro-steps for O(1) reversible playback.
 * Pure TypeScript implementation, fully testable, zero side effects.
 */

import type { Step } from '../engine/types';

export interface BinarySearchState {
  readonly array: readonly number[];
  readonly target: number;
  readonly low: number;
  readonly mid: number | null;
  readonly high: number;
  readonly foundIndex: number | null;
  readonly comparisons: number;
  readonly eliminatedIndices: readonly number[];
}

export interface BinarySearchInput {
  array: number[];
  target: number;
}

export const BINARY_SEARCH_PSEUDOCODE = [
  'low = 0, high = n - 1',
  'while low <= high:',
  '  mid = low + floor((high - low) / 2)',
  '  if array[mid] == target:',
  '    return mid // Target found',
  '  else if array[mid] < target:',
  '    low = mid + 1 // Search right half',
  '  else:',
  '    high = mid - 1 // Search left half',
  'return -1 // Target not found',
];

/**
 * Validates whether the given array is strictly sorted in non-decreasing order.
 */
export function isSortedArray(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

/**
 * Generates the full sequence of execution steps for Binary Search.
 */
export function generateBinarySearchSteps(input: BinarySearchInput): Step<BinarySearchState>[] {
  const { array, target } = input;
  const steps: Step<BinarySearchState>[] = [];
  const n = array.length;

  if (n === 0) {
    const emptyState: BinarySearchState = {
      array: [],
      target,
      low: 0,
      mid: null,
      high: -1,
      foundIndex: null,
      comparisons: 0,
      eliminatedIndices: [],
    };
    steps.push({
      stepIndex: 0,
      totalSteps: 1,
      state: emptyState,
      actionType: 'NOT_FOUND',
      activeIndices: [],
      pointers: [],
      pseudocodeLine: 10,
      narration: `Array is empty. Target ${target} cannot be found.`,
      variableWatch: { low: 0, high: -1, mid: null, target, comparisons: 0 },
    });
    return steps;
  }

  let low = 0;
  let high = n - 1;
  let comparisons = 0;
  let foundIndex: number | null = null;
  const eliminated: number[] = [];

  // Step 0: INIT
  const initState: BinarySearchState = {
    array: [...array],
    target,
    low,
    mid: null,
    high,
    foundIndex: null,
    comparisons: 0,
    eliminatedIndices: [],
  };

  steps.push({
    stepIndex: 0,
    totalSteps: 0, // Assigned at end
    state: initState,
    actionType: 'INIT',
    activeIndices: [low, high],
    pointers: [
      { name: 'Low', index: low, color: 'cyan' },
      { name: 'High', index: high, color: 'amber' },
    ],
    pseudocodeLine: 1,
    narration: `Initialize search range: Low = 0 (value: ${array[low]}), High = ${high} (value: ${array[high]}). Target = ${target}.`,
    variableWatch: { low, high, mid: null, target, comparisons: 0 },
  });

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    comparisons++;
    const midVal = array[mid];

    // Compute eliminated indices up to this step
    const currentEliminated = [...eliminated];

    // Step: Calculate Mid and Compare
    const compareState: BinarySearchState = {
      array: [...array],
      target,
      low,
      mid,
      high,
      foundIndex: null,
      comparisons,
      eliminatedIndices: currentEliminated,
    };

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      state: compareState,
      actionType: 'COMPARE',
      activeIndices: [mid],
      pointers: [
        { name: 'Low', index: low, color: 'cyan' },
        { name: 'Mid', index: mid, color: 'indigo' },
        { name: 'High', index: high, color: 'amber' },
      ],
      pseudocodeLine: 3,
      narration: `Compare target ${target} with middle element array[${mid}] = ${midVal} (calculated mid = ${low} + floor((${high} - ${low}) / 2)).`,
      variableWatch: { low, high, mid, 'array[mid]': midVal, target, comparisons },
    });

    if (midVal === target) {
      foundIndex = mid;
      const foundState: BinarySearchState = {
        array: [...array],
        target,
        low,
        mid,
        high,
        foundIndex: mid,
        comparisons,
        eliminatedIndices: currentEliminated,
      };

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        state: foundState,
        actionType: 'FOUND',
        activeIndices: [mid],
        pointers: [{ name: 'Found', index: mid, color: 'emerald' }],
        pseudocodeLine: 5,
        narration: `Success! Target ${target} found at index ${mid} after ${comparisons} comparison${comparisons === 1 ? '' : 's'}.`,
        variableWatch: { low, high, mid, foundIndex: mid, target, comparisons },
      });
      break;
    } else if (midVal < target) {
      // Eliminate left side including mid: low to mid
      for (let i = low; i <= mid; i++) {
        if (!eliminated.includes(i)) eliminated.push(i);
      }

      const nextLow = mid + 1;
      const shiftState: BinarySearchState = {
        array: [...array],
        target,
        low: nextLow,
        mid,
        high,
        foundIndex: null,
        comparisons,
        eliminatedIndices: [...eliminated],
      };

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        state: shiftState,
        actionType: 'SHIFT',
        activeIndices: nextLow <= high ? [nextLow, high] : [],
        pointers: nextLow <= high ? [
          { name: 'Low', index: nextLow, color: 'cyan' },
          { name: 'High', index: high, color: 'amber' },
        ] : [],
        pseudocodeLine: 7,
        narration: `Since array[${mid}] (${midVal}) < target (${target}), target must be in the right half. Move Low to ${nextLow}. Discarded indices ${low}..${mid}.`,
        variableWatch: { low: nextLow, high, mid, target, comparisons },
      });

      low = nextLow;
    } else {
      // midVal > target: Eliminate right side including mid: mid to high
      for (let i = mid; i <= high; i++) {
        if (!eliminated.includes(i)) eliminated.push(i);
      }

      const nextHigh = mid - 1;
      const shiftState: BinarySearchState = {
        array: [...array],
        target,
        low,
        mid,
        high: nextHigh,
        foundIndex: null,
        comparisons,
        eliminatedIndices: [...eliminated],
      };

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        state: shiftState,
        actionType: 'SHIFT',
        activeIndices: low <= nextHigh ? [low, nextHigh] : [],
        pointers: low <= nextHigh ? [
          { name: 'Low', index: low, color: 'cyan' },
          { name: 'High', index: nextHigh, color: 'amber' },
        ] : [],
        pseudocodeLine: 9,
        narration: `Since array[${mid}] (${midVal}) > target (${target}), target must be in the left half. Move High to ${nextHigh}. Discarded indices ${mid}..${high}.`,
        variableWatch: { low, high: nextHigh, mid, target, comparisons },
      });

      high = nextHigh;
    }
  }

  if (foundIndex === null) {
    const notFoundState: BinarySearchState = {
      array: [...array],
      target,
      low,
      mid: null,
      high,
      foundIndex: null,
      comparisons,
      eliminatedIndices: array.map((_, i) => i),
    };

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      state: notFoundState,
      actionType: 'NOT_FOUND',
      activeIndices: [],
      pointers: [],
      pseudocodeLine: 10,
      narration: `Search range exhausted (Low ${low} > High ${high}). Target ${target} does not exist in the array. Total comparisons: ${comparisons}.`,
      variableWatch: { low, high, mid: null, target, comparisons },
    });
  }

  // Assign totalSteps to all steps
  const total = steps.length;
  return steps.map((s, idx) => ({
    ...s,
    stepIndex: idx,
    totalSteps: total,
  }));
}

/**
 * Predefined beginner-friendly presets for Binary Search.
 */
export const BINARY_SEARCH_PRESETS = [
  {
    name: 'Standard (9 items, search 23)',
    array: [2, 5, 8, 12, 16, 23, 38, 56, 72],
    target: 23,
    description: 'Target is in the right half; demonstrates 2 steps of interval halving.',
  },
  {
    name: 'First Element (search 3)',
    array: [3, 9, 14, 19, 27, 35, 42, 60],
    target: 3,
    description: 'Target is at index 0; tests lower boundary navigation.',
  },
  {
    name: 'Last Element (search 99)',
    array: [10, 20, 30, 40, 50, 60, 70, 80, 99],
    target: 99,
    description: 'Target is at the final index; tests upper boundary navigation.',
  },
  {
    name: 'Target Absent (search 45)',
    array: [5, 12, 19, 26, 33, 40, 52, 67, 81],
    target: 45,
    description: 'Target lies between 40 and 52; demonstrates Low > High termination.',
  },
  {
    name: 'Single Element Found',
    array: [42],
    target: 42,
    description: 'Base case array of length 1 found in exactly 1 comparison.',
  },
  {
    name: 'Negative Numbers (search -5)',
    array: [-50, -20, -10, -5, 0, 15, 30],
    target: -5,
    description: 'Validates correct ordering and comparisons across negative integers.',
  },
];
