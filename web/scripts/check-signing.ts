// Compares our Hyperliquid signing against reference output from the official
// Python SDK. Usage: node scripts/check-signing.ts <ref.json>
import { readFileSync } from 'node:fs'
import { privateKeyToAccount } from 'viem/accounts'
import { signL1Action, splitSignature, usdSendTypedData } from '../src/lib/hl/signing.ts'
import { roundPrice, toWire } from '../src/lib/hl/format.ts'

const ref = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const acct = privateKeyToAccount('0x0123456789012345678901234567890123456789012345678901234567890123')
const nonce = 1761000000123
const order = {
  type: 'order',
  orders: [{ a: 0, b: true, p: toWire(roundPrice(108450.0, 5)), s: toWire(0.00012), r: false, t: { limit: { tif: 'Ioc' } } }],
  grouping: 'na',
}
const actions: Record<string, object> = {
  order,
  lev: { type: 'updateLeverage', asset: 0, isCross: false, leverage: 7 },
  mrg: { type: 'updateIsolatedMargin', asset: 3, isBuy: false, ntli: 1234567 },
}
let ok = JSON.stringify(order) === JSON.stringify(ref.order)
console.log('order wire matches:', ok)
for (const [k, a] of Object.entries(actions)) {
  const sig = await signL1Action(acct, a, nonce, true)
  const same = JSON.stringify(sig) === JSON.stringify(ref.sigs[k])
  ok &&= same
  console.log(k, same ? 'MATCH' : `MISMATCH ${JSON.stringify(sig)}`)
}
const usd = splitSignature(await acct.signTypedData(usdSendTypedData(ref.usd)))
const same = JSON.stringify(usd) === JSON.stringify(ref.sigs.usd)
ok &&= same
console.log('usd', same ? 'MATCH' : `MISMATCH ${JSON.stringify(usd)}`)
process.exit(ok ? 0 : 1)
