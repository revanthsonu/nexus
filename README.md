# Nexus — NSF Research Intelligence Dashboard

> An interactive data visualization platform that maps research collaboration networks, funding trends, and topic evolution across **25 top US research institutions** using NSF grant data (2018–2023).

Built to demonstrate **data visualization engineering** and **interactive analytics**: force-directed network graphs with D3.js, temporal funding analysis with Recharts, and real-time domain filtering — all rendered client-side with React.

---

## Features

### 🔗 Collaboration Network
Interactive D3 force-directed graph showing inter-institutional research partnerships. Node size encodes NSF funding volume. Hover to highlight connections, drag to rearrange, click to pin detail panels.

### 📈 Funding Trends
Stacked area charts visualizing NSF funding allocation across 5 research domains (CS, Life Sciences, Physics, Engineering, Social Sciences) from 2018–2023, with per-domain bar comparison.

### 🔬 Topic Evolution
Filterable keyword trend analysis tracking 7 research topics (Machine Learning, Deep Learning, NLP, Quantum Computing, Bioinformatics, Robotics, Public Health) with interactive topic toggle pills.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Visualization** | D3.js (force simulation, drag, scales) · Recharts (area, bar charts) |
| **Frontend** | React 19 · Create React App |
| **Data** | Static NSF grant dataset · Client-side filtering & aggregation |
| **Design** | DM Serif Display + JetBrains Mono typography · Warm light theme |

---

## Architecture

```
nexus/
├── public/
│   └── index.html
└── src/
    ├── App.js              # Main application (data, components, layout)
    ├── index.css            # Light theme design system
    └── index.js             # React entry point
```

### Key Components

| Component | Purpose |
|---|---|
| `NetworkGraph` | D3 force-directed graph with ResizeObserver, drag behavior, hover tooltips |
| `TrendsView` | Recharts stacked area + bar charts for funding analysis |
| `TopicsView` | Filterable topic evolution with toggle pills |
| `StatCard` | Reusable KPI card with accent-colored top border |

---

## Quick Start

```bash
npm install
npm start         # Dev server on localhost:3000
```

### Production Build

```bash
npm run build     # Outputs to build/
```

---

## Data Coverage

- **25 institutions**: MIT, Stanford, Harvard, CMU, UC Berkeley, Caltech, Cornell, Princeton, Georgia Tech, and more
- **5 research domains**: Computer Science, Life Sciences, Physics & Math, Engineering, Social Sciences
- **7 topic keywords**: Machine Learning, Deep Learning, NLP, Quantum Computing, Bioinformatics, Robotics, Public Health
- **6-year span**: 2018–2023 NSF funding data
