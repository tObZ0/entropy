import { Link } from '../router'
import { PageHero, usePageTitle } from './ui'

export default function NotFound() {
  usePageTitle('Not found')
  return (
    <main>
      <PageHero eyebrow="404" title="This page dissolved." lead="It may have moved, or never existed.">
        <div className="hero-ctas" style={{ justifyContent: 'flex-start' }}>
          <Link className="btn btn-lg btn-primary" href="/">Go home</Link>
          <Link className="btn btn-lg" href="/app">Launch app</Link>
        </div>
      </PageHero>
    </main>
  )
}
