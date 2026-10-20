import { WHALE_ALERT_USD } from '../config'
import type { Plan } from '../lib/planner'
import { short } from '../lib/wallet'

const usd = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(2)}`
const px = (n: number) => (n >= 1000 ? `$${Math.round(n).toLocaleString('en-US')}` : `$${n.toPrecision(5)}`)

/** The plan as a public position tracker would list it, next to the unsplit version. */
export default function TrackerView({ plan, addresses }: { plan: Plan; addresses?: string[] }) {
  const coin = plan.input.asset.name
  const side = plan.input.isLong ? 'Long' : 'Short'
  const singleAlert = plan.totalNotional >= WHALE_ALERT_USD
  return (
    <div className="grid g2">
      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>As one account</div>
        <table className="tracker">
          <thead><tr><th>Wallet</th><th className="r">Size</th><th className="r">Liq</th></tr></thead>
          <tbody>
            <tr>
              <td>your wallet{singleAlert && <span className="alert">WHALE</span>}</td>
              <td className="r">{side} {usd(plan.totalNotional)}</td>
              <td className="r danger">{px(plan.singleLiqPx)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>With Entropy</div>
        <table className="tracker">
          <thead><tr><th>Wallet</th><th className="r">Size</th><th className="r">Liq</th></tr></thead>
          <tbody>
            {[...plan.slices]
              .sort((a, b) => b.notional - a.notional)
              .map((s) => (
                <tr key={s.index}>
                  <td>{addresses ? short(addresses[s.index]) : `new wallet ${s.index + 1}`}</td>
                  <td className="r">{side} {usd(s.notional)}</td>
                  <td className="r accent">{px(s.liqPx)}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 12.5, margin: '10px 0 0' }}>
          Trackers sort by size; none of these {coin} positions stands out, and no two share a liquidation price.
        </p>
      </div>
    </div>
  )
}
