import { describe, it, expect } from 'vitest';
import {
  generateBinarySearchSteps,
  isSortedArray,
  BINARY_SEARCH_PRESETS,
} from '../src/core/algorithms/binary-search';
import { VisualizerController } from '../src/core/engine/controller';

describe('Binary Search Algorithm & Step Generator Tests', () => {
  it('validates sorted and unsorted arrays correctly', () => {
    expect(isSortedArray([1, 2, 3, 4, 5])).toBe(true);
    expect(isSortedArray([-10, -5, 0, 5, 10])).toBe(true);
    expect(isSortedArray([5, 5, 5, 5])).toBe(true); // duplicates non-decreasing
    expect(isSortedArray([1, 3, 2, 4])).toBe(false);
    expect(isSortedArray([10, 5, 1])).toBe(false);
  });

  it('handles empty input array safely', () => {
    const steps = generateBinarySearchSteps({ array: [], target: 42 });
    expect(steps.length).toBe(1);
    expect(steps[0].actionType).toBe('NOT_FOUND');
    expect(steps[0].state.foundIndex).toBeNull();
  });

  it('finds target at first position (index 0)', () => {
    const arr = [10, 20, 30, 40, 50, 60, 70];
    const steps = generateBinarySearchSteps({ array: arr, target: 10 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.actionType).toBe('FOUND');
    expect(lastStep.state.foundIndex).toBe(0);
    expect(lastStep.state.comparisons).toBeGreaterThan(0);
  });

  it('finds target at middle position', () => {
    const arr = [10, 20, 30, 40, 50];
    const steps = generateBinarySearchSteps({ array: arr, target: 30 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.actionType).toBe('FOUND');
    expect(lastStep.state.foundIndex).toBe(2);
    // Mid element matches immediately on first comparison
    expect(lastStep.state.comparisons).toBe(1);
  });

  it('finds target at last position (index n-1)', () => {
    const arr = [5, 15, 25, 35, 45, 55, 65];
    const steps = generateBinarySearchSteps({ array: arr, target: 65 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.actionType).toBe('FOUND');
    expect(lastStep.state.foundIndex).toBe(6);
  });

  it('reports target not found when absent', () => {
    const arr = [2, 4, 6, 8, 10];
    const steps = generateBinarySearchSteps({ array: arr, target: 5 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.actionType).toBe('NOT_FOUND');
    expect(lastStep.state.foundIndex).toBeNull();
    expect(lastStep.narration).toContain('does not exist');
  });

  it('handles single-element array found and not found', () => {
    const found = generateBinarySearchSteps({ array: [99], target: 99 });
    expect(found[found.length - 1].actionType).toBe('FOUND');
    expect(found[found.length - 1].state.foundIndex).toBe(0);

    const notFound = generateBinarySearchSteps({ array: [99], target: 100 });
    expect(notFound[notFound.length - 1].actionType).toBe('NOT_FOUND');
    expect(notFound[notFound.length - 1].state.foundIndex).toBeNull();
  });

  it('handles duplicate values correctly', () => {
    const arr = [1, 2, 2, 2, 3, 4, 5];
    const steps = generateBinarySearchSteps({ array: arr, target: 2 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.actionType).toBe('FOUND');
    expect(arr[lastStep.state.foundIndex!]).toBe(2);
  });

  it('handles negative numbers correctly', () => {
    const arr = [-30, -20, -10, 0, 10, 20];
    const steps = generateBinarySearchSteps({ array: arr, target: -20 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.actionType).toBe('FOUND');
    expect(lastStep.state.foundIndex).toBe(1);
  });

  it('integrates seamlessly with VisualizerController for O(1) reversible playback', () => {
    const arr = [2, 4, 6, 8, 10, 12, 14, 16];
    const steps = generateBinarySearchSteps({ array: arr, target: 14 });
    const controller = new VisualizerController(steps);

    expect(controller.currentState.currentStepIndex).toBe(0);
    expect(controller.currentStep.actionType).toBe('INIT');

    // Step forward
    controller.stepForward();
    expect(controller.currentState.currentStepIndex).toBe(1);
    expect(controller.currentStep.actionType).toBe('COMPARE');

    // Step backward restores exact previous step
    controller.stepBackward();
    expect(controller.currentState.currentStepIndex).toBe(0);
    expect(controller.currentStep.actionType).toBe('INIT');

    // Jump directly to end
    controller.goToStep(steps.length - 1);
    expect(controller.currentState.currentStepIndex).toBe(steps.length - 1);
    expect(controller.currentStep.actionType).toBe('FOUND');

    // Reset restores start
    controller.reset();
    expect(controller.currentState.currentStepIndex).toBe(0);
    expect(controller.currentState.isPlaying).toBe(false);
  });

  it('all predefined presets generate valid step sequences', () => {
    for (const preset of BINARY_SEARCH_PRESETS) {
      const steps = generateBinarySearchSteps({ array: preset.array, target: preset.target });
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].actionType).toBe('INIT');
    }
  });
});
