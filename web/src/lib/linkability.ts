import { getLedgerUpdates } from './hl/info'

export type LinkFinding = { slice: number; level: 'linked' | 'clean' | 'unfunded'; reason: string }

/**
 * Checks each slice account's public transfer history for direct links to the
 * main wallet or to another slice. This only catches direct transfers; timing,
 * amounts and off-Hyperliquid funding can still link accounts.
 */
export async function checkLinkability(main: string, slices: string[]): Promise<LinkFinding[]> {
  const mainL = main.toLowerCase()
  const sliceSet = new Map(slices.map((a, i) => [a.toLowerCase(), i]))
  return Promise.all(
    slices.map(async (addr, i): Promise<LinkFinding> => {
      const updates = await getLedgerUpdates(addr)
      if (!updates.length) return { slice: i, level: 'unfunded', reason: 'No deposits yet' }
      for (const u of updates) {
        const parties = [u.delta.user, u.delta.destination].filter(Boolean).map((x) => x!.toLowerCase())
        if (parties.includes(mainL)) return { slice: i, level: 'linked', reason: 'Direct transfer with your main wallet' }
        const other = parties.find((p) => p !== addr.toLowerCase() && sliceSet.has(p))
        if (other) return { slice: i, level: 'linked', reason: `Direct transfer with slice ${sliceSet.get(other)! + 1}` }
      }
      return { slice: i, level: 'clean', reason: 'No direct transfers to your wallet or other slices' }
    }),
  )
}
