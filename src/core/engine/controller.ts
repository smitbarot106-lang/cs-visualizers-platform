// ============================================================================
// Interactive CS Visualizers & Developer Tools — Step Engine Controller
// Handles playback scheduling, forward/backward stepping, and subscriptions
// ============================================================================

import type {
  Step,
  PlaybackState,
  PlaybackListener,
  IVisualizerController,
} from './types';

export class VisualizerController<TState> implements IVisualizerController<TState> {
  private _steps: readonly Step<TState>[];
  private _currentIndex: number = 0;
  private _isPlaying: boolean = false;
  private _speedMs: number = 500;
  private _timerId: ReturnType<typeof setInterval> | null = null;
  private _listeners: Set<PlaybackListener<TState>> = new Set();

  constructor(steps: Step<TState>[], initialSpeedMs: number = 500) {
    if (!steps || steps.length === 0) {
      throw new Error('VisualizerController requires at least one Step in the sequence.');
    }
    this._steps = Object.freeze([...steps]);
    this._speedMs = Math.max(50, initialSpeedMs);
  }

  get steps(): readonly Step<TState>[] {
    return this._steps;
  }

  get currentStep(): Step<TState> {
    return this._steps[this._currentIndex];
  }

  get currentState(): PlaybackState {
    return {
      currentStepIndex: this._currentIndex,
      totalSteps: this._steps.length,
      isPlaying: this._isPlaying,
      speedMs: this._speedMs,
      isAtStart: this._currentIndex === 0,
      isAtEnd: this._currentIndex === this._steps.length - 1,
    };
  }

  public play(): void {
    if (this._isPlaying) return;
    if (this.currentState.isAtEnd) {
      this._currentIndex = 0;
    }
    this._isPlaying = true;
    this.notify();

    this._timerId = setInterval(() => {
      const moved = this.stepForward();
      if (!moved) {
        this.pause();
      }
    }, this._speedMs);
  }

  public pause(): void {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    if (this._timerId !== null) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
    this.notify();
  }

  public stepForward(): boolean {
    if (this._currentIndex < this._steps.length - 1) {
      this._currentIndex++;
      this.notify();
      return true;
    }
    return false;
  }

  public stepBackward(): boolean {
    if (this._currentIndex > 0) {
      this._currentIndex--;
      this.notify();
      return true;
    }
    return false;
  }

  public goToStep(index: number): boolean {
    if (typeof index !== 'number' || !Number.isFinite(index)) {
      return false;
    }
    const intIndex = Math.floor(index);
    const target = Math.max(0, Math.min(intIndex, this._steps.length - 1));
    if (target !== this._currentIndex) {
      this._currentIndex = target;
      this.notify();
      return true;
    }
    return false;
  }

  public reset(): void {
    this.pause();
    this._currentIndex = 0;
    this.notify();
  }

  public setSpeed(ms: number): void {
    this._speedMs = Math.max(50, ms);
    if (this._isPlaying) {
      this.pause();
      this.play();
    } else {
      this.notify();
    }
  }

  public subscribe(listener: PlaybackListener<TState>): () => void {
    this._listeners.add(listener);
    listener(this.currentStep, this.currentState);
    return () => {
      this._listeners.delete(listener);
    };
  }

  public destroy(): void {
    this.pause();
    this._listeners.clear();
  }

  private notify(): void {
    const step = this.currentStep;
    const state = this.currentState;
    for (const listener of this._listeners) {
      try {
        listener(step, state);
      } catch (err) {
        console.error('Error in visualizer playback listener:', err);
      }
    }
  }
}
