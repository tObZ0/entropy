import { HL_API } from '../../config'

export type AssetMeta = {
  index: number
  name: string
  szDecimals: number
  maxLeverage: number
  onlyIsolated?: boolean
  isDelisted?: boolean
  markPx: number
  dayNtlVlm: number
  openInterest: number
}

export type HlPosition = {
  coin: string
  szi: string
  entryPx: string | null
  positionValue: string
  unrealizedPnl: string
  liquidationPx: string | null
  marginUsed: string
  leverage: { type: 'cross' | 'isolated'; value: number }
}

export type ClearinghouseState = {
  marginSummary: { accountValue: string; totalNtlPos: string; totalMarginUsed: string }
  withdrawable: string
  assetPositions: { position: HlPosition }[]
}

async function info<T>(body: object): Promise<T> {
  const res = await fetch(`${HL_API}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Hyperliquid info ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

type RawMeta = { universe: { name: string; szDecimals: number; maxLeverage: number; onlyIsolated?: boolean; isDelisted?: boolean }[] }
type RawCtx = { markPx: string; dayNtlVlm: string; openInterest: string }

/** All perp markets with live mark prices, most traded first. */
export async function getMarkets(): Promise<AssetMeta[]> {
  const [meta, ctxs] = await info<[RawMeta, RawCtx[]]>({ type: 'metaAndAssetCtxs' })
  return meta.universe
    .map((u, index) => ({
      ...u,
      index,
      markPx: Number(ctxs[index]?.markPx ?? 0),
      dayNtlVlm: Number(ctxs[index]?.dayNtlVlm ?? 0),
      openInterest: Number(ctxs[index]?.openInterest ?? 0) * Number(ctxs[index]?.markPx ?? 0),
    }))
    .filter((m) => !m.isDelisted && m.markPx > 0)
    .sort((a, b) => b.dayNtlVlm - a.dayNtlVlm)
}

export function getAllMids(): Promise<Record<string, string>> {
  return info({ type: 'allMids' })
}

export function getClearinghouseState(user: string): Promise<ClearinghouseState> {
  return info({ type: 'clearinghouseState', user })
}

export type LedgerUpdate = {
  time: number
  hash: string
  delta: { type: string; usdc?: string; user?: string; destination?: string; amount?: string }
}

/** Deposits, withdrawals and transfers in and out of an account. */
export function getLedgerUpdates(user: string): Promise<LedgerUpdate[]> {
  return info({ type: 'userNonFundingLedgerUpdates', user, startTime: 0 })
}
