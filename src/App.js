import { useState, useEffect, useRef, useCallback } from "react"
import * as d3 from "d3"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#05080f",
  surface: "#0a0f1e",
  card:    "#0d1528",
  border:  "#162035",
  accent:  "#e8a020",
  accentD: "#b07010",
  blue:    "#38bdf8",
  text:    "#dde6f0",
  muted:   "#4a607a",
  mutedLt: "#7a98b8",
}

const DOMAINS = {
  CS:  { label:"Computer Science", color:"#38bdf8" },
  BIO: { label:"Life Sciences",    color:"#4ade80" },
  PHY: { label:"Physics & Math",   color:"#fbbf24" },
  ENG: { label:"Engineering",      color:"#f472b6" },
  SOC: { label:"Social Sciences",  color:"#a78bfa" },
}

// ── STATIC DATA ───────────────────────────────────────────────────────────────
const NODES = [
  { id:0,  name:"MIT",          domain:"CS",  funding:852  },
  { id:1,  name:"Stanford",     domain:"CS",  funding:918  },
  { id:2,  name:"Caltech",      domain:"PHY", funding:412  },
  { id:3,  name:"Harvard",      domain:"BIO", funding:1102 },
  { id:4,  name:"CMU",          domain:"CS",  funding:634  },
  { id:5,  name:"UC Berkeley",  domain:"CS",  funding:789  },
  { id:6,  name:"U Michigan",   domain:"ENG", funding:723  },
  { id:7,  name:"UIUC",         domain:"ENG", funding:612  },
  { id:8,  name:"Cornell",      domain:"BIO", funding:587  },
  { id:9,  name:"Georgia Tech", domain:"ENG", funding:543  },
  { id:10, name:"UT Austin",    domain:"CS",  funding:498  },
  { id:11, name:"UW Seattle",   domain:"BIO", funding:612  },
  { id:12, name:"Princeton",    domain:"PHY", funding:389  },
  { id:13, name:"Columbia",     domain:"SOC", funding:445  },
  { id:14, name:"Duke",         domain:"BIO", funding:378  },
  { id:15, name:"Northwestern", domain:"SOC", funding:412  },
  { id:16, name:"NYU",          domain:"SOC", funding:334  },
  { id:17, name:"UW Madison",   domain:"BIO", funding:521  },
  { id:18, name:"Maryland",     domain:"CS",  funding:445  },
  { id:19, name:"USC",          domain:"CS",  funding:398  },
  { id:20, name:"Purdue",       domain:"ENG", funding:478  },
  { id:21, name:"Ohio State",   domain:"ENG", funding:512  },
  { id:22, name:"Penn State",   domain:"ENG", funding:489  },
  { id:23, name:"UCSD",         domain:"BIO", funding:567  },
  { id:24, name:"UT Dallas",    domain:"CS",  funding:187  },
]

const EDGES = [
  [0,1],[0,4],[0,5],[0,8],[0,12],[0,18],
  [1,2],[1,4],[1,5],[1,19],[1,23],
  [2,12],[2,19],
  [3,8],[3,11],[3,14],[3,17],[3,13],
  [4,5],[4,7],[4,18],
  [5,19],[5,23],[5,11],
  [6,7],[6,20],[6,21],[6,22],
  [7,20],[7,22],
  [8,14],[8,12],
  [9,10],[9,20],[9,21],
  [10,18],[10,24],
  [11,23],[11,17],
  [12,13],[12,16],
  [13,15],[13,16],
  [14,17],[15,16],[15,21],
  [17,21],[20,22],
]

const TRENDS = [
  { year:"2018", CS:4.2, BIO:5.8, PHY:2.9, ENG:3.7, SOC:1.8 },
  { year:"2019", CS:4.9, BIO:6.1, PHY:3.1, ENG:3.9, SOC:1.9 },
  { year:"2020", CS:5.8, BIO:7.2, PHY:3.0, ENG:4.1, SOC:2.1 },
  { year:"2021", CS:6.9, BIO:8.4, PHY:3.2, ENG:4.4, SOC:2.3 },
  { year:"2022", CS:7.8, BIO:8.9, PHY:3.5, ENG:4.8, SOC:2.5 },
  { year:"2023", CS:9.1, BIO:9.3, PHY:3.7, ENG:5.1, SOC:2.8 },
]

const TOPICS = [
  { year:"2018", ML:312, DL:189, Bio:245, QC:67,  NLP:134, Rob:156, PH:178 },
  { year:"2019", ML:421, DL:287, Bio:267, QC:98,  NLP:189, Rob:178, PH:201 },
  { year:"2020", ML:589, DL:412, Bio:312, QC:134, NLP:287, Rob:198, PH:389 },
  { year:"2021", ML:712, DL:534, Bio:334, QC:189, NLP:378, Rob:223, PH:312 },
  { year:"2022", ML:845, DL:678, Bio:356, QC:245, NLP:489, Rob:267, PH:289 },
  { year:"2023", ML:1023,DL:812, Bio:389, QC:312, NLP:612, Rob:312, PH:267 },
]

const TOPIC_META = [
  { key:"ML",  label:"Machine Learning",   color:"#38bdf8" },
  { key:"DL",  label:"Deep Learning",      color:"#818cf8" },
  { key:"Bio", label:"Bioinformatics",      color:"#4ade80" },
  { key:"QC",  label:"Quantum Computing",  color:"#fbbf24" },
  { key:"NLP", label:"Natural Lang. Proc.", color:"#a78bfa" },
  { key:"Rob", label:"Robotics",           color:"#f472b6" },
  { key:"PH",  label:"Public Health",      color:"#fb923c" },
]

// ── SHARED COMPONENTS ────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    flex:1, minWidth:110, background:C.card,
    border:`1px solid ${C.border}`,
    borderTop:`2px solid ${color || C.accent}`,
    borderRadius:6, padding:"12px 14px",
  }}>
    <div style={{ color:C.muted, fontSize:9, letterSpacing:"0.18em", marginBottom:5 }}>
      {label.toUpperCase()}
    </div>
    <div style={{ color: color || C.accent, fontSize:22, fontWeight:700,
      fontFamily:"'Playfair Display', Georgia, serif", lineHeight:1.1, marginBottom:3 }}>
      {value}
    </div>
    {sub && <div style={{ color:C.muted, fontSize:9, letterSpacing:"0.05em" }}>{sub}</div>}
  </div>
)

const CustomTooltipBase = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background:C.card, border:`1px solid ${C.border}`,
      borderLeft:`3px solid ${C.accent}`,
      borderRadius:8, padding:"10px 14px",
      fontSize:11, fontFamily:"monospace", minWidth:160,
    }}>
      <div style={{ color:C.accent, fontWeight:700, marginBottom:8 }}>{label}</div>
      {[...payload].sort((a,b)=>b.value-a.value).map(p => (
        <div key={p.dataKey} style={{ color:p.fill || p.stroke, marginBottom:3 }}>
          {p.name}: <strong>${typeof formatter==="function" ? formatter(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ── NETWORK GRAPH ─────────────────────────────────────────────────────────────
function NetworkGraph({ domainFilter, onSelect, selected }) {
  const svgRef   = useRef()
  const simRef   = useRef()
  const [tooltip, setTooltip] = useState(null)
  const [dims, setDims] = useState({ w:640, h:460 })

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
      .map(n => ({ ...n }))
    const idSet = new Set(filteredNodes.map(n => n.id))
    const filteredEdges = EDGES
      .filter(([a,b]) => idSet.has(a) && idSet.has(b))
      .map(([source, target]) => ({ source, target }))

    const rScale = d3.scaleSqrt().domain([150, 1200]).range([6, 22])

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svg.attr("width", w).attr("height", h)

    // Background grid
    const defs = svg.append("defs")
    const pat = defs.append("pattern")
      .attr("id","grid").attr("width",40).attr("height",40)
      .attr("patternUnits","userSpaceOnUse")
    pat.append("path").attr("d","M 40 0 L 0 0 0 40")
      .attr("fill","none").attr("stroke","#162035").attr("stroke-width","0.6")
    svg.append("rect").attr("width","100%").attr("height","100%")
      .attr("fill","url(#grid)").attr("opacity",0.7)

    // Glow filter
    const filter = defs.append("filter").attr("id","glow")
    filter.append("feGaussianBlur").attr("stdDeviation","3").attr("result","blur")
    const merge = filter.append("feMerge")
    merge.append("feMergeNode").attr("in","blur")
    merge.append("feMergeNode").attr("in","SourceGraphic")

    const linkG = svg.append("g")
    const nodeG = svg.append("g")

    const linkSel = linkG.selectAll("line")
      .data(filteredEdges).enter().append("line")
      .attr("stroke", C.border)
      .attr("stroke-width", 1.4)
      .attr("stroke-opacity", 0.9)

    const nodeSel = nodeG.selectAll("g")
      .data(filteredNodes).enter().append("g")
      .style("cursor","pointer")

    nodeSel.append("circle")
      .attr("r", d => rScale(d.funding) + 7)
      .attr("fill","none")
      .attr("stroke", d => DOMAINS[d.domain].color)
      .attr("stroke-width", 0.6)
      .attr("opacity", 0.2)

    nodeSel.append("circle")
      .attr("r", d => rScale(d.funding))
      .attr("fill", d => DOMAINS[d.domain].color)
      .attr("fill-opacity", 0.82)
      .attr("stroke", d => DOMAINS[d.domain].color)
      .attr("stroke-width", 1.5)

    nodeSel.append("text")
      .text(d => d.name)
      .attr("text-anchor","middle")
      .attr("dy", d => rScale(d.funding) + 13)
      .attr("fill", C.mutedLt)
      .attr("font-size","9px")
      .attr("font-family","monospace")
      .attr("pointer-events","none")

    nodeSel
      .on("mouseover", function(event, d) {
        d3.select(this).select("circle:nth-child(2)")
          .transition().duration(120)
          .attr("fill-opacity",1).attr("r", rScale(d.funding)+3)
        linkSel
          .attr("stroke", l => (l.source.id===d.id||l.target.id===d.id) ? C.accent : C.border)
          .attr("stroke-width", l => (l.source.id===d.id||l.target.id===d.id) ? 2.2 : 1.4)
          .attr("stroke-opacity", l => (l.source.id===d.id||l.target.id===d.id) ? 1 : 0.3)
        const conn = EDGES.filter(([a,b])=>a===d.id||b===d.id).length
        setTooltip({ ...d, connections: conn })
      })
      .on("mouseout", function(event, d) {
        d3.select(this).select("circle:nth-child(2)")
          .transition().duration(120)
          .attr("fill-opacity",0.82).attr("r", rScale(d.funding))
        linkSel
          .attr("stroke", C.border)
          .attr("stroke-width", 1.4)
          .attr("stroke-opacity", 0.9)
        setTooltip(null)
      })
      .on("click", (_, d) => onSelect(selected?.id === d.id ? null : d))

    const drag = d3.drag()
      .on("start", (e,d) => { if(!e.active) simRef.current?.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y })
      .on("drag",  (e,d) => { d.fx=e.x; d.fy=e.y })
      .on("end",   (e,d) => { if(!e.active) simRef.current?.alphaTarget(0); d.fx=null; d.fy=null })
    nodeSel.call(drag)

    const sim = d3.forceSimulation(filteredNodes)
      .force("link",  d3.forceLink(filteredEdges).id(d=>d.id).distance(85).strength(0.45))
      .force("charge",d3.forceManyBody().strength(-240))
      .force("center",d3.forceCenter(w/2, h/2))
      .force("collide",d3.forceCollide().radius(d => rScale(d.funding)+12))
      .on("tick", () => {
        linkSel
          .attr("x1",d=>d.source.x).attr("y1",d=>d.source.y)
          .attr("x2",d=>d.target.x).attr("y2",d=>d.target.y)
        nodeSel.attr("transform", d=>`translate(${
          Math.max(rScale(d.funding)+2, Math.min(w-rScale(d.funding)-2, d.x))
        },${
          Math.max(rScale(d.funding)+2, Math.min(h-rScale(d.funding)-2, d.y))
        })`)
      })

    simRef.current = sim
    return () => sim.stop()
  }, [domainFilter, dims])

  return (
    <div style={{ position:"relative" }}>
      <svg ref={svgRef} style={{
        display:"block", width:"100%",
        borderRadius:8, background:C.bg,
        border:`1px solid ${C.border}`,
      }}/>
      {tooltip && (
        <div style={{
          position:"absolute", top:12, right:12,
          background:C.card, border:`1px solid ${C.border}`,
          borderLeft:`3px solid ${DOMAINS[tooltip.domain].color}`,
          borderRadius:8, padding:"12px 16px", minWidth:190,
          fontFamily:"monospace", pointerEvents:"none", zIndex:10,
        }}>
          <div style={{ color:DOMAINS[tooltip.domain].color, fontWeight:700, fontSize:13, marginBottom:5 }}>
            {tooltip.name}
          </div>
          <div style={{ color:C.muted, fontSize:10, marginBottom:6 }}>
            {DOMAINS[tooltip.domain].label}
          </div>
          <div style={{ color:C.text, fontSize:11, marginBottom:3 }}>
            💰 <span style={{color:C.accent, fontWeight:700}}>${tooltip.funding}M</span> NSF funding
          </div>
          <div style={{ color:C.text, fontSize:11 }}>
            🔗 <span style={{color:C.blue, fontWeight:700}}>{tooltip.connections}</span> collaborations
          </div>
        </div>
      )}
    </div>
  )
}

// ── TRENDS VIEW ───────────────────────────────────────────────────────────────
function TrendsView() {
  const total18 = Object.entries(TRENDS[0]).filter(([k])=>k!=="year").reduce((s,[,v])=>s+v,0)
  const total23 = Object.entries(TRENDS[5]).filter(([k])=>k!=="year").reduce((s,[,v])=>s+v,0)
  const growth  = (((total23/total18)-1)*100).toFixed(0)

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <StatCard label="2023 Total" value={`$${total23.toFixed(1)}B`} sub="across all domains"/>
        <StatCard label="6-Year Growth" value={`+${growth}%`} sub="2018 → 2023" color={C.blue}/>
        <StatCard label="CS Surge" value="+117%" sub="fastest growing" color={DOMAINS.CS.color}/>
        <StatCard label="Top Domain" value="Life Sci" sub="$9.3B in 2023" color={DOMAINS.BIO.color}/>
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"18px 14px 10px" }}>
        <div style={{ color:C.mutedLt, fontSize:10, fontFamily:"monospace",
          letterSpacing:"0.14em", marginBottom:14 }}>
          NSF FUNDING BY DOMAIN  ·  USD BILLIONS  ·  2018–2023
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={TRENDS} margin={{ top:8, right:16, left:0, bottom:0 }}>
            <defs>
              {Object.entries(DOMAINS).map(([k,d]) => (
                <linearGradient key={k} id={`tg-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={d.color} stopOpacity={0.55}/>
                  <stop offset="95%" stopColor={d.color} stopOpacity={0.04}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 4" stroke={C.border} vertical={false}/>
            <XAxis dataKey="year" stroke={C.muted}
              tick={{ fill:C.mutedLt, fontSize:11, fontFamily:"monospace" }}/>
            <YAxis stroke={C.muted}
              tick={{ fill:C.mutedLt, fontSize:11, fontFamily:"monospace" }}
              tickFormatter={v=>`$${v}B`}/>
            <Tooltip content={<CustomTooltipBase formatter={v=>`${v.toFixed(1)}B`}/>}/>
            <Legend iconType="circle"
              wrapperStyle={{ fontFamily:"monospace", fontSize:10, color:C.muted, paddingTop:8 }}/>
            {Object.entries(DOMAINS).map(([k,d]) => (
              <Area key={k} type="monotone" dataKey={k} name={d.label}
                stackId="1" stroke={d.color} strokeWidth={1.8}
                fill={`url(#tg-${k})`} fillOpacity={1}/>
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Per-domain bar breakdown */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:8, padding:"18px 14px 10px", marginTop:14 }}>
        <div style={{ color:C.mutedLt, fontSize:10, fontFamily:"monospace",
          letterSpacing:"0.14em", marginBottom:14 }}>
          2023 FUNDING BY DOMAIN  ·  SIDE-BY-SIDE COMPARISON
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[{ year:"2023", ...TRENDS[5] }]}
            margin={{ top:8, right:16, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 4" stroke={C.border} vertical={false}/>
            <XAxis dataKey="year" stroke={C.muted} tick={{ fill:C.mutedLt, fontSize:11 }}/>
            <YAxis stroke={C.muted} tick={{ fill:C.mutedLt, fontSize:11 }} tickFormatter={v=>`$${v}B`}/>
            <Tooltip content={<CustomTooltipBase formatter={v=>`${v.toFixed(1)}B`}/>}/>
            <Legend iconType="square"
              wrapperStyle={{ fontFamily:"monospace", fontSize:10, color:C.muted, paddingTop:8 }}/>
            {Object.entries(DOMAINS).map(([k,d]) => (
              <Bar key={k} dataKey={k} name={d.label} fill={d.color} fillOpacity={0.85} radius={[3,3,0,0]}/>
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
  const mlGrowth  = (((TOPICS[5].ML  / TOPICS[0].ML)  - 1)*100).toFixed(0)
  const qcGrowth  = (((TOPICS[5].QC  / TOPICS[0].QC)  - 1)*100).toFixed(0)
  const nlpGrowth = (((TOPICS[5].NLP / TOPICS[0].NLP) - 1)*100).toFixed(0)

  const displayTopics = active ? TOPIC_META.filter(t => t.key === active) : TOPIC_META

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <StatCard label="ML/AI Growth"       value={`+${mlGrowth}%`}  sub="2018 → 2023" color={DOMAINS.CS.color}/>
        <StatCard label="NLP Acceleration"   value={`+${nlpGrowth}%`} sub="driven by LLMs" color="#a78bfa"/>
        <StatCard label="Quantum Computing"  value={`+${qcGrowth}%`}  sub="fastest relative" color="#fbbf24"/>
        <StatCard label="Public Health Peak" value="2020"              sub="COVID funding surge" color="#fb923c"/>
      </div>

      {/* Topic toggle pills */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        <button
          onClick={() => setActive(null)}
          style={{
            background: !active ? C.accent : "transparent",
            border:`1px solid ${!active ? C.accent : C.border}`,
            color: !active ? C.bg : C.muted,
            borderRadius:20, padding:"4px 12px",
            fontSize:10, fontFamily:"monospace", cursor:"pointer",
            letterSpacing:"0.1em",
          }}>ALL</button>
        {TOPIC_META.map(t => (
          <button key={t.key}
            onClick={() => setActive(active===t.key ? null : t.key)}
            style={{
              background: active===t.key ? t.color : "transparent",
              border:`1px solid ${active===t.key ? t.color : C.border}`,
              color: active===t.key ? C.bg : C.muted,
              borderRadius:20, padding:"4px 12px",
              fontSize:10, fontFamily:"monospace", cursor:"pointer",
            }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:8, padding:"18px 14px 10px" }}>
        <div style={{ color:C.mutedLt, fontSize:10, fontFamily:"monospace",
          letterSpacing:"0.14em", marginBottom:14 }}>
          KEYWORD EVOLUTION  ·  GRANT COUNT  ·  2018–2023
        </div>
        <ResponsiveContainer width="100%" height={330}>
          <AreaChart data={TOPICS} margin={{ top:8, right:16, left:0, bottom:0 }}>
            <defs>
              {TOPIC_META.map(t => (
                <linearGradient key={t.key} id={`kg-${t.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={t.color} stopOpacity={active===t.key ? 0.8 : 0.5}/>
                  <stop offset="95%" stopColor={t.color} stopOpacity={0.03}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 4" stroke={C.border} vertical={false}/>
            <XAxis dataKey="year" stroke={C.muted}
              tick={{ fill:C.mutedLt, fontSize:11, fontFamily:"monospace" }}/>
            <YAxis stroke={C.muted}
              tick={{ fill:C.mutedLt, fontSize:11, fontFamily:"monospace" }}/>
            <Tooltip content={<CustomTooltipBase formatter={v=>`${v} grants`}/>}/>
            <Legend iconType="circle"
              wrapperStyle={{ fontFamily:"monospace", fontSize:10, color:C.muted, paddingTop:8 }}/>
            {displayTopics.map(t => (
              <Area key={t.key} type="monotone" dataKey={t.key} name={t.label}
                stackId={active ? undefined : "1"}
                stroke={t.color} strokeWidth={active===t.key ? 2.5 : 1.6}
                fill={`url(#kg-${t.key})`} fillOpacity={1}/>
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]         = useState("network")
  const [domain, setDomain]   = useState("ALL")
  const [selected, setSelected] = useState(null)

  const topNode   = NODES.reduce((a,b) => a.funding > b.funding ? a : b)
  const totalFund = NODES.reduce((s,n) => s + n.funding, 0)

  const tabs = [
    { id:"network", label:"◈  Network"  },
    { id:"trends",  label:"◉  Funding Trends" },
    { id:"topics",  label:"◆  Topic Evolution" },
  ]

  const connCount = selected
    ? EDGES.filter(([a,b]) => a===selected.id || b===selected.id).length
    : 0

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text,
      fontFamily:"monospace", fontSize:13 }}>

      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:${C.bg}; }
        button { transition: all 0.15s ease; }
        button:hover { opacity:0.85; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:${C.surface}; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:2px; }
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`,
        padding:"14px 24px", display:"flex", alignItems:"center",
        justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <div>
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <span style={{
              fontFamily:"'Playfair Display', Georgia, serif",
              fontSize:24, fontWeight:700, letterSpacing:"0.08em", color:C.text
            }}>NEXUS</span>
            <span style={{ color:C.accent, fontSize:10, letterSpacing:"0.2em" }}>
              NSF RESEARCH INTELLIGENCE
            </span>
          </div>
          <div style={{ color:C.muted, fontSize:9, letterSpacing:"0.12em", marginTop:3 }}>
            DATA-DRIVEN SCIENCE OF SCIENCE  ·  2018–2023  ·  25 INSTITUTIONS
          </div>
        </div>
        <div style={{ display:"flex", gap:24 }}>
          {[
            { v:`$${(totalFund/1000).toFixed(1)}B`, l:"TOTAL FUNDING" },
            { v:NODES.length,                        l:"INSTITUTIONS"  },
            { v:EDGES.length,                        l:"COLLABORATIONS"},
          ].map(s => (
            <div key={s.l} style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif",
                fontSize:20, fontWeight:700, color:C.accent }}>{s.v}</div>
              <div style={{ fontSize:8, color:C.muted, letterSpacing:"0.16em" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY: SIDEBAR + MAIN ── */}
      <div style={{ display:"flex" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width:176, background:C.surface, borderRight:`1px solid ${C.border}`,
          minHeight:"calc(100vh - 68px)", padding:"18px 12px", flexShrink:0 }}>

          <div style={{ fontSize:8, color:C.muted, letterSpacing:"0.2em", marginBottom:10 }}>
            FILTER DOMAIN
          </div>
          {[
            { id:"ALL", label:"All Domains", color:C.accent },
            ...Object.entries(DOMAINS).map(([k,v]) => ({ id:k, label:v.label, color:v.color }))
          ].map(d => (
            <button key={d.id} onClick={() => { setDomain(d.id); setSelected(null) }}
              style={{
                display:"block", width:"100%", textAlign:"left",
                background: domain===d.id ? C.card : "transparent",
                border:`1px solid ${domain===d.id ? d.color : "transparent"}`,
                borderLeft:`3px solid ${domain===d.id ? d.color : "transparent"}`,
                borderRadius:5, color: domain===d.id ? d.color : C.muted,
                padding:"6px 9px", marginBottom:4, cursor:"pointer",
                fontSize:10, fontFamily:"monospace",
              }}>
              {d.label}
            </button>
          ))}

          <div style={{ borderTop:`1px solid ${C.border}`, marginTop:18, paddingTop:16 }}>
            <div style={{ fontSize:8, color:C.muted, letterSpacing:"0.2em", marginBottom:10 }}>
              TOP FUNDED
            </div>
            <div style={{
              background:C.card, border:`1px solid ${C.border}`,
              borderLeft:`3px solid ${DOMAINS[topNode.domain].color}`,
              borderRadius:6, padding:"10px 11px"
            }}>
              <div style={{ color:DOMAINS[topNode.domain].color, fontWeight:700, fontSize:12 }}>
                {topNode.name}
              </div>
              <div style={{ color:C.accent, fontSize:18, fontWeight:700,
                fontFamily:"'Playfair Display',serif", marginTop:4 }}>
                ${topNode.funding}M
              </div>
              <div style={{ color:C.muted, fontSize:9, marginTop:2 }}>
                {DOMAINS[topNode.domain].label}
              </div>
            </div>
          </div>

          {selected && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:8, color:C.muted, letterSpacing:"0.2em", marginBottom:10 }}>
                SELECTED
              </div>
              <div style={{
                background:C.card, border:`1px solid ${C.border}`,
                borderLeft:`3px solid ${DOMAINS[selected.domain].color}`,
                borderRadius:6, padding:"10px 11px"
              }}>
                <div style={{ color:DOMAINS[selected.domain].color, fontWeight:700, fontSize:11, marginBottom:8 }}>
                  {selected.name}
                </div>
                {[
                  { l:"Domain",     v:DOMAINS[selected.domain].label, c:C.text   },
                  { l:"NSF Funding",v:`$${selected.funding}M`,         c:C.accent },
                  { l:"Collabs",    v:connCount,                       c:C.blue   },
                ].map(row => (
                  <div key={row.l} style={{ marginBottom:6 }}>
                    <div style={{ color:C.muted, fontSize:8, letterSpacing:"0.12em" }}>{row.l.toUpperCase()}</div>
                    <div style={{ color:row.c, fontWeight:700, fontSize:13,
                      fontFamily:"'Playfair Display',serif" }}>{row.v}</div>
                  </div>
                ))}
                <button onClick={() => setSelected(null)} style={{
                  marginTop:6, width:"100%", background:"transparent",
                  border:`1px solid ${C.border}`, borderRadius:4,
                  color:C.muted, fontSize:9, padding:"5px",
                  cursor:"pointer", fontFamily:"monospace",
                }}>CLEAR ✕</button>
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex:1, padding:"20px 24px", minWidth:0 }}>

          {/* Tab bar */}
          <div style={{ display:"flex", gap:2, marginBottom:20,
            borderBottom:`1px solid ${C.border}` }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  background:"transparent", border:"none",
                  borderBottom:`2px solid ${tab===t.id ? C.accent : "transparent"}`,
                  color: tab===t.id ? C.accent : C.muted,
                  padding:"8px 18px 10px", fontSize:11,
                  fontFamily:"monospace", letterSpacing:"0.1em",
                  cursor:"pointer",
                }}>
                {t.label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Hint text */}
          {tab === "network" && (
            <div style={{ color:C.muted, fontSize:9, letterSpacing:"0.12em", marginBottom:12 }}>
              NODE SIZE = NSF FUNDING  ·  HOVER TO HIGHLIGHT CONNECTIONS  ·  DRAG TO REARRANGE  ·  CLICK TO PIN DETAIL
            </div>
          )}

          {/* Views */}
          {tab === "network" && (
            <>
              <NetworkGraph domainFilter={domain} onSelect={setSelected} selected={selected}/>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:12 }}>
                {Object.entries(DOMAINS).map(([k,d]) => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:5,
                    fontSize:9, color:C.muted, letterSpacing:"0.08em" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
                    {d.label}
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "trends" && <TrendsView/>}
          {tab === "topics" && <TopicsView/>}
        </div>
      </div>
    </div>
  )
}
