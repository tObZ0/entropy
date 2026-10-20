import { useEffect, useState, type ReactNode } from 'react'
import { Link } from '../router'

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title === 'Entropy' ? 'Entropy — leverage without a target' : `${title} · Entropy`
    if (description) document.querySelector('meta[name=description]')?.setAttribute('content', description)
  }, [title, description])
}

export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section className="page-hero">
      <div className="wrap">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  )
}

export function CtaBand({ title = 'Ready to go unseen?', text = 'Plan a split with live Hyperliquid prices. Nothing is sent until you confirm.' }: { title?: string; text?: string }) {
  return (
    <section className="cta-band">
      <div className="wrap">
        <img src="/mark.svg" alt="" width={56} height={56} />
        <h2>{title}</h2>
        <p className="muted">{text}</p>
        <div className="hero-ctas">
          <Link className="btn btn-lg btn-primary" href="/app">Launch app</Link>
          <Link className="btn btn-lg" href="/early-access">Get early access</Link>
        </div>
      </div>
    </section>
  )
}

export type DocSection = { id: string; title: string; body: ReactNode }

/** Long-form page with a sticky table of contents. */
export function DocLayout({ sections, meta }: { sections: DocSection[]; meta?: ReactNode }) {
  const [active, setActive] = useState(sections[0]?.id)
  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-20% 0px -70% 0px' },
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [sections])
  return (
    <div className="wrap doc">
      <aside className="toc">
        {meta}
        <div className="eyebrow" style={{ margin: '0 0 10px' }}>Contents</div>
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'on' : ''} onClick={(e) => {
            e.preventDefault()
            document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
            history.replaceState(null, '', `#${s.id}`)
          }}>{s.title}</a>
        ))}
      </aside>
      <article className="prose">
        {sections.map((s) => (
          <section key={s.id} id={s.id}>
            <h2>{s.title}</h2>
            {s.body}
          </section>
        ))}
      </article>
    </div>
  )
}
