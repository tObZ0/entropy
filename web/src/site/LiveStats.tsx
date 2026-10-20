import { useEffect, useState } from 'react'
import { getMarkets, type AssetMeta } from '../lib/hl/info'

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
  const stats: [string, string][] = [
    ['Open interest on Hyperliquid', m?.length ? big(oi) : '—'],
    ['24h perps volume', m?.length ? big(vol) : '—'],
    ['Perp markets', m?.length ? String(m.length) : '—'],
    ['BTC mark price', btc ? `$${Math.round(btc.markPx).toLocaleString('en-US')}` : '—'],
  ]
  return (
    <div>
      <div className="live-stats">
        {stats.map(([k, v]) => (
          <div key={k}>
            <div className="v">{v}</div>
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
