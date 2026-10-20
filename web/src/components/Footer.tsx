import { Link } from '../router'
import { FEATURES, SITE } from '../site/content'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link href="/" className="brand"><img src="/mark.svg" alt="" />entropy</Link>
            <p className="muted" style={{ fontSize: 14, maxWidth: 300, marginTop: 14 }}>
              Hidden leverage on Hyperliquid. Non-custodial, keys never leave your device.
            </p>
            <div className="row" style={{ marginTop: 12 }}>
              {SITE.x && <a className="muted" href={SITE.x} target="_blank" rel="noreferrer">X</a>}
              {SITE.telegram && <a className="muted" href={SITE.telegram} target="_blank" rel="noreferrer">Telegram</a>}
              {SITE.email && <a className="muted" href={`mailto:${SITE.email}`}>{SITE.email}</a>}
            </div>
          </div>
          <div>
            <h4>Product</h4>
            <Link href="/product">Overview</Link>
            {FEATURES.slice(0, 5).map((f) => <Link key={f.slug} href={`/product/${f.slug}`}>{f.name}</Link>)}
            <Link href="/app">Launch app</Link>
          </div>
          <div>
            <h4>Learn</h4>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/whitepaper">Whitepaper</Link>
            <Link href="/privacy">Privacy model</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/faq">FAQ</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link href="/early-access">Early access</Link>
            <Link href="/security">Security</Link>
            <Link href="/brand">Brand</Link>
            <Link href="/risk">Risk disclosure</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Entropy</span>
          <span>Not financial advice. Leveraged trading can lose more than you expect.</span>
        </div>
      </div>
    </footer>
  )
}
