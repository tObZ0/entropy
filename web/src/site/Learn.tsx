import { Link } from '../router'
import { LIMITS } from '../config'
import { CtaBand, DocLayout, PageHero, usePageTitle, type DocSection } from './ui'
import { FeatureVisual, FlowDiagram } from './visuals'

/* ---------------------------------------------------------------- How it works */

const WALK: [string, string, string[]][] = [
  ['Connect and sign', 'Connect MetaMask, Rabby or any browser wallet, then sign one fixed message.', [
    'The signature is free and sends no transaction.',
    'Entropy hashes it into up to 12 private keys, one per slice account.',
    'The same wallet always rebuilds the same accounts, so there is nothing new to back up.',
    'Keys live only in this browser tab’s memory and disappear when you close it.',
  ]],
  ['Plan the position', 'Pick a market, side, size and leverage, then choose how many slices and how wide a liquidation band.', [
    'Slice sizes are random, so every plan looks different.',
    'Margin differs per slice, spreading liquidation across a range.',
    'The preview uses live mainnet prices and shows exactly what trackers will see.',
    'Reshuffle as often as you like. Nothing is sent until you confirm.',
  ]],
  ['Fund each slice', 'Every slice account needs its own USDC on Hyperliquid before it can open.', [
    'Entropy shows the amount each account needs, including a small fee buffer.',
    'Sending from your main wallet is one click, but it publicly links that slice to you.',
    'Funding from separate sources keeps slices unlinked. Run the linkability check to confirm.',
  ]],
  ['Open on a random schedule', 'Confirm, and slices open one by one with random gaps between them.', [
    'Each slice sets its own isolated leverage, then fills with a price-limited market order.',
    'Extra margin is added right after each fill, so liquidation lands where the plan said.',
    'You can stop the schedule at any time. Keep the tab open until it finishes.',
  ]],
  ['Manage it as one', 'The app combines every slice into one position view.', [
    'See total size, value, margin, PnL and liquidation range.',
    'Close all sends reduce-only orders from every slice at once.',
    'Come back later, sign again, and your accounts and positions reappear.',
  ]],
]

export function HowItWorks() {
  usePageTitle('How it works', 'A step-by-step walkthrough of how Entropy splits and hides a Hyperliquid position.')
  return (
    <main>
      <PageHero eyebrow="How it works" title={<>From one wallet to many <em>ordinary</em> traders</>} lead="Entropy runs entirely in your browser. Here is every step, from the first signature to closing the position." />
      <section className="section" style={{ paddingTop: 0, borderTop: 0 }}>
        <div className="wrap"><div className="card visual-card big"><FlowDiagram /></div></div>
      </section>
      {WALK.map(([t, d, pts], i) => (
        <section className="section" key={t}>
          <div className="wrap split">
            <div>
              <span className="step-n">Step 0{i + 1}</span>
              <h2>{t}</h2>
              <p className="sub" style={{ marginBottom: 0 }}>{d}</p>
            </div>
            <ul className="checks">{pts.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </section>
      ))}
      <CtaBand />
    </main>
  )
}

/* ---------------------------------------------------------------- Privacy model */

const ROWS: [string, string, string][] = [
  ['Your total position size', 'Visible on one wallet', 'Hidden: split across accounts with random sizes'],
  ['Your liquidation price', 'One exact public price', 'Hidden: spread across a band of prices'],
  ['That the slices belong together', 'n/a', 'Hidden if funded from unrelated sources'],
  ['Your main wallet’s activity', 'Every trade visible', 'Unchanged, except for transfers you choose to make'],
  ['Each slice’s size and liquidation', 'n/a', 'Visible, like any trader on Hyperliquid'],
  ['Funding transfers', 'n/a', 'Visible: a transfer from your wallet links that slice'],
  ['Timing of opens', 'One moment', 'Randomised gaps, but still within one window'],
  ['Your IP address', 'Seen by the API', 'Seen by the Hyperliquid API, as with any app'],
]

export function PrivacyModel() {
  usePageTitle('Privacy model', 'What Entropy hides from trackers, and what it cannot.')
  return (
    <main>
      <PageHero eyebrow="Privacy model" title={<>What Entropy hides, and what it <em>can’t</em></>} lead="Privacy tools that oversell get people hurt. This page lists what an observer can still learn, so you can decide how to fund and trade." />
      <section className="section" style={{ paddingTop: 0, borderTop: 0 }}>
        <div className="wrap">
          <div className="card scroll-x" style={{ padding: 8 }}>
            <table className="tracker compare">
              <thead><tr><th>What an observer wants</th><th>Without Entropy</th><th>With Entropy</th></tr></thead>
              <tbody>
                {ROWS.map(([a, b, c]) => (
                  <tr key={a}><td style={{ whiteSpace: 'normal' }}>{a}</td><td className="muted" style={{ whiteSpace: 'normal' }}>{b}</td><td style={{ whiteSpace: 'normal' }} className={c.startsWith('Hidden') ? 'accent' : 'muted'}>{c}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <span className="eyebrow">Who we defend against</span>
          <h2>The adversary is a tracker, not a state.</h2>
          <div className="grid g3" style={{ marginTop: 36 }}>
            <div className="card"><h3 style={{ marginTop: 0 }}>In scope</h3><p>Position trackers, whale-alert bots, copy traders and anyone reading Hyperliquid’s public data to find big positions and their liquidation levels.</p></div>
            <div className="card"><h3 style={{ marginTop: 0 }}>Partly in scope</h3><p>Analysts who cluster wallets by funding source, timing and behaviour. Entropy flags direct links; you control funding and timing.</p></div>
            <div className="card"><h3 style={{ marginTop: 0 }}>Out of scope</h3><p>Hyperliquid itself, network-level observers, and anyone who obtains your derivation signature or your device.</p></div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow">The biggest leak</span>
            <h2>Funding decides everything.</h2>
            <p className="sub">If every slice is funded straight from your main wallet, anyone can follow the transfers and add the slices back up. The linkability check shows these links before and after you trade.</p>
            <Link className="btn" href="/product/linkability">About the linkability check</Link>
          </div>
          <div className="card visual-card"><FeatureVisual kind="links" /></div>
        </div>
      </section>
      <CtaBand title="Know what you’re hiding" text="Read the whitepaper for the full privacy analysis, or plan a split and check it yourself." />
    </main>
  )
}

/* ---------------------------------------------------------------- Whitepaper */

const Eq = ({ children }: { children: string }) => <pre className="eq">{children}</pre>

const PAPER: DocSection[] = [
  { id: 'abstract', title: 'Abstract', body: <>
    <p>Hyperliquid publishes every account’s positions, leverage and liquidation price. This transparency lets anyone find large leveraged positions and, in documented cases, coordinate to push the price into their liquidation level. Entropy is a client-side tool that represents one leveraged position as several smaller positions in accounts that are not publicly linked, with liquidation prices spread across a band. It requires no custody, no server and no changes to the venue.</p>
  </> },
  { id: 'problem', title: '1. The problem', body: <>
    <p>On a transparent perpetuals venue, three things about a large position are public: its <b>size</b>, which marks the account as worth watching; its <b>liquidation price</b>, a single level where forced closing begins; and its <b>defence</b>, since any margin added near that level is visible as it happens.</p>
    <p>Public trackers index this data and alert on large positions. In March 2025 a trader publicly invited others to push BTC into the liquidation level of a 40x short visible on Hyperliquid. The position holder added margin to survive, which was itself visible. A single account turns a trading decision into a public target.</p>
  </> },
  { id: 'goals', title: '2. Design goals', body: <>
    <ul>
      <li><b>No single target.</b> No one account should show the full size, and no one price should liquidate the whole position.</li>
      <li><b>Same economics.</b> Total size, total margin and fees should match the single position the trader asked for.</li>
      <li><b>Non-custodial.</b> No party other than the trader can move funds or sign orders.</li>
      <li><b>No new trust.</b> No server, relayer or pooled funds. The tool talks directly to the venue’s public API.</li>
      <li><b>Honest output.</b> Show what still leaks, rather than claim privacy the design does not provide.</li>
    </ul>
  </> },
  { id: 'accounts', title: '3. Account derivation', body: <>
    <p>The trader’s wallet signs a fixed, versioned message. Entropy derives slice keys from that signature:</p>
    <Eq>{`seed = keccak256(signature)
key_i = keccak256("entropy/v1/hyperliquid/slice" ‖ seed ‖ uint32(i))
(re-hash while key_i = 0 or key_i ≥ n)`}</Eq>
    <p>Wallets that sign deterministically (RFC 6979, used by MetaMask, Rabby and hardware wallets) always produce the same signature, so the same accounts can be rebuilt on any device. Entropy records the first derived address per wallet and warns if a later derivation differs. Keys are held in memory only.</p>
    <p>The signature is equivalent to the slice keys. The message says so in plain words, and must only be signed on the real Entropy app.</p>
  </> },
  { id: 'planner', title: '4. Splitting and the liquidation band', body: <>
    <p>A position of notional <i>N</i> at leverage <i>L</i> is split into <i>k</i> slices with random weights, each above the venue’s $10 order minimum and rounded to the market’s size step.</p>
    <p>On Hyperliquid an isolated position’s maintenance margin rate is half the initial margin rate at maximum leverage, <code>mmr = 1 / (2 · maxLeverage)</code>. With margin share <i>m</i> (margin ÷ notional), the fraction the price can move against a long before liquidation is:</p>
    <Eq>{`d = (m − mmr) / (1 − mmr)        (long)
d = (m − mmr) / (1 + mmr)        (short)`}</Eq>
    <p>A single account at leverage <i>L</i> has <code>d₀ = d(1/L)</code>. Entropy gives slice <i>i</i> a distance <code>dᵢ = d₀ · (1 + oᵢ − ō)</code>, where offsets <i>oᵢ</i> are spaced evenly across <code>[−b, +b]</code> in random order and <i>ō</i> is their notional-weighted mean. Because <i>m</i> is linear in <i>d</i>, the notional-weighted mean margin share stays <code>1/L</code>: <b>total margin is unchanged</b>, while liquidation prices spread across a band of width roughly <code>2b · d₀</code>.</p>
    <p>Each slice opens at the smallest integer leverage at or above <code>1/mᵢ</code> (capped at the market maximum). The difference is then added as isolated margin right after the fill. If a slice would exceed maximum leverage, it is clamped and the band narrows; the app reports this.</p>
  </> },
  { id: 'execution', title: '5. Execution', body: <>
    <p>Slices open sequentially with random delays. For each slice Entropy checks the account balance, sets isolated leverage, sends an immediate-or-cancel order limited to {LIMITS.slippage * 100}% from the mid price, then adds the remaining margin. Every request is signed locally using Hyperliquid’s L1 action scheme; signatures are checked against the official Hyperliquid Python SDK.</p>
    <p>Closing sends reduce-only immediate-or-cancel orders from every slice in parallel.</p>
  </> },
  { id: 'privacy', title: '6. Privacy analysis', body: <>
    <p>An observer of public Hyperliquid data sees <i>k</i> accounts with ordinary positions. Linking them requires evidence that they share an owner. The main linking vectors are:</p>
    <ul>
      <li><b>Funding.</b> Direct transfers from a known wallet, or between slices. This is the strongest link and is under the trader’s control. Entropy checks each slice’s ledger for it.</li>
      <li><b>Timing.</b> Slices open in one window. Random gaps blur this but do not remove it; longer gaps help.</li>
      <li><b>Composition.</b> Several new accounts opening the same market and side within minutes is a pattern. It is weaker in liquid markets with many such traders.</li>
      <li><b>Behaviour.</b> Closing all slices at once links them at exit. Staggered exits are on the roadmap.</li>
      <li><b>Network.</b> The venue’s API sees the client’s IP address for every request.</li>
    </ul>
    <p>Entropy therefore defends well against size-ranking trackers and liquidation-level hunting, and partially against clustering analysis, depending on how slices are funded and exited.</p>
  </> },
  { id: 'limits', title: '7. Limitations', body: <>
    <ul>
      <li>Orders and margin top-ups only run while the app is open.</li>
      <li>Entropy does not provide private funding or exits; the trader must choose funding paths.</li>
      <li>Positions are capped at ${LIMITS.maxPositionUsd} while the software is new.</li>
      <li>The code has not been independently audited.</li>
    </ul>
  </> },
  { id: 'roadmap', title: '8. Roadmap', body: <>
    <p>Next: a risk guard that defends each slice from its own balance, and hidden stops kept on the device. Then an optional always-on agent wallet (trade-only, no withdrawals), staggered exits, guided funding routes, and additional venues.</p>
  </> },
  { id: 'references', title: 'References', body: <>
    <ul className="refs">
      <li><a href="https://decrypt.co/310220/crypto-traders-hunting-521-million-bitcoin-whale" target="_blank" rel="noreferrer">Decrypt: Crypto traders are hunting a $521 million bitcoin whale (Mar 2025)</a></li>
      <li><a href="https://www.theblock.co/post/356341/hyperliquid-trader-james-wynn-hit-with-over-100-million-loss-as-leveraged-bitcoin-trade-unravels" target="_blank" rel="noreferrer">The Block: James Wynn hit with over $100 million loss (May 2025)</a></li>
      <li><a href="https://cointelegraph.com/news/hyperliquid-whale-loss-100-million-bitcoin-dips-below-105" target="_blank" rel="noreferrer">Cointelegraph: Hyperliquid whale loss nears $100M (May 2025)</a></li>
      <li><a href="https://hyperliquid.gitbook.io/hyperliquid-docs" target="_blank" rel="noreferrer">Hyperliquid documentation: margining and liquidations</a></li>
    </ul>
  </> },
]

export function Whitepaper() {
  usePageTitle('Whitepaper', 'Entropy whitepaper: design, liquidation band math and privacy analysis.')
  return (
    <main>
      <PageHero eyebrow="Whitepaper · v0.1 · October 2026" title={<>Entropy: hidden leverage on a <em>transparent</em> venue</>} lead="The design, the math behind the liquidation band, and an honest analysis of what stays visible." />
      <DocLayout sections={PAPER} />
      <CtaBand />
    </main>
  )
}

/* ---------------------------------------------------------------- Docs */

const DOCS: DocSection[] = [
  { id: 'start', title: 'Getting started', body: <>
    <p>You need a browser wallet (MetaMask, Rabby or similar, ideally an ordinary key or hardware wallet) and some USDC on Hyperliquid.</p>
    <ol>
      <li>Open the <Link href="/app">app</Link> and click <b>Connect wallet</b>.</li>
      <li>Click <b>Create slice accounts</b> and sign the message. It is free and sends no transaction.</li>
      <li>Set up your trade, fund the slice accounts, then click <b>Open</b>.</li>
    </ol>
  </> },
  { id: 'accounts', title: 'Slice accounts', body: <>
    <p>Your signature produces up to 12 accounts. A plan with <i>k</i> slices uses the first <i>k</i>. They are normal Hyperliquid accounts: you can look them up on any explorer.</p>
    <p>To use them on another device, connect the same wallet and sign again. If Entropy says your wallet produced <b>different accounts than last time</b>, stop and do not fund the new ones. Your wallet does not sign the same way twice, so it cannot reliably rebuild accounts. Use an ordinary or hardware wallet with Entropy instead.</p>
  </> },
  { id: 'planning', title: 'Planning a position', body: <>
    <ul>
      <li><b>Size</b> is the total notional in USD, currently capped at ${LIMITS.maxPositionUsd}.</li>
      <li><b>Leverage</b> sets total margin, exactly as for one position.</li>
      <li><b>Slices</b> is how many accounts to use. Each must stay above ${LIMITS.minSliceUsd}.</li>
      <li><b>Liquidation spread</b> sets how wide the band is. Wider means more slices survive a sharp move but some liquidate earlier.</li>
      <li><b>Random gap</b> is the longest wait between slice opens. Longer looks more natural.</li>
    </ul>
    <p>Click <b>Reshuffle</b> for new random sizes and timing.</p>
  </> },
  { id: 'funding', title: 'Funding slices', body: <>
    <p>Each slice row shows its balance and the USDC it needs. Two ways to fund:</p>
    <ul>
      <li><b>Send from wallet</b> moves USDC from your connected wallet’s Hyperliquid account in one signature. It is public and links that slice to you.</li>
      <li><b>Copy address</b> and fund it from somewhere unrelated to your main wallet. This keeps slices unlinked.</li>
    </ul>
    <p>Use <b>Check linkability</b> to see which slices have a direct transfer link.</p>
  </> },
  { id: 'opening', title: 'Opening', body: <>
    <p>When every slice is funded and the plan has no errors, click <b>Open</b> and confirm. Slices open one at a time with random gaps. <b>Keep the tab open</b> until the log says all slices are processed. You can stop the schedule at any time.</p>
  </> },
  { id: 'managing', title: 'Managing and closing', body: <>
    <p><b>Open positions</b> combines every slice by market. <b>Close all</b> closes every slice in that market with reduce-only market orders. Funds stay in each slice account after closing.</p>
  </> },
  { id: 'errors', title: 'Troubleshooting', body: <>
    <ul>
      <li><b>“Needs $X, account has $Y”</b>: fund that slice account, then open again.</li>
      <li><b>“Order rested instead of filling”</b>: the price moved past the {LIMITS.slippage * 100}% limit. Try again.</li>
      <li><b>“Over the safety limit”</b>: lower the size. The cap is ${LIMITS.maxPositionUsd} for now.</li>
      <li><b>No wallet found</b>: install MetaMask or Rabby and reload the page.</li>
    </ul>
  </> },
]

export function Docs() {
  usePageTitle('Docs', 'How to use Entropy: accounts, planning, funding, opening and closing.')
  return (
    <main>
      <PageHero eyebrow="Docs" title="Using Entropy" lead="Everything you need to plan, fund, open and close a hidden position." />
      <DocLayout sections={DOCS} />
      <CtaBand />
    </main>
  )
}
