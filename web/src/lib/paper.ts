import { TAKER_FEE } from '../config'
import type { RunEvent, SliceRun } from './executor'
import { roundSize } from './hl/format'
import { getL2Book, type AssetMeta } from './hl/info'
import { isolatedLiqPx, type Plan } from './planner'

// Paper mode: the full Entropy flow with live Hyperliquid prices and a
// simulated balance. Fills walk the real order book, so slippage is realistic.
// Everything is kept in this browser only.

export const PAPER_START_BALANCE = 1_000_000
/** Paper trades can rehearse whale-sized positions. */
export const PAPER_MAX_POSITION_USD = 5_000_000

export type PaperSlice = {
  index: number
  size: number
  entryPx: number
  margin: number
  liqPx: number
  state: 'open' | 'liquidated' | 'closed'
  exitPx?: number
  pnl?: number
}

export type PaperPosition = {
  id: string
  coin: string
  isLong: boolean
  openedAt: number
  closedAt?: number
  fees: number
  slices: PaperSlice[]
}

export type PaperBook = {
  /** Cash not locked as margin. */
  balance: number
  positions: PaperPosition[]
  history: PaperPosition[]
}

const KEY = 'entropy:paper:v1'

export function loadPaper(): PaperBook {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* storage unavailable: start fresh */
  }
  return { balance: PAPER_START_BALANCE, positions: [], history: [] }
}

export function savePaper(book: PaperBook) {
  try {
    localStorage.setItem(KEY, JSON.stringify(book))
  } catch {
    /* storage unavailable: the book lives for this session only */
  }
}

export const resetPaper = (): PaperBook => ({ balance: PAPER_START_BALANCE, positions: [], history: [] })

/** Average fill price for a market order of `size`, walking the live book. */
export async function simulateFill(asset: AssetMeta, isBuy: boolean, size: number, maxSlippage: number) {
  const [bids, asks] = await getL2Book(asset.name)
  const side = isBuy ? asks : bids
  if (!side.length) throw new Error('Order book is empty')
  const best = Number(side[0].px)
  const limit = best * (isBuy ? 1 + maxSlippage : 1 - maxSlippage)
  let left = size
  let cost = 0
  for (const lvl of side) {
    const px = Number(lvl.px)
    if (isBuy ? px > limit : px < limit) break
    const take = Math.min(left, Number(lvl.sz))
    cost += take * px
    left -= take
    if (left <= 1e-12) break
  }
  const filled = roundSize(size - Math.max(0, left), asset.szDecimals)
  if (filled <= 0) throw new Error('Not enough liquidity within the price limit')
  return { totalSz: filled, avgPx: cost / (size - Math.max(0, left)) }
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new Error('stopped'))
    })
  })

/**
 * Runs a plan on paper, slice by slice, with the plan's random delays (or
 * none when `skipWaits`). Calls `onFill` with each simulated fill so the
 * caller can update the book.
 */
export async function runPaperPlan(
  plan: Plan,
  addresses: string[],
  opts: { skipWaits: boolean; slippage: number },
  cb: {
    onSlice(r: SliceRun): void
    onLog(e: RunEvent): void
    onFill(slice: PaperSlice, fee: number): void
  },
  signal: AbortSignal,
) {
  const { asset, isLong } = plan.input
  const log = (text: string, level: RunEvent['level'] = 'info') => cb.onLog({ at: Date.now(), text, level })
  for (const s of plan.slices) {
    const run: SliceRun = { index: s.index, address: addresses[s.index] ?? `paper-${s.index + 1}`, state: 'waiting', opensAt: Date.now() + s.delay * 1000 }
    cb.onSlice({ ...run })
    if (s.delay > 0 && !opts.skipWaits) {
      log(`Slice ${s.index + 1}: opening in ${s.delay}s`)
      await sleep(s.delay * 1000, signal)
    }
    if (signal.aborted) throw new Error('stopped')
    cb.onSlice({ ...run, state: 'opening' })
    try {
      const fill = await simulateFill(asset, isLong, s.size, opts.slippage)
      const margin = (s.margin / s.size) * fill.totalSz
      const fee = fill.totalSz * fill.avgPx * TAKER_FEE
      cb.onFill(
        {
          index: s.index,
          size: fill.totalSz,
          entryPx: fill.avgPx,
          margin,
          liqPx: isolatedLiqPx(asset, isLong, fill.avgPx, fill.totalSz, margin),
          state: 'open',
        },
        fee,
      )
      log(`Slice ${s.index + 1}: paper fill ${fill.totalSz} ${asset.name} at ${fill.avgPx.toPrecision(6)}`, 'ok')
      cb.onSlice({ ...run, state: 'open', filledSz: fill.totalSz, avgPx: fill.avgPx })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      log(`Slice ${s.index + 1}: ${msg}`, 'error')
      cb.onSlice({ ...run, state: 'failed', error: msg })
    }
  }
  log('All paper slices processed', 'ok')
}

export const slicePnl = (p: PaperPosition, s: PaperSlice, mark: number) =>
  s.state === 'open' ? (mark - s.entryPx) * s.size * (p.isLong ? 1 : -1) : s.pnl ?? 0

/** Liquidates any open paper slice the mark price has crossed. */
export function applyMarks(book: PaperBook, mids: Record<string, string>): { book: PaperBook; events: string[] } {
  const events: string[] = []
  let changed = false
  const positions = book.positions.map((p) => {
    const mark = Number(mids[p.coin])
    if (!mark) return p
    const slices = p.slices.map((s) => {
      if (s.state !== 'open') return s
      const hit = p.isLong ? mark <= s.liqPx : mark >= s.liqPx
      if (!hit) return s
      changed = true
      events.push(`${p.coin} slice ${s.index + 1} liquidated at ${mark.toPrecision(6)} (paper)`)
      return { ...s, state: 'liquidated' as const, exitPx: mark, pnl: -s.margin }
    })
    return { ...p, slices }
  })
  if (!changed) return { book, events }
  // Fully liquidated positions move to history.
  const done = positions.filter((p) => p.slices.every((s) => s.state !== 'open'))
  return {
    book: {
      ...book,
      positions: positions.filter((p) => !done.includes(p)),
      history: [...done.map((p) => ({ ...p, closedAt: Date.now() })), ...book.history].slice(0, 50),
    },
    events,
  }
}

/** Closes every open slice of a paper position at live book prices. */
export async function closePaperPosition(book: PaperBook, id: string, asset: AssetMeta, slippage: number): Promise<PaperBook> {
  const p = book.positions.find((x) => x.id === id)
  if (!p) return book
  let balance = book.balance
  let fees = p.fees
  const slices: PaperSlice[] = []
  for (const s of p.slices) {
    if (s.state !== 'open') {
      slices.push(s)
      continue
    }
    const fill = await simulateFill(asset, !p.isLong, s.size, slippage * 2)
    const pnl = (fill.avgPx - s.entryPx) * fill.totalSz * (p.isLong ? 1 : -1)
    const fee = fill.totalSz * fill.avgPx * TAKER_FEE
    balance += s.margin + pnl - fee
    fees += fee
    slices.push({ ...s, state: 'closed', exitPx: fill.avgPx, pnl })
  }
  const closed = { ...p, slices, fees, closedAt: Date.now() }
  return {
    balance,
    positions: book.positions.filter((x) => x.id !== id),
    history: [closed, ...book.history].slice(0, 50),
  }
}
