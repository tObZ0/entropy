type Props = {
  refPx: number
  /** Liquidation price if the position were one account. */
  single: number
  liqs: { px: number; weight: number }[]
  showSingle?: boolean
  height?: number
}

const money = (n: number) =>
  n >= 1000 ? `$${Math.round(n).toLocaleString('en-US')}` : `$${n.toPrecision(5).replace(/\.?0+$/, '')}`

/**
 * Price axis from liquidation to the current price: the single-account
 * liquidation line versus the band of slice liquidations.
 */
export default function LadderChart({ refPx, single, liqs, showSingle = true, height = 120 }: Props) {
  const W = 800
  const pad = 16
  const all = [refPx, single, ...liqs.map((l) => l.px)]
  let lo = Math.min(...all)
  let hi = Math.max(...all)
  const span = hi - lo || refPx * 0.01
  lo -= span * 0.08
  hi += span * 0.08
  const x = (p: number) => pad + ((p - lo) / (hi - lo)) * (W - 2 * pad)
  const maxW = Math.max(...liqs.map((l) => l.weight), 1)
  const axisY = height - 26
  const bandLo = liqs.length ? Math.min(...liqs.map((l) => l.px)) : 0
  const bandHi = liqs.length ? Math.max(...liqs.map((l) => l.px)) : 0

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label="Liquidation prices">
      <line x1={pad} x2={W - pad} y1={axisY} y2={axisY} stroke="var(--line-2)" />
      {liqs.length > 0 && (
        <rect x={x(bandLo)} y={14} width={Math.max(2, x(bandHi) - x(bandLo))} height={axisY - 14} fill="rgba(232,226,189,.06)" />
      )}
      {liqs.map((l, i) => {
        const h = 14 + (l.weight / maxW) * (axisY - 30)
        return <rect key={`${i}-${l.px}`} className="grow-y" style={{ animationDelay: `${i * 60}ms` }} x={x(l.px) - 2.5} y={axisY - h} width={5} height={h} rx={2} fill="var(--accent)" opacity={0.55 + 0.45 * (l.weight / maxW)} />
      })}
      {showSingle && (
        <g>
          <line className="pulse" x1={x(single)} x2={x(single)} y1={10} y2={axisY} stroke="var(--danger)" strokeWidth={2} strokeDasharray="5 4" />
          <text x={x(single)} y={axisY + 18} fill="var(--danger)" fontSize={12} textAnchor="middle" fontFamily="var(--mono)">liq {money(single)}</text>
        </g>
      )}
      {liqs.length > 0 && (
        <>
          <text x={x(bandLo)} y={axisY + 18} fill="var(--accent)" fontSize={12} textAnchor="start" fontFamily="var(--mono)">{money(bandLo)}</text>
          <text x={x(bandHi)} y={axisY + 18} fill="var(--accent)" fontSize={12} textAnchor="end" fontFamily="var(--mono)">{money(bandHi)}</text>
        </>
      )}
      <line x1={x(refPx)} x2={x(refPx)} y1={10} y2={axisY} stroke="var(--muted)" strokeWidth={1} />
      <text x={x(refPx)} y={axisY + 18} fill="var(--muted)" fontSize={12} textAnchor="end" fontFamily="var(--mono)">mark {money(refPx)}</text>
    </svg>
  )
}
