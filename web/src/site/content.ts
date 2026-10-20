// Site-wide content: features, incidents, FAQ. Kept here so pages stay layout.

export const SITE = {
  name: 'Entropy',
  // Fill these in when the accounts exist; empty links are hidden.
  x: '',
  telegram: '',
  email: '',
}

export type Feature = {
  slug: string
  name: string
  tagline: string
  status: 'live' | 'next'
  summary: string
  problem: string
  how: string[]
  details: [string, string][]
  visual: 'split' | 'ladder' | 'tracker' | 'links' | 'close' | 'guard' | 'stops'
}

export const FEATURES: Feature[] = [
  {
    slug: 'splitter',
    name: 'Position splitter',
    tagline: 'One order in. Several ordinary positions out.',
    status: 'live',
    summary: 'Split one position into slices of random size, each in its own account and each well under whale-alert size.',
    problem:
      'Trackers rank wallets by position size. Anything big enough to matter is posted, copied and traded against within minutes of opening.',
    how: [
      'You enter one trade: market, side, size and leverage.',
      'Entropy divides it into 1 to 12 slices with random weights, so no two plans look alike.',
      'Each slice is rounded to the market’s size rules and kept above the $10 order minimum.',
      'Every slice lives in a different account derived from your signature.',
    ],
    details: [
      ['Random sizing', 'Weights are drawn fresh for every plan. Reshuffle until you like the spread.'],
      ['Alert-aware', 'Plans warn you if any slice is still large enough to trigger public whale alerts.'],
      ['Same exposure', 'Total size, margin and leverage match the single position you asked for.'],
    ],
    visual: 'split',
  },
  {
    slug: 'liquidation-ladder',
    name: 'Liquidation ladder',
    tagline: 'Turn one liquidation line into a band.',
    status: 'live',
    summary: 'Give each slice different margin so liquidation is spread across a price range instead of sitting on one exact price.',
    problem:
      'A single position has one liquidation price, published to everyone. That makes it a level hunters can push the market toward, as traders openly tried with a 40x BTC short in March 2025.',
    how: [
      'Entropy computes the liquidation distance your leverage implies for one account.',
      'It spreads each slice’s distance around that value, by as much as you choose (up to ±60%).',
      'Margin is set per slice to land exactly on its distance, while total margin stays the same.',
      'Slices open at an integer leverage and get the rest of their margin added right after the fill.',
    ],
    details: [
      ['No extra capital', 'The notional-weighted average distance equals the single-account distance, so total margin is unchanged.'],
      ['Partial, not total', 'A move into the band liquidates some slices, not the whole position at once.'],
      ['Within limits', 'Slices never exceed the market’s max leverage; the band narrows if they would.'],
    ],
    visual: 'ladder',
  },
  {
    slug: 'tracker-view',
    name: 'Tracker view',
    tagline: 'See yourself the way the market sees you.',
    status: 'live',
    summary: 'Preview your slices exactly as Hypurrscan and whale bots would list them, side by side with the unsplit position.',
    problem: 'It is hard to judge what an outsider can infer from a position until you see it in a tracker’s format.',
    how: [
      'Every plan renders twice: as one wallet and as the slices.',
      'Rows are sorted by size, the way trackers sort them.',
      'Liquidation prices are shown per row, so you can check none of them line up.',
    ],
    details: [
      ['Before you trade', 'The view is built from the plan, so you see it before any order is sent.'],
      ['Live after', 'Open positions are read straight from Hyperliquid, the same public data trackers use.'],
    ],
    visual: 'tracker',
  },
  {
    slug: 'linkability',
    name: 'Linkability check',
    tagline: 'Know which slices can be tied back to you.',
    status: 'live',
    summary: 'Scan each slice account’s public transfer history for direct links to your wallet or to other slices.',
    problem:
      'Splitting only hides you if the accounts can’t be connected. The easiest way to connect them is a public transfer from your main wallet.',
    how: [
      'Entropy reads every slice account’s deposits and transfers from Hyperliquid.',
      'Any transfer to or from your connected wallet marks that slice as linked.',
      'Any transfer between two slices marks both as linked.',
    ],
    details: [
      ['Direct links only', 'It catches transfers, not timing or behavioural patterns. Treat “clean” as necessary, not sufficient.'],
      ['Your call', 'Entropy never moves funds between accounts on its own. It tells you what a transfer would reveal.'],
    ],
    visual: 'links',
  },
  {
    slug: 'close-as-one',
    name: 'Close as one',
    tagline: 'Many accounts. One position to manage.',
    status: 'live',
    summary: 'See combined size, margin, PnL and liquidation range across every slice, and unwind them all with one button.',
    problem: 'Managing several accounts by hand is slow, and slow is dangerous with leverage.',
    how: [
      'Entropy reads every slice account and groups positions by market.',
      'Close all sends reduce-only market orders from every slice at once.',
      'Opening can be stopped at any point; slices already open stay open until you close them.',
    ],
    details: [
      ['Reduce-only', 'Closing orders can only shrink positions, never flip them.'],
      ['Parallel', 'All slices close together, so the exit is as fast as one account.'],
    ],
    visual: 'close',
  },
  {
    slug: 'risk-guard',
    name: 'Risk guard',
    tagline: 'Defend the band without showing your hand.',
    status: 'next',
    summary: 'Watch every slice and top up margin or trim size when price nears a slice’s liquidation level.',
    problem: 'Defending a big position in public, like adding millions in margin, tells everyone where you are.',
    how: [
      'A local engine checks each slice against the mark price.',
      'Near the edge it adds margin from that slice’s own balance, or trims the slice.',
      'It never moves funds between slices, which would link them.',
    ],
    details: [
      ['Runs where you choose', 'In your browser tab first; an optional always-on agent wallet later.'],
      ['Per-slice rules', 'Each slice is defended on its own, so actions look like unrelated traders.'],
    ],
    visual: 'guard',
  },
  {
    slug: 'hidden-stops',
    name: 'Hidden stops',
    tagline: 'Stops nobody can see coming.',
    status: 'next',
    summary: 'Keep take-profit and stop-loss levels on your device, and fire them as market orders only when they trigger.',
    problem: 'Resting stop orders are visible on the book, which tells hunters exactly where forced selling waits.',
    how: [
      'You set stop and target levels for the whole position.',
      'They are stored locally and never sent to Hyperliquid in advance.',
      'When price crosses a level, every slice closes with reduce-only market orders.',
    ],
    details: [
      ['Nothing on the book', 'Until they fire, your stops exist only on your device.'],
      ['Trade-off', 'They only fire while Entropy is running. An always-on agent is on the roadmap.'],
    ],
    visual: 'stops',
  },
]

export type Incident = { date: string; source: string; title: string; text: string; url: string }

export const INCIDENTS: Incident[] = [
  {
    date: 'Mar 2025',
    source: 'Decrypt',
    title: 'A whale hunt, organised in public',
    text: 'A 40x BTC short worth roughly $450M+ was visible on Hyperliquid with its liquidation price. A trader openly invited others to push BTC into it.',
    url: 'https://decrypt.co/310220/crypto-traders-hunting-521-million-bitcoin-whale',
  },
  {
    date: 'May 2025',
    source: 'The Block',
    title: 'A $1B+ long, watched tick by tick',
    text: 'James Wynn’s 40x bitcoin long grew past $1 billion while the whole market followed his wallet live.',
    url: 'https://www.theblock.co/post/356341/hyperliquid-trader-james-wynn-hit-with-over-100-million-loss-as-leveraged-bitcoin-trade-unravels',
  },
  {
    date: 'May 2025',
    source: 'Cointelegraph',
    title: '$99M liquidated on a public ledger',
    text: 'On-chain data showed about $99M of those positions liquidated as BTC dipped, every step visible on Hypurrscan.',
    url: 'https://cointelegraph.com/news/hyperliquid-whale-loss-100-million-bitcoin-dips-below-105',
  },
]

export const FAQ: [string, string][] = [
  ['What is Entropy?', 'A tool that splits one leveraged Hyperliquid position across several accounts that are not publicly linked, with different margin on each, so trackers never see your full size or a single liquidation price.'],
  ['Is it custodial?', 'No. Entropy runs entirely in your browser. Slice account keys are derived from a signature on your device and are never sent anywhere or stored. There is no Entropy server holding funds or keys.'],
  ['How are the slice accounts created?', 'Your wallet signs one fixed message. Entropy hashes that signature into a set of private keys. The same wallet always produces the same accounts, so there is nothing to back up beyond your wallet.'],
  ['Does it cost more than trading normally?', 'You pay normal Hyperliquid taker fees on the same total size. Total margin is the same as one position at your chosen leverage. There is no Entropy fee today.'],
  ['How do I fund the slices?', 'Each slice account needs USDC on Hyperliquid. Sending it from your main wallet is easiest but publicly links that slice to you. Funding from separate sources keeps slices unlinked. Entropy shows which slices are linked.'],
  ['Does Entropy use a mixer?', 'No. Entropy never routes funds through mixers or privacy pools and never moves funds between accounts on its own.'],
  ['What happens if I close the tab?', 'Open positions stay open on Hyperliquid. Slices that had not opened yet will not open. Come back, sign again, and your accounts and positions reappear.'],
  ['Which markets are supported?', 'Hyperliquid perpetuals. Other venues such as Solana perps and lending markets are on the roadmap.'],
  ['Is there a size limit?', 'Yes, while Entropy is new, positions are capped at $50. The limit rises as the software proves itself.'],
  ['Is it audited?', 'Not yet. Entropy is early software. Request signing has been checked against Hyperliquid’s official SDK, but there has been no independent audit.'],
  ['Is there a token?', 'No.'],
]
