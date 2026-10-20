// Hyperliquid number rules: sizes are rounded to the asset's szDecimals;
// perp prices have at most 5 significant figures and at most 6 - szDecimals
// decimals (integer prices are always allowed).

export function roundSize(size: number, szDecimals: number): number {
  const f = 10 ** szDecimals
  return Math.floor(size * f + 1e-9) / f
}

export function roundPrice(px: number, szDecimals: number): number {
  if (Number.isInteger(px)) return px
  const sig = Number(px.toPrecision(5))
  const f = 10 ** Math.max(0, 6 - szDecimals)
  return Math.round(sig * f) / f
}

/** Number to the string format Hyperliquid expects on the wire. */
export function toWire(x: number): string {
  let s = x.toFixed(8)
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s === '-0' ? '0' : s
}
