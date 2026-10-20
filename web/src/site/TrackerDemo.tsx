import { useState } from 'react'
import LadderChart from '../components/LadderChart'

// Illustrative numbers for the landing demo only.
const DEMO = {
  px: 108_400,
  single: { addr: '0x7a3f…c91e', size: '$6.20M', lev: '10x', liq: 98_640 },
  slices: [
    { addr: '0x19be…04da', size: '$612K', lev: '7x', liq: 94_310 },
    { addr: '0xd240…7f13', size: '$948K', lev: '9x', liq: 97_020 },
    { addr: '0x5c71…ae90', size: '$705K', lev: '12x', liq: 100_150 },
    { addr: '0x8e02…3b6c', size: '$1.04M', lev: '10x', liq: 98_270 },
    { addr: '0xa6f9…d218', size: '$833K', lev: '8x', liq: 95_880 },
    { addr: '0x3d4e…915f', size: '$1.12M', lev: '11x', liq: 99_430 },
    { addr: '0xf18a…6c07', size: '$942K', lev: '13x', liq: 101_060 },
  ],
}

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`
const usd = (s: string) => parseFloat(s.slice(1)) * (s.endsWith('M') ? 1e6 : 1e3)

export default function TrackerDemo() {
  const [split, setSplit] = useState(true)
  const rows = split ? DEMO.slices : [DEMO.single]
  return (
    <div className="card" style={{ textAlign: 'left', maxWidth: 820, margin: '64px auto 0', padding: 20 }}>
      <div className="row" style={{ marginBottom: 14 }}>
        <span className="eyebrow">Public tracker · BTC-PERP · simulated</span>
        <span className="spacer" />
        <div className="seg" style={{ width: 260 }}>
          <button className={!split ? 'on-short' : ''} onClick={() => setSplit(false)}>One account</button>
          <button className={split ? 'on-long' : ''} onClick={() => setSplit(true)}>With Entropy</button>
        </div>
      </div>
      <div className="scroll-x">
        <table className="tracker">
          <thead>
            <tr><th>Wallet</th><th className="r">Size</th><th className="r">Lev</th><th className="r">Liq. price</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.addr}>
                <td>
                  {r.addr}
                  {!split && <span className="alert">WHALE ALERT</span>}
                </td>
                <td className="r">{r.size}</td>
                <td className="r">{r.lev}</td>
                <td className="r">{fmt(r.liq)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 18 }}>
        <LadderChart
          refPx={DEMO.px}
          single={DEMO.single.liq}
          liqs={split ? DEMO.slices.map((s) => ({ px: s.liq, weight: usd(s.size) })) : []}
          showSingle={!split}
          height={92}
        />
      </div>
      <p className="muted" style={{ fontSize: 13, margin: '10px 0 0' }}>
        {split
          ? 'Seven ordinary positions with liquidation spread across a $6,700 range. No line to push the price to.'
          : 'One wallet, one size, one exact liquidation price, visible to everyone.'}
      </p>
    </div>
  )
}
