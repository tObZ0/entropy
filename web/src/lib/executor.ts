import type { PrivateKeyAccount } from 'viem/accounts'
import { LIMITS } from '../config'
import { adjustIsolatedMargin, marketOrder, setIsolatedLeverage } from './hl/exchange'
import { getAllMids, getClearinghouseState, type AssetMeta } from './hl/info'
import type { Plan } from './planner'

export type SliceRun = {
  index: number
  address: string
  state: 'waiting' | 'opening' | 'open' | 'failed' | 'skipped'
  opensAt?: number
  filledSz?: number
  avgPx?: number
  error?: string
}

export type RunEvent = { at: number; text: string; level: 'info' | 'ok' | 'error' }

type Callbacks = {
  onSlice(run: SliceRun): void
  onLog(e: RunEvent): void
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new Error('stopped'))
    })
  })

async function midOf(coin: string): Promise<number> {
  const mids = await getAllMids()
  const px = Number(mids[coin])
  if (!px) throw new Error(`No price for ${coin}`)
  return px
}

/**
 * Opens the plan's slices one by one, waiting each slice's random delay.
 * Each slice: set isolated leverage, cross the book with an IOC order, then
 * top up margin so liquidation lands where the plan put it.
 */
export async function runPlan(plan: Plan, accounts: PrivateKeyAccount[], cb: Callbacks, signal: AbortSignal) {
  const { asset, isLong } = plan.input
  const log = (text: string, level: RunEvent['level'] = 'info') => cb.onLog({ at: Date.now(), text, level })
  if (plan.totalNotional > LIMITS.maxPositionUsd * 1.02) throw new Error('Plan is over the safety limit')

  for (const s of plan.slices) {
    const acct = accounts[s.index]
    const run: SliceRun = { index: s.index, address: acct.address, state: 'waiting', opensAt: Date.now() + s.delay * 1000 }
    cb.onSlice({ ...run })
    if (s.delay > 0) {
      log(`Slice ${s.index + 1}: opening in ${s.delay}s`)
      await sleep(s.delay * 1000, signal)
    }
    if (signal.aborted) throw new Error('stopped')

    cb.onSlice({ ...run, state: 'opening' })
    try {
      const st = await getClearinghouseState(acct.address)
      const free = Number(st.withdrawable)
      const need = s.notional / s.openLeverage + s.extraMargin + s.notional * 0.001
      if (free < need) throw new Error(`Needs $${need.toFixed(2)}, account has $${free.toFixed(2)}`)

      await setIsolatedLeverage(acct, asset, s.openLeverage)
      const px = await midOf(asset.name)
      const fill = await marketOrder(acct, asset, isLong, s.size, px, LIMITS.slippage)
      log(`Slice ${s.index + 1}: filled ${fill.totalSz} ${asset.name} at ${fill.avgPx}`, 'ok')

      const extra = (s.margin / s.size) * fill.totalSz - (fill.totalSz * fill.avgPx) / s.openLeverage
      if (extra > 0.01) {
        await adjustIsolatedMargin(acct, asset, isLong, extra)
        log(`Slice ${s.index + 1}: added $${extra.toFixed(2)} margin`)
      }
      cb.onSlice({ ...run, state: 'open', filledSz: fill.totalSz, avgPx: fill.avgPx })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      log(`Slice ${s.index + 1}: ${msg}`, 'error')
      cb.onSlice({ ...run, state: 'failed', error: msg })
    }
  }
  log('All slices processed', 'ok')
}

/** Closes every slice's position in `asset` with reduce-only IOC orders. */
export async function closeAll(asset: AssetMeta, accounts: PrivateKeyAccount[], onLog: Callbacks['onLog']) {
  const px = await midOf(asset.name)
  await Promise.all(
    accounts.map(async (acct, i) => {
      try {
        const st = await getClearinghouseState(acct.address)
        const pos = st.assetPositions.find((p) => p.position.coin === asset.name)?.position
        const szi = Number(pos?.szi ?? 0)
        if (!szi) return
        const fill = await marketOrder(acct, asset, szi < 0, Math.abs(szi), px, LIMITS.slippage * 2, true)
        onLog({ at: Date.now(), text: `Slice ${i + 1}: closed ${fill.totalSz} at ${fill.avgPx}`, level: 'ok' })
      } catch (e) {
        onLog({ at: Date.now(), text: `Slice ${i + 1}: close failed: ${e instanceof Error ? e.message : e}`, level: 'error' })
      }
    }),
  )
}
