import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react'

// Minimal path router. The host must serve index.html for unknown paths
// (public/_redirects on Netlify, vercel.json on Vercel).

const listeners = new Set<() => void>()

export function navigate(to: string) {
  const url = new URL(to, window.location.href)
  window.history.pushState(null, '', url.pathname + url.search + url.hash)
  listeners.forEach((l) => l())
  if (url.hash) {
    requestAnimationFrame(() => document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }))
  } else {
    window.scrollTo(0, 0)
  }
}

export function usePath(): string {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const on = () => setPath(window.location.pathname)
    listeners.add(on)
    window.addEventListener('popstate', on)
    return () => {
      listeners.delete(on)
      window.removeEventListener('popstate', on)
    }
  }, [])
  return path.replace(/\/+$/, '') || '/'
}

export function Link({ href = '/', onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = /^(https?:|mailto:)/.test(href) || rest.download !== undefined || rest.target === '_blank'
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (external || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(href)
  }
  return <a href={href} onClick={handle} {...rest} />
}
