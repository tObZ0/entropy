import { useState, type FormEvent } from 'react'
import { Link } from '../router'
import { LIMITS } from '../config'
import { FAQ } from './content'
import { CtaBand, PageHero, usePageTitle } from './ui'

/* ---------------------------------------------------------------- FAQ */

export function Faq() {
  usePageTitle('FAQ', 'Answers to common questions about Entropy.')
  const [open, setOpen] = useState<number | null>(0)
  return (
    <main>
      <PageHero eyebrow="FAQ" title="Questions, answered straight" />
      <section className="section" style={{ paddingTop: 0, borderTop: 0 }}>
        <div className="wrap narrow">
          <div className="faq">
            {FAQ.map(([q, a], i) => (
              <div key={q} className={`faq-item${open === i ? ' open' : ''}`}>
                <button onClick={() => setOpen(open === i ? null : i)}>{q}<span aria-hidden>{open === i ? '−' : '+'}</span></button>
                {open === i && <p>{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </main>
  )
}

/* ---------------------------------------------------------------- Security */

const SEC: [string, string][] = [
  ['No custody', 'Entropy never holds funds. Every order is signed in your browser and sent straight to Hyperliquid.'],
  ['No server', 'There is no Entropy backend. The site is static files; the app talks only to the public Hyperliquid API.'],
  ['Keys in memory only', 'Slice keys are derived when you sign and kept in the tab’s memory. They are never written to disk or sent anywhere.'],
  ['Checked signing', 'Every request type the app signs produces byte-identical signatures to Hyperliquid’s official Python SDK.'],
  ['Hard limits', `Positions are capped at $${LIMITS.maxPositionUsd}. Orders can move at most ${LIMITS.slippage * 100}% from the mid price. Closing orders are reduce-only.`],
  ['Confirm before trading', 'Nothing is sent to Hyperliquid until you review the plan and confirm it.'],
]

export function Security() {
  usePageTitle('Security', 'How Entropy keeps keys and funds under your control, and its audit status.')
  return (
    <main>
      <PageHero eyebrow="Security" title={<>Your keys. Your device. <em>Nothing</em> in between.</>} lead="Entropy is built so that nobody, including us, can move your funds." />
      <section className="section" style={{ paddingTop: 0, borderTop: 0 }}>
        <div className="wrap">
          <div className="grid g3">
            {SEC.map(([t, d]) => <div className="card" key={t}><h3 style={{ marginTop: 0 }}>{t}</h3><p>{d}</p></div>)}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow">The one secret</span>
            <h2>Your derivation signature is the key to every slice.</h2>
            <p className="sub">Anyone who gets that signature controls your slice accounts. Treat a request to sign the Entropy message on any other site as a phishing attempt.</p>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Stay safe</h3>
            <ul className="checks">
              <li>Only sign the Entropy message on the real Entropy app.</li>
              <li>Read the message before signing: it names Entropy and says what it does.</li>
              <li>Use a normal or hardware wallet; some smart wallets cannot rebuild the same accounts.</li>
              <li>Start small. The size cap exists for a reason.</li>
            </ul>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow">Audit status</span>
            <h2>Not audited yet.</h2>
            <p className="sub" style={{ marginBottom: 0 }}>Entropy is early software. An independent review comes before any raise of the position cap beyond small amounts.</p>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Found a problem?</h3>
            <p>Please report security issues privately before sharing them publicly, and give us time to fix them. A dedicated contact will be listed here at launch.</p>
          </div>
        </div>
      </section>
      <CtaBand />
    </main>
  )
}

/* ---------------------------------------------------------------- Early access */

export function EarlyAccess() {
  usePageTitle('Early access', 'Join the Entropy early access list.')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (/^(localhost|127\.)/.test(location.hostname)) {
      setState('error')
      setMsg('The list goes live once the site is deployed. Nothing was sent.')
      return
    }
    setState('sending')
    try {
      const body = new URLSearchParams()
      data.forEach((v, k) => body.append(k, String(v)))
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
      if (!res.ok) throw new Error(String(res.status))
      setState('done')
    } catch {
      setState('error')
      setMsg('Could not join the list. Please try again.')
    }
  }
  return (
    <main>
      <PageHero eyebrow="Early access" title={<>Get in <em>before</em> the cap goes up</>} lead={`Entropy is live with a $${LIMITS.maxPositionUsd} position cap. Join the list to hear first when limits rise and new venues open.`} />
      <section className="section" style={{ paddingTop: 0, borderTop: 0 }}>
        <div className="wrap narrow">
          <div className="card" style={{ padding: 28 }}>
            {state === 'done' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <img src="/mark.svg" alt="" width={48} height={48} />
                <h3>You’re on the list.</h3>
                <p>We’ll be in touch when limits rise. Meanwhile you can try the app with small sizes.</p>
                <Link className="btn btn-primary" href="/app" style={{ marginTop: 16 }}>Launch app</Link>
              </div>
            ) : (
              <form name="early-access" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={submit}>
                <input type="hidden" name="form-name" value="early-access" />
                <p hidden><label>Leave empty <input name="bot-field" /></label></p>
                <div className="field">
                  <label htmlFor="ea-email">Email</label>
                  <input id="ea-email" className="input" name="email" type="email" required placeholder="you@example.com" />
                </div>
                <div className="field">
                  <label htmlFor="ea-x">X handle <span>optional</span></label>
                  <input id="ea-x" className="input" name="x" placeholder="@handle" />
                </div>
                <div className="field">
                  <label htmlFor="ea-size">Typical position size</label>
                  <select id="ea-size" className="input" name="size" defaultValue="">
                    <option value="" disabled>Choose one</option>
                    <option>Under $10K</option>
                    <option>$10K – $100K</option>
                    <option>$100K – $1M</option>
                    <option>Over $1M</option>
                  </select>
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={state === 'sending'}>
                  {state === 'sending' ? 'Joining…' : 'Join early access'}
                </button>
                {state === 'error' && <div className="note err" style={{ marginTop: 12 }}>{msg}</div>}
                <p className="muted" style={{ fontSize: 12.5, margin: '14px 0 0' }}>We only use your email to tell you about Entropy. No spam, no sharing.</p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

/* ---------------------------------------------------------------- Brand */

const COLORS: [string, string][] = [
  ['Ink', '#050505'],
  ['Surface', '#0C0C0B'],
  ['Cream', '#E8E2BD'],
  ['Gold', '#A8955A'],
  ['Paper', '#F5F4EE'],
]

export function Brand() {
  usePageTitle('Brand', 'Entropy logo files, colors and type.')
  return (
    <main>
      <PageHero eyebrow="Brand" title="The Entropy mark" lead="An ordered grid breaking apart into disorder: one visible position dissolving into pieces nobody can read." />
      <section className="section" style={{ paddingTop: 0, borderTop: 0 }}>
        <div className="wrap">
          <div className="grid g2">
            <div className="card brand-tile dark"><img src="/mark.svg" alt="Entropy mark on dark" /></div>
            <div className="card brand-tile light"><img src="/mark-light.svg" alt="Entropy mark on light" /></div>
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <a className="btn" href="/mark.svg" download="entropy-mark-dark.svg">Download mark (dark)</a>
            <a className="btn" href="/mark-light.svg" download="entropy-mark-light.svg">Download mark (light)</a>
            <a className="btn" href="/favicon.svg" download="entropy-mark-small.svg">Download small mark</a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <span className="eyebrow">Color</span>
          <div className="grid g4" style={{ marginTop: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {COLORS.map(([n, c]) => (
              <div className="card" key={c} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ background: c, height: 96, borderBottom: '1px solid var(--line)' }} />
                <div style={{ padding: 14 }}><b style={{ fontWeight: 500 }}>{n}</b><div className="mono muted" style={{ fontSize: 12 }}>{c}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow">Type</span>
            <p style={{ fontSize: 48, fontWeight: 300, letterSpacing: '-.04em', margin: '16px 0 4px' }}>Geist</p>
            <p className="muted">Headlines and text. Light weight for display sizes.</p>
          </div>
          <div>
            <span className="eyebrow">&nbsp;</span>
            <p className="mono" style={{ fontSize: 40, margin: '16px 0 4px' }}>Geist Mono</p>
            <p className="muted">Numbers, prices, addresses and labels.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

/* ---------------------------------------------------------------- Risk */

export function Risk() {
  usePageTitle('Risk disclosure', 'Risks of using Entropy and leveraged trading.')
  return (
    <main>
      <PageHero eyebrow="Legal" title="Risk disclosure" lead="Read this before using Entropy." />
      <section className="section" style={{ paddingTop: 0, borderTop: 0 }}>
        <div className="wrap narrow prose">
          <p><b>Leverage.</b> Leveraged perpetual futures can lose your entire margin quickly. Splitting a position changes where and how it liquidates; it does not remove liquidation risk. Some slices in a liquidation band liquidate earlier than a single position would.</p>
          <p><b>Software.</b> Entropy is early, unaudited software provided as is. Bugs could cause orders to fail, open at unexpected prices, or not close when you expect.</p>
          <p><b>Availability.</b> Entropy only acts while the app is open. If you close the tab, slices that have not opened will not open, and nothing will defend your positions.</p>
          <p><b>Privacy.</b> Entropy reduces what public trackers can infer. It does not make you anonymous. Funding, timing and behaviour can still link accounts. See the <Link href="/privacy">privacy model</Link>.</p>
          <p><b>Keys.</b> Anyone with your derivation signature controls your slice accounts. Wallets that do not sign deterministically may be unable to rebuild accounts.</p>
          <p><b>Venue.</b> Entropy depends on Hyperliquid. Its outages, rule changes, delistings or failures affect your positions.</p>
          <p><b>Your responsibility.</b> You are responsible for complying with the laws that apply to you. Nothing on this site is financial, legal or tax advice.</p>
        </div>
      </section>
    </main>
  )
}
