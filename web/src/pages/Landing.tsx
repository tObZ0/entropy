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

function TrackerDemo() {
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

const STEPS = [
  ['Sign once', 'Your wallet signs one message. Entropy turns it into a set of fresh trading accounts, right in your browser. Keys never leave your device and are never stored.'],
  ['Plan the split', 'Enter one trade. Entropy splits it into slices of random size, each with its own margin, so liquidation becomes a range instead of a price.'],
  ['Fund the slices', 'Each slice account needs its own USDC. Entropy shows what to send and warns you when a transfer would link a slice back to you.'],
  ['Open on a random clock', 'Slices open one by one at random intervals, so the market sees unrelated traders arriving, not one whale.'],
]

const FEATURES: [string, string, boolean][] = [
  ['Position splitter', 'One order becomes several positions of random size, each kept well under whale-alert size.', false],
  ['Liquidation ladder', 'Different margin per slice turns one liquidation line into a band hunters cannot target.', false],
  ['Tracker view', 'See your slices exactly the way Hypurrscan and whale bots see them, before you open.', false],
  ['Linkability check', 'Flags slices that can be tied to your wallet or to each other through public transfers.', false],
  ['Close as one', 'Manage every slice as a single position: combined size, PnL and one button to unwind it all.', false],
  ['Risk guard and hidden stops', 'Margin top-ups near liquidation, and stops that live on your device until they fire.', true],
]

export default function Landing() {
  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <span className="eyebrow">Hidden leverage on Hyperliquid</span>
          <h1>
            Leverage without a <em>target</em>
          </h1>
          <p className="lead">
            Entropy splits one position across accounts that can't be linked. Trackers see a few ordinary traders. Nobody
            sees your size, and nobody sees a liquidation price to hunt.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-lg btn-primary" href="#/app">Launch app</a>
            <a className="btn btn-lg" href="#how">How it works</a>
          </div>
          <TrackerDemo />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <span className="eyebrow">The problem</span>
          <h2>On a public order book, a big position is a public target.</h2>
          <p className="sub">
            Hyperliquid shows every wallet's size, leverage and liquidation price. Trackers turn that into alerts, and
            traders have openly coordinated to push the price into a whale's liquidation level.
          </p>
          <div className="grid g3">
            <div className="card"><span className="step-n">Size</span><h3>Your size is a signal</h3><p>Large positions get posted, copied and traded against the moment they open.</p></div>
            <div className="card"><span className="step-n">Liquidation</span><h3>Your liquidation is a line</h3><p>One exact price where forced selling starts is a level anyone can aim at.</p></div>
            <div className="card"><span className="step-n">Timing</span><h3>Your moves are watched</h3><p>Adds, top-ups and exits from a known wallet show up on trackers in real time.</p></div>
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="wrap">
          <span className="eyebrow">How it works</span>
          <h2>One trade in. Many unremarkable positions out.</h2>
          <p className="sub">Entropy runs entirely in your browser. There is no Entropy server holding keys or funds.</p>
          <div className="grid g4">
            {STEPS.map(([t, d], i) => (
              <div className="card" key={t}>
                <span className="step-n">0{i + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="wrap">
          <span className="eyebrow">Features</span>
          <h2>Built for traders who are worth watching.</h2>
          <p className="sub">Starting with Hyperliquid perps, the venue where the hunting happens.</p>
          <div className="grid g3">
            {FEATURES.map(([t, d, soon]) => (
              <div className="card" key={t}>
                <span className={`tag${soon ? ' soon' : ''}`}>{soon ? 'Coming next' : 'Live'}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="limits">
        <div className="wrap">
          <span className="eyebrow">Honest limits</span>
          <h2>What Entropy hides, and what it can't.</h2>
          <div className="grid g2" style={{ marginTop: 36 }}>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Funding decides privacy</h3>
              <p>If every slice is funded straight from your main wallet, anyone can connect them. Entropy flags those links, but the funding path is yours to choose.</p>
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Your signature is the key</h3>
              <p>The message you sign controls every slice account. Only sign it on the real Entropy app, and never share it.</p>
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Early software</h3>
              <p>Entropy is new and unaudited. Position sizes are capped while it proves itself. Trade only what you can afford to lose.</p>
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Not a mixer</h3>
              <p>Entropy never moves your money between accounts on its own, and never routes funds through privacy pools.</p>
            </div>
          </div>
          <div className="hero-ctas" style={{ marginTop: 56 }}>
            <a className="btn btn-lg btn-primary" href="#/app">Launch app</a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          <span>© {new Date().getFullYear()} Entropy · Non-custodial · Keys stay on your device</span>
          <span>Not financial advice. Leverage can lose more than you expect.</span>
        </div>
      </footer>
    </main>
  )
}
