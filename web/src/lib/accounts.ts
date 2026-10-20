import { concat, hexToBigInt, keccak256, numberToBytes, toBytes, type Hex } from 'viem'
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts'

// Slice accounts are derived from one wallet signature over this message, so
// the same wallet always rebuilds the same accounts and no key is ever stored.
// Changing this text changes every user's accounts: never edit it, add a new
// version instead.
export const DERIVATION_MESSAGE = [
  'Entropy: create my slice accounts',
  '',
  'Signing this creates the private trading accounts Entropy uses to split your positions.',
  'It is free and sends no transaction.',
  '',
  'Anyone who gets this signature controls those accounts.',
  'Only sign it on the real Entropy app.',
  '',
  'Version: 1',
].join('\n')

const SECP256K1_N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n
const DOMAIN = toBytes('entropy/v1/hyperliquid/slice')

export function deriveSliceAccounts(signature: Hex, count: number): PrivateKeyAccount[] {
  const seed = keccak256(signature)
  const out: PrivateKeyAccount[] = []
  for (let i = 0; i < count; i++) {
    let key = keccak256(concat([DOMAIN, toBytes(seed), numberToBytes(i, { size: 4 })]))
    // A hash outside the valid key range is astronomically unlikely; rehash if so.
    while (hexToBigInt(key) === 0n || hexToBigInt(key) >= SECP256K1_N) key = keccak256(key)
    out.push(privateKeyToAccount(key))
  }
  return out
}

/**
 * Wallets that sign non-deterministically would give different accounts each
 * time, stranding funds. We remember the first account per wallet and compare.
 */
export function checkDeterministic(wallet: string, firstSlice: string): 'new' | 'same' | 'changed' {
  const k = `entropy:first-slice:${wallet.toLowerCase()}`
  try {
    const prev = localStorage.getItem(k)
    if (!prev) {
      localStorage.setItem(k, firstSlice)
      return 'new'
    }
    return prev.toLowerCase() === firstSlice.toLowerCase() ? 'same' : 'changed'
  } catch {
    return 'new'
  }
}
