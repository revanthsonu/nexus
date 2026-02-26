import { useState, useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"

// ── DESIGN TOKENS (Light Theme) ───────────────────────────────────────────────
const C = {
  bg: "#f7f5f2",
  surface: "#ffffff",
  card: "#ffffff",
  border: "#e8e3dc",
  accent: "#0d9488",     // teal
  accentD: "#0a7c72",
  blue: "#3b82f6",
  text: "#1a1523",
  muted: "#8a8294",
  mutedLt: "#65607a",
  gridLine: "#eae6e0",
  highlight: "#fef3c7",
  danger: "#ef4444",
}

const DOMAINS = {
  CS: { label: "Computer Science", color: "#3b82f6" },
  BIO: { label: "Life Sciences", color: "#10b981" },
  PHY: { label: "Physics & Math", color: "#f59e0b" },
  ENG: { label: "Engineering", color: "#ec4899" },
  SOC: { label: "Social Sciences", color: "#8b5cf6" },
}

// ── STATIC DATA ───────────────────────────────────────────────────────────────
const NODES = [
  { id: 0, name: "MIT", domain: "CS", funding: 852 },
  { id: 1, name: "Stanford", domain: "CS", funding: 918 },
  { id: 2, name: "Caltech", domain: "PHY", funding: 412 },
  { id: 3, name: "Harvard", domain: "BIO", funding: 1102 },
  { id: 4, name: "CMU", domain: "CS", funding: 634 },
  { id: 5, name: "UC Berkeley", domain: "CS", funding: 789 },
  { id: 6, name: "U Michigan", domain: "ENG", funding: 723 },
  { id: 7, name: "UIUC", domain: "ENG", funding: 612 },
  { id: 8, name: "Cornell", domain: "BIO", funding: 587 },
  { id: 9, name: "Georgia Tech", domain: "ENG", funding: 543 },
  { id: 10, name: "UT Austin", domain: "CS", funding: 498 },
  { id: 11, name: "UW Seattle", domain: "BIO", funding: 612 },
  { id: 12, name: "Princeton", domain: "PHY", funding: 389 },
  { id: 13, name: "Columbia", domain: "SOC", funding: 445 },
  { id: 14, name: "Duke", domain: "BIO", funding: 378 },
  { id: 15, name: "Northwestern", domain: "SOC", funding: 412 },
  { id: 16, name: "NYU", domain: "SOC", funding: 334 },
  { id: 17, name: "UW Madison", domain: "BIO", funding: 521 },
  { id: 18, name: "Maryland", domain: "CS", funding: 445 },
  { id: 19, name: "USC", domain: "CS", funding: 398 },
  { id: 20, name: "Purdue", domain: "ENG", funding: 478 },
  { id: 21, name: "Ohio State", domain: "ENG", funding: 512 },
  { id: 22, name: "Penn State", domain: "ENG", funding: 489 },
  { id: 23, name: "UCSD", domain: "BIO", funding: 567 },
  { id: 24, name: "UT Dallas", domain: "CS", funding: 187 },
]

const EDGES = [
  [0, 1], [0, 4], [0, 5], [0, 8], [0, 12], [0, 18],
  [1, 2], [1, 4], [1, 5], [1, 19], [1, 23],
  [2, 12], [2, 19],
  [3, 8], [3, 11], [3, 14], [3, 17], [3, 13],
  [4, 5], [4, 7], [4, 18],
  [5, 19], [5, 23], [5, 11],
  [6, 7], [6, 20], [6, 21], [6, 22],
  [7, 20], [7, 22],
  [8, 14], [8, 12],
  [9, 10], [9, 20], [9, 21],
  [10, 18], [10, 24],
  [11, 23], [11, 17],
  [12, 13], [12, 16],
  [13, 15], [13, 16],
  [14, 17], [15, 16], [15, 21],
  [17, 21], [20, 22],
]

const TRENDS = [
  { year: "2018", CS: 4.2, BIO: 5.8, PHY: 2.9, ENG: 3.7, SOC: 1.8 },
  { year: "2019", CS: 4.9, BIO: 6.1, PHY: 3.1, ENG: 3.9, SOC: 1.9 },
  { year: "2020", CS: 5.8, BIO: 7.2, PHY: 3.0, ENG: 4.1, SOC: 2.1 },
  { year: "2021", CS: 6.9, BIO: 8.4, PHY: 3.2, ENG: 4.4, SOC: 2.3 },
  { year: "2022", CS: 7.8, BIO: 8.9, PHY: 3.5, ENG: 4.8, SOC: 2.5 },
  { year: "2023", CS: 9.1, BIO: 9.3, PHY: 3.7, ENG: 5.1, SOC: 2.8 },
]

const TOPICS = [
  { year: "2018", ML: 312, DL: 189, Bio: 245, QC: 67, NLP: 134, Rob: 156, PH: 178 },
  { year: "2019", ML: 421, DL: 287, Bio: 267, QC: 98, NLP: 189, Rob: 178, PH: 201 },
  { year: "2020", ML: 589, DL: 412, Bio: 312, QC: 134, NLP: 287, Rob: 198, PH: 389 },
  { year: "2021", ML: 712, DL: 534, Bio: 334, QC: 189, NLP: 378, Rob: 223, PH: 312 },
  { year: "2022", ML: 845, DL: 678, Bio: 356, QC: 245, NLP: 489, Rob: 267, PH: 289 },
  { year: "2023", ML: 1023, DL: 812, Bio: 389, QC: 312, NLP: 612, Rob: 312, PH: 267 },
]

const TOPIC_META = [
  { key: "ML", label: "Machine Learning", color: "#3b82f6" },
  { key: "DL", label: "Deep Learning", color: "#6366f1" },
  { key: "Bio", label: "Bioinformatics", color: "#10b981" },
  { key: "QC", label: "Quantum Computing", color: "#f59e0b" },
  { key: "NLP", label: "Natural Lang. Proc.", color: "#8b5cf6" },
  { key: "Rob", label: "Robotics", color: "#ec4899" },
  { key: "PH", label: "Public Health", color: "#f97316" },
]

// ── GRAPH ALGORITHMS ──────────────────────────────────────────────────────────

function buildAdjList(nodes, edges) {
  const adj = {}
  nodes.forEach(n => { adj[n.id] = [] })
  edges.forEach(([a, b]) => {
    if (adj[a] && adj[b]) {
      adj[a].push(b)
      adj[b].push(a)
    }
  })
  return adj
}

function computeDegreeCentrality(nodes, edges) {
  const maxDegree = nodes.length - 1
  const degree = {}
  nodes.forEach(n => { degree[n.id] = 0 })
  edges.forEach(([a, b]) => {
    if (degree[a] !== undefined) degree[a]++
    if (degree[b] !== undefined) degree[b]++
  })
  const result = {}
  nodes.forEach(n => { result[n.id] = degree[n.id] / maxDegree })
  return result
}

function computeBetweennessCentrality(nodes, edges) {
  const adj = buildAdjList(nodes, edges)
  const ids = nodes.map(n => n.id)
  const bc = {}
  ids.forEach(id => { bc[id] = 0 })

  ids.forEach(s => {
    // BFS from s
    const stack = []
    const pred = {}; ids.forEach(id => { pred[id] = [] })
    const sigma = {}; ids.forEach(id => { sigma[id] = 0 }); sigma[s] = 1
    const dist = {}; ids.forEach(id => { dist[id] = -1 }); dist[s] = 0
    const queue = [s]

    while (queue.length) {
      const v = queue.shift()
      stack.push(v)
      for (const w of (adj[v] || [])) {
        if (dist[w] < 0) {
          queue.push(w)
          dist[w] = dist[v] + 1
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v]
          pred[w].push(v)
        }
      }
    }

    const delta = {}; ids.forEach(id => { delta[id] = 0 })
    while (stack.length) {
      const w = stack.pop()
      for (const v of pred[w]) {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w])
      }
      if (w !== s) bc[w] += delta[w]
    }
  })

  // Normalize
  const n = ids.length
  const norm = (n - 1) * (n - 2)
  if (norm > 0) ids.forEach(id => { bc[id] /= norm })
  return bc
}

function computePageRank(nodes, edges, damping = 0.85, iterations = 30) {
  const adj = buildAdjList(nodes, edges)
  const ids = nodes.map(n => n.id)
  const N = ids.length
  let pr = {}
  ids.forEach(id => { pr[id] = 1 / N })

  for (let i = 0; i < iterations; i++) {
    const newPr = {}
    ids.forEach(id => { newPr[id] = (1 - damping) / N })
    ids.forEach(id => {
      const neighbors = adj[id] || []
      if (neighbors.length === 0) return
      const share = pr[id] / neighbors.length
      neighbors.forEach(nb => { newPr[nb] += damping * share })
    })
    pr = newPr
  }
  return pr
}

function countConnectedComponents(nodes, edges) {
  const adj = buildAdjList(nodes, edges)
  const visited = new Set()
  let components = 0
  const componentSizes = []

  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      components++
      let size = 0
      const queue = [n.id]
      while (queue.length) {
        const v = queue.shift()
        if (visited.has(v)) continue
        visited.add(v)
        size++
          ; (adj[v] || []).forEach(nb => { if (!visited.has(nb)) queue.push(nb) })
      }
      componentSizes.push(size)
    }
  })
  return { components, componentSizes, largestComponent: Math.max(...componentSizes, 0) }
}

function computeNetworkDensity(nodeCount, edgeCount) {
  if (nodeCount < 2) return 0
  return (2 * edgeCount) / (nodeCount * (nodeCount - 1))
}

function computeInterdisciplinaryScore(nodeId, edges, nodes) {
  const nodeMap = {}
  nodes.forEach(n => { nodeMap[n.id] = n })
  const neighborDomains = {}
  edges.forEach(([a, b]) => {
    if (a === nodeId && nodeMap[b]) {
      const d = nodeMap[b].domain
      neighborDomains[d] = (neighborDomains[d] || 0) + 1
    }
    if (b === nodeId && nodeMap[a]) {
      const d = nodeMap[a].domain
      neighborDomains[d] = (neighborDomains[d] || 0) + 1
    }
  })
  const counts = Object.values(neighborDomains)
  const total = counts.reduce((s, c) => s + c, 0)
  if (total <= 1) return 0
  // Simpson's Diversity Index: 1 - Σ(p_i²)
  const simpson = 1 - counts.reduce((s, c) => s + (c / total) ** 2, 0)
  return simpson
}

// ── SHARED COMPONENTS ────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    flex: 1, minWidth: 110, background: C.card,
    border: `1px solid ${C.border}`,
    borderTop: `2px solid ${color || C.accent}`,
    borderRadius: 8, padding: "14px 16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  }}>
    <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.18em", marginBottom: 5, fontWeight: 600 }}>
      {label.toUpperCase()}
    </div>
    <div style={{
      color: color || C.accent, fontSize: 24, fontWeight: 700,
      fontFamily: "'DM Serif Display', Georgia, serif", lineHeight: 1.1, marginBottom: 3
    }}>
      {value}
    </div>
    {sub && <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.05em" }}>{sub}</div>}
  </div>
)

const CustomTooltipBase = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.accent}`,
      borderRadius: 8, padding: "10px 14px",
      fontSize: 11, minWidth: 160,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    }}>
      <div style={{ color: C.accent, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      {[...payload].sort((a, b) => b.value - a.value).map(p => (
        <div key={p.dataKey} style={{ color: p.fill || p.stroke, marginBottom: 3 }}>
          {p.name}: <strong>${typeof formatter === "function" ? formatter(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ── NETWORK GRAPH ─────────────────────────────────────────────────────────────
function NetworkGraph({ domainFilter, onSelect, selected, removedNode }) {
  const svgRef = useRef()
  const simRef = useRef()
  const [tooltip, setTooltip] = useState(null)
  const [dims, setDims] = useState({ w: 640, h: 460 })

  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      setDims({ w: Math.max(w, 300), h: Math.max(Math.round(w * 0.68), 300) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current) return
    const { w, h } = dims

    const filteredNodes = NODES
      .filter(n => domainFilter === "ALL" || n.domain === domainFilter)
      .filter(n => removedNode == null || n.id !== removedNode)
      .map(n => ({ ...n }))
    const idSet = new Set(filteredNodes.map(n => n.id))
    const filteredEdges = EDGES
      .filter(([a, b]) => idSet.has(a) && idSet.has(b))
      .map(([source, target]) => ({ source, target }))

    const rScale = d3.scaleSqrt().domain([150, 1200]).range([6, 22])

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", w).attr("height", h)

    const defs = svg.append("defs")
    const pat = defs.append("pattern")
      .attr("id", "grid").attr("width", 40).attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse")
    pat.append("path").attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none").attr("stroke", "#e8e3dc").attr("stroke-width", "0.5")
    svg.append("rect").attr("width", "100%").attr("height", "100%")
      .attr("fill", "url(#grid)").attr("opacity", 0.6)

    const filter = defs.append("filter").attr("id", "shadow")
      .attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%")
    filter.append("feDropShadow")
      .attr("dx", "0").attr("dy", "1").attr("stdDeviation", "2")
      .attr("flood-color", "rgba(0,0,0,0.12)")

    const linkG = svg.append("g")
    const nodeG = svg.append("g")

    const linkSel = linkG.selectAll("line")
      .data(filteredEdges).enter().append("line")
      .attr("stroke", "#d1cbc3")
      .attr("stroke-width", 1.2)
      .attr("stroke-opacity", 0.7)

    const nodeSel = nodeG.selectAll("g")
      .data(filteredNodes).enter().append("g")
      .style("cursor", "pointer")

    nodeSel.append("circle")
      .attr("r", d => rScale(d.funding) + 6)
      .attr("fill", "none")
      .attr("stroke", d => DOMAINS[d.domain].color)
      .attr("stroke-width", 0.8)
      .attr("opacity", 0.15)

    nodeSel.append("circle")
      .attr("r", d => rScale(d.funding))
      .attr("fill", d => DOMAINS[d.domain].color)
      .attr("fill-opacity", 0.88)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("filter", "url(#shadow)")

    nodeSel.append("text")
      .text(d => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", d => rScale(d.funding) + 14)
      .attr("fill", C.mutedLt)
      .attr("font-size", "9px")
      .attr("font-weight", "500")
      .attr("pointer-events", "none")

    nodeSel
      .on("mouseover", function (event, d) {
        d3.select(this).select("circle:nth-child(2)")
          .transition().duration(120)
          .attr("fill-opacity", 1).attr("r", rScale(d.funding) + 3)
        linkSel
          .attr("stroke", l => (l.source.id === d.id || l.target.id === d.id) ? C.accent : "#d1cbc3")
          .attr("stroke-width", l => (l.source.id === d.id || l.target.id === d.id) ? 2.5 : 1.2)
          .attr("stroke-opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.25)
        const conn = EDGES.filter(([a, b]) => a === d.id || b === d.id).length
        setTooltip({ ...d, connections: conn })
      })
      .on("mouseout", function (event, d) {
        d3.select(this).select("circle:nth-child(2)")
          .transition().duration(120)
          .attr("fill-opacity", 0.88).attr("r", rScale(d.funding))
        linkSel
          .attr("stroke", "#d1cbc3")
          .attr("stroke-width", 1.2)
          .attr("stroke-opacity", 0.7)
        setTooltip(null)
      })
      .on("click", (_, d) => onSelect(selected?.id === d.id ? null : d))

    const drag = d3.drag()
      .on("start", (e, d) => { if (!e.active) simRef.current?.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y })
      .on("end", (e, d) => { if (!e.active) simRef.current?.alphaTarget(0); d.fx = null; d.fy = null })
    nodeSel.call(drag)

    const sim = d3.forceSimulation(filteredNodes)
      .force("link", d3.forceLink(filteredEdges).id(d => d.id).distance(85).strength(0.45))
      .force("charge", d3.forceManyBody().strength(-240))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collide", d3.forceCollide().radius(d => rScale(d.funding) + 12))
      .on("tick", () => {
        linkSel
          .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x).attr("y2", d => d.target.y)
        nodeSel.attr("transform", d => `translate(${Math.max(rScale(d.funding) + 2, Math.min(w - rScale(d.funding) - 2, d.x))
          },${Math.max(rScale(d.funding) + 2, Math.min(h - rScale(d.funding) - 2, d.y))
          })`)
      })

    simRef.current = sim
    return () => sim.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainFilter, dims, removedNode])

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} style={{
        display: "block", width: "100%",
        borderRadius: 10, background: C.bg,
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }} />
      {tooltip && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: C.card, border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${DOMAINS[tooltip.domain].color}`,
          borderRadius: 8, padding: "12px 16px", minWidth: 190,
          pointerEvents: "none", zIndex: 10,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}>
          <div style={{ color: DOMAINS[tooltip.domain].color, fontWeight: 700, fontSize: 13, marginBottom: 5 }}>
            {tooltip.name}
          </div>
          <div style={{ color: C.muted, fontSize: 10, marginBottom: 6 }}>
            {DOMAINS[tooltip.domain].label}
          </div>
          <div style={{ color: C.text, fontSize: 11, marginBottom: 3 }}>
            💰 <span style={{ color: C.accent, fontWeight: 700 }}>${tooltip.funding}M</span> NSF funding
          </div>
          <div style={{ color: C.text, fontSize: 11 }}>
            🔗 <span style={{ color: C.blue, fontWeight: 700 }}>{tooltip.connections}</span> collaborations
          </div>
        </div>
      )}
    </div>
  )
}

// ── TRENDS VIEW ───────────────────────────────────────────────────────────────
function TrendsView() {
  const total18 = Object.entries(TRENDS[0]).filter(([k]) => k !== "year").reduce((s, [, v]) => s + v, 0)
  const total23 = Object.entries(TRENDS[5]).filter(([k]) => k !== "year").reduce((s, [, v]) => s + v, 0)
  const growth = (((total23 / total18) - 1) * 100).toFixed(0)

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="2023 Total" value={`$${total23.toFixed(1)}B`} sub="across all domains" />
        <StatCard label="6-Year Growth" value={`+${growth}%`} sub="2018 → 2023" color={C.blue} />
        <StatCard label="CS Surge" value="+117%" sub="fastest growing" color={DOMAINS.CS.color} />
        <StatCard label="Top Domain" value="Life Sci" sub="$9.3B in 2023" color={DOMAINS.BIO.color} />
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 16px 12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{
          color: C.muted, fontSize: 10, fontWeight: 600,
          letterSpacing: "0.14em", marginBottom: 14
        }}>
          NSF FUNDING BY DOMAIN  ·  USD BILLIONS  ·  2018–2023
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={TRENDS} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              {Object.entries(DOMAINS).map(([k, d]) => (
                <linearGradient key={k} id={`tg-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={d.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={d.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 4" stroke={C.gridLine} vertical={false} />
            <XAxis dataKey="year" stroke={C.border} tick={{ fill: C.mutedLt, fontSize: 11 }} />
            <YAxis stroke={C.border} tick={{ fill: C.mutedLt, fontSize: 11 }} tickFormatter={v => `$${v}B`} />
            <Tooltip content={<CustomTooltipBase formatter={v => `${v.toFixed(1)}B`} />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: C.muted, paddingTop: 8 }} />
            {Object.entries(DOMAINS).map(([k, d]) => (
              <Area key={k} type="monotone" dataKey={k} name={d.label}
                stackId="1" stroke={d.color} strokeWidth={1.8}
                fill={`url(#tg-${k})`} fillOpacity={1} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: "20px 16px 12px", marginTop: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{
          color: C.muted, fontSize: 10, fontWeight: 600,
          letterSpacing: "0.14em", marginBottom: 14
        }}>
          2023 FUNDING BY DOMAIN  ·  SIDE-BY-SIDE COMPARISON
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[{ year: "2023", ...TRENDS[5] }]} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 4" stroke={C.gridLine} vertical={false} />
            <XAxis dataKey="year" stroke={C.border} tick={{ fill: C.mutedLt, fontSize: 11 }} />
            <YAxis stroke={C.border} tick={{ fill: C.mutedLt, fontSize: 11 }} tickFormatter={v => `$${v}B`} />
            <Tooltip content={<CustomTooltipBase formatter={v => `${v.toFixed(1)}B`} />} />
            <Legend iconType="square" wrapperStyle={{ fontSize: 10, color: C.muted, paddingTop: 8 }} />
            {Object.entries(DOMAINS).map(([k, d]) => (
              <Bar key={k} dataKey={k} name={d.label} fill={d.color} fillOpacity={0.85} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── TOPICS VIEW ───────────────────────────────────────────────────────────────
function TopicsView() {
  const [active, setActive] = useState(null)
  const mlGrowth = (((TOPICS[5].ML / TOPICS[0].ML) - 1) * 100).toFixed(0)
  const qcGrowth = (((TOPICS[5].QC / TOPICS[0].QC) - 1) * 100).toFixed(0)
  const nlpGrowth = (((TOPICS[5].NLP / TOPICS[0].NLP) - 1) * 100).toFixed(0)
  const displayTopics = active ? TOPIC_META.filter(t => t.key === active) : TOPIC_META

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="ML/AI Growth" value={`+${mlGrowth}%`} sub="2018 → 2023" color={DOMAINS.CS.color} />
        <StatCard label="NLP Acceleration" value={`+${nlpGrowth}%`} sub="driven by LLMs" color="#8b5cf6" />
        <StatCard label="Quantum Computing" value={`+${qcGrowth}%`} sub="fastest relative" color="#f59e0b" />
        <StatCard label="Public Health Peak" value="2020" sub="COVID funding surge" color="#f97316" />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <button onClick={() => setActive(null)} style={{
          background: !active ? C.accent : "transparent", border: `1px solid ${!active ? C.accent : C.border}`,
          color: !active ? "#fff" : C.muted, borderRadius: 20, padding: "4px 12px",
          fontSize: 10, cursor: "pointer", letterSpacing: "0.1em", fontWeight: 600,
        }}>ALL</button>
        {TOPIC_META.map(t => (
          <button key={t.key} onClick={() => setActive(active === t.key ? null : t.key)} style={{
            background: active === t.key ? t.color : "transparent", border: `1px solid ${active === t.key ? t.color : C.border}`,
            color: active === t.key ? "#fff" : C.muted, borderRadius: 20, padding: "4px 12px",
            fontSize: 10, cursor: "pointer", fontWeight: 500,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 16px 12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{ color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", marginBottom: 14 }}>
          KEYWORD EVOLUTION  ·  GRANT COUNT  ·  2018–2023
        </div>
        <ResponsiveContainer width="100%" height={330}>
          <AreaChart data={TOPICS} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              {TOPIC_META.map(t => (
                <linearGradient key={t.key} id={`kg-${t.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.color} stopOpacity={active === t.key ? 0.6 : 0.35} />
                  <stop offset="95%" stopColor={t.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 4" stroke={C.gridLine} vertical={false} />
            <XAxis dataKey="year" stroke={C.border} tick={{ fill: C.mutedLt, fontSize: 11 }} />
            <YAxis stroke={C.border} tick={{ fill: C.mutedLt, fontSize: 11 }} />
            <Tooltip content={<CustomTooltipBase formatter={v => `${v} grants`} />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: C.muted, paddingTop: 8 }} />
            {displayTopics.map(t => (
              <Area key={t.key} type="monotone" dataKey={t.key} name={t.label}
                stackId={active ? undefined : "1"} stroke={t.color} strokeWidth={active === t.key ? 2.5 : 1.6}
                fill={`url(#kg-${t.key})`} fillOpacity={1} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── ANALYTICS VIEW ────────────────────────────────────────────────────────────
function AnalyticsView({ onRemoveNode, removedNode }) {
  const [sortBy, setSortBy] = useState("betweenness")

  const activeNodes = useMemo(() =>
    removedNode != null ? NODES.filter(n => n.id !== removedNode) : NODES
    , [removedNode])
  const activeEdges = useMemo(() => {
    if (removedNode == null) return EDGES
    return EDGES.filter(([a, b]) => a !== removedNode && b !== removedNode)
  }, [removedNode])

  const degree = useMemo(() => computeDegreeCentrality(activeNodes, activeEdges), [activeNodes, activeEdges])
  const betweenness = useMemo(() => computeBetweennessCentrality(activeNodes, activeEdges), [activeNodes, activeEdges])
  const pagerank = useMemo(() => computePageRank(activeNodes, activeEdges), [activeNodes, activeEdges])
  const interdisc = useMemo(() => {
    const r = {}
    activeNodes.forEach(n => { r[n.id] = computeInterdisciplinaryScore(n.id, activeEdges, activeNodes) })
    return r
  }, [activeNodes, activeEdges])

  const networkInfo = useMemo(() => countConnectedComponents(activeNodes, activeEdges), [activeNodes, activeEdges])
  const density = useMemo(() => computeNetworkDensity(activeNodes.length, activeEdges.length), [activeNodes, activeEdges])

  // Baseline (full network) for comparison
  const baselineInfo = useMemo(() => countConnectedComponents(NODES, EDGES), [])
  const baselineDensity = useMemo(() => computeNetworkDensity(NODES.length, EDGES.length), [])

  const sorted = useMemo(() => {
    const list = activeNodes.map(n => ({
      ...n,
      degree: degree[n.id] || 0,
      betweenness: betweenness[n.id] || 0,
      pagerank: pagerank[n.id] || 0,
      interdisciplinary: interdisc[n.id] || 0,
    }))
    list.sort((a, b) => b[sortBy] - a[sortBy])
    return list
  }, [activeNodes, degree, betweenness, pagerank, interdisc, sortBy])

  const maxBetweenness = Math.max(...sorted.map(n => n.betweenness), 0.001)
  const maxPagerank = Math.max(...sorted.map(n => n.pagerank), 0.001)
  const removedNodeObj = removedNode != null ? NODES.find(n => n.id === removedNode) : null

  return (
    <div>
      {/* Network-level stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Nodes" value={activeNodes.length} sub={removedNode != null ? `−1 from ${NODES.length}` : `of ${NODES.length}`} />
        <StatCard label="Edges" value={activeEdges.length} sub={removedNode != null ? `−${EDGES.length - activeEdges.length} from ${EDGES.length}` : `collaborations`} color={C.blue} />
        <StatCard label="Components" value={networkInfo.components}
          sub={networkInfo.components > 1 ? `⚠ network fragmented` : "fully connected"}
          color={networkInfo.components > 1 ? C.danger : DOMAINS.BIO.color} />
        <StatCard label="Density" value={density.toFixed(3)}
          sub={removedNode != null ? `was ${baselineDensity.toFixed(3)}` : "edge probability"}
          color={DOMAINS.SOC.color} />
      </div>

      {/* What-If Simulation */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: 16
      }}>
        <div style={{ color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", marginBottom: 12 }}>
          ◇  WHAT-IF SIMULATION  ·  NETWORK RESILIENCE
        </div>
        <div style={{ fontSize: 12, color: C.text, marginBottom: 12, lineHeight: 1.6 }}>
          Remove an institution to analyze its structural importance. See how the network fragments,
          which nodes become isolated, and how centrality redistributes.
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => onRemoveNode(null)} style={{
            background: removedNode == null ? C.accent : "transparent",
            border: `1px solid ${removedNode == null ? C.accent : C.border}`,
            color: removedNode == null ? "#fff" : C.muted,
            borderRadius: 20, padding: "5px 14px", fontSize: 10, cursor: "pointer", fontWeight: 600,
          }}>FULL NETWORK</button>
          {NODES.slice(0, 12).map(n => (
            <button key={n.id} onClick={() => onRemoveNode(removedNode === n.id ? null : n.id)} style={{
              background: removedNode === n.id ? C.danger : "transparent",
              border: `1px solid ${removedNode === n.id ? C.danger : C.border}`,
              color: removedNode === n.id ? "#fff" : C.muted,
              borderRadius: 20, padding: "5px 12px", fontSize: 10, cursor: "pointer", fontWeight: 500,
            }}>−{n.name}</button>
          ))}
        </div>
        {removedNodeObj && (
          <div style={{
            marginTop: 14, padding: "12px 14px", background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 8, fontSize: 11, color: "#991b1b"
          }}>
            <strong>Removed: {removedNodeObj.name}</strong> ({DOMAINS[removedNodeObj.domain].label}, ${removedNodeObj.funding}M)
            <br />
            Lost <strong>{EDGES.length - activeEdges.length}</strong> collaborations.
            {networkInfo.components > 1 && <> Network split into <strong>{networkInfo.components} components</strong> — largest has {networkInfo.largestComponent} nodes.</>}
            {networkInfo.components === 1 && <> Network remains connected.</>}
          </div>
        )}
      </div>

      {/* Centrality Rankings Table */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em" }}>
            CENTRALITY METRICS  ·  NODE IMPORTANCE RANKING
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "betweenness", label: "Betweenness" },
              { id: "degree", label: "Degree" },
              { id: "pagerank", label: "PageRank" },
              { id: "interdisciplinary", label: "Diversity" },
            ].map(s => (
              <button key={s.id} onClick={() => setSortBy(s.id)} style={{
                background: sortBy === s.id ? C.accent : "transparent",
                border: `1px solid ${sortBy === s.id ? C.accent : C.border}`,
                color: sortBy === s.id ? "#fff" : C.muted,
                borderRadius: 4, padding: "3px 10px", fontSize: 9, cursor: "pointer", fontWeight: 600,
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: "left", padding: "8px 6px", color: C.muted, fontWeight: 700, fontSize: 9, letterSpacing: "0.1em" }}>#</th>
                <th style={{ textAlign: "left", padding: "8px 6px", color: C.muted, fontWeight: 700, fontSize: 9, letterSpacing: "0.1em" }}>INSTITUTION</th>
                <th style={{ textAlign: "left", padding: "8px 6px", color: C.muted, fontWeight: 700, fontSize: 9, letterSpacing: "0.1em" }}>DOMAIN</th>
                <th style={{ textAlign: "right", padding: "8px 6px", color: C.muted, fontWeight: 700, fontSize: 9, letterSpacing: "0.1em" }}>DEGREE</th>
                <th style={{ textAlign: "left", padding: "8px 6px", color: C.muted, fontWeight: 700, fontSize: 9, letterSpacing: "0.1em", minWidth: 120 }}>BETWEENNESS</th>
                <th style={{ textAlign: "left", padding: "8px 6px", color: C.muted, fontWeight: 700, fontSize: 9, letterSpacing: "0.1em", minWidth: 100 }}>PAGERANK</th>
                <th style={{ textAlign: "left", padding: "8px 6px", color: C.muted, fontWeight: 700, fontSize: 9, letterSpacing: "0.1em", minWidth: 100 }}>DIVERSITY</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((n, i) => (
                <tr key={n.id} style={{
                  borderBottom: `1px solid ${C.gridLine}`,
                  background: i === 0 ? C.highlight : "transparent"
                }}>
                  <td style={{ padding: "7px 6px", fontWeight: 700, color: C.muted }}>{i + 1}</td>
                  <td style={{ padding: "7px 6px", fontWeight: 600, color: C.text }}>{n.name}</td>
                  <td style={{ padding: "7px 6px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: DOMAINS[n.domain].color, fontWeight: 500, fontSize: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: DOMAINS[n.domain].color }} />
                      {DOMAINS[n.domain].label}
                    </span>
                  </td>
                  <td style={{ padding: "7px 6px", textAlign: "right", fontWeight: 600, color: C.text }}>
                    {n.degree.toFixed(3)}
                  </td>
                  <td style={{ padding: "7px 6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 5, background: C.gridLine, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${(n.betweenness / maxBetweenness) * 100}%`,
                          background: C.accent, borderRadius: 3, transition: "width 0.3s"
                        }} />
                      </div>
                      <span style={{ fontWeight: 600, color: C.text, fontSize: 10, minWidth: 35 }}>{n.betweenness.toFixed(3)}</span>
                    </div>
                  </td>
                  <td style={{ padding: "7px 6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 5, background: C.gridLine, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${(n.pagerank / maxPagerank) * 100}%`,
                          background: C.blue, borderRadius: 3, transition: "width 0.3s"
                        }} />
                      </div>
                      <span style={{ fontWeight: 600, color: C.text, fontSize: 10, minWidth: 35 }}>{n.pagerank.toFixed(3)}</span>
                    </div>
                  </td>
                  <td style={{ padding: "7px 6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 5, background: C.gridLine, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${n.interdisciplinary * 100}%`,
                          background: DOMAINS.SOC.color, borderRadius: 3, transition: "width 0.3s"
                        }} />
                      </div>
                      <span style={{ fontWeight: 600, color: C.text, fontSize: 10, minWidth: 35 }}>{n.interdisciplinary.toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{
          marginTop: 14, padding: "10px 12px", background: "#f0fdfa", border: "1px solid #ccfbf1",
          borderRadius: 6, fontSize: 10, color: "#115e59", lineHeight: 1.7
        }}>
          <strong>Metrics Guide:</strong>
          <strong> Degree</strong> = fraction of possible connections realized.
          <strong> Betweenness</strong> = frequency on shortest paths (bridge nodes score high).
          <strong> PageRank</strong> = importance via connection quality (linked by important nodes).
          <strong> Diversity</strong> = Simpson's Index across neighbor domains (1.0 = max interdisciplinary).
        </div>
      </div>
    </div>
  )
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("network")
  const [domain, setDomain] = useState("ALL")
  const [selected, setSelected] = useState(null)
  const [removedNode, setRemovedNode] = useState(null)

  const topNode = NODES.reduce((a, b) => a.funding > b.funding ? a : b)
  const totalFund = NODES.reduce((s, n) => s + n.funding, 0)

  const tabs = [
    { id: "network", label: "◈  Network" },
    { id: "trends", label: "◉  Funding Trends" },
    { id: "topics", label: "◆  Topic Evolution" },
    { id: "analytics", label: "◇  Analytics" },
  ]

  const connCount = selected
    ? EDGES.filter(([a, b]) => a === selected.id || b === selected.id).length
    : 0

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontSize: 13 }}>

      {/* ── TOPBAR ── */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "16px 28px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 26, fontWeight: 400, letterSpacing: "0.06em", color: C.text
            }}>NEXUS</span>
            <span style={{ color: C.accent, fontSize: 10, letterSpacing: "0.2em", fontWeight: 600 }}>
              NSF RESEARCH INTELLIGENCE
            </span>
          </div>
          <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.12em", marginTop: 3, fontWeight: 500 }}>
            DATA-DRIVEN SCIENCE OF SCIENCE  ·  2018–2023  ·  25 INSTITUTIONS
          </div>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {[
            { v: `$${(totalFund / 1000).toFixed(1)}B`, l: "TOTAL FUNDING" },
            { v: NODES.length, l: "INSTITUTIONS" },
            { v: EDGES.length, l: "COLLABORATIONS" },
          ].map(s => (
            <div key={s.l} style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: "'DM Serif Display',Georgia,serif",
                fontSize: 22, fontWeight: 400, color: C.accent
              }}>{s.v}</div>
              <div style={{ fontSize: 8, color: C.muted, letterSpacing: "0.16em", fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY: SIDEBAR + MAIN ── */}
      <div style={{ display: "flex" }}>

        {/* ── SIDEBAR ── */}
        <div style={{
          width: 180, background: C.surface, borderRight: `1px solid ${C.border}`,
          minHeight: "calc(100vh - 72px)", padding: "18px 12px", flexShrink: 0
        }}>

          <div style={{ fontSize: 8, color: C.muted, letterSpacing: "0.2em", marginBottom: 10, fontWeight: 700 }}>
            FILTER DOMAIN
          </div>
          {[
            { id: "ALL", label: "All Domains", color: C.accent },
            ...Object.entries(DOMAINS).map(([k, v]) => ({ id: k, label: v.label, color: v.color }))
          ].map(d => (
            <button key={d.id} onClick={() => { setDomain(d.id); setSelected(null) }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: domain === d.id ? (d.color + "12") : "transparent",
                border: `1px solid ${domain === d.id ? d.color : "transparent"}`,
                borderLeft: `3px solid ${domain === d.id ? d.color : "transparent"}`,
                borderRadius: 6, color: domain === d.id ? d.color : C.muted,
                padding: "7px 10px", marginBottom: 4, cursor: "pointer",
                fontSize: 10, fontWeight: domain === d.id ? 600 : 500,
              }}>
              {d.label}
            </button>
          ))}

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 18, paddingTop: 16 }}>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: "0.2em", marginBottom: 10, fontWeight: 700 }}>
              TOP FUNDED
            </div>
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${DOMAINS[topNode.domain].color}`,
              borderRadius: 8, padding: "10px 12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ color: DOMAINS[topNode.domain].color, fontWeight: 700, fontSize: 12 }}>
                {topNode.name}
              </div>
              <div style={{
                color: C.accent, fontSize: 20, fontWeight: 400,
                fontFamily: "'DM Serif Display',serif", marginTop: 4
              }}>
                ${topNode.funding}M
              </div>
              <div style={{ color: C.muted, fontSize: 9, marginTop: 2 }}>
                {DOMAINS[topNode.domain].label}
              </div>
            </div>
          </div>

          {selected && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 8, color: C.muted, letterSpacing: "0.2em", marginBottom: 10, fontWeight: 700 }}>
                SELECTED
              </div>
              <div style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${DOMAINS[selected.domain].color}`,
                borderRadius: 8, padding: "10px 12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{ color: DOMAINS[selected.domain].color, fontWeight: 700, fontSize: 11, marginBottom: 8 }}>
                  {selected.name}
                </div>
                {[
                  { l: "Domain", v: DOMAINS[selected.domain].label, c: C.text },
                  { l: "NSF Funding", v: `$${selected.funding}M`, c: C.accent },
                  { l: "Collabs", v: connCount, c: C.blue },
                ].map(row => (
                  <div key={row.l} style={{ marginBottom: 6 }}>
                    <div style={{ color: C.muted, fontSize: 8, letterSpacing: "0.12em", fontWeight: 600 }}>{row.l.toUpperCase()}</div>
                    <div style={{
                      color: row.c, fontWeight: 700, fontSize: 13,
                      fontFamily: "'DM Serif Display',serif"
                    }}>{row.v}</div>
                  </div>
                ))}
                <button onClick={() => setSelected(null)} style={{
                  marginTop: 6, width: "100%", background: "transparent",
                  border: `1px solid ${C.border}`, borderRadius: 4,
                  color: C.muted, fontSize: 9, padding: "5px",
                  cursor: "pointer", fontWeight: 500,
                }}>CLEAR ✕</button>
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, padding: "22px 28px", minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: "transparent", border: "none",
                borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`,
                color: tab === t.id ? C.accent : C.muted,
                padding: "8px 18px 10px", fontSize: 11, letterSpacing: "0.1em",
                cursor: "pointer", fontWeight: tab === t.id ? 700 : 500,
              }}>
                {t.label.toUpperCase()}
              </button>
            ))}
          </div>

          {tab === "network" && (
            <>
              <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.12em", marginBottom: 12, fontWeight: 500 }}>
                NODE SIZE = NSF FUNDING  ·  HOVER TO HIGHLIGHT CONNECTIONS  ·  DRAG TO REARRANGE  ·  CLICK TO PIN DETAIL
              </div>
              <NetworkGraph domainFilter={domain} onSelect={setSelected} selected={selected} removedNode={removedNode} />
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                {Object.entries(DOMAINS).map(([k, d]) => (
                  <div key={k} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: 9, color: C.muted, letterSpacing: "0.08em", fontWeight: 500
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                    {d.label}
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "trends" && <TrendsView />}
          {tab === "topics" && <TopicsView />}
          {tab === "analytics" && <AnalyticsView onRemoveNode={setRemovedNode} removedNode={removedNode} />}
        </div>
      </div>
    </div>
  )
}
