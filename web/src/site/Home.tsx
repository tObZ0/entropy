import { Fragment, useState, type CSSProperties } from 'react'
import { Link } from '../router'
import { FAQ, FEATURES, INCIDENTS } from './content'
import EntropyField from './EntropyField'
import LiveStats from './LiveStats'
import Ticker from './Ticker'
import TrackerDemo from './TrackerDemo'
import { CtaBand, usePageTitle } from './ui'
import { FlowDiagram } from './visuals'

const HEADLINE: [string, boolean][] = [
  ['Hide', false], ['your', false], ['size', true], ['and', false], ['your', false], ['liquidation', true], ['price', true],
]

const STEPS = [
  ['Sign once', 'Your wallet signs one message. Entropy turns it into fresh trading accounts, in your browser. Keys never leave your device and are never stored.'],
  ['Plan the split', 'Enter one trade. Entropy splits it into slices of random size, each with its own margin, so liquidation becomes a range instead of a price.'],
  ['Fund the slices', 'Each slice account needs its own USDC. Entropy shows what to send and flags any transfer that links a slice back to you.'],
  ['Open on a random clock', 'Slices open one by one at random intervals, so the market sees unrelated traders arriving, not one whale.'],
]

export default function Home() {
  usePageTitle('Entropy', 'Entropy splits one Hyperliquid position across unlinkable accounts, so trackers never see your size or one liquidation price to hunt.')
  const [openQ, setOpenQ] = useState<number | null>(0)
  return (
    <main>
      <section className="hero">
        <EntropyField />
        <div className="wrap">
          <Link href="/whitepaper" className="pill">Whitepaper v0.1 is out <span aria-hidden>→</span></Link>
          <h1 className="words">
            {HEADLINE.map(([w, hi], i) => (
              <Fragment key={i}>
                <span className="w" style={{ '--w': i } as CSSProperties}>{hi ? <em>{w}</em> : w}</span>{' '}
              </Fragment>
            ))}
          </h1>
          <p className="lead">
            Entropy splits one leveraged position across accounts that can't be linked. Trackers see a few ordinary
            traders. Nobody sees a whale, and nobody sees a line to hunt.
          </p>
          <div className="hero-ctas">
            <Link className="btn btn-lg btn-primary" href="/app">Launch app</Link>
            <Link className="btn btn-lg" href="/product/paper-mode">Try paper mode</Link>
          </div>
          <div className="trust-row">
            <span>Non-custodial</span><span>Keys stay on your device</span><span>No mixers</span><span>Built for Hyperliquid</span>
          </div>
          <TrackerDemo />
        </div>
      </section>

      <Ticker />

      <section className="section">
        <div className="wrap">
          <LiveStats />
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
            <div className="card"><span className="step-n">Defence</span><h3>Your defence is public too</h3><p>Every margin top-up from a known wallet shows up on trackers as it happens.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="row" style={{ alignItems: 'end', marginBottom: 36 }}>
            <div>
              <span className="eyebrow">On the record</span>
              <h2 style={{ marginBottom: 0 }}>From public whale hunts to $100M wipeouts.</h2>
            </div>
          </div>
          <div className="grid g3">
            {INCIDENTS.map((i) => (
              <a key={i.url} className="card incident" href={i.url} target="_blank" rel="noreferrer">
                <span className="eyebrow">{i.source} · {i.date}</span>
                <h3>{i.title}</h3>
                <p>{i.text}</p>
                <span className="read">Read source ↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="wrap">
          <span className="eyebrow">How it works</span>
          <h2>One trade in. Many unremarkable positions out.</h2>
          <p className="sub">Entropy runs entirely in your browser. There is no Entropy server holding keys or funds.</p>
          <div className="card" style={{ marginBottom: 16, padding: '28px 24px' }}>
            <FlowDiagram />
          </div>
          <div className="grid g4">
            {STEPS.map(([t, d], i) => (
              <div className="card" key={t}>
                <span className="step-n">0{i + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <Link className="btn" href="/how-it-works">Read the full walkthrough</Link>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="wrap">
          <span className="eyebrow">Product</span>
          <h2>The complete layer for hidden leverage.</h2>
          <p className="sub">Starting with Hyperliquid perps, the venue where the hunting happens.</p>
          <div className="grid g3">
            {FEATURES.map((f) => (
              <Link key={f.slug} href={`/product/${f.slug}`} className="card feature-card">
                <span className={`tag${f.status === 'next' ? ' soon' : ''}`}>{f.status === 'next' ? 'Coming next' : 'Live'}</span>
                <h3>{f.name}</h3>
                <p>{f.summary}</p>
                <span className="read">Learn more →</span>
              </Link>
            ))}
            <Link href="/privacy" className="card feature-card">
              <span className="tag">Read first</span>
              <h3>Privacy model</h3>
              <p>Exactly what Entropy hides from trackers, and what it can't. No hand-waving.</p>
              <span className="read">Learn more →</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap faq-wrap">
          <div>
            <span className="eyebrow">FAQ</span>
            <h2>Questions, answered straight.</h2>
            <Link className="btn" href="/faq">All questions</Link>
          </div>
          <div className="faq">
            {FAQ.slice(0, 6).map(([q, a], i) => (
              <div key={q} className={`faq-item${openQ === i ? ' open' : ''}`}>
                <button onClick={() => setOpenQ(openQ === i ? null : i)}>
                  {q}
                  <span aria-hidden>{openQ === i ? '−' : '+'}</span>
                </button>
                {openQ === i && <p>{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </main>
  )
}
