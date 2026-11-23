// ============================================================================
// Interactive CS Visualizers & Developer Tools — Core Step Engine Types
// Architecture: Immutable Precomputed State Snapshots for O(1) Reversible Playback
// ============================================================================

/**
 * Standard classification of atomic algorithm operations.
 */
export type StepActionType =
  | 'INIT'
  | 'COMPARE'
  | 'SWAP'
  | 'SHIFT'
  | 'OVERWRITE'
  | 'VISIT'
  | 'ENQUEUE'
  | 'DEQUEUE'
  | 'PUSH'
  | 'POP'
  | 'FOUND'
  | 'NOT_FOUND'
  | 'COMPLETE';

/**
 * Visual metadata for pointer flags (e.g., Low, Mid, High, Left, Right, Pivot).
 */
export interface PointerInfo {
  name: string;
  color?: string;
  index: number;
}

/**
 * Key-value mapping of monitored runtime variables.
 */
export type VariableWatchMap = Record<string, string | number | boolean | null | undefined>;

/**
 * An individual micro-step in an algorithm execution.
 *
 * IMMUTABILITY CONTRACT:
 * - Level 1 (Collection): The steps array is shallow-frozen by VisualizerController (Object.freeze([...steps])).
 * - Level 2 (Metadata): Step properties (stepIndex, actionType, narration, etc.) are typed readonly.
 * - Level 3 (Payload): The state payload is typed Readonly<TState>. To avoid recursive freeze overhead
 *   on large data structures during 60fps playback, deep-freezing is not enforced at runtime by the controller.
 *   Step generators are contractually required to produce distinct, immutable state snapshots per step.
 */
export interface Step<TState> {
  /** 0-based index of this step in the execution sequence */
  readonly stepIndex: number;
  /** Total number of steps in the sequence */
  readonly totalSteps: number;
  /** Immutable snapshot of the data structure (array, tree, graph, etc.) */
  readonly state: Readonly<TState>;
  /** Action category for styling indicators */
  readonly actionType: StepActionType;
  /** Indices of elements currently active/highlighted in this step */
  readonly activeIndices: readonly number[];
  /** Named pointers currently positioned on the data structure */
  readonly pointers: readonly PointerInfo[];
  /** 1-based line number of synchronized pseudocode to highlight (0 if none) */
  readonly pseudocodeLine: number;
  /** Plain-English narration explaining what happened in this step */
  readonly narration: string;
  /** Snapshot of variable values at this specific step */
  readonly variableWatch: VariableWatchMap;
}

/**
 * Playback runtime state.
 */
export interface PlaybackState {
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly isPlaying: boolean;
  readonly speedMs: number;
  readonly isAtStart: boolean;
  readonly isAtEnd: boolean;
}

/**
 * Listener callback for playback state changes.
 */
export type PlaybackListener<TState> = (
  currentStep: Step<TState>,
  playbackState: PlaybackState
) => void;

/**
 * Visualizer Playback Controller interface.
 */
export interface IVisualizerController<TState> {
  readonly steps: readonly Step<TState>[];
  readonly currentState: PlaybackState;
  readonly currentStep: Step<TState>;

  play(): void;
  pause(): void;
  stepForward(): boolean;
  stepBackward(): boolean;
  /**
   * Jump directly to a step index.
   * - Rejects NaN, Infinity, -Infinity, and non-numeric inputs by returning false without state modification.
   * - Finite floating-point inputs are floored to the nearest lower integer (Math.floor).
   * - Clamps out-of-bounds inputs to [0, totalSteps - 1].
   * - Returns true if the current index changed; returns false if already at target or input was rejected.
   */
  goToStep(index: number): boolean;
  reset(): void;
  setSpeed(ms: number): void;
  subscribe(listener: PlaybackListener<TState>): () => void;
  destroy(): void;
}
