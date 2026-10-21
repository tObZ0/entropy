import { useMarkets } from '../lib/hl/useMarkets'

const fmt = (n: number) => (n >= 1000 ? Math.round(n).toLocaleString('en-US') : n >= 1 ? n.toFixed(2) : n.toPrecision(3))

/** Endless strip of live Hyperliquid prices. */
export default function Ticker() {
  const { data, prev } = useMarkets()
  if (!data?.length) return <div className="ticker" />
  const before = Object.fromEntries((prev ?? []).map((a) => [a.name, a.markPx]))
  const items = data.slice(0, 18).map((a) => {
    const p = before[a.name]
    const dir = p ? (a.markPx > p ? 'up' : a.markPx < p ? 'down' : '') : ''
    return (
      <span key={a.name} className="tick">
        <b>{a.name}</b>
        <span className={dir}>${fmt(a.markPx)}</span>
      </span>
    )
  })
  return (
    <div className="ticker" aria-label="Live Hyperliquid prices">
      <div className="ticker-track">
        <div className="ticker-group">{items}</div>
        <div className="ticker-group" aria-hidden="true">{items}</div>
      </div>
    </div>
  )
}
