import { useEffect, useState } from 'react'
import { getMarkets, type AssetMeta } from '../lib/hl/info'

const fmt = (n: number) => (n >= 1000 ? Math.round(n).toLocaleString('en-US') : n >= 1 ? n.toFixed(2) : n.toPrecision(3))

/** Endless strip of live Hyperliquid prices. */
export default function Ticker() {
  const [m, setM] = useState<AssetMeta[]>([])
  const [prev, setPrev] = useState<Record<string, number>>({})
  useEffect(() => {
    let live = true
    const load = () =>
      getMarkets()
        .then((x) => {
          if (!live) return
          setM((old) => {
            setPrev(Object.fromEntries(old.map((a) => [a.name, a.markPx])))
            return x.slice(0, 18)
          })
        })
        .catch(() => {})
    load()
    const t = setInterval(load, 20_000)
    return () => {
      live = false
      clearInterval(t)
    }
  }, [])
  if (!m.length) return <div className="ticker" />
  const items = m.map((a) => {
    const p = prev[a.name]
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
