import { describe, it, expect } from 'vitest';
import {
  generateGraphSteps,
  buildAdjacencyList,
  validateGraph,
  GRAPH_PRESETS,
} from '../src/core/algorithms/graph';
import { VisualizerController } from '../src/core/engine/controller';

describe('Graph Traversal Algorithm & Step Generator Tests (BFS & DFS)', () => {
  const connectedPreset = GRAPH_PRESETS[0];

  describe('Graph Validation', () => {
    it('validates a correct graph without errors', () => {
      const res = validateGraph(connectedPreset.graph, connectedPreset.startNode);
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('rejects empty graph with no nodes', () => {
      const res = validateGraph({ nodes: [], edges: [] }, 'A');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('at least one node');
    });

    it('rejects start node not in nodes list', () => {
      const res = validateGraph(connectedPreset.graph, 'Z');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Start node 'Z' is not in the graph");
    });

    it('rejects edge referencing non-existent node', () => {
      const badGraph = {
        nodes: [{ id: 'A', label: 'A', x: 0, y: 0 }],
        edges: [{ from: 'A', to: 'B' }],
      };
      const res = validateGraph(badGraph, 'A');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("non-existent node: 'B'");
    });

    it('rejects duplicate node IDs', () => {
      const dupGraph = {
        nodes: [
          { id: 'A', label: 'A', x: 0, y: 0 },
          { id: 'A', label: 'A2', x: 10, y: 10 },
        ],
        edges: [],
      };
      const res = validateGraph(dupGraph, 'A');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Duplicate node IDs');
    });
  });

  describe('Adjacency list construction', () => {
    it('builds undirected sorted adjacency list accurately', () => {
      const adj = buildAdjacencyList(connectedPreset.graph);
      expect(adj.get('A')).toEqual(['B', 'D']);
      expect(adj.get('B')).toEqual(['A', 'C', 'E']);
      expect(adj.get('E')).toEqual(['B', 'C', 'D']);
    });
  });

  describe('Breadth-First Search (BFS)', () => {
    it('executes BFS on simple connected graph in level order', () => {
      const steps = generateGraphSteps(connectedPreset.graph, 'A', 'bfs');
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].actionType).toBe('INIT');

      const finalStep = steps[steps.length - 1];
      expect(finalStep.actionType).toBe('COMPLETE');
      // Starts with A, then neighbors B and D, then C and E
      expect(finalStep.state.traversalOrder[0]).toBe('A');
      expect(finalStep.state.traversalOrder.slice(1, 3)).toEqual(['B', 'D']);
      expect(finalStep.state.visitedNodes.length).toBe(5);
      expect(finalStep.state.unvisitedNodes.length).toBe(0);
    });

    it('handles cyclic graph without infinite looping in BFS', () => {
      const cyclicPreset = GRAPH_PRESETS.find(p => p.name.includes('Cycle'))!;
      const steps = generateGraphSteps(cyclicPreset.graph, 'A', 'bfs');
      const final = steps[steps.length - 1];
      expect(final.actionType).toBe('COMPLETE');
      // Traversal visits all 4 nodes exactly once
      expect(final.state.traversalOrder.length).toBe(4);
    });

    it('identifies unvisited nodes in disconnected graph during BFS', () => {
      const disconnectedPreset = GRAPH_PRESETS.find(p => p.name.includes('Disconnected'))!;
      const steps = generateGraphSteps(disconnectedPreset.graph, 'A', 'bfs');
      const final = steps[steps.length - 1];
      expect(final.actionType).toBe('COMPLETE');
      expect(final.state.traversalOrder).toEqual(['A', 'B', 'C']);
      expect(final.state.unvisitedNodes).toEqual(['D', 'E']);
      expect(final.narration).toContain('Disconnected node(s) [D, E]');
    });
  });

  describe('Depth-First Search (DFS)', () => {
    it('executes DFS on branching tree graph deeply before backtracking', () => {
      const treePreset = GRAPH_PRESETS.find(p => p.name.includes('Branching'))!;
      const steps = generateGraphSteps(treePreset.graph, 'A', 'dfs');
      expect(steps.length).toBeGreaterThan(0);

      const finalStep = steps[steps.length - 1];
      expect(finalStep.actionType).toBe('COMPLETE');
      expect(finalStep.state.traversalOrder[0]).toBe('A');
      // DFS explores B's subtree (D, E) before C
      expect(finalStep.state.traversalOrder).toEqual(['A', 'B', 'D', 'E', 'C', 'F']);
      expect(finalStep.state.visitedNodes.length).toBe(6);
    });

    it('handles cyclic graph without infinite looping in DFS', () => {
      const cyclicPreset = GRAPH_PRESETS.find(p => p.name.includes('Cycle'))!;
      const steps = generateGraphSteps(cyclicPreset.graph, 'A', 'dfs');
      const final = steps[steps.length - 1];
      expect(final.actionType).toBe('COMPLETE');
      expect(final.state.traversalOrder.length).toBe(4);
    });

    it('identifies unvisited nodes in disconnected graph during DFS', () => {
      const disconnectedPreset = GRAPH_PRESETS.find(p => p.name.includes('Disconnected'))!;
      const steps = generateGraphSteps(disconnectedPreset.graph, 'A', 'dfs');
      const final = steps[steps.length - 1];
      expect(final.actionType).toBe('COMPLETE');
      expect(final.state.traversalOrder).toEqual(['A', 'B', 'C']);
      expect(final.state.unvisitedNodes).toEqual(['D', 'E']);
    });
  });

  describe('Reversible Playback Integration', () => {
    it('VisualizerController supports stepping forward, backward, and reset with graph states', () => {
      const steps = generateGraphSteps(connectedPreset.graph, 'A', 'bfs');
      const controller = new VisualizerController(steps);

      expect(controller.currentState.currentStepIndex).toBe(0);
      expect(controller.currentStep.actionType).toBe('INIT');

      controller.stepForward();
      controller.stepForward();
      expect(controller.currentState.currentStepIndex).toBe(2);

      controller.stepBackward();
      expect(controller.currentState.currentStepIndex).toBe(1);

      controller.goToStep(steps.length - 1);
      expect(controller.currentState.currentStepIndex).toBe(steps.length - 1);
      expect(controller.currentStep.actionType).toBe('COMPLETE');

      controller.reset();
      expect(controller.currentState.currentStepIndex).toBe(0);
      expect(controller.currentStep.actionType).toBe('INIT');
    });
  });

  describe('All Graph Presets Validation', () => {
    it('all presets run cleanly across BFS and DFS', () => {
      for (const preset of GRAPH_PRESETS) {
        const bfsSteps = generateGraphSteps(preset.graph, preset.startNode, 'bfs');
        expect(bfsSteps.length).toBeGreaterThan(0);

        const dfsSteps = generateGraphSteps(preset.graph, preset.startNode, 'dfs');
        expect(dfsSteps.length).toBeGreaterThan(0);
      }
    });
  });
});
