import { LIMITS, TAKER_FEE, WHALE_ALERT_USD } from '../config'
import { roundSize } from './hl/format'
import type { AssetMeta } from './hl/info'

export type PlanInput = {
  asset: AssetMeta
  isLong: boolean
  notionalUsd: number
  leverage: number
  slices: number
  /** How far liquidation prices spread, as a share of the distance to liquidation (0.4 = ±40%). */
  band: number
  /** Random gap between slice opens, seconds. */
  delayRange: [number, number]
  /** Position size limit; defaults to the live-trading safety limit. */
  maxUsd?: number
}

export type PlannedSlice = {
  index: number
  size: number
  notional: number
  /** Margin this slice should hold, USD. */
  margin: number
  /** Leverage to open at; extra margin is added right after the fill. */
  openLeverage: number
  extraMargin: number
  liqPx: number
  /** Seconds after the previous slice opens. */
  delay: number
}

export type Plan = {
  input: PlanInput
  refPx: number
  slices: PlannedSlice[]
  totalSize: number
  totalNotional: number
  totalMargin: number
  /** Liquidation price if the whole position were one account. */
  singleLiqPx: number
  liqLow: number
  liqHigh: number
  feesUsd: number
  totalDurationSec: number
  warnings: string[]
}

export function maxSlicesFor(notionalUsd: number): number {
  return Math.max(1, Math.min(LIMITS.maxSlices, Math.floor(notionalUsd / LIMITS.minSliceUsd)))
}

const rand = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Hyperliquid isolated liquidation: maintenance margin is half the initial
 * margin at max leverage. With margin share m (margin / notional) the price
 * can move d = (m - mmr) / (1 ∓ mmr) against the position before liquidation.
 */
const mmrOf = (a: AssetMeta) => 1 / (2 * a.maxLeverage)
const distOf = (m: number, mmr: number, isLong: boolean) => (m - mmr) / (isLong ? 1 - mmr : 1 + mmr)
const marginShareOf = (d: number, mmr: number, isLong: boolean) => d * (isLong ? 1 - mmr : 1 + mmr) + mmr

export function buildPlan(input: PlanInput): Plan {
  const { asset, isLong, notionalUsd, leverage, band, delayRange } = input
  const warnings: string[] = []
  const refPx = asset.markPx
  const n = Math.min(input.slices, maxSlicesFor(notionalUsd))
  if (n < input.slices) warnings.push(`Reduced to ${n} slices so each stays above the $${LIMITS.minSliceUsd} order minimum.`)
  const maxUsd = input.maxUsd ?? LIMITS.maxPositionUsd
  if (notionalUsd > maxUsd)
    warnings.push(`Over the $${maxUsd.toLocaleString('en-US')} safety limit. Lower the size${input.maxUsd ? '' : ', practice bigger sizes in paper mode, or raise the limit in config.ts'}.`)
  if (leverage > asset.maxLeverage) warnings.push(`${asset.name} allows at most ${asset.maxLeverage}x.`)

  // Random sizes, each at least the order minimum.
  const spare = notionalUsd - n * LIMITS.minSliceUsd
  const w = Array.from({ length: n }, () => 0.35 + rand())
  const wSum = w.reduce((s, x) => s + x, 0)
  const notionals = w.map((x) => LIMITS.minSliceUsd + (spare * x) / wSum)
  const sizes = notionals.map((x) => roundSize(x / refPx, asset.szDecimals))
  const realNotionals = sizes.map((s) => s * refPx)
  const total = realNotionals.reduce((s, x) => s + x, 0)

  // Spread each slice's distance-to-liquidation around the single-account
  // distance, keeping the notional-weighted average (and so total margin) equal.
  const mmr = mmrOf(asset)
  const lev = Math.min(leverage, asset.maxLeverage)
  const d0 = distOf(1 / lev, mmr, isLong)
  const offsets = shuffle(Array.from({ length: n }, (_, i) => (n === 1 ? 0 : -band + (2 * band * i) / (n - 1))))
  const meanOff = offsets.reduce((s, o, i) => s + o * realNotionals[i], 0) / (total || 1)
  const minShare = 1 / asset.maxLeverage
  let clamped = false

  const slices: PlannedSlice[] = sizes.map((size, i) => {
    const notional = realNotionals[i]
    let m = marginShareOf(d0 * (1 + offsets[i] - meanOff), mmr, isLong)
    if (m < minShare) {
      m = minShare
      clamped = true
    }
    const margin = m * notional
    const openLeverage = Math.max(1, Math.min(asset.maxLeverage, Math.ceil(1 / m)))
    const d = distOf(m, mmr, isLong)
    const [lo, hi] = delayRange
    return {
      index: i,
      size,
      notional,
      margin,
      openLeverage,
      extraMargin: Math.max(0, margin - notional / openLeverage),
      liqPx: refPx * (isLong ? 1 - d : 1 + d),
      delay: i === 0 ? 0 : Math.round(lo + rand() * (hi - lo)),
    }
  })
  if (clamped) warnings.push(`Some slices hit ${asset.name}'s ${asset.maxLeverage}x limit, so the band is narrower than asked.`)
  if (slices.some((s) => s.size <= 0)) warnings.push('A slice rounded to zero size. Use fewer slices or a bigger position.')
  if (slices.some((s) => s.notional >= WHALE_ALERT_USD)) warnings.push('A slice is still large enough to trigger whale alerts. Add slices.')

  const liqs = slices.map((s) => s.liqPx)
  return {
    input: { ...input, slices: n },
    refPx,
    slices,
    totalSize: sizes.reduce((s, x) => s + x, 0),
    totalNotional: total,
    totalMargin: slices.reduce((s, x) => s + x.margin, 0),
    singleLiqPx: refPx * (isLong ? 1 - d0 : 1 + d0),
    liqLow: Math.min(...liqs),
    liqHigh: Math.max(...liqs),
    feesUsd: total * TAKER_FEE,
    totalDurationSec: slices.reduce((s, x) => s + x.delay, 0),
    warnings,
  }
}

/** Liquidation price of an isolated position, for checking live positions. */
export function isolatedLiqPx(asset: AssetMeta, isLong: boolean, entryPx: number, size: number, margin: number) {
  const mmr = mmrOf(asset)
  const d = distOf(margin / (entryPx * size), mmr, isLong)
  return entryPx * (isLong ? 1 - d : 1 + d)
}
