import { encode } from '@msgpack/msgpack'
import { concat, hexToBytes, keccak256, numberToBytes, parseSignature, zeroAddress, type Hex } from 'viem'
import type { LocalAccount } from 'viem/accounts'

export type HlSignature = { r: Hex; s: Hex; v: number }

/** Hash of an L1 action (orders, leverage, margin), as Hyperliquid computes it. */
export function actionHash(action: object, vaultAddress: Hex | null, nonce: number): Hex {
  const vault = vaultAddress
    ? concat([new Uint8Array([1]), hexToBytes(vaultAddress)])
    : new Uint8Array([0])
  return keccak256(concat([encode(action), numberToBytes(BigInt(nonce), { size: 8 }), vault]))
}

function split(sig: Hex): HlSignature {
  const { r, s, v, yParity } = parseSignature(sig)
  return { r, s, v: v !== undefined ? Number(v) : 27 + (yParity ?? 0) }
}

/** Signs an L1 action with a local key ("phantom agent" scheme). */
export async function signL1Action(
  account: LocalAccount,
  action: object,
  nonce: number,
  isMainnet: boolean,
): Promise<HlSignature> {
  const sig = await account.signTypedData({
    domain: { name: 'Exchange', version: '1', chainId: 1337, verifyingContract: zeroAddress },
    types: { Agent: [{ name: 'source', type: 'string' }, { name: 'connectionId', type: 'bytes32' }] },
    primaryType: 'Agent',
    message: { source: isMainnet ? 'a' : 'b', connectionId: actionHash(action, null, nonce) },
  })
  return split(sig)
}

/** EIP-712 payload for a user-signed USDC transfer between Hyperliquid accounts. */
export function usdSendTypedData(action: {
  signatureChainId: Hex
  hyperliquidChain: string
  destination: string
  amount: string
  time: number
}) {
  return {
    domain: {
      name: 'HyperliquidSignTransaction',
      version: '1',
      chainId: Number(action.signatureChainId),
      verifyingContract: zeroAddress,
    },
    types: {
      'HyperliquidTransaction:UsdSend': [
        { name: 'hyperliquidChain', type: 'string' },
        { name: 'destination', type: 'string' },
        { name: 'amount', type: 'string' },
        { name: 'time', type: 'uint64' },
      ],
    },
    primaryType: 'HyperliquidTransaction:UsdSend' as const,
    message: {
      hyperliquidChain: action.hyperliquidChain,
      destination: action.destination,
      amount: action.amount,
      time: BigInt(action.time),
    },
  }
}

export { split as splitSignature }
