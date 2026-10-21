<p align="center"><img src="brand/mark.svg" width="72" alt="Entropy" /></p>

# Entropy

**Hide your size and your liquidation price on Hyperliquid.**

Entropy splits one leveraged position across accounts that aren't publicly linked, each with different margin, so trackers see a few ordinary traders instead of one whale, and liquidation becomes a band of prices instead of a single line to hunt.

It runs entirely in the browser. There is no server, no custody and no mixer.

## How it works

1. **Sign once.** Your wallet signs a fixed message; the browser derives up to 12 slice-account keys from it. The same wallet always rebuilds the same accounts. Keys are never stored or sent anywhere.
2. **Plan.** One trade is split into slices of random size. Margin differs per slice, spreading liquidation across a band while total margin stays the same.
3. **Fund.** Each slice account needs its own USDC. Entropy flags any transfer that links a slice back to you.
4. **Open on a random clock.** Slices open one by one at random intervals, then are managed and closed as one position.

The math behind the liquidation band is in the [whitepaper](web/src/site/Learn.tsx) (also at `/whitepaper` on the site).

## Paper mode

The app opens in Paper mode: the full flow with a simulated $1M balance and no wallet. Fills walk Hyperliquid's live order book, positions mark to market, and slices liquidate when the price crosses them.

## Status

Early, unaudited software.

- Live trading is capped at **$50** per position (`web/src/config.ts`).
- Request signing is checked against Hyperliquid's official Python SDK (`web/scripts/check-signing.ts`).
- Risk guard, hidden stops and an always-on agent are not built yet.

## Development

```bash
cd web
npm install
npm run dev
```

| Path | What |
|---|---|
| `web/src/lib/hl/` | Hyperliquid client: info, signing, exchange |
| `web/src/lib/planner.ts` | Splitting and liquidation-band math |
| `web/src/lib/executor.ts` | Opening and closing slices on mainnet |
| `web/src/lib/paper.ts` | Paper mode simulation |
| `web/src/lib/accounts.ts` | Slice-account derivation |
| `web/src/pages/Trade.tsx` | The app |
| `web/src/site/` | Marketing site pages |
| `brand/` | Logo files and `gen_mark.py` |

## Disclaimer

Leveraged trading can lose more than you expect. Entropy reduces what public trackers can infer; it does not make you anonymous. Nothing here is financial advice.
