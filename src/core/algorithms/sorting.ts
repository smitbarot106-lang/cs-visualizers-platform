/**
 * Comparison Sorting Step Generator
 * Implements Bubble Sort, Selection Sort, and Insertion Sort.
 * Produces deterministic, immutable micro-steps for O(1) reversible playback.
 * Pure TypeScript, zero external dependencies.
 */

import type { Step } from '../engine/types';

export type SortingAlgorithmType = 'bubble' | 'selection' | 'insertion';

export interface SortingState {
  readonly array: readonly number[];
  readonly comparedIndices: readonly [number, number] | null;
  readonly swappedIndices: readonly [number, number] | null;
  readonly sortedIndices: readonly number[];
  readonly minOrKeyIndex: number | null;
  readonly comparisons: number;
  readonly swaps: number;
  readonly passes: number;
  readonly algorithm: SortingAlgorithmType;
}

export const SORTING_METADATA: Record<SortingAlgorithmType, {
  name: string;
  bestTime: string;
  averageTime: string;
  worstTime: string;
  spaceComplexity: string;
  isStable: boolean;
  isInPlace: boolean;
  pseudocode: readonly string[];
}> = {
  bubble: {
    name: 'Bubble Sort',
    bestTime: 'O(n)',
    averageTime: 'O(n²)',
    worstTime: 'O(n²)',
    spaceComplexity: 'O(1)',
    isStable: true,
    isInPlace: true,
    pseudocode: [
      'for i = 0 to n - 1:',
      '  swapped = false',
      '  for j = 0 to n - i - 2:',
      '    if array[j] > array[j + 1]:',
      '      swap(array[j], array[j + 1])',
      '      swapped = true',
      '  if not swapped: break // Early exit',
    ],
  },
  selection: {
    name: 'Selection Sort',
    bestTime: 'O(n²)',
    averageTime: 'O(n²)',
    worstTime: 'O(n²)',
    spaceComplexity: 'O(1)',
    isStable: false,
    isInPlace: true,
    pseudocode: [
      'for i = 0 to n - 1:',
      '  minIdx = i',
      '  for j = i + 1 to n - 1:',
      '    if array[j] < array[minIdx]:',
      '      minIdx = j // New minimum',
      '  if minIdx != i: swap(array[i], array[minIdx])',
      '  mark array[i] as sorted',
    ],
  },
  insertion: {
    name: 'Insertion Sort',
    bestTime: 'O(n)',
    averageTime: 'O(n²)',
    worstTime: 'O(n²)',
    spaceComplexity: 'O(1)',
    isStable: true,
    isInPlace: true,
    pseudocode: [
      'for i = 1 to n - 1:',
      '  key = array[i], j = i - 1',
      '  while j >= 0 and array[j] > key:',
      '    array[j + 1] = array[j] // Shift right',
      '    j = j - 1',
      '  array[j + 1] = key // Insert key',
      '  mark [0..i] as sorted',
    ],
  },
};

/**
 * Bubble Sort generator with early termination optimization.
 */
function generateBubbleSortSteps(inputArray: number[]): Step<SortingState>[] {
  const steps: Step<SortingState>[] = [];
  const arr = [...inputArray];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  const sortedIndices: number[] = [];

  if (n <= 1) {
    steps.push({
      stepIndex: 0,
      totalSteps: 1,
      state: {
        array: [...arr],
        comparedIndices: null,
        swappedIndices: null,
        sortedIndices: n === 1 ? [0] : [],
        minOrKeyIndex: null,
        comparisons: 0,
        swaps: 0,
        passes: 0,
        algorithm: 'bubble',
      },
      actionType: 'COMPLETE',
      activeIndices: n === 1 ? [0] : [],
      pointers: [],
      pseudocodeLine: 1,
      narration: n === 0 ? 'Array is empty. Already sorted.' : 'Single element array is trivially sorted.',
      variableWatch: { n, comparisons: 0, swaps: 0 },
    });
    return steps;
  }

  // Step 0: INIT
  steps.push({
    stepIndex: 0,
    totalSteps: 0,
    state: {
      array: [...arr],
      comparedIndices: null,
      swappedIndices: null,
      sortedIndices: [],
      minOrKeyIndex: null,
      comparisons: 0,
      swaps: 0,
      passes: 0,
      algorithm: 'bubble',
    },
    actionType: 'INIT',
    activeIndices: [],
    pointers: [],
    pseudocodeLine: 1,
    narration: `Starting Bubble Sort on ${n} elements. Iteratively bubbling the largest unsorted value to the end of the array.`,
    variableWatch: { n, comparisons: 0, swaps: 0, pass: 0 },
  });

  for (let i = 0; i < n; i++) {
    let swappedInPass = false;

    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      const valA = arr[j];
      const valB = arr[j + 1];

      // COMPARE step
      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        state: {
          array: [...arr],
          comparedIndices: [j, j + 1],
          swappedIndices: null,
          sortedIndices: [...sortedIndices],
          minOrKeyIndex: null,
          comparisons,
          swaps,
          passes: i + 1,
          algorithm: 'bubble',
        },
        actionType: 'COMPARE',
        activeIndices: [j, j + 1],
        pointers: [
          { name: 'j', index: j, color: 'cyan' },
          { name: 'j+1', index: j + 1, color: 'indigo' },
        ],
        pseudocodeLine: 4,
        narration: `Compare adjacent elements array[${j}] (${valA}) and array[${j + 1}] (${valB}).`,
        variableWatch: { i, j, 'array[j]': valA, 'array[j+1]': valB, comparisons, swaps },
      });

      if (valA > valB) {
        // SWAP step
        arr[j] = valB;
        arr[j + 1] = valA;
        swaps++;
        swappedInPass = true;

        steps.push({
          stepIndex: steps.length,
          totalSteps: 0,
          state: {
            array: [...arr],
            comparedIndices: [j, j + 1],
            swappedIndices: [j, j + 1],
            sortedIndices: [...sortedIndices],
            minOrKeyIndex: null,
            comparisons,
            swaps,
            passes: i + 1,
            algorithm: 'bubble',
          },
          actionType: 'SWAP',
          activeIndices: [j, j + 1],
          pointers: [
            { name: 'Swapped', index: j, color: 'amber' },
            { name: 'Swapped', index: j + 1, color: 'amber' },
          ],
          pseudocodeLine: 5,
          narration: `Swap array[${j}] (${valA}) and array[${j + 1}] (${valB}) because ${valA} > ${valB}.`,
          variableWatch: { i, j, comparisons, swaps, swapped: true },
        });
      }
    }

    // Mark the bubbled element as sorted
    const sortedIdx = n - i - 1;
    if (!sortedIndices.includes(sortedIdx)) {
      sortedIndices.push(sortedIdx);
    }

    if (!swappedInPass) {
      // Early exit optimization
      for (let k = 0; k < n; k++) {
        if (!sortedIndices.includes(k)) sortedIndices.push(k);
      }

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        state: {
          array: [...arr],
          comparedIndices: null,
          swappedIndices: null,
          sortedIndices: [...sortedIndices],
          minOrKeyIndex: null,
          comparisons,
          swaps,
          passes: i + 1,
          algorithm: 'bubble',
        },
        actionType: 'COMPLETE',
        activeIndices: Array.from({ length: n }, (_, idx) => idx),
        pointers: [],
        pseudocodeLine: 7,
        narration: `No swaps occurred during pass ${i + 1}. Early termination: array is fully sorted!`,
        variableWatch: { i, comparisons, swaps, earlyExit: true },
      });
      break;
    }
  }

  // Ensure all indices marked sorted at completion
  for (let k = 0; k < n; k++) {
    if (!sortedIndices.includes(k)) sortedIndices.push(k);
  }

  const lastStep = steps[steps.length - 1];
  if (lastStep.actionType !== 'COMPLETE') {
    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      state: {
        array: [...arr],
        comparedIndices: null,
        swappedIndices: null,
        sortedIndices: [...sortedIndices],
        minOrKeyIndex: null,
        comparisons,
        swaps,
        passes: n,
        algorithm: 'bubble',
      },
      actionType: 'COMPLETE',
      activeIndices: Array.from({ length: n }, (_, idx) => idx),
      pointers: [],
      pseudocodeLine: 7,
      narration: `Bubble Sort complete! Total comparisons: ${comparisons}, swaps: ${swaps}.`,
      variableWatch: { comparisons, swaps, isSorted: true },
    });
  }

  return steps;
}

/**
 * Selection Sort generator.
 */
function generateSelectionSortSteps(inputArray: number[]): Step<SortingState>[] {
  const steps: Step<SortingState>[] = [];
  const arr = [...inputArray];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  const sortedIndices: number[] = [];

  if (n <= 1) {
    steps.push({
      stepIndex: 0,
      totalSteps: 1,
      state: {
        array: [...arr],
        comparedIndices: null,
        swappedIndices: null,
        sortedIndices: n === 1 ? [0] : [],
        minOrKeyIndex: null,
        comparisons: 0,
        swaps: 0,
        passes: 0,
        algorithm: 'selection',
      },
      actionType: 'COMPLETE',
      activeIndices: n === 1 ? [0] : [],
      pointers: [],
      pseudocodeLine: 1,
      narration: n === 0 ? 'Array is empty.' : 'Single element array is trivially sorted.',
      variableWatch: { n, comparisons: 0, swaps: 0 },
    });
    return steps;
  }

  // Step 0: INIT
  steps.push({
    stepIndex: 0,
    totalSteps: 0,
    state: {
      array: [...arr],
      comparedIndices: null,
      swappedIndices: null,
      sortedIndices: [],
      minOrKeyIndex: null,
      comparisons: 0,
      swaps: 0,
      passes: 0,
      algorithm: 'selection',
    },
    actionType: 'INIT',
    activeIndices: [],
    pointers: [],
    pseudocodeLine: 1,
    narration: `Starting Selection Sort on ${n} elements. Finding the minimum element in the unsorted portion and moving it to position i.`,
    variableWatch: { n, comparisons: 0, swaps: 0 },
  });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    // Start of pass: set minIdx = i
    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      state: {
        array: [...arr],
        comparedIndices: null,
        swappedIndices: null,
        sortedIndices: [...sortedIndices],
        minOrKeyIndex: minIdx,
        comparisons,
        swaps,
        passes: i + 1,
        algorithm: 'selection',
      },
      actionType: 'INIT',
      activeIndices: [i],
      pointers: [
        { name: 'i', index: i, color: 'cyan' },
        { name: 'Min', index: minIdx, color: 'amber' },
      ],
      pseudocodeLine: 2,
      narration: `Pass ${i + 1}: Assume current element array[${i}] (${arr[i]}) is the minimum (minIdx = ${i}).`,
      variableWatch: { i, minIdx, 'array[minIdx]': arr[minIdx], comparisons, swaps },
    });

    for (let j = i + 1; j < n; j++) {
      comparisons++;
      const valJ = arr[j];
      const valMin = arr[minIdx];

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        state: {
          array: [...arr],
          comparedIndices: [j, minIdx],
          swappedIndices: null,
          sortedIndices: [...sortedIndices],
          minOrKeyIndex: minIdx,
          comparisons,
          swaps,
          passes: i + 1,
          algorithm: 'selection',
        },
        actionType: 'COMPARE',
        activeIndices: [j, minIdx],
        pointers: [
          { name: 'j', index: j, color: 'indigo' },
          { name: 'Min', index: minIdx, color: 'amber' },
        ],
        pseudocodeLine: 4,
        narration: `Compare candidate array[${j}] (${valJ}) with current minimum array[${minIdx}] (${valMin}).`,
        variableWatch: { i, j, minIdx, 'array[j]': valJ, 'array[minIdx]': valMin, comparisons, swaps },
      });

      if (valJ < valMin) {
        minIdx = j;
        steps.push({
          stepIndex: steps.length,
          totalSteps: 0,
          state: {
            array: [...arr],
            comparedIndices: null,
            swappedIndices: null,
            sortedIndices: [...sortedIndices],
            minOrKeyIndex: minIdx,
            comparisons,
            swaps,
            passes: i + 1,
            algorithm: 'selection',
          },
          actionType: 'SHIFT',
          activeIndices: [minIdx],
          pointers: [
            { name: 'i', index: i, color: 'cyan' },
            { name: 'New Min', index: minIdx, color: 'emerald' },
          ],
          pseudocodeLine: 5,
          narration: `Found new smaller element at index ${j} (${valJ})! Update minIdx to ${j}.`,
          variableWatch: { i, minIdx: j, 'newMin': valJ, comparisons, swaps },
        });
      }
    }

    if (minIdx !== i) {
      const temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
      swaps++;

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        state: {
          array: [...arr],
          comparedIndices: null,
          swappedIndices: [i, minIdx],
          sortedIndices: [...sortedIndices],
          minOrKeyIndex: minIdx,
          comparisons,
          swaps,
          passes: i + 1,
          algorithm: 'selection',
        },
        actionType: 'SWAP',
        activeIndices: [i, minIdx],
        pointers: [
          { name: 'i', index: i, color: 'cyan' },
          { name: 'Min', index: minIdx, color: 'amber' },
        ],
        pseudocodeLine: 6,
        narration: `Swap minimum element array[${minIdx}] (${arr[i]}) into sorted position array[${i}].`,
        variableWatch: { i, minIdx, comparisons, swaps },
      });
    }

    sortedIndices.push(i);
  }

  sortedIndices.push(n - 1); // Last element is automatically in place

  steps.push({
    stepIndex: steps.length,
    totalSteps: 0,
    state: {
      array: [...arr],
      comparedIndices: null,
      swappedIndices: null,
      sortedIndices: [...sortedIndices],
      minOrKeyIndex: null,
      comparisons,
      swaps,
      passes: n - 1,
      algorithm: 'selection',
    },
    actionType: 'COMPLETE',
    activeIndices: Array.from({ length: n }, (_, idx) => idx),
    pointers: [],
    pseudocodeLine: 7,
    narration: `Selection Sort complete! Total comparisons: ${comparisons}, swaps: ${swaps}.`,
    variableWatch: { comparisons, swaps, isSorted: true },
  });

  return steps;
}

/**
 * Insertion Sort generator.
 */
function generateInsertionSortSteps(inputArray: number[]): Step<SortingState>[] {
  const steps: Step<SortingState>[] = [];
  const arr = [...inputArray];
  const n = arr.length;
  let comparisons = 0;
  let shifts = 0;
  const sortedIndices: number[] = [0]; // First element is trivially sorted

  if (n <= 1) {
    steps.push({
      stepIndex: 0,
      totalSteps: 1,
      state: {
        array: [...arr],
        comparedIndices: null,
        swappedIndices: null,
        sortedIndices: n === 1 ? [0] : [],
        minOrKeyIndex: null,
        comparisons: 0,
        swaps: 0,
        passes: 0,
        algorithm: 'insertion',
      },
      actionType: 'COMPLETE',
      activeIndices: n === 1 ? [0] : [],
      pointers: [],
      pseudocodeLine: 1,
      narration: n === 0 ? 'Array is empty.' : 'Single element array is trivially sorted.',
      variableWatch: { n, comparisons: 0, shifts: 0 },
    });
    return steps;
  }

  // Step 0: INIT
  steps.push({
    stepIndex: 0,
    totalSteps: 0,
    state: {
      array: [...arr],
      comparedIndices: null,
      swappedIndices: null,
      sortedIndices: [0],
      minOrKeyIndex: null,
      comparisons: 0,
      swaps: 0,
      passes: 0,
      algorithm: 'insertion',
    },
    actionType: 'INIT',
    activeIndices: [0],
    pointers: [{ name: 'Sorted', index: 0, color: 'emerald' }],
    pseudocodeLine: 1,
    narration: `Starting Insertion Sort. Element array[0] (${arr[0]}) forms initial 1-element sorted subarray.`,
    variableWatch: { n, comparisons: 0, shifts: 0 },
  });

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;

    // Pick Key step
    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      state: {
        array: [...arr],
        comparedIndices: null,
        swappedIndices: null,
        sortedIndices: [...sortedIndices],
        minOrKeyIndex: i,
        comparisons,
        swaps: shifts,
        passes: i,
        algorithm: 'insertion',
      },
      actionType: 'INIT',
      activeIndices: [i],
      pointers: [
        { name: 'Key', index: i, color: 'amber' },
      ],
      pseudocodeLine: 2,
      narration: `Select array[${i}] (${key}) as the Key to insert into the sorted left portion [0..${i - 1}].`,
      variableWatch: { i, key, j, comparisons, shifts },
    });

    while (j >= 0) {
      comparisons++;
      const valJ = arr[j];

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        state: {
          array: [...arr],
          comparedIndices: [j, j + 1],
          swappedIndices: null,
          sortedIndices: [...sortedIndices],
          minOrKeyIndex: j + 1,
          comparisons,
          swaps: shifts,
          passes: i,
          algorithm: 'insertion',
        },
        actionType: 'COMPARE',
        activeIndices: [j, j + 1],
        pointers: [
          { name: 'j', index: j, color: 'cyan' },
          { name: 'Key', index: j + 1, color: 'amber' },
        ],
        pseudocodeLine: 3,
        narration: `Compare sorted element array[${j}] (${valJ}) with Key (${key}).`,
        variableWatch: { i, j, 'array[j]': valJ, key, comparisons, shifts },
      });

      if (valJ > key) {
        // Shift right
        arr[j + 1] = arr[j];
        shifts++;

        steps.push({
          stepIndex: steps.length,
          totalSteps: 0,
          state: {
            array: [...arr],
            comparedIndices: null,
            swappedIndices: [j, j + 1],
            sortedIndices: [...sortedIndices],
            minOrKeyIndex: j,
            comparisons,
            swaps: shifts,
            passes: i,
            algorithm: 'insertion',
          },
          actionType: 'SHIFT',
          activeIndices: [j, j + 1],
          pointers: [
            { name: 'Shifted', index: j + 1, color: 'indigo' },
          ],
          pseudocodeLine: 4,
          narration: `Since ${valJ} > Key (${key}), shift array[${j}] (${valJ}) right to index ${j + 1}.`,
          variableWatch: { i, j, key, shiftedVal: valJ, shifts },
        });

        j--;
      } else {
        // Found correct position
        break;
      }
    }

    arr[j + 1] = key;
    sortedIndices.push(i);

    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      state: {
        array: [...arr],
        comparedIndices: null,
        swappedIndices: null,
        sortedIndices: Array.from({ length: i + 1 }, (_, idx) => idx),
        minOrKeyIndex: j + 1,
        comparisons,
        swaps: shifts,
        passes: i,
        algorithm: 'insertion',
      },
      actionType: 'OVERWRITE',
      activeIndices: [j + 1],
      pointers: [
        { name: 'Inserted', index: j + 1, color: 'emerald' },
      ],
      pseudocodeLine: 6,
      narration: `Insert Key (${key}) at position ${j + 1}. Subarray [0..${i}] is now sorted.`,
      variableWatch: { i, insertedAt: j + 1, key, comparisons, shifts },
    });
  }

  steps.push({
    stepIndex: steps.length,
    totalSteps: 0,
    state: {
      array: [...arr],
      comparedIndices: null,
      swappedIndices: null,
      sortedIndices: Array.from({ length: n }, (_, idx) => idx),
      minOrKeyIndex: null,
      comparisons,
      swaps: shifts,
      passes: n - 1,
      algorithm: 'insertion',
    },
    actionType: 'COMPLETE',
    activeIndices: Array.from({ length: n }, (_, idx) => idx),
    pointers: [],
    pseudocodeLine: 7,
    narration: `Insertion Sort complete! Total comparisons: ${comparisons}, shifts: ${shifts}.`,
    variableWatch: { comparisons, shifts, isSorted: true },
  });

  return steps;
}

/**
 * Universal dispatcher for all three approved sorting algorithms.
 */
export function generateSortingSteps(
  array: number[],
  algorithm: SortingAlgorithmType
): Step<SortingState>[] {
  let steps: Step<SortingState>[];

  if (algorithm === 'bubble') {
    steps = generateBubbleSortSteps(array);
  } else if (algorithm === 'selection') {
    steps = generateSelectionSortSteps(array);
  } else if (algorithm === 'insertion') {
    steps = generateInsertionSortSteps(array);
  } else {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  const total = steps.length;
  return steps.map((s, idx) => ({
    ...s,
    stepIndex: idx,
    totalSteps: total,
  }));
}

/**
 * Predefined test presets for sorting.
 */
export const SORTING_PRESETS = [
  {
    name: 'Random (7 items)',
    array: [45, 12, 85, 32, 89, 39, 69],
    description: 'General case demonstrating typical comparisons and swaps.',
  },
  {
    name: 'Nearly Sorted',
    array: [10, 20, 40, 30, 50, 60, 70],
    description: 'Demonstrates O(n) early termination in Bubble & Insertion sort.',
  },
  {
    name: 'Reversed Array',
    array: [70, 60, 50, 40, 30, 20, 10],
    description: 'Worst-case scenario with maximum comparisons and swaps.',
  },
  {
    name: 'Duplicate Elements',
    array: [30, 10, 40, 10, 50, 30, 20],
    description: 'Demonstrates algorithm stability with identical element values.',
  },
  {
    name: 'All Equal Elements',
    array: [25, 25, 25, 25, 25],
    description: 'Edge case where elements are identical; no swaps should occur.',
  },
  {
    name: 'Small Array (4 items)',
    array: [4, 2, 3, 1],
    description: 'Compact walkthrough ideal for beginners analyzing every swap.',
  },
];
