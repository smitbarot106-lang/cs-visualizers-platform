import { describe, it, expect } from 'vitest';
import {
  generateSortingSteps,
  SORTING_METADATA,
  SORTING_PRESETS,
  type SortingAlgorithmType,
} from '../src/core/algorithms/sorting';
import { VisualizerController } from '../src/core/engine/controller';

function isArraySortedAscending(arr: readonly number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

describe('Sorting Algorithms Step Generator Tests', () => {
  const algorithms: SortingAlgorithmType[] = ['bubble', 'selection', 'insertion'];

  for (const algo of algorithms) {
    describe(`${SORTING_METADATA[algo].name}`, () => {
      it('handles empty array cleanly', () => {
        const steps = generateSortingSteps([], algo);
        expect(steps.length).toBe(1);
        expect(steps[0].actionType).toBe('COMPLETE');
        expect(steps[0].state.array).toEqual([]);
      });

      it('handles single-element array', () => {
        const steps = generateSortingSteps([42], algo);
        expect(steps.length).toBe(1);
        expect(steps[0].actionType).toBe('COMPLETE');
        expect(steps[0].state.array).toEqual([42]);
      });

      it('sorts a random unsorted array correctly', () => {
        const input = [64, 34, 25, 12, 22, 11, 90];
        const steps = generateSortingSteps(input, algo);
        const finalStep = steps[steps.length - 1];

        expect(finalStep.actionType).toBe('COMPLETE');
        expect(isArraySortedAscending(finalStep.state.array)).toBe(true);
        expect(finalStep.state.array).toEqual([11, 12, 22, 25, 34, 64, 90]);
      });

      it('sorts a reverse-sorted array correctly', () => {
        const input = [5, 4, 3, 2, 1];
        const steps = generateSortingSteps(input, algo);
        const finalStep = steps[steps.length - 1];

        expect(finalStep.actionType).toBe('COMPLETE');
        expect(isArraySortedAscending(finalStep.state.array)).toBe(true);
        expect(finalStep.state.array).toEqual([1, 2, 3, 4, 5]);
      });

      it('sorts an array with duplicate and negative numbers', () => {
        const input = [3, -1, 4, 3, -5, 0, 2];
        const steps = generateSortingSteps(input, algo);
        const finalStep = steps[steps.length - 1];

        expect(finalStep.actionType).toBe('COMPLETE');
        expect(isArraySortedAscending(finalStep.state.array)).toBe(true);
        expect(finalStep.state.array).toEqual([-5, -1, 0, 2, 3, 3, 4]);
      });

      it('handles all equal elements without issues', () => {
        const input = [7, 7, 7, 7];
        const steps = generateSortingSteps(input, algo);
        const finalStep = steps[steps.length - 1];

        expect(finalStep.actionType).toBe('COMPLETE');
        expect(finalStep.state.array).toEqual([7, 7, 7, 7]);
      });

      it('does not mutate the original input array object passed to generator', () => {
        const original = [9, 3, 7, 1];
        const originalCopy = [...original];
        generateSortingSteps(original, algo);
        expect(original).toEqual(originalCopy);
      });

      it('integrates with VisualizerController for step-by-step playback and exact state recovery', () => {
        const input = [5, 2, 4, 1];
        const steps = generateSortingSteps(input, algo);
        const controller = new VisualizerController(steps);

        expect(controller.currentState.currentStepIndex).toBe(0);
        expect(controller.currentStep.actionType).toBe('INIT');

        // Step forward multiple steps
        controller.stepForward();
        controller.stepForward();
        const currentIndex = controller.currentState.currentStepIndex;
        expect(currentIndex).toBe(2);

        // Step backward restores exact previous step
        controller.stepBackward();
        expect(controller.currentState.currentStepIndex).toBe(1);

        // Reset restores step 0
        controller.reset();
        expect(controller.currentState.currentStepIndex).toBe(0);
        expect(controller.currentStep.state.array).toEqual([5, 2, 4, 1]);
      });
    });
  }

  describe('Algorithm specific optimizations', () => {
    it('Bubble sort early exits in pass 1 on already sorted array', () => {
      const alreadySorted = [1, 2, 3, 4, 5];
      const steps = generateSortingSteps(alreadySorted, 'bubble');
      const finalStep = steps[steps.length - 1];
      expect(finalStep.actionType).toBe('COMPLETE');
      expect(finalStep.narration).toContain('Early termination');
      // Number of passes should be 1
      expect(finalStep.state.passes).toBe(1);
      expect(finalStep.state.swaps).toBe(0);
    });
  });

  describe('Sorting Presets Validation', () => {
    it('all presets work across all 3 algorithms', () => {
      for (const preset of SORTING_PRESETS) {
        for (const algo of algorithms) {
          const steps = generateSortingSteps(preset.array, algo);
          expect(steps.length).toBeGreaterThan(0);
          const final = steps[steps.length - 1];
          expect(isArraySortedAscending(final.state.array)).toBe(true);
        }
      }
    });
  });
});
