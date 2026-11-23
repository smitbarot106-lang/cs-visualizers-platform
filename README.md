# Interactive CS Visualizers & Privacy-First Developer Tools Platform

> **"Don't just see the answer — understand how it works."**

A modern, fast, educational computer science visualization and privacy-first developer utility suite. Built with Astro and pure TypeScript, running entirely client-side in the browser with zero backend telemetry and zero external font or script CDN dependencies.

---

## Table of Contents

- [Overview](#overview)
- [Target Audience](#target-audience)
- [V1 Feature Inventory](#v1-feature-inventory)
  - [Developer Tools](#developer-tools)
  - [Interactive Algorithm Visualizers](#interactive-algorithm-visualizers)
  - [Comprehensive Educational Guides](#comprehensive-educational-guides)
- [Complete Route Index (19 Routes)](#complete-route-index-19-routes)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Privacy & Security Architecture](#privacy--security-architecture)
- [Accessibility & Responsive Standards](#accessibility--responsive-standards)
- [Quickstart & Local Development](#quickstart--local-development)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Available Scripts](#available-scripts)
- [Repository Directory Structure](#repository-directory-structure)
- [V1 Baseline & Deferred V2 Scope](#v1-baseline--deferred-v2-scope)
- [License](#license)

---

## Overview

The **Interactive CS Visualizers & Privacy-First Developer Tools Platform** provides computer science students, educators, and software engineers with intuitive step-by-step algorithmic visualizations and essential developer utilities. 

Unlike traditional platforms that rely on remote server-side computation or heavy frontend runtimes, this platform executes 100% of its algorithms, parsing, and conversions directly inside the user's browser. It features the custom **Obsidian Algorithmic** theme inspired by modern design systems, offering high-contrast visual tokens, responsive layouts down to 320px mobile viewports, and zero telemetry tracking.

---

## Target Audience

- **Computer Science & IT Students:** Visualizing core algorithms (searching, sorting, graph traversal) with step-by-step state watches and execution queues.
- **Job Seekers & Technical Interviewees:** Reviewing time/space complexities and fundamental patterns with the Big-O cheat sheet and interactive controls.
- **Software Developers & Engineers:** Quick, secure JSON formatting/validation and base conversions with zero risk of transmitting sensitive data or tokens to third-party servers.
- **Educators & Mentors:** Clean, distraction-free visual demonstrations for classroom lectures and lab assignments.

---

## V1 Feature Inventory

### Developer Tools

1. **JSON Formatter & Validator** (`/tools/json-formatter/`)
   - **Syntax Diagnostics:** In-browser JSON parsing with exact line and column error pointers.
   - **Formatting Options:** 2-space indentation, 4-space indentation, and compact minification.
   - **Privacy Guarantee:** All parsing happens strictly in memory within the client browser. No data leaves the device.
   - **Productivity Controls:** One-click clipboard copy, clear canvas, and sample payload loading.

2. **Number Base Converter** (`/tools/number-base-converter/`)
   - **Multi-Radix Synchronization:** Simultaneous synchronized conversions across Binary (Base 2), Octal (Base 8), Decimal (Base 10), and Hexadecimal (Base 16).
   - **Arbitrary Precision:** Powered by native JavaScript `BigInt` arithmetic, eliminating 64-bit IEEE-754 precision loss for large integers.
   - **Pedagogical Breakdown:** Detailed conversion steps displaying repeated division algorithms and positional power-weight expansions.
   - **Quick Presets:** Instant loading of common byte-width limits (8-bit max, 16-bit max, 32-bit max, 64-bit max).

### Interactive Algorithm Visualizers

3. **Binary Search Visualizer** (`/visualizers/binary-search/`)
   - **Pointer Tracking:** Real-time visual tracking of `Low` (Cyan), `Mid` (Amber), and `High` (Purple) pointers, with `Found` target highlights (Emerald).
   - **Visual Elimination:** Automatic dimming and strikethrough of discarded search intervals.
   - **Playback Engine:** Play, pause, step forward, step backward, reset, and configurable execution speed (`0.5x`, `1.0x`, `2.0x`).
   - **Live State Inspection:** Synchronized pseudocode line highlighting, array element watch, and iteration counter.
   - **Dynamic Inputs:** Support for custom sorted arrays and target query values.

4. **Sorting Visualizer** (`/visualizers/sorting/`)
   - **Algorithms Implemented:** Bubble Sort, Selection Sort, and Insertion Sort.
   - **Dynamic Bar Rendering:** Scaled bar charts with active comparisons, swaps, and completed sorted states color-coded.
   - **Real-Time Metrics:** Live operation counters tracking exact comparisons and swaps.
   - **Array Generation:** Random array generation, custom comma-separated list input, and adjustable dataset sizes.

5. **Breadth-First (BFS) & Depth-First (DFS) Search Visualizer** (`/visualizers/bfs-dfs/`)
   - **Graph Topology:** Visual SVG node-and-edge layout featuring directed/undirected graphs.
   - **Data Structure Inspection:** Live visual representation of the BFS FIFO Queue vs. the DFS LIFO Call Stack.
   - **Traversal State:** Distinct color badges for Unvisited, Queued/Stacked, Currently Exploring, and Completed nodes.
   - **Educational Characteristics:** Accurate conceptual breakdowns (e.g., BFS for unweighted shortest paths; DFS for cycle detection, topological sorting, and maze traversal).

### Comprehensive Educational Guides

The platform includes six in-depth, reference-grade educational guides complete with LaTeX mathematical formulas, algorithmic pseudocode, and complexity analysis:

1. **Binary Search Guide** (`/guides/binary-search/`) — Logarithmic divide-and-conquer principles, pointer mechanics, and overflow avoidance (`mid = low + (high - low) / 2`).
2. **Sorting Algorithms Guide** (`/guides/sorting-algorithms/`) — In-depth breakdown of Bubble, Selection, and Insertion sorts, comparing stability and inversion counts.
3. **Graph Traversal (BFS & DFS) Guide** (`/guides/bfs-dfs/`) — Frontier exploration mechanics, adjacency structures, queue vs. stack paradigms, and cycle prevention.
4. **JSON Fundamentals Guide** (`/guides/json-fundamentals/`) — ECMA-404 specification details, data types, parsing edge cases, security pitfalls, and valid schemas.
5. **Number Systems Guide** (`/guides/number-systems/`) — Radix arithmetic, binary two's complement representation, bitwise operations, and hex encoding.
6. **Big-O Cheat Sheet** (`/guides/big-o-cheat-sheet/`) — Asymptotic analysis summary table comparing Best, Average, and Worst case complexities ($O(1)$, $O(\log n)$, $O(n)$, $O(n \log n)$, $O(n^2)$) and spatial complexity.

---

## Complete Route Index (19 Routes)

All 19 routes are statically generated at build time using Astro SSG:

| Category | Route Path | Description |
| :--- | :--- | :--- |
| **Hubs & Entry** | `/` | Platform landing page, feature highlights, and tool index |
| | `/visualizers/` | Visualizers directory and algorithm catalog |
| | `/tools/` | Developer tools directory and utility catalog |
| | `/guides/` | Educational guides directory and curriculum index |
| **Visualizers** | `/visualizers/binary-search/` | Interactive Binary Search pointer visualizer |
| | `/visualizers/sorting/` | Interactive Bubble, Selection, & Insertion sorting visualizer |
| | `/visualizers/bfs-dfs/` | Interactive Breadth-First & Depth-First graph visualizer |
| **Developer Tools** | `/tools/json-formatter/` | Client-side JSON formatter, validator, and syntax checker |
| | `/tools/number-base-converter/` | Arbitrary precision multi-base conversion engine |
| **Guides** | `/guides/binary-search/` | Theoretical and practical guide to binary search |
| | `/guides/sorting-algorithms/` | Deep-dive guide to elementary sorting algorithms |
| | `/guides/bfs-dfs/` | Comprehensive guide to graph search and traversal |
| | `/guides/json-fundamentals/` | Specifications and parser reference for JSON |
| | `/guides/number-systems/` | Number systems, positional notation, and binary arithmetic |
| | `/guides/big-o-cheat-sheet/` | Algorithm time and space complexity reference sheet |
| **Platform** | `/about/` | Project mission, design philosophy, and architecture |
| | `/privacy/` | Zero-telemetry and client-side execution privacy policy |
| | `/terms/` | Open educational terms of service |
| | `/404` | Custom styled Obsidian 404 page |

---

## Architecture & Tech Stack

- **Static Site Generator:** [Astro](https://astro.build/) `v7.4.13` (Zero JS runtime baseline for static content).
- **Type Safety:** [TypeScript](https://www.typescriptlang.org/) `v5.7.3` configured under strict mode.
- **Client Execution Engines:** Vanilla TypeScript modules managing state machines, stepping histories, and DOM manipulation without heavy external framework overhead.
- **Mathematical Typesetting:** Native KaTeX rendering for mathematical notations and complexity bounds.
- **Testing Framework:** [Vitest](https://vitest.dev/) `v5.1.1` unit testing for conversion algorithms, search invariants, and sorting engines (107/107 automated tests).
- **Design System:** Custom **Obsidian Algorithmic** theme with system font stacks (`JetBrains Mono`, `Inter`, and system fallbacks), CSS Custom Properties, and zero runtime CSS frameworks.

---

## Privacy & Security Architecture

- **100% Client-Side Processing:** All conversions, algorithm simulations, and JSON parsing operations run exclusively in client memory within the user's browser.
- **Zero Server Transmission:** User input data, JSON payloads, and conversion queries are never transmitted across the network.
- **Zero Telemetry & Zero Analytics:** No Google Analytics, trackers, beacons, or third-party tracking scripts are bundled or loaded.
- **Zero External Font / Asset CDNs:** Fonts and stylesheets rely strictly on system typography and locally self-contained styles, preventing third-party IP address logging.
- **No Third-Party Cookies:** The application sets zero tracking cookies and uses no persistent third-party storage.

*(Note: The platform is a static web application running in your browser; it does not install an offline service worker cache in V1).*

---

## Accessibility & Responsive Standards

- **Target Standard:** Built to target **WCAG 2.2 AA** contrast and readability guidelines (minimum 4.5:1 contrast ratio across primary text and interactive surfaces).
- **Responsive Viewport Support:** Extensively audited and verified across standard breakpoints:
  - Mobile: `320px`, `360px`, `390px` (zero horizontal page-level overflow).
  - Tablet & Laptop: `768px`, `1024px`.
  - Desktop: `1280px`, `1440px`.
- **Keyboard Navigation:** Native `<dialog>` search modals with `Escape` key listeners, semantic HTML5 landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`), and accessible ARIA attributes.
- **Reduced Motion:** Respects user operating system preferences for `prefers-reduced-motion`.

*(Disclosure: WCAG 2.2 AA is a target design standard. Testing was conducted via automated DOM assertions and browser viewport tests; formal screen-reader certification with physical NVDA/VoiceOver hardware was not conducted).*

---

## Quickstart & Local Development

### Prerequisites

- **Node.js:** `>=22.23.4` (verified and required by `package.json`).
- **npm:** Included with Node.js.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd cs-visualizers-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Launches local Astro dev server at `http://localhost:4321/` |
| **Run Tests** | `npm test` or `npm run test:run` | Executes the Vitest unit test suite (107 tests across 6 suites) |
| **Type Check** | `npm run check` | Runs Astro check and TypeScript validation |
| **Production Build** | `npm run build` | Compiles static production output to `dist/` |
| **Local Preview** | `npm run preview` | Spins up a local web server to preview the built `dist/` bundle |

---

## Repository Directory Structure

```text
cs-visualizers-platform/
├── dist/                          # Production static build output (generated)
├── public/                        # Static public assets and icons
├── src/
│   ├── components/                # Modular UI components
│   │   ├── common/
│   │   │   ├── RouteScaffold.astro# Standardized container layout scaffold
│   │   │   └── SkipToContent.astro# Accessibility skip-link navigation
│   │   ├── search/
│   │   │   └── SearchModal.astro  # Native HTML5 dialog quick search modal
│   │   └── shell/
│   │       ├── HeaderNav.astro    # Navigation bar & search trigger
│   │       ├── Footer.astro       # Global footer with link columns
│   │       └── MobileDrawer.astro # Responsive navigation drawer
│   ├── core/                      # Pure TypeScript algorithmic engines & tools
│   │   ├── algorithms/
│   │   │   ├── binary-search.ts   # Binary search state generator
│   │   │   ├── graph.ts           # BFS & DFS graph traversal engines
│   │   │   └── sorting.ts         # Bubble, Selection, Insertion engines
│   │   ├── engine/
│   │   │   ├── controller.ts      # Step playback controller (play, pause, step)
│   │   │   └── types.ts           # State machine type definitions
│   │   └── tools/
│   │       ├── base-converter.ts  # BigInt multi-base conversion engine
│   │       └── json-formatter.ts  # JSON parsing & syntax diagnostics
│   ├── layouts/                   # Astro page layout wrappers
│   │   └── BaseLayout.astro       # Root HTML document wrapper & metadata
│   ├── pages/                     # 19 statically generated Astro routes
│   │   ├── index.astro            # Homepage (/)
│   │   ├── 404.astro              # Custom 404 error page (/404)
│   │   ├── about/index.astro      # /about/
│   │   ├── privacy/index.astro    # /privacy/
│   │   ├── terms/index.astro      # /terms/
│   │   ├── visualizers/
│   │   │   ├── index.astro        # Visualizers Hub (/visualizers/)
│   │   │   ├── binary-search/     # /visualizers/binary-search/
│   │   │   ├── sorting/           # /visualizers/sorting/
│   │   │   └── bfs-dfs/           # /visualizers/bfs-dfs/
│   │   ├── tools/
│   │   │   ├── index.astro        # Tools Directory (/tools/)
│   │   │   ├── json-formatter/    # /tools/json-formatter/
│   │   │   └── number-base-converter/ # /tools/number-base-converter/
│   │   └── guides/
│   │       ├── index.astro        # Guides Directory (/guides/)
│   │       ├── binary-search/     # /guides/binary-search/
│   │       ├── sorting-algorithms/# /guides/sorting-algorithms/
│   │       ├── bfs-dfs/           # /guides/bfs-dfs/
│   │       ├── json-fundamentals/ # /guides/json-fundamentals/
│   │       ├── number-systems/    # /guides/number-systems/
│   │       └── big-o-cheat-sheet/ # /guides/big-o-cheat-sheet/
│   └── styles/                    # Global CSS styling
│       ├── fonts.css              # System font stack configurations
│       └── tokens.css             # Obsidian Algorithmic design tokens
├── tests/                         # Vitest unit test suites
│   ├── base-converter.test.ts     # Multi-base conversion unit tests
│   ├── binary-search.test.ts      # Binary search invariant unit tests
│   ├── controller.test.ts         # Playback controller step tests
│   ├── graph.test.ts              # BFS/DFS traversal unit tests
│   ├── json-formatter.test.ts     # JSON parsing and error pointer tests
│   └── sorting.test.ts            # Bubble, Selection, Insertion sort tests
├── astro.config.mjs               # Astro framework configuration
├── package.json                   # Project dependencies and npm scripts
├── tsconfig.json                  # Strict TypeScript compiler options
└── vitest.config.ts               # Vitest test runner configuration
```

---

## V1 Baseline & Deferred V2 Scope

The project has achieved complete **V1 Acceptance** at commit `5499f25`. The following features are intentionally scoped and deferred for the future V2 roadmap:

- **Deferred to V2:**
  - Interactive HTML5 Canvas / SVG Big-O dynamic complexity curve plots.
  - Advanced sorting algorithms (Merge Sort, Quick Sort, Heap Sort, Radix Sort).
  - Custom interactive drag-and-drop graph topology builder for BFS/DFS.
  - WebAssembly (Wasm) indexed search trie.
  - Floating-point IEEE-754 radix conversion support.
  - Remote code compilation or execution sandbox.

---

## License

This project is open-source educational software. Developed for students and developers worldwide.
