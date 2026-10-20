import { short, useWallet } from '../lib/wallet'

export default function Header({ isApp }: { isApp: boolean }) {
  const { address, connect, connecting } = useWallet()
  return (
    <header className="nav">
      <div className="wrap">
        <a href="#/" className="brand">
          <img src="/mark.svg" alt="" />
          entropy
        </a>
        {!isApp && (
          <nav className="nav-links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#limits">Limits</a>
          </nav>
        )}
        <div className="nav-right">
          {isApp ? (
            address ? (
              <span className="btn btn-sm mono">{short(address)}</span>
            ) : (
              <button className="btn btn-sm btn-primary" onClick={connect} disabled={connecting}>
                {connecting ? 'Connecting…' : 'Connect wallet'}
              </button>
            )
          ) : (
            <a className="btn btn-sm btn-primary" href="#/app">
              Launch app
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
