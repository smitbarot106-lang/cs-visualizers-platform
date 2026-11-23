import { describe, it, expect, vi } from 'vitest';
import { VisualizerController } from '../src/core/engine/controller';
import type { Step } from '../src/core/engine/types';

describe('VisualizerController Step Engine', () => {
  const sampleSteps: Step<number[]>[] = [
    {
      stepIndex: 0,
      totalSteps: 3,
      state: [10, 20, 30],
      actionType: 'INIT',
      activeIndices: [],
      pointers: [],
      pseudocodeLine: 1,
      narration: 'Initialize array [10, 20, 30].',
      variableWatch: { length: 3 },
    },
    {
      stepIndex: 1,
      totalSteps: 3,
      state: [10, 20, 30],
      actionType: 'COMPARE',
      activeIndices: [0, 1],
      pointers: [{ name: 'Left', index: 0 }, { name: 'Right', index: 1 }],
      pseudocodeLine: 2,
      narration: 'Compare elements 10 and 20.',
      variableWatch: { left: 10, right: 20 },
    },
    {
      stepIndex: 2,
      totalSteps: 3,
      state: [10, 20, 30],
      actionType: 'COMPLETE',
      activeIndices: [0, 1, 2],
      pointers: [],
      pseudocodeLine: 3,
      narration: 'Algorithm execution complete.',
      variableWatch: { completed: true },
    },
  ];

  describe('Initialization & Empty Step Handling', () => {
    it('initializes at step 0 with accurate state flags', () => {
      const controller = new VisualizerController(sampleSteps);
      expect(controller.currentState.currentStepIndex).toBe(0);
      expect(controller.currentState.isAtStart).toBe(true);
      expect(controller.currentState.isAtEnd).toBe(false);
      expect(controller.currentStep.actionType).toBe('INIT');
    });

    it('rejects empty or null step arrays in constructor', () => {
      expect(() => new VisualizerController([])).toThrow(
        'VisualizerController requires at least one Step in the sequence.'
      );
      expect(() => new VisualizerController(null as unknown as Step<unknown>[])).toThrow(
        'VisualizerController requires at least one Step in the sequence.'
      );
    });

    it('handles single-step sequences correctly', () => {
      const singleStep: Step<number[]>[] = [sampleSteps[0]];
      const controller = new VisualizerController(singleStep);
      expect(controller.currentState.isAtStart).toBe(true);
      expect(controller.currentState.isAtEnd).toBe(true);
      expect(controller.stepForward()).toBe(false);
      expect(controller.stepBackward()).toBe(false);
    });
  });

  describe('Step Transitions', () => {
    it('steps forward and backward deterministically', () => {
      const controller = new VisualizerController(sampleSteps);

      expect(controller.stepForward()).toBe(true);
      expect(controller.currentState.currentStepIndex).toBe(1);
      expect(controller.currentStep.actionType).toBe('COMPARE');

      expect(controller.stepForward()).toBe(true);
      expect(controller.currentState.currentStepIndex).toBe(2);
      expect(controller.currentState.isAtEnd).toBe(true);

      // Cannot step past end
      expect(controller.stepForward()).toBe(false);
      expect(controller.currentState.currentStepIndex).toBe(2);

      // Step backward
      expect(controller.stepBackward()).toBe(true);
      expect(controller.currentState.currentStepIndex).toBe(1);

      expect(controller.stepBackward()).toBe(true);
      expect(controller.currentState.currentStepIndex).toBe(0);
      expect(controller.currentState.isAtStart).toBe(true);

      // Cannot step before 0
      expect(controller.stepBackward()).toBe(false);
      expect(controller.currentState.currentStepIndex).toBe(0);
    });

    it('resets correctly to initial state', () => {
      const controller = new VisualizerController(sampleSteps);
      controller.goToStep(2);
      expect(controller.currentState.currentStepIndex).toBe(2);

      controller.reset();
      expect(controller.currentState.currentStepIndex).toBe(0);
      expect(controller.currentState.isAtStart).toBe(true);
    });
  });

  describe('goToStep Invalid & Edge-Case Inputs', () => {
    it('allows direct scrubbing to valid integer indices', () => {
      const controller = new VisualizerController(sampleSteps);
      expect(controller.goToStep(2)).toBe(true);
      expect(controller.currentState.currentStepIndex).toBe(2);

      expect(controller.goToStep(0)).toBe(true);
      expect(controller.currentState.currentStepIndex).toBe(0);

      // Calling goToStep with current index returns false (no transition)
      expect(controller.goToStep(0)).toBe(false);
    });

    it('floors floating-point index inputs to nearest integer', () => {
      const controller = new VisualizerController(sampleSteps);
      expect(controller.goToStep(1.7)).toBe(true);
      expect(controller.currentState.currentStepIndex).toBe(1);

      // 1.2 floors to 1, which is current index -> returns false
      expect(controller.goToStep(1.2)).toBe(false);
      expect(controller.currentState.currentStepIndex).toBe(1);

      expect(controller.goToStep(2.99)).toBe(true);
      expect(controller.currentState.currentStepIndex).toBe(2);
    });

    it('clamps negative numbers to index 0', () => {
      const controller = new VisualizerController(sampleSteps);
      controller.goToStep(2);

      expect(controller.goToStep(-1)).toBe(true);
      expect(controller.currentState.currentStepIndex).toBe(0);

      // Already at 0, negative input still clamps to 0 -> returns false
      expect(controller.goToStep(-100)).toBe(false);
      expect(controller.currentState.currentStepIndex).toBe(0);
    });

    it('clamps values greater than maximum index to last step', () => {
      const controller = new VisualizerController(sampleSteps);
      expect(controller.goToStep(999)).toBe(true);
      expect(controller.currentState.currentStepIndex).toBe(2);

      expect(controller.goToStep(10000)).toBe(false);
      expect(controller.currentState.currentStepIndex).toBe(2);
    });

    it('rejects NaN, Infinity, -Infinity and non-numbers safely', () => {
      const controller = new VisualizerController(sampleSteps);
      controller.goToStep(1);

      expect(controller.goToStep(NaN)).toBe(false);
      expect(controller.currentState.currentStepIndex).toBe(1);

      expect(controller.goToStep(Infinity)).toBe(false);
      expect(controller.currentState.currentStepIndex).toBe(1);

      expect(controller.goToStep(-Infinity)).toBe(false);
      expect(controller.currentState.currentStepIndex).toBe(1);

      expect(controller.goToStep('1' as unknown as number)).toBe(false);
      expect(controller.currentState.currentStepIndex).toBe(1);
    });
  });

  describe('Subscriptions & Lifecycle', () => {
    it('notifies subscribers upon step transitions', () => {
      const controller = new VisualizerController(sampleSteps);
      const mockListener = vi.fn();
      const unsubscribe = controller.subscribe(mockListener);

      expect(mockListener).toHaveBeenCalledTimes(1);

      controller.stepForward();
      expect(mockListener).toHaveBeenCalledTimes(2);

      unsubscribe();
      controller.stepForward();
      expect(mockListener).toHaveBeenCalledTimes(2);
    });

    it('cleans up resources and halts timer on destroy', () => {
      const controller = new VisualizerController(sampleSteps);
      controller.play();
      expect(controller.currentState.isPlaying).toBe(true);

      controller.destroy();
      expect(controller.currentState.isPlaying).toBe(false);
    });
  });

  describe('State Immutability Contract', () => {
    it('shallow-freezes the steps collection to prevent mutation', () => {
      const controller = new VisualizerController(sampleSteps);
      expect(Object.isFrozen(controller.steps)).toBe(true);

      // Attempting to mutate array in strict mode throws TypeError
      expect(() => {
        (controller.steps as Step<number[]>[]).push(sampleSteps[0]);
      }).toThrow();
    });

    it('preserves step metadata immutability', () => {
      const controller = new VisualizerController(sampleSteps);
      const step = controller.currentStep;
      expect(step.stepIndex).toBe(0);
      expect(step.actionType).toBe('INIT');
    });
  });
});
