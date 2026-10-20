import { useEffect, useState } from 'react'
import Landing from './pages/Landing'
import Trade from './pages/Trade'
import Header from './components/Header'
import { WalletProvider } from './lib/wallet'

// "#/app" style hashes are routes; any other hash ("#how") is an anchor on
// the landing page.
function useHashRoute() {
  const read = () => {
    const h = window.location.hash.replace(/^#/, '')
    return h.startsWith('/') ? h : '/'
  }
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => {
      const h = window.location.hash.replace(/^#/, '')
      if (h && !h.startsWith('/')) {
        document.getElementById(h)?.scrollIntoView({ behavior: 'smooth' })
        return
      }
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export default function App() {
  const route = useHashRoute()
  const isApp = route.startsWith('/app')
  return (
    <WalletProvider>
      <Header isApp={isApp} />
      {isApp ? <Trade /> : <Landing />}
    </WalletProvider>
  )
}
