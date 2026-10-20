import { useEffect, useState, type ReactNode } from 'react'
import { Link, usePath } from '../router'
import AnimatedMark from '../site/AnimatedMark'
import { FEATURES, SITE } from '../site/content'
import { short, useWallet } from '../lib/wallet'

const RESOURCES: [string, string, string][] = [
  ['Whitepaper', '/whitepaper', 'Design, math and privacy analysis'],
  ['Privacy model', '/privacy', 'What Entropy hides, and what it can’t'],
  ['Docs', '/docs', 'Step-by-step guide to the app'],
  ['Security', '/security', 'Keys, signatures and audit status'],
  ['FAQ', '/faq', 'Short answers to common questions'],
  ['Brand', '/brand', 'Logo files and colors'],
]

function Menu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="menu">
      <button className="menu-btn" aria-haspopup="true">
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
      </button>
      <div className="menu-pop">{children}</div>
    </div>
  )
}

export default function Header() {
  const path = usePath()
  const isApp = path.startsWith('/app')
  const { address, connect, connecting } = useWallet()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(false)
    // Menus open on focus; drop focus so they close after navigating.
    ;(document.activeElement as HTMLElement | null)?.blur()
  }, [path])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  return (
    <>
    <header className="nav">
      <div className="wrap">
        <Link href="/" className="brand">
          <AnimatedMark size={26} mode="hover" />
          entropy
        </Link>
        <nav className="nav-links">
          <Menu label="Product">
            <Link href="/product" className="menu-item menu-head">
              <b>Overview</b>
              <span>Everything Entropy does</span>
            </Link>
            {FEATURES.map((f) => (
              <Link key={f.slug} href={`/product/${f.slug}`} className="menu-item">
                <b>{f.name}{f.status === 'next' && <span className="tag soon">Next</span>}</b>
                <span>{f.tagline}</span>
              </Link>
            ))}
          </Menu>
          <Menu label="Resources">
            {RESOURCES.map(([n, h, d]) => (
              <Link key={h} href={h} className="menu-item">
                <b>{n}</b>
                <span>{d}</span>
              </Link>
            ))}
          </Menu>
          <Link href="/how-it-works">How it works</Link>
        </nav>
        <div className="nav-right">
          {SITE.x && <a className="icon-btn" href={SITE.x} target="_blank" rel="noreferrer" aria-label="X">𝕏</a>}
          {isApp ? (
            address ? (
              <span className="btn btn-sm mono">{short(address)}</span>
            ) : (
              <button className="btn btn-sm btn-primary" onClick={connect} disabled={connecting}>
                {connecting ? 'Connecting…' : 'Connect wallet'}
              </button>
            )
          ) : (
            <>
              <Link className="btn btn-sm hide-sm" href="/early-access">Get early access</Link>
              <Link className="btn btn-sm btn-primary" href="/app">Launch app</Link>
            </>
          )}
          <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span /><span />
          </button>
        </div>
      </div>
    </header>
      {/* Outside <header>: its backdrop-filter would trap a fixed overlay. */}
      {open && (
        <div className="mobile-menu">
          <div className="wrap">
            <div className="eyebrow">Product</div>
            <Link href="/product">Overview</Link>
            {FEATURES.map((f) => <Link key={f.slug} href={`/product/${f.slug}`}>{f.name}</Link>)}
            <div className="eyebrow">Resources</div>
            <Link href="/how-it-works">How it works</Link>
            {RESOURCES.map(([n, h]) => <Link key={h} href={h}>{n}</Link>)}
            <div className="row" style={{ marginTop: 20 }}>
              <Link className="btn" href="/early-access">Get early access</Link>
              <Link className="btn btn-primary" href="/app">Launch app</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
