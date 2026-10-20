import { useEffect, useState } from 'react'
import { getMarkets, type AssetMeta } from '../lib/hl/info'
import { CountUp } from './motion'

const big = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(0)}M`)

/** Live Hyperliquid numbers: the size of the public book Entropy hides in. */
export default function LiveStats() {
  const [m, setM] = useState<AssetMeta[] | null>(null)
  const [at, setAt] = useState<Date>()
  useEffect(() => {
    getMarkets().then((x) => (setM(x), setAt(new Date()))).catch(() => setM([]))
  }, [])
  const oi = m?.reduce((s, x) => s + x.openInterest, 0) ?? 0
  const vol = m?.reduce((s, x) => s + x.dayNtlVlm, 0) ?? 0
  const btc = m?.find((x) => x.name === 'BTC')
  const stats: [string, number | undefined, (n: number) => string][] = [
    ['Open interest on Hyperliquid', m?.length ? oi : undefined, big],
    ['24h perps volume', m?.length ? vol : undefined, big],
    ['Perp markets', m?.length ? m.length : undefined, (n) => String(Math.round(n))],
    ['BTC mark price', btc?.markPx, (n) => `$${Math.round(n).toLocaleString('en-US')}`],
  ]
  return (
    <div>
      <div className="live-stats">
        {stats.map(([k, v, f]) => (
          <div key={k}>
            <div className="v">{v === undefined ? '—' : <CountUp value={v} format={f} />}</div>
            <div className="k">{k}</div>
          </div>
        ))}
      </div>
      <p className="eyebrow" style={{ marginTop: 14, fontSize: 11 }}>
        Live from the Hyperliquid API{at ? ` · ${at.toLocaleTimeString()}` : ''} · every position in it is public
      </p>
    </div>
  )
}
