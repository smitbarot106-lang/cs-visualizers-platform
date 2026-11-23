/**
 * Graph Traversal Step Generator (BFS & DFS)
 * Produces deterministic, immutable micro-steps for O(1) reversible playback.
 * Pure TypeScript, zero external dependencies.
 */

import type { Step } from '../engine/types';

export type GraphAlgorithmType = 'bfs' | 'dfs';

export interface GraphNode {
  readonly id: string;
  readonly label: string;
  readonly x: number; // 0 to 100 percentage for SVG positioning
  readonly y: number; // 0 to 100 percentage for SVG positioning
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
}

export interface GraphData {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

export interface GraphState {
  readonly graph: GraphData;
  readonly startNode: string;
  readonly currentNode: string | null;
  readonly examiningNeighbor: string | null;
  readonly activeEdge: readonly [string, string] | null;
  readonly visitedNodes: readonly string[];
  readonly traversalOrder: readonly string[];
  readonly queueOrStack: readonly string[];
  readonly algorithm: GraphAlgorithmType;
  readonly unvisitedNodes: readonly string[];
}

export const GRAPH_METADATA: Record<GraphAlgorithmType, {
  name: string;
  dataStructure: 'Queue (FIFO)' | 'Stack (LIFO)';
  timeComplexity: string;
  spaceComplexity: string;
  pseudocode: readonly string[];
}> = {
  bfs: {
    name: 'Breadth-First Search (BFS)',
    dataStructure: 'Queue (FIFO)',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    pseudocode: [
      'queue = [startNode], visited = {startNode}',
      'while queue is not empty:',
      '  current = queue.dequeue()',
      '  process(current)',
      '  for each neighbor of current:',
      '    if neighbor not in visited:',
      '      visited.add(neighbor)',
      '      queue.enqueue(neighbor)',
    ],
  },
  dfs: {
    name: 'Depth-First Search (DFS)',
    dataStructure: 'Stack (LIFO)',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    pseudocode: [
      'stack = [startNode], visited = {}',
      'while stack is not empty:',
      '  current = stack.pop()',
      '  if current not in visited:',
      '    visited.add(current)',
      '    process(current)',
      '    for each neighbor of current (reversed):',
      '      if neighbor not in visited: stack.push(neighbor)',
    ],
  },
};

/**
 * Builds an undirected adjacency list from graph nodes and edges.
 * Neighbors are sorted alphabetically for deterministic traversal.
 */
export function buildAdjacencyList(graph: GraphData): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }

  for (const edge of graph.edges) {
    if (adj.has(edge.from) && adj.has(edge.to)) {
      if (!adj.get(edge.from)!.includes(edge.to)) {
        adj.get(edge.from)!.push(edge.to);
      }
      if (!adj.get(edge.to)!.includes(edge.from)) {
        adj.get(edge.to)!.push(edge.from);
      }
    }
  }

  // Sort neighbors for deterministic execution
  for (const [key, neighbors] of adj.entries()) {
    adj.set(key, neighbors.sort());
  }

  return adj;
}

/**
 * Validates a graph data structure.
 */
export function validateGraph(graph: GraphData, startNode: string): { isValid: boolean; error?: string } {
  if (!graph.nodes || graph.nodes.length === 0) {
    return { isValid: false, error: 'Graph must contain at least one node.' };
  }

  const nodeIds = new Set(graph.nodes.map(n => n.id));
  if (nodeIds.size !== graph.nodes.length) {
    return { isValid: false, error: 'Duplicate node IDs detected in graph.' };
  }

  if (!nodeIds.has(startNode)) {
    return { isValid: false, error: `Start node '${startNode}' is not in the graph nodes list.` };
  }

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from)) {
      return { isValid: false, error: `Edge references non-existent node: '${edge.from}'.` };
    }
    if (!nodeIds.has(edge.to)) {
      return { isValid: false, error: `Edge references non-existent node: '${edge.to}'.` };
    }
  }

  return { isValid: true };
}

/**
 * Breadth-First Search step generator.
 */
function generateBFSSteps(graph: GraphData, startNode: string): Step<GraphState>[] {
  const steps: Step<GraphState>[] = [];
  const adj = buildAdjacencyList(graph);
  const allNodeIds = graph.nodes.map(n => n.id);

  const queue: string[] = [startNode];
  const visited: string[] = [startNode];
  const traversalOrder: string[] = [];

  // Step 0: INIT
  steps.push({
    stepIndex: 0,
    totalSteps: 0,
    state: {
      graph,
      startNode,
      currentNode: null,
      examiningNeighbor: null,
      activeEdge: null,
      visitedNodes: [startNode],
      traversalOrder: [],
      queueOrStack: [startNode],
      algorithm: 'bfs',
      unvisitedNodes: allNodeIds.filter(id => id !== startNode),
    },
    actionType: 'INIT',
    activeIndices: [],
    pointers: [{ name: 'Start', index: 0, color: 'cyan' }],
    pseudocodeLine: 1,
    narration: `Initialize BFS: Enqueue start node (${startNode}) and mark it as visited. Queue = [${startNode}].`,
    variableWatch: { current: null, queue: `[${startNode}]`, visited: `{${startNode}}`, order: '[]' },
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    traversalOrder.push(current);

    // Step: Dequeue and visit
    steps.push({
      stepIndex: steps.length,
      totalSteps: 0,
      state: {
        graph,
        startNode,
        currentNode: current,
        examiningNeighbor: null,
        activeEdge: null,
        visitedNodes: [...visited],
        traversalOrder: [...traversalOrder],
        queueOrStack: [...queue],
        algorithm: 'bfs',
        unvisitedNodes: allNodeIds.filter(id => !visited.includes(id)),
      },
      actionType: 'DEQUEUE',
      activeIndices: [],
      pointers: [{ name: 'Current', index: 0, color: 'emerald' }],
      pseudocodeLine: 3,
      narration: `Dequeue front element (${current}). Process node ${current}. Current traversal order: ${traversalOrder.join(' → ')}.`,
      variableWatch: { current, queue: `[${queue.join(', ')}]`, visited: `{${visited.join(', ')}}`, order: traversalOrder.join(', ') },
    });

    const neighbors = adj.get(current) ?? [];
    for (const neighbor of neighbors) {
      // Step: Inspect neighbor edge
      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        state: {
          graph,
          startNode,
          currentNode: current,
          examiningNeighbor: neighbor,
          activeEdge: [current, neighbor],
          visitedNodes: [...visited],
          traversalOrder: [...traversalOrder],
          queueOrStack: [...queue],
          algorithm: 'bfs',
          unvisitedNodes: allNodeIds.filter(id => !visited.includes(id)),
        },
        actionType: 'COMPARE',
        activeIndices: [],
        pointers: [
          { name: 'From', index: 0, color: 'emerald' },
          { name: 'To', index: 1, color: 'amber' },
        ],
        pseudocodeLine: 5,
        narration: `Examine edge (${current} — ${neighbor}). Check if neighbor ${neighbor} has been visited.`,
        variableWatch: { current, neighbor, 'alreadyVisited?': visited.includes(neighbor) },
      });

      if (!visited.includes(neighbor)) {
        visited.push(neighbor);
        queue.push(neighbor);

        steps.push({
          stepIndex: steps.length,
          totalSteps: 0,
          state: {
            graph,
            startNode,
            currentNode: current,
            examiningNeighbor: neighbor,
            activeEdge: [current, neighbor],
            visitedNodes: [...visited],
            traversalOrder: [...traversalOrder],
            queueOrStack: [...queue],
            algorithm: 'bfs',
            unvisitedNodes: allNodeIds.filter(id => !visited.includes(id)),
          },
          actionType: 'ENQUEUE',
          activeIndices: [],
          pointers: [{ name: 'Enqueued', index: 0, color: 'indigo' }],
          pseudocodeLine: 8,
          narration: `Neighbor ${neighbor} is unvisited. Mark ${neighbor} as visited and enqueue it. Queue = [${queue.join(', ')}].`,
          variableWatch: { current, neighbor, queue: `[${queue.join(', ')}]`, visited: `{${visited.join(', ')}}` },
        });
      }
    }
  }

  const unvisited = allNodeIds.filter(id => !visited.includes(id));
  const completeNarration = unvisited.length > 0
    ? `BFS traversal finished for connected component! Visited: ${traversalOrder.join(' → ')}. Note: Disconnected node(s) [${unvisited.join(', ')}] were unreachable from start node ${startNode}.`
    : `BFS traversal complete! All ${visited.length} reachable nodes visited in level-order: ${traversalOrder.join(' → ')}.`;

  steps.push({
    stepIndex: steps.length,
    totalSteps: 0,
    state: {
      graph,
      startNode,
      currentNode: null,
      examiningNeighbor: null,
      activeEdge: null,
      visitedNodes: [...visited],
      traversalOrder: [...traversalOrder],
      queueOrStack: [],
      algorithm: 'bfs',
      unvisitedNodes: unvisited,
    },
    actionType: 'COMPLETE',
    activeIndices: [],
    pointers: [],
    pseudocodeLine: 2,
    narration: completeNarration,
    variableWatch: { traversalOrder: traversalOrder.join(' → '), unreached: unvisited.join(', ') || 'none' },
  });

  return steps;
}

/**
 * Depth-First Search step generator.
 */
function generateDFSSteps(graph: GraphData, startNode: string): Step<GraphState>[] {
  const steps: Step<GraphState>[] = [];
  const adj = buildAdjacencyList(graph);
  const allNodeIds = graph.nodes.map(n => n.id);

  const stack: string[] = [startNode];
  const visited: string[] = [];
  const traversalOrder: string[] = [];

  // Step 0: INIT
  steps.push({
    stepIndex: 0,
    totalSteps: 0,
    state: {
      graph,
      startNode,
      currentNode: null,
      examiningNeighbor: null,
      activeEdge: null,
      visitedNodes: [],
      traversalOrder: [],
      queueOrStack: [startNode],
      algorithm: 'dfs',
      unvisitedNodes: [...allNodeIds],
    },
    actionType: 'INIT',
    activeIndices: [],
    pointers: [{ name: 'Start', index: 0, color: 'cyan' }],
    pseudocodeLine: 1,
    narration: `Initialize DFS: Push start node (${startNode}) onto the call stack. Stack = [${startNode}].`,
    variableWatch: { stack: `[${startNode}]`, visited: '{}', order: '[]' },
  });

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (!visited.includes(current)) {
      visited.push(current);
      traversalOrder.push(current);

      steps.push({
        stepIndex: steps.length,
        totalSteps: 0,
        state: {
          graph,
          startNode,
          currentNode: current,
          examiningNeighbor: null,
          activeEdge: null,
          visitedNodes: [...visited],
          traversalOrder: [...traversalOrder],
          queueOrStack: [...stack],
          algorithm: 'dfs',
          unvisitedNodes: allNodeIds.filter(id => !visited.includes(id)),
        },
        actionType: 'VISIT',
        activeIndices: [],
        pointers: [{ name: 'Visiting', index: 0, color: 'purple' }],
        pseudocodeLine: 5,
        narration: `Pop top of stack: Visit node ${current}. Current path traversal: ${traversalOrder.join(' → ')}.`,
        variableWatch: { current, stack: `[${stack.join(', ')}]`, visited: `{${visited.join(', ')}}`, order: traversalOrder.join(', ') },
      });

      // Get neighbors and push in reverse order so earlier alphabetical neighbors are popped first
      const neighbors = [...(adj.get(current) ?? [])].reverse();

      for (const neighbor of neighbors) {
        steps.push({
          stepIndex: steps.length,
          totalSteps: 0,
          state: {
            graph,
            startNode,
            currentNode: current,
            examiningNeighbor: neighbor,
            activeEdge: [current, neighbor],
            visitedNodes: [...visited],
            traversalOrder: [...traversalOrder],
            queueOrStack: [...stack],
            algorithm: 'dfs',
            unvisitedNodes: allNodeIds.filter(id => !visited.includes(id)),
          },
          actionType: 'COMPARE',
          activeIndices: [],
          pointers: [
            { name: 'From', index: 0, color: 'purple' },
            { name: 'To', index: 1, color: 'amber' },
          ],
          pseudocodeLine: 7,
          narration: `Inspect branch edge (${current} — ${neighbor}). Check if neighbor ${neighbor} is already visited.`,
          variableWatch: { current, neighbor, 'visited?': visited.includes(neighbor) },
        });

        if (!visited.includes(neighbor)) {
          stack.push(neighbor);

          steps.push({
            stepIndex: steps.length,
            totalSteps: 0,
            state: {
              graph,
              startNode,
              currentNode: current,
              examiningNeighbor: neighbor,
              activeEdge: [current, neighbor],
              visitedNodes: [...visited],
              traversalOrder: [...traversalOrder],
              queueOrStack: [...stack],
              algorithm: 'dfs',
              unvisitedNodes: allNodeIds.filter(id => !visited.includes(id)),
            },
            actionType: 'PUSH',
            activeIndices: [],
            pointers: [{ name: 'Pushed', index: 0, color: 'indigo' }],
            pseudocodeLine: 8,
            narration: `Push neighbor ${neighbor} onto the LIFO stack to explore this branch deeply. Stack = [${stack.join(', ')}].`,
            variableWatch: { current, neighbor, stack: `[${stack.join(', ')}]`, visited: `{${visited.join(', ')}}` },
          });
        }
      }
    }
  }

  const unvisited = allNodeIds.filter(id => !visited.includes(id));
  const completeNarration = unvisited.length > 0
    ? `DFS traversal finished for connected component! Visited: ${traversalOrder.join(' → ')}. Unreached: [${unvisited.join(', ')}].`
    : `DFS traversal complete! All ${visited.length} reachable nodes explored deeply: ${traversalOrder.join(' → ')}.`;

  steps.push({
    stepIndex: steps.length,
    totalSteps: 0,
    state: {
      graph,
      startNode,
      currentNode: null,
      examiningNeighbor: null,
      activeEdge: null,
      visitedNodes: [...visited],
      traversalOrder: [...traversalOrder],
      queueOrStack: [],
      algorithm: 'dfs',
      unvisitedNodes: unvisited,
    },
    actionType: 'COMPLETE',
    activeIndices: [],
    pointers: [],
    pseudocodeLine: 2,
    narration: completeNarration,
    variableWatch: { traversalOrder: traversalOrder.join(' → '), unreached: unvisited.join(', ') || 'none' },
  });

  return steps;
}

/**
 * Universal dispatcher for Graph traversal algorithms (BFS and DFS).
 */
export function generateGraphSteps(
  graph: GraphData,
  startNode: string,
  algorithm: GraphAlgorithmType
): Step<GraphState>[] {
  const validation = validateGraph(graph, startNode);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const steps = algorithm === 'bfs'
    ? generateBFSSteps(graph, startNode)
    : generateDFSSteps(graph, startNode);

  const total = steps.length;
  return steps.map((s, idx) => ({
    ...s,
    stepIndex: idx,
    totalSteps: total,
  }));
}

/**
 * Predefined beginner-friendly preset graphs.
 */
export const GRAPH_PRESETS: {
  name: string;
  description: string;
  startNode: string;
  graph: GraphData;
}[] = [
  {
    name: 'Simple Connected Graph',
    description: 'A 5-node connected mesh. Demonstrates basic neighbor exploration and level-by-level queue expansion.',
    startNode: 'A',
    graph: {
      nodes: [
        { id: 'A', label: 'A', x: 20, y: 30 },
        { id: 'B', label: 'B', x: 50, y: 15 },
        { id: 'C', label: 'C', x: 80, y: 30 },
        { id: 'D', label: 'D', x: 35, y: 75 },
        { id: 'E', label: 'E', x: 65, y: 75 },
      ],
      edges: [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'D' },
        { from: 'B', to: 'C' },
        { from: 'B', to: 'E' },
        { from: 'D', to: 'E' },
        { from: 'C', to: 'E' },
      ],
    },
  },
  {
    name: 'Branching Tree Graph',
    description: 'Hierarchical tree structure. Contrasts BFS level-order visits with DFS deep branch exploration.',
    startNode: 'A',
    graph: {
      nodes: [
        { id: 'A', label: 'Root (A)', x: 50, y: 15 },
        { id: 'B', label: 'B', x: 25, y: 45 },
        { id: 'C', label: 'C', x: 75, y: 45 },
        { id: 'D', label: 'D', x: 15, y: 80 },
        { id: 'E', label: 'E', x: 35, y: 80 },
        { id: 'F', label: 'F', x: 85, y: 80 },
      ],
      edges: [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'C' },
        { from: 'B', to: 'D' },
        { from: 'B', to: 'E' },
        { from: 'C', to: 'F' },
      ],
    },
  },
  {
    name: 'Graph with Cycle',
    description: 'Contains a triangle cycle (A–B–C–A). Demonstrates how the visited set prevents infinite loops.',
    startNode: 'A',
    graph: {
      nodes: [
        { id: 'A', label: 'A', x: 25, y: 25 },
        { id: 'B', label: 'B', x: 75, y: 25 },
        { id: 'C', label: 'C', x: 50, y: 65 },
        { id: 'D', label: 'D', x: 85, y: 75 },
      ],
      edges: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'C', to: 'A' }, // Cycle back to A
        { from: 'C', to: 'D' },
      ],
    },
  },
  {
    name: 'Disconnected Graph',
    description: 'Two separate components (A–B–C and isolated D–E). Shows that single traversal only reaches connected nodes.',
    startNode: 'A',
    graph: {
      nodes: [
        { id: 'A', label: 'A', x: 20, y: 25 },
        { id: 'B', label: 'B', x: 45, y: 25 },
        { id: 'C', label: 'C', x: 32, y: 70 },
        { id: 'D', label: 'D', x: 75, y: 45 },
        { id: 'E', label: 'E', x: 90, y: 75 },
      ],
      edges: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'A', to: 'C' },
        { from: 'D', to: 'E' }, // Component 2
      ],
    },
  },
];
