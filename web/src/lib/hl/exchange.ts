import type { Hex } from 'viem'
import type { LocalAccount } from 'viem/accounts'
import { HL_API, HL_IS_MAINNET } from '../../config'
import { roundPrice, roundSize, toWire } from './format'
import { signL1Action, splitSignature, usdSendTypedData, type HlSignature } from './signing'
import type { AssetMeta } from './info'

export type OrderStatus =
  | { filled: { totalSz: string; avgPx: string; oid: number } }
  | { resting: { oid: number } }
  | { error: string }

type ExchangeResponse =
  | { status: 'ok'; response: { type: string; data?: { statuses: OrderStatus[] } } }
  | { status: 'err'; response: string }

async function post(action: object, nonce: number, signature: HlSignature): Promise<ExchangeResponse> {
  const res = await fetch(`${HL_API}/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, nonce, signature, vaultAddress: null }),
  })
  if (!res.ok) throw new Error(`Hyperliquid exchange ${res.status}: ${await res.text()}`)
  return res.json()
}

// Nonces must be unique and increasing per signer; slices sign independently
// but share this counter, which is simplest and still satisfies that.
let lastNonce = 0
function nextNonce(): number {
  lastNonce = Math.max(Date.now(), lastNonce + 1)
  return lastNonce
}

async function l1(account: LocalAccount, action: object): Promise<ExchangeResponse> {
  const nonce = nextNonce()
  const sig = await signL1Action(account, action, nonce, HL_IS_MAINNET)
  const res = await post(action, nonce, sig)
  if (res.status === 'err') throw new Error(res.response)
  return res
}

export async function setIsolatedLeverage(account: LocalAccount, asset: AssetMeta, leverage: number) {
  await l1(account, { type: 'updateLeverage', asset: asset.index, isCross: false, leverage })
}

/** Adds (positive) or removes (negative) isolated margin, in USD. */
export async function adjustIsolatedMargin(account: LocalAccount, asset: AssetMeta, isLong: boolean, usd: number) {
  await l1(account, {
    type: 'updateIsolatedMargin',
    asset: asset.index,
    isBuy: isLong,
    ntli: Math.round(usd * 1e6),
  })
}

/**
 * Immediate-or-cancel order that crosses the book up to `slippage` away from
 * `refPx`: effectively a market order with a price limit.
 */
export async function marketOrder(
  account: LocalAccount,
  asset: AssetMeta,
  isBuy: boolean,
  size: number,
  refPx: number,
  slippage: number,
  reduceOnly = false,
): Promise<{ totalSz: number; avgPx: number }> {
  const px = roundPrice(refPx * (isBuy ? 1 + slippage : 1 - slippage), asset.szDecimals)
  const sz = roundSize(size, asset.szDecimals)
  const res = await l1(account, {
    type: 'order',
    orders: [{ a: asset.index, b: isBuy, p: toWire(px), s: toWire(sz), r: reduceOnly, t: { limit: { tif: 'Ioc' } } }],
    grouping: 'na',
  })
  if (res.status !== 'ok') throw new Error('order rejected')
  const st = res.response.data?.statuses[0]
  if (!st) throw new Error('No order status returned')
  if ('error' in st) throw new Error(st.error)
  if ('resting' in st) throw new Error('Order rested instead of filling')
  return { totalSz: Number(st.filled.totalSz), avgPx: Number(st.filled.avgPx) }
}

type Eip1193 = { request(args: { method: string; params?: unknown[] }): Promise<unknown> }

/**
 * Sends USDC from the connected wallet's Hyperliquid account to another
 * address on Hyperliquid. Signed in the user's wallet. This transfer is public
 * and links the two accounts.
 */
export async function usdSendFromWallet(provider: Eip1193, from: Hex, destination: Hex, amountUsd: number) {
  const chainId = (await provider.request({ method: 'eth_chainId' })) as Hex
  const time = nextNonce()
  const action = {
    type: 'usdSend',
    signatureChainId: chainId,
    hyperliquidChain: HL_IS_MAINNET ? 'Mainnet' : 'Testnet',
    destination: destination.toLowerCase(),
    amount: toWire(Math.floor(amountUsd * 100) / 100),
    time,
  }
  const typed = usdSendTypedData(action)
  const json = JSON.stringify({ ...typed, message: { ...typed.message, time: time }, types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    ...typed.types,
  } })
  const sig = (await provider.request({ method: 'eth_signTypedData_v4', params: [from, json] })) as Hex
  const res = await post(action, time, splitSignature(sig))
  if (res.status === 'err') throw new Error(res.response)
}
