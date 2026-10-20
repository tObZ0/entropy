import type { JSX } from 'react'
import Footer from './components/Footer'
import Header from './components/Header'
import { WalletProvider } from './lib/wallet'
import Trade from './pages/Trade'
import { usePath } from './router'
import Home from './site/Home'
import { Brand, EarlyAccess, Faq, Risk, Security } from './site/Info'
import { Docs, HowItWorks, PrivacyModel, Whitepaper } from './site/Learn'
import NotFound from './site/NotFound'
import { FeaturePage, ProductOverview } from './site/Product'

function Page({ path }: { path: string }) {
  if (path === '/') return <Home />
  if (path === '/app') return <Trade />
  if (path === '/product') return <ProductOverview />
  if (path.startsWith('/product/')) return <FeaturePage slug={path.slice('/product/'.length)} />
  const pages: Record<string, () => JSX.Element> = {
    '/how-it-works': HowItWorks,
    '/privacy': PrivacyModel,
    '/whitepaper': Whitepaper,
    '/docs': Docs,
    '/faq': Faq,
    '/security': Security,
    '/early-access': EarlyAccess,
    '/brand': Brand,
    '/risk': Risk,
  }
  const P = pages[path]
  return P ? <P /> : <NotFound />
}

export default function App() {
  const path = usePath()
  return (
    <WalletProvider>
      <Header />
      <Page key={path} path={path} />
      {path !== '/app' && <Footer />}
    </WalletProvider>
  )
}
