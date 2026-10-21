import { useEffect, useRef, useState } from 'react'

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scroll reveals for the whole page. Tags common blocks with `.rv`, staggers
 * siblings in a grid, and adds `.in` as each one scrolls into view. Re-run on
 * every route change.
 */
export function useScrollReveal(key: string) {
  useEffect(() => {
    if (reducedMotion()) return
    const sel = [
      '.page-hero .wrap > *',
      '.section .wrap > :not(.grid):not(.split)',
      '.section .split > *',
      '.section .grid > *',
      '.cta-band .wrap > *',
      '.prose section',
      '.live-stats > *',
    ].join(',')
    // A plain scroll check rather than IntersectionObserver: it cannot miss an
    // element during fast scrolls or jumps, which would leave it invisible.
    let pending: HTMLElement[] = []
    let ticking = false
    const check = () => {
      ticking = false
      const limit = window.innerHeight * 0.92
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < limit) {
          el.classList.add('in')
          return false
        }
        return true
      })
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(check)
      }
    }
    const raf = requestAnimationFrame(() => {
      pending = [...document.querySelectorAll<HTMLElement>(sel)].filter((el) => !el.closest('.hero'))
      pending.forEach((el) => {
        const parent = el.parentElement
        const i = parent?.classList.contains('grid') || parent?.classList.contains('live-stats') ? [...parent.children].indexOf(el) : 0
        el.style.setProperty('--d', `${Math.min(i, 6) * 70}ms`)
        el.classList.add('rv')
      })
      check()
    })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [key])
}

/** Soft spotlight that follows the cursor across cards. */
export function useCardSpotlight() {
  useEffect(() => {
    const on = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>('.card')
      if (!card) return
      const r = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${e.clientX - r.left}px`)
      card.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    document.addEventListener('pointermove', on, { passive: true })
    return () => document.removeEventListener('pointermove', on)
  }, [])
}

/** Animates a number from 0 to `value` once it is on screen. */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(reducedMotion() ? value : 0)
  const current = useRef(shown)
  const counted = useRef(false)
  useEffect(() => {
    if (reducedMotion() || !ref.current) {
      setShown(value)
      return
    }
    let raf = 0
    const animate = (from: number, ms: number) => {
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / ms)
        current.current = from + (value - from) * (1 - Math.pow(1 - p, 3))
        setShown(current.current)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    // Later refreshes glide from the current number instead of restarting at zero.
    if (counted.current) {
      animate(current.current, 600)
      return () => cancelAnimationFrame(raf)
    }
    // Never leave the number at zero if the observer doesn't fire.
    const fallback = setTimeout(() => {
      if (counted.current) return
      counted.current = true
      current.current = value
      setShown(value)
    }, 4000)
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || counted.current) return
      counted.current = true
      obs.disconnect()
      animate(0, 1400)
    })
    obs.observe(ref.current)
    return () => {
      obs.disconnect()
      clearTimeout(fallback)
      cancelAnimationFrame(raf)
    }
  }, [value])
  return <span ref={ref}>{format(shown)}</span>
}
