// Safety limits for mainnet. Raise these only after real trades have worked
// end to end at the current limit.
export const LIMITS = {
  /** Largest total position (notional, USD) the app will open. */
  maxPositionUsd: 50,
  /** Hyperliquid rejects orders under $10 notional; keep a margin above it. */
  minSliceUsd: 11,
  maxSlices: 12,
  /** IOC orders cross the book at most this far from the mark price. */
  slippage: 0.01,
}

/** Sizes that public whale trackers commonly alert on (USD notional). */
export const WHALE_ALERT_USD = 1_000_000

export const HL_API = 'https://api.hyperliquid.xyz'
export const HL_IS_MAINNET = true

/** Hyperliquid taker fee at the base tier. */
export const TAKER_FEE = 0.00045
