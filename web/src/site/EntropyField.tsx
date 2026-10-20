import { useEffect, useRef } from 'react'
import { reducedMotion } from './motion'

/**
 * Hero background: a grid of small squares. Near the centre they hold a
 * perfect grid; toward the edges, and around the cursor, they drift and turn,
 * like the logo. Pauses when off screen or the tab is hidden.
 */
export default function EntropyField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const still = reducedMotion()
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 }
    type P = { x: number; y: number; seed: number; spin: number }
    let pts: P[] = []
    const GAP = 26

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      pts = []
      for (let y = GAP / 2; y < h; y += GAP)
        for (let x = GAP / 2; x < w; x += GAP) pts.push({ x, y, seed: Math.random() * 1000, spin: Math.random() * 2 - 1 })
    }

    const draw = (t: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.08
      mouse.y += (mouse.ty - mouse.y) * 0.08
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2, cy = h * 0.42
      const maxR = Math.hypot(w / 2, h / 2)
      const time = t / 1000
      for (const p of pts) {
        // Disorder grows with distance from the centre, and near the cursor.
        const r = Math.hypot(p.x - cx, p.y - cy) / maxR
        const md = Math.hypot(p.x - mouse.x, p.y - mouse.y)
        const near = Math.max(0, 1 - md / 160)
        const k = Math.min(1, Math.pow(r, 1.6) * 1.25 + near * 0.9)
        const ox = Math.sin(time * 0.6 + p.seed) * 10 * k + (near ? ((p.x - mouse.x) / (md || 1)) * near * 14 : 0)
        const oy = Math.cos(time * 0.5 + p.seed * 1.3) * 10 * k + (near ? ((p.y - mouse.y) / (md || 1)) * near * 14 : 0)
        const size = 2.4 * (1 - 0.5 * k)
        // Fade out toward the very edges and under the headline.
        const fade = Math.max(0, 1 - r * 0.75)
        const alpha = (0.07 + 0.5 * k) * fade + near * 0.4
        if (alpha < 0.01) continue
        ctx.save()
        ctx.translate(p.x + ox, p.y + oy)
        ctx.rotate(k * p.spin * (1.2 + Math.sin(time * 0.4 + p.seed)))
        ctx.fillStyle = `rgba(232,226,189,${alpha.toFixed(3)})`
        ctx.fillRect(-size / 2, -size / 2, size, size)
        ctx.restore()
      }
      if (!still && visible) raf = requestAnimationFrame(draw)
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.tx = e.clientX - r.left
      mouse.ty = e.clientY - r.top
    }
    const onLeave = () => ((mouse.tx = -9999), (mouse.ty = -9999))
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !document.hidden
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(draw)
    })
    const onVis = () => {
      visible = !document.hidden
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(draw)
    }

    resize()
    raf = requestAnimationFrame(draw)
    const ro = new ResizeObserver(() => (resize(), still && requestAnimationFrame(draw)))
    ro.observe(canvas)
    io.observe(canvas)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas ref={ref} className="entropy-field" aria-hidden="true" />
}
