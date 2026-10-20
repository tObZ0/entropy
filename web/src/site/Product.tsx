import { Link } from '../router'
import { FEATURES } from './content'
import NotFound from './NotFound'
import { CtaBand, PageHero, usePageTitle } from './ui'
import { FeatureVisual } from './visuals'

const ROADMAP: [string, string, string][] = [
  ['Now', 'Hyperliquid perps', 'Splitter, liquidation ladder, tracker view, linkability check, close as one. $50 position cap.'],
  ['Next', 'Defence', 'Risk guard and hidden stops, first in the browser, then with an optional always-on agent wallet.'],
  ['Then', 'Funding and exits', 'Guided funding routes that keep slices unlinked, and private ways to bring profits home.'],
  ['Later', 'More venues', 'Solana perps and lending markets, through the same venue interface.'],
]

export function ProductOverview() {
  usePageTitle('Product', 'Everything Entropy does to hide a leveraged position on Hyperliquid.')
  return (
    <main>
      <PageHero
        eyebrow="Product"
        title={<>Everything you need to trade <em>unseen</em></>}
        lead="Entropy is a set of tools that work together: split the position, spread the liquidation, check what leaks, and manage it all as one."
      >
        <div className="hero-ctas" style={{ justifyContent: 'flex-start' }}>
          <Link className="btn btn-lg btn-primary" href="/app">Launch app</Link>
          <Link className="btn btn-lg" href="/whitepaper">Read the whitepaper</Link>
        </div>
      </PageHero>
      {FEATURES.map((f, i) => (
        <section key={f.slug} className="section feature-row">
          <div className={`wrap split${i % 2 ? ' flip' : ''}`}>
            <div>
              <span className={`tag${f.status === 'next' ? ' soon' : ''}`}>{f.status === 'next' ? 'Coming next' : 'Live'}</span>
              <h2>{f.name}</h2>
              <p className="sub" style={{ marginBottom: 24 }}>{f.summary}</p>
              <Link className="btn" href={`/product/${f.slug}`}>Learn more</Link>
            </div>
            <div className="card visual-card"><FeatureVisual kind={f.visual} /></div>
          </div>
        </section>
      ))}
      <section className="section">
        <div className="wrap">
          <span className="eyebrow">Roadmap</span>
          <h2>Where Entropy is going.</h2>
          <div className="grid g4" style={{ marginTop: 36 }}>
            {ROADMAP.map(([when, t, d]) => (
              <div className="card" key={when}>
                <span className="step-n">{when}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </main>
  )
}

export function FeaturePage({ slug }: { slug: string }) {
  const f = FEATURES.find((x) => x.slug === slug)
  usePageTitle(f?.name ?? 'Not found', f?.summary)
  if (!f) return <NotFound />
  const i = FEATURES.indexOf(f)
  const next = FEATURES[(i + 1) % FEATURES.length]
  return (
    <main>
      <PageHero eyebrow={`Product · ${f.status === 'next' ? 'Coming next' : 'Live'}`} title={f.name} lead={f.tagline} />
      <section className="section" style={{ paddingTop: 0, borderTop: 0 }}>
        <div className="wrap">
          <div className="card visual-card big"><FeatureVisual kind={f.visual} /></div>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow">The problem</span>
            <p className="big-text">{f.problem}</p>
          </div>
          <div>
            <span className="eyebrow">How it works</span>
            <ol className="steps">
              {f.how.map((h) => <li key={h}>{h}</li>)}
            </ol>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="grid g3">
            {f.details.map(([t, d]) => (
              <div className="card" key={t}><h3 style={{ marginTop: 0 }}>{t}</h3><p>{d}</p></div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 40 }}>
            <Link className="btn" href="/product">← All features</Link>
            <span className="spacer" />
            <Link className="btn" href={`/product/${next.slug}`}>Next: {next.name} →</Link>
          </div>
        </div>
      </section>
      <CtaBand />
    </main>
  )
}
