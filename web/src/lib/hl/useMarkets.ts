import { useEffect, useState } from 'react'
import { getMarkets, type AssetMeta } from './info'

// One shared, self-healing feed of Hyperliquid markets for every component.
// It refreshes on an interval while anything is subscribed, retries failures
// with backoff, and keeps the last good data on screen meanwhile.

type State = { data: AssetMeta[] | null; prev: AssetMeta[] | null; at: number | null; error: string | null }

const REFRESH_MS = 20_000
let state: State = { data: null, prev: null, at: null, error: null }
const subs = new Set<(s: State) => void>()
let timer: ReturnType<typeof setTimeout> | undefined
let inFlight = false
let failures = 0

function emit() {
  subs.forEach((f) => f(state))
}

async function load() {
  if (inFlight) return
  inFlight = true
  try {
    const data = await getMarkets()
    state = { data, prev: state.data, at: Date.now(), error: null }
    failures = 0
  } catch (e) {
    failures++
    state = { ...state, error: e instanceof Error ? e.message : String(e) }
  } finally {
    inFlight = false
    emit()
    schedule()
  }
}

function schedule() {
  clearTimeout(timer)
  if (!subs.size) return
  // Retry quickly after a failure (2s, 4s, 8s … up to 30s), else refresh normally.
  const wait = failures ? Math.min(30_000, 1000 * 2 ** failures) : REFRESH_MS
  timer = setTimeout(load, wait)
}

const onWake = () => {
  if (document.visibilityState === 'visible' && subs.size && (!state.at || Date.now() - state.at > REFRESH_MS)) load()
}

export function useMarkets(): State {
  const [s, setS] = useState(state)
  useEffect(() => {
    subs.add(setS)
    if (subs.size === 1) {
      document.addEventListener('visibilitychange', onWake)
      window.addEventListener('online', onWake)
    }
    if (!state.data || Date.now() - (state.at ?? 0) > REFRESH_MS) load()
    else schedule()
    setS(state)
    return () => {
      subs.delete(setS)
      if (!subs.size) {
        clearTimeout(timer)
        document.removeEventListener('visibilitychange', onWake)
        window.removeEventListener('online', onWake)
      }
    }
  }, [])
  return s
}
