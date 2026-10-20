import LadderChart from '../components/LadderChart'
import type { Feature } from './content'

// Small explanatory diagrams, one per feature. Colors come from CSS tokens.

const A = 'var(--accent)'
const D = 'var(--accent-deep)'
const M = 'var(--muted)'
const L = 'var(--line-2)'
const R = 'var(--danger)'
const T = { fontFamily: 'var(--mono)', fontSize: 11 }

function Split() {
  const slices = [0.18, 0.11, 0.2, 0.14, 0.22, 0.15]
  let y = 22
  return (
    <svg viewBox="0 0 520 220" width="100%" role="img" aria-label="One position split into slices">
      <text x={20} y={16} fill={M} {...T}>YOUR ORDER</text>
      <rect x={20} y={90} width={150} height={44} rx={8} fill={R} opacity={0.85} />
      <text x={95} y={117} fill="#0a0a08" textAnchor="middle" {...T} fontSize={12}>1 position · $6.2M</text>
      <text x={330} y={16} fill={M} {...T}>WHAT TRACKERS SEE</text>
      {slices.map((s, i) => {
        const h = 10 + s * 70
        const y0 = y
        y += h + 8
        const w = 70 + s * 520
        return (
          <g key={i}>
            <path d={`M170 112 C 250 112, 250 ${y0 + h / 2}, 330 ${y0 + h / 2}`} stroke={L} fill="none" />
            <path className="flow" style={{ animationDelay: `${i * -0.3}s` }} d={`M170 112 C 250 112, 250 ${y0 + h / 2}, 330 ${y0 + h / 2}`} stroke={A} fill="none" />
            <rect className="grow-x" style={{ animationDelay: `${i * 90}ms` }} x={330} y={y0} width={w * 0.6} height={h} rx={5} fill={A} opacity={0.5 + s * 2} />
          </g>
        )
      })}
    </svg>
  )
}

function Tracker() {
  const rows: [string, string, string, boolean][] = [
    ['0x7a3f…c91e', '$6.20M', '$98,640', true],
  ]
  const after: [string, string, string][] = [
    ['0xa6f9…d218', '$1.12M', '$99,430'],
    ['0x8e02…3b6c', '$1.04M', '$98,270'],
    ['0x5c71…ae90', '$948K', '$97,020'],
    ['0xd240…7f13', '$833K', '$95,880'],
  ]
  return (
    <div className="grid g2">
      <table className="tracker">
        <thead><tr><th>Before</th><th className="r">Size</th><th className="r">Liq</th></tr></thead>
        <tbody>{rows.map(([a, s, l]) => <tr key={a}><td>{a}<span className="alert">WHALE</span></td><td className="r">{s}</td><td className="r danger">{l}</td></tr>)}</tbody>
      </table>
      <table className="tracker">
        <thead><tr><th>After</th><th className="r">Size</th><th className="r">Liq</th></tr></thead>
        <tbody>{after.map(([a, s, l]) => <tr key={a}><td>{a}</td><td className="r">{s}</td><td className="r accent">{l}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

function Links() {
  const nodes: [number, number, string, 'linked' | 'clean'][] = [
    [380, 40, 'slice 1', 'clean'],
    [440, 110, 'slice 2', 'linked'],
    [380, 180, 'slice 3', 'clean'],
    [290, 200, 'slice 4', 'linked'],
  ]
  return (
    <svg viewBox="0 0 520 230" width="100%" role="img" aria-label="Linkability between wallet and slices">
      <circle cx={110} cy={115} r={34} fill="none" stroke={M} />
      <text x={110} y={119} fill={M} textAnchor="middle" {...T}>your wallet</text>
      {nodes.map(([x, y, n, s]) => (
        <g key={n}>
          {s === 'linked' && <line x1={144} y1={115} x2={x - 26} y2={y} stroke={R} strokeDasharray="5 4" />}
          <circle cx={x} cy={y} r={26} fill={s === 'linked' ? 'rgba(232,128,111,.12)' : 'rgba(232,226,189,.10)'} stroke={s === 'linked' ? R : A} />
          <text x={x} y={y + 4} fill={s === 'linked' ? R : A} textAnchor="middle" {...T}>{n}</text>
        </g>
      ))}
      <text x={20} y={222} fill={M} {...T}>dashed = public transfer found · slices 1 and 3 stay unlinked</text>
    </svg>
  )
}

function Close() {
  return (
    <svg viewBox="0 0 520 200" width="100%" role="img" aria-label="Closing all slices at once">
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={20} y={20 + i * 34} width={150 + ((i * 37) % 70)} height={22} rx={5} fill={A} opacity={0.75} />
          <path d={`M${190 + ((i * 37) % 70)} ${31 + i * 34} C 300 ${31 + i * 34}, 300 100, 380 100`} stroke={L} fill="none" />
        </g>
      ))}
      <rect x={380} y={78} width={120} height={44} rx={10} fill="none" stroke={R} />
      <text x={440} y={104} fill={R} textAnchor="middle" {...T} fontSize={12}>Close all</text>
    </svg>
  )
}

function Guard() {
  return (
    <svg viewBox="0 0 520 200" width="100%" role="img" aria-label="Risk guard adding margin near liquidation">
      <path d="M20 60 L90 80 L150 70 L220 120 L280 110 L330 150 L380 140 L440 105 L500 90" fill="none" stroke={M} strokeWidth={1.5} />
      <rect x={20} y={150} width={480} height={30} fill="rgba(232,226,189,.07)" />
      <text x={26} y={170} fill={D} {...T}>liquidation band</text>
      <circle cx={330} cy={150} r={6} fill={A} />
      <text x={340} y={135} fill={A} {...T}>+ margin on slice 3</text>
    </svg>
  )
}

function Stops() {
  return (
    <svg viewBox="0 0 520 200" width="100%" role="img" aria-label="Hidden stop that fires only when crossed">
      <text x={20} y={20} fill={M} {...T}>ORDER BOOK</text>
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={20} y={32 + i * 22} width={60 + ((i * 53) % 90)} height={14} rx={3} fill={L} />)}
      <text x={20} y={180} fill={M} {...T}>no stop orders visible</text>
      <rect x={290} y={40} width={200} height={110} rx={12} fill="none" stroke={L} />
      <text x={390} y={64} fill={M} textAnchor="middle" {...T}>YOUR DEVICE</text>
      <line x1={310} x2={470} y1={100} y2={100} stroke={R} strokeDasharray="5 4" />
      <text x={390} y={92} fill={R} textAnchor="middle" {...T}>stop $97,800</text>
      <line x1={310} x2={470} y1={128} y2={128} stroke={A} strokeDasharray="5 4" />
      <text x={390} y={142} fill={A} textAnchor="middle" {...T}>target $112,000</text>
    </svg>
  )
}

export function FeatureVisual({ kind }: { kind: Feature['visual'] }) {
  switch (kind) {
    case 'split': return <Split />
    case 'ladder':
      return (
        <LadderChart
          refPx={108400}
          single={98640}
          liqs={[94310, 97020, 100150, 98270, 95880, 99430, 101060].map((px, i) => ({ px, weight: [612, 948, 705, 1040, 833, 1120, 942][i] }))}
          height={140}
        />
      )
    case 'tracker': return <Tracker />
    case 'links': return <Links />
    case 'close': return <Close />
    case 'guard': return <Guard />
    case 'stops': return <Stops />
  }
}

/** The end-to-end flow: device → accounts → venue. */
export function FlowDiagram() {
  const box = (x: number, y: number, w: number, label: string, sub: string, hi = false) => (
    <g>
      <rect x={x} y={y} width={w} height={64} rx={12} fill={hi ? 'rgba(232,226,189,.08)' : 'none'} stroke={hi ? A : L} />
      <text x={x + w / 2} y={y + 28} fill={hi ? A : 'var(--text)'} textAnchor="middle" fontSize={13} fontFamily="var(--sans)">{label}</text>
      <text x={x + w / 2} y={y + 47} fill={M} textAnchor="middle" {...T}>{sub}</text>
    </g>
  )
  return (
    <svg viewBox="0 0 900 240" width="100%" role="img" aria-label="How Entropy works">
      {box(10, 88, 150, 'Your wallet', 'signs one message', true)}
      <path d="M160 120 H200" stroke={L} />
      <path className="flow" d="M160 120 H200" stroke={A} />
      {box(200, 88, 170, 'Your browser', 'derives slice keys')}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M370 120 C 410 120, 410 ${28 + i * 56}, 450 ${28 + i * 56}`} stroke={L} fill="none" />
          <path className="flow" style={{ animationDelay: `${i * -0.35}s` }} d={`M370 120 C 410 120, 410 ${28 + i * 56}, 450 ${28 + i * 56}`} stroke={A} fill="none" />
          <rect x={450} y={8 + i * 56} width={150} height={40} rx={10} fill="none" stroke={L} />
          <text x={525} y={33 + i * 56} fill="var(--text)" textAnchor="middle" {...T}>slice account {i + 1}</text>
          <path d={`M600 ${28 + i * 56} C 640 ${28 + i * 56}, 640 120, 690 120`} stroke={L} fill="none" />
          <path className="flow" style={{ animationDelay: `${-0.8 + i * -0.35}s` }} d={`M600 ${28 + i * 56} C 640 ${28 + i * 56}, 640 120, 690 120`} stroke={A} fill="none" />
        </g>
      ))}
      {box(690, 88, 200, 'Hyperliquid', 'perps · public ledger', true)}
    </svg>
  )
}
