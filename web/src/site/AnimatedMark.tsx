import type { CSSProperties } from 'react'

// The logo's squares (from brand/gen_mark.py): size, color, x, y, rotation.
const MARK: [number, string, number, number, number][] = [
  [8.0, '#F2EDCF', 7.0, 7.0, 0.0], [7.79, '#E6DEBC', 18.85, 7.74, -0.2], [7.32, '#D9D0A8', 32.89, 9.01, 1.9], [6.65, '#CDC194', 44.69, 9.25, 0.5],
  [7.79, '#E6DEBC', 7.8, 19.31, 2.0], [7.32, '#D9D0A8', 19.71, 19.96, -4.3], [6.65, '#CDC194', 32.38, 21.44, 13.3], [5.79, '#C1B281', 48.94, 27.7, -32.2],
  [7.32, '#D9D0A8', 8.06, 32.07, 10.1], [6.65, '#CDC194', 23.46, 35.43, 5.0], [5.79, '#C1B281', 34.76, 33.9, -34.1], [4.77, '#B4A46E', 55.15, 40.13, -45.2],
  [6.65, '#CDC194', 10.25, 43.72, -11.1], [5.79, '#C1B281', 21.97, 47.34, -2.5], [4.77, '#B4A46E', 43.42, 49.26, 35.2], [3.6, '#A8955A', 60.16, 54.96, 19.6],
]

/**
 * The Entropy mark with motion. "loop": order → disorder → order, forever.
 * "hover": shows the logo, and snaps into a perfect grid on hover.
 */
export default function AnimatedMark({ size = 64, mode = 'loop', className = '' }: { size?: number; mode?: 'loop' | 'hover'; className?: string }) {
  return (
    <svg className={`amark amark-${mode} ${className}`} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      {MARK.map(([s, fill, x, y, r], i) => {
        const row = Math.floor(i / 4)
        const col = i % 4
        const style = {
          '--sx': `${x}px`, '--sy': `${y}px`, '--sr': `${r}deg`, '--ss': s / 8,
          '--ox': `${14.75 + col * 11.5}px`, '--oy': `${14.75 + row * 11.5}px`,
          '--i': i, '--k': (row + col) / 6,
        } as CSSProperties
        return <rect key={i} x={-4} y={-4} width={8} height={8} rx={1.45} fill={fill} style={style} />
      })}
    </svg>
  )
}
