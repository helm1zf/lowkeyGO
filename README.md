# lowkeyGO | Supply Chain Optimization Engine

### High-Performance Multi-Modal Routing & Logistics Analytics

**lowkeyGO** is a production-grade logistics routing engine designed to solve the "Green Logistics" paradox: balancing carbon footprint reduction with operational speed. Built with a full-stack architecture featuring a **Node.js/Express** backend and a **React/Vite** frontend, it utilizes a custom Dijkstra-based pathfinding algorithm to optimize transport across Rail, Road, and Sea networks.

![Dashboard Preview](https://raw.githubusercontent.com/visgl/deck.gl-data/master/images/whats-new/arc-layer.png) *Visual representation of the multi-modal mapping capabilities*

## Core Features

- **Dynamic Multi-Modal Pathfinding**: Calculates optimal routes across diverse transport mediums (Maritime, Rail, Trucking) based on real-time cost factors.
- **Dynamic GreenScore™ Algorithm**: A custom weighting system that adjusts edge costs based on `Cargo Weight`, `Fuel Type`, and `Priority (Speed vs. Carbon)`.
- **Advanced 3D Visualization**: Leverages **Deck.gl** and **Mapbox GL** to render complex logistics arcs and hub hierarchies in a performant 3D environment.
- **Heuristic Operations Reporting**: Integrates predictive analysis to justify routing decisions based on environmental trade-offs and technical efficiency.
- **Responsive Supply Chain UI**: A "Brutalist-Minimal" dashboard design focused on data density and operator clarity.

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Motion (Framer Motion).
- **Mapping**: Deck.gl (ArcLayer, ScatterplotLayer), React-Map-GL, Mapbox GL.
- **Backend**: Node.js, Express (API Proxy Layer).
- **Data Viz**: Recharts (Carbon Distribution Analysis).
- **Deployment**: Vite (Production-ready build optimization).

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- A [Mapbox Access Token](https://account.mapbox.com/access-tokens/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/lowkeygo.git
   cd lowkeygo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Environment Setup

The application requires two API keys to function fully. Create a `.env` file in the root directory based on `.env.example`:

1.  **Mapbox Access Token (`VITE_MAPBOX_TOKEN`)**: 
    - Obtain for free at [Mapbox Account](https://account.mapbox.com/). 
    - Used for the 3D map rendering and geographic data tiles.
2.  **Gemini API Key (`GEMINI_API_KEY`)**: 
    - Obtain for free at [Google AI Studio](https://aistudio.google.com/). 
    - Used for the "System Audit Analysis" feature which provides technical routing insights.

```env
VITE_MAPBOX_TOKEN=pk.your_token_here
GEMINI_API_KEY=your_gemini_key_here
```

### Installation & Execution
   ```bash
   npm run dev
   ```

## 📂 Project Structure & Key Files

For reviewers and recruiters, here is the entry point for the core logic:

- **`src/App.tsx`**: The primary dashboard interface. Contains the React state management, map integration (Deck.gl), and the high-level routing logic.
- **`server.ts`**: The Express backend. Handles API proxying to the Gemini 1.5 Flash model for secure AI operations and serves the production build.
- **Graph Algorithm**: Look for the `findOptimalPath` implementation in `src/App.tsx`. It implements a weighted Dijkstra algorithm that considers multi-modal node types (Rail, RoadBase, ShipPort) and dynamically recalculated edge weights.

## 🧠 Architecture Note

Unlike standard routing apps, **lowkeyGO** treats "Carbon" as a physical constraint rather than a secondary metric. The system calculates `GreenScore` using:
`EdgeCost = (Distance * CO2Factor * Weight * Priority) + (TravelTime * (1 - Priority))`

This allows the engine to pivot from a "Fastest Route" (Road heavy) to a "Sustainably Efficient" (Rail/Sea heavy) route instantly as the operator slides the priority scale.

## License

MIT © [Hz Fadhali]
