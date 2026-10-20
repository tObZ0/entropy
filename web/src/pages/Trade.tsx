import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PrivateKeyAccount } from 'viem/accounts'
import LadderChart from '../components/LadderChart'
import TrackerView from '../components/TrackerView'
import { LIMITS } from '../config'
import { checkDeterministic, deriveSliceAccounts, DERIVATION_MESSAGE } from '../lib/accounts'
import { closeAll, runPlan, type RunEvent, type SliceRun } from '../lib/executor'
import { usdSendFromWallet } from '../lib/hl/exchange'
import { getAllMids, getClearinghouseState, getMarkets, type AssetMeta, type ClearinghouseState } from '../lib/hl/info'
import { applyMarks, closePaperPosition, loadPaper, PAPER_MAX_POSITION_USD, PAPER_START_BALANCE, resetPaper, runPaperPlan, savePaper, slicePnl, type PaperBook, type PaperPosition } from '../lib/paper'
import { checkLinkability, type LinkFinding } from '../lib/linkability'
import { buildPlan, maxSlicesFor, type Plan } from '../lib/planner'
import { short, useWallet } from '../lib/wallet'
import { usePageTitle } from '../site/ui'

const usd = (n: number, d = 2) => `$${n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`
const px = (n: number) => (n >= 1000 ? usd(n, 1) : `$${n.toPrecision(5)}`)

/** USDC a slice account needs before its slice can open. */
const needFor = (s: Plan['slices'][number]) => s.margin + s.notional * 0.001 + 0.5

type Mode = 'paper' | 'live'
const MODE_KEY = 'entropy:mode'
const readMode = (): Mode => {
  try {
    return localStorage.getItem(MODE_KEY) === 'live' ? 'live' : 'paper'
  } catch {
    return 'paper'
  }
}

export default function Trade() {
  usePageTitle('App')
  const wallet = useWallet()
  const [mode, setModeState] = useState<Mode>(readMode)
  const paper = mode === 'paper'
  const [book, setBook] = useState<PaperBook>(loadPaper)
  const [mids, setMids] = useState<Record<string, string>>({})
  const [skipWaits, setSkipWaits] = useState(true)
  const [markets, setMarkets] = useState<AssetMeta[]>([])
  const [marketErr, setMarketErr] = useState<string>()
  const [coin, setCoin] = useState('BTC')
  const [isLong, setIsLong] = useState(true)
  const [notional, setNotional] = useState(() => (readMode() === 'paper' ? 250_000 : 40))
  const [leverage, setLeverage] = useState(5)
  const [slices, setSlices] = useState(() => (readMode() === 'paper' ? 6 : 3))
  const [band, setBand] = useState(0.4)
  const [delayMax, setDelayMax] = useState(90)
  const [seed, setSeed] = useState(0)

  const [accounts, setAccounts] = useState<PrivateKeyAccount[] | null>(null)
  const [deriveNote, setDeriveNote] = useState<string>()
  const [states, setStates] = useState<Record<string, ClearinghouseState>>({})
  const [links, setLinks] = useState<LinkFinding[] | null>(null)
  const [busy, setBusy] = useState<string>()
  const [err, setErr] = useState<string>()

  const [confirming, setConfirming] = useState(false)
  const [runs, setRuns] = useState<Record<number, SliceRun>>({})
  const [log, setLog] = useState<RunEvent[]>([])
  const [running, setRunning] = useState(false)
  const abort = useRef<AbortController | null>(null)

  // Markets and prices
  useEffect(() => {
    let live = true
    const load = () =>
      getMarkets()
        .then((m) => live && (setMarkets(m), setMarketErr(undefined)))
        .catch((e) => live && setMarketErr(String(e.message ?? e)))
    load()
    const t = setInterval(load, 15_000)
    return () => {
      live = false
      clearInterval(t)
    }
  }, [])
  const asset = markets.find((m) => m.name === coin)

  // The plan is random by design; rebuild it when inputs change or on reshuffle,
  // but not on every price tick.
  const [plan, setPlan] = useState<Plan | null>(null)
  const assetReady = !!asset
  useEffect(() => {
    if (!asset) return
    setPlan(buildPlan({ asset, isLong, notionalUsd: notional, leverage, slices, band, delayRange: [Math.min(15, delayMax), delayMax], maxUsd: paper ? PAPER_MAX_POSITION_USD : undefined }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetReady, coin, isLong, notional, leverage, slices, band, delayMax, seed, paper])

  // Paper book: persist, mark to market, and liquidate crossed slices.
  const bookRef = useRef(book)
  useEffect(() => {
    bookRef.current = book
    savePaper(book)
  }, [book])
  useEffect(() => {
    if (!paper) return
    let live = true
    const tick = () =>
      getAllMids()
        .then((m) => {
          if (!live) return
          setMids(m)
          // Side effects stay outside the state updater, which React may run twice.
          const r = applyMarks(bookRef.current, m)
          if (r.events.length) {
            setBook((b) => applyMarks(b, m).book)
            setLog((l) => [...l, ...r.events.map((text) => ({ at: Date.now(), text, level: 'error' as const }))])
          }
        })
        .catch(() => {})
    tick()
    const t = setInterval(tick, 4_000)
    return () => {
      live = false
      clearInterval(t)
    }
  }, [paper])

  function setMode(m: Mode) {
    if (running) return
    setModeState(m)
    setRuns({})
    setLog([])
    if (m === 'live' && notional > LIMITS.maxPositionUsd) setNotional(LIMITS.maxPositionUsd)
    try {
      localStorage.setItem(MODE_KEY, m)
    } catch {
      /* not persisted */
    }
  }

  // Slice account balances and positions
  const refreshStates = useCallback(async () => {
    if (!accounts) return
    const res = await Promise.all(accounts.map((a) => getClearinghouseState(a.address).catch(() => null)))
    const next: Record<string, ClearinghouseState> = {}
    res.forEach((r, i) => r && (next[accounts[i].address] = r))
    setStates(next)
  }, [accounts])
  useEffect(() => {
    refreshStates()
    const t = setInterval(refreshStates, 8_000)
    return () => clearInterval(t)
  }, [refreshStates])

  async function derive() {
    setErr(undefined)
    setBusy('derive')
    try {
      const sig = await wallet.signMessage(DERIVATION_MESSAGE)
      const accts = deriveSliceAccounts(sig, LIMITS.maxSlices)
      const det = checkDeterministic(wallet.address!, accts[0].address)
      setDeriveNote(
        det === 'changed'
          ? 'This wallet produced different accounts than last time. Your wallet may not sign deterministically: do not fund these accounts, and check your earlier ones.'
          : undefined,
      )
      setAccounts(accts)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(undefined)
    }
  }

  async function fundFromWallet(address: `0x${string}`, amount: number) {
    if (!wallet.provider || !wallet.address) return
    if (!window.confirm(`Send ${usd(amount)} USDC on Hyperliquid from your wallet to ${short(address)}?\n\nThis transfer is public and links this slice to your wallet. Trackers can then connect them.`)) return
    setBusy(address)
    setErr(undefined)
    try {
      await usdSendFromWallet(wallet.provider, wallet.address, address, amount)
      setTimeout(refreshStates, 1500)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(undefined)
    }
  }

  async function runLinkCheck() {
    if (!accounts || !plan || !wallet.address) return
    setBusy('links')
    try {
      setLinks(await checkLinkability(wallet.address, accounts.slice(0, plan.slices.length).map((a) => a.address)))
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(undefined)
    }
  }

  async function executePaper() {
    if (!plan) return
    setConfirming(false)
    setRunning(true)
    setRuns({})
    setLog([])
    const ctl = new AbortController()
    abort.current = ctl
    const id = `${Date.now().toString(36)}-${plan.input.asset.name}`
    const pos: PaperPosition = { id, coin: plan.input.asset.name, isLong: plan.input.isLong, openedAt: Date.now(), fees: 0, slices: [] }
    setBook((b) => ({ ...b, positions: [pos, ...b.positions] }))
    try {
      await runPaperPlan(
        plan,
        accounts?.map((a) => a.address) ?? [],
        { skipWaits, slippage: LIMITS.slippage },
        {
          onSlice: (r) => setRuns((m) => ({ ...m, [r.index]: r })),
          onLog: (e) => setLog((l) => [...l, e]),
          onFill: (slice, fee) =>
            setBook((b) => ({
              ...b,
              balance: b.balance - slice.margin - fee,
              positions: b.positions.map((p) => (p.id === id ? { ...p, fees: p.fees + fee, slices: [...p.slices, slice] } : p)),
            })),
        },
        ctl.signal,
      )
    } catch (e) {
      setLog((l) => [...l, { at: Date.now(), text: e instanceof Error ? e.message : String(e), level: 'error' }])
    } finally {
      // Drop the position if no slice filled.
      setBook((b) => ({ ...b, positions: b.positions.filter((p) => p.id !== id || p.slices.length > 0) }))
      setRunning(false)
    }
  }

  async function closePaper(p: PaperPosition) {
    const a = markets.find((m) => m.name === p.coin)
    if (!a) return
    setBusy('close')
    try {
      const next = await closePaperPosition(book, p.id, a, LIMITS.slippage)
      setBook(next)
      setLog((l) => [...l, { at: Date.now(), text: `Closed paper ${p.coin} position`, level: 'ok' }])
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(undefined)
    }
  }

  async function execute() {
    if (paper) return executePaper()
    if (!plan || !accounts) return
    setConfirming(false)
    setRunning(true)
    setRuns({})
    setLog([])
    const ctl = new AbortController()
    abort.current = ctl
    try {
      await runPlan(plan, accounts, { onSlice: (r) => setRuns((m) => ({ ...m, [r.index]: r })), onLog: (e) => setLog((l) => [...l, e]) }, ctl.signal)
    } catch (e) {
      setLog((l) => [...l, { at: Date.now(), text: e instanceof Error ? e.message : String(e), level: 'error' }])
    } finally {
      setRunning(false)
      refreshStates()
    }
  }

  async function closeCoin(a: AssetMeta) {
    if (!accounts) return
    if (!window.confirm(`Close every ${a.name} slice at market?`)) return
    abort.current?.abort()
    setBusy('close')
    await closeAll(a, accounts, (e) => setLog((l) => [...l, e]))
    setBusy(undefined)
    refreshStates()
  }

  // Positions across all slice accounts, grouped by coin
  const positions = useMemo(() => {
    const by: Record<string, { size: number; value: number; pnl: number; margin: number; liqs: number[]; count: number }> = {}
    for (const st of Object.values(states))
      for (const { position: p } of st.assetPositions) {
        const g = (by[p.coin] ??= { size: 0, value: 0, pnl: 0, margin: 0, liqs: [], count: 0 })
        g.size += Number(p.szi)
        g.value += Number(p.positionValue)
        g.pnl += Number(p.unrealizedPnl)
        g.margin += Number(p.marginUsed)
        if (p.liquidationPx) g.liqs.push(Number(p.liquidationPx))
        g.count++
      }
    return Object.entries(by)
  }, [states])

  const used = plan?.slices.length ?? 0
  const balance = (a: string) => Number(states[a]?.withdrawable ?? 0)
  const blocking = plan ? plan.warnings.filter((w) => /safety limit|zero size|allows at most/.test(w)) : []
  const unfunded = plan && accounts ? plan.slices.filter((s) => balance(accounts[s.index].address) < needFor(s)) : []
  const paperCost = plan ? plan.totalMargin + plan.feesUsd : 0
  const paperShort = paper && paperCost > book.balance
  const canRun = paper
    ? !!plan && !running && blocking.length === 0 && !paperShort
    : !!plan && !!accounts && !running && blocking.length === 0 && unfunded.length === 0
  const maxUsd = paper ? PAPER_MAX_POSITION_USD : LIMITS.maxPositionUsd
  const paperOpen = book.positions.reduce(
    (acc, p) => {
      const mark = Number(mids[p.coin])
      for (const s of p.slices) {
        if (s.state !== 'open') continue
        acc.margin += s.margin
        if (mark) acc.pnl += slicePnl(p, s, mark)
      }
      return acc
    },
    { margin: 0, pnl: 0 },
  )
  const maxN = maxSlicesFor(notional)

  return (
    <main className="app">
      <div className="wrap">
        {marketErr && <div className="note err" style={{ marginBottom: 16 }}>Could not load Hyperliquid markets: {marketErr}</div>}
        {err && <div className="note err" style={{ marginBottom: 16 }}>{err}</div>}
        <div className="mode-bar">
          <div className="seg mode-seg">
            <button className={paper ? 'on-paper' : ''} onClick={() => setMode('paper')} disabled={running}>Paper</button>
            <button className={!paper ? 'on-live' : ''} onClick={() => setMode('live')} disabled={running}>Live</button>
          </div>
          <span className="muted" style={{ fontSize: 13 }}>
            {paper
              ? 'Practice with live Hyperliquid prices and a simulated $1M balance. No wallet, no real orders.'
              : 'Real orders on Hyperliquid mainnet with real funds.'}
          </span>
        </div>
        <div className="app-grid">
          {/* Order form */}
          <div>
            <div className="panel">
              <div className="panel-title">New hidden position</div>
              <div className="field">
                <label>Market <span className="mono">{asset ? px(asset.markPx) : '…'}</span></label>
                <select className="input" value={coin} onChange={(e) => setCoin(e.target.value)}>
                  {markets.slice(0, 40).map((m) => (
                    <option key={m.name} value={m.name}>{m.name}-PERP · up to {m.maxLeverage}x</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <div className="seg">
                  <button className={isLong ? 'on-long' : ''} onClick={() => setIsLong(true)}>Long</button>
                  <button className={!isLong ? 'on-short' : ''} onClick={() => setIsLong(false)}>Short</button>
                </div>
              </div>
              <div className="field">
                <label>Position size (USD) <span>limit {usd(maxUsd, 0)}</span></label>
                <input className="input mono" type="number" min={LIMITS.minSliceUsd} max={maxUsd} value={notional} onChange={(e) => setNotional(Number(e.target.value) || 0)} />
              </div>
              <div className="field">
                <label>Leverage <b>{leverage}x</b></label>
                <input type="range" min={1} max={asset?.maxLeverage ?? 20} value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Slices <b>{Math.min(slices, maxN)}</b></label>
                <input type="range" min={1} max={Math.max(1, maxN)} value={Math.min(slices, maxN)} onChange={(e) => setSlices(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Liquidation spread <b>±{Math.round(band * 100)}%</b></label>
                <input type="range" min={0} max={0.6} step={0.05} value={band} onChange={(e) => setBand(Number(e.target.value))} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Random gap between slices <b>up to {delayMax}s</b></label>
                <input type="range" min={15} max={600} step={15} value={delayMax} onChange={(e) => setDelayMax(Number(e.target.value))} />
              </div>
            </div>

            {paper && (
              <div className="panel">
                <div className="panel-title">
                  Paper account
                  <span className="tag soon">Simulated</span>
                </div>
                <div className="stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="stat"><div className="k">Free balance</div><div className="v">{usd(book.balance)}</div></div>
                  <div className="stat"><div className="k">In positions</div><div className="v">{usd(paperOpen.margin)}</div></div>
                  <div className="stat"><div className="k">Unrealized PnL</div><div className={`v ${paperOpen.pnl >= 0 ? 'ok' : 'danger'}`}>{usd(paperOpen.pnl)}</div></div>
                  <div className="stat"><div className="k">Equity</div><div className="v">{usd(book.balance + paperOpen.margin + paperOpen.pnl)}</div></div>
                </div>
                <label className="row" style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={skipWaits} onChange={(e) => setSkipWaits(e.target.checked)} /> Skip the random waits between slices
                </label>
                <div className="row" style={{ marginTop: 14 }}>
                  <button
                    className="btn btn-sm"
                    disabled={running}
                    onClick={() => window.confirm(`Reset the paper account to ${usd(PAPER_START_BALANCE, 0)} and clear all paper positions?`) && setBook(resetPaper())}
                  >
                    Reset paper account
                  </button>
                </div>
                <p className="muted" style={{ fontSize: 12.5, margin: '14px 0 0' }}>
                  Fills walk Hyperliquid's live order book, and slices liquidate if the price crosses them. Saved in this browser only.
                </p>
              </div>
            )}

            {!paper && <div className="panel">
              <div className="panel-title">
                Slice accounts
                {accounts && <span className="tag">{used} in use</span>}
              </div>
              {!wallet.address ? (
                <>
                  <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Connect a wallet to create your slice accounts.</p>
                  <button className="btn btn-primary" onClick={wallet.connect} disabled={wallet.connecting}>Connect wallet</button>
                  {wallet.error && <div className="note err" style={{ marginTop: 12 }}>{wallet.error}</div>}
                </>
              ) : !accounts ? (
                <>
                  <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
                    Sign one message to create your accounts. It's free, sends no transaction, and the same wallet always rebuilds the same accounts.
                  </p>
                  <button className="btn btn-primary" onClick={derive} disabled={busy === 'derive'}>
                    {busy === 'derive' ? 'Waiting for signature…' : 'Create slice accounts'}
                  </button>
                </>
              ) : (
                <>
                  {deriveNote && <div className="note err" style={{ marginBottom: 12 }}>{deriveNote}</div>}
                  <div style={{ display: 'grid', gap: 10 }}>
                    {plan?.slices.map((s) => {
                      const a = accounts[s.index]
                      const have = balance(a.address)
                      const need = needFor(s)
                      const link = links?.find((l) => l.slice === s.index)
                      return (
                        <div key={a.address} style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                          <div className="row" style={{ fontSize: 13 }}>
                            <span className={`dot ${have >= need ? 'ok' : have > 0 ? 'mid' : ''}`} />
                            <span className="mono" title={a.address} style={{ cursor: 'copy' }} onClick={() => navigator.clipboard?.writeText(a.address)}>
                              {s.index + 1}. {short(a.address)}
                            </span>
                            <span className="spacer" />
                            <span className="mono muted">{usd(have)} / {usd(need)}</span>
                          </div>
                          <div className="row" style={{ marginTop: 6 }}>
                            {link && <span className={`tag ${link.level === 'linked' ? 'soon' : ''}`} title={link.reason}>{link.level}</span>}
                            <span className="spacer" />
                            <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(a.address)}>Copy address</button>
                            {have < need && (
                              <button className="btn btn-sm" disabled={busy === a.address} onClick={() => fundFromWallet(a.address, need - have)}>
                                {busy === a.address ? 'Sign in wallet…' : 'Send from wallet'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="note" style={{ marginTop: 14 }}>
                    Fund each address with USDC on Hyperliquid. "Send from wallet" is the easy way, but it publicly links that slice to you. Funding from separate sources keeps them unlinked.
                  </div>
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn btn-sm" onClick={runLinkCheck} disabled={busy === 'links'}>{busy === 'links' ? 'Checking…' : 'Check linkability'}</button>
                    <button className="btn btn-sm" onClick={refreshStates}>Refresh balances</button>
                  </div>
                </>
              )}
            </div>}
          </div>

          {/* Preview, execution, positions */}
          <div>
            <div className="panel">
              <div className="panel-title">
                Plan preview
                <button className="btn btn-sm" onClick={() => setSeed((s) => s + 1)} disabled={running}>Reshuffle</button>
              </div>
              {!plan ? (
                <p className="muted">Loading live prices…</p>
              ) : (
                <>
                  <div className="stats">
                    <div className="stat"><div className="k">Total</div><div className="v">{usd(plan.totalNotional)}</div></div>
                    <div className="stat"><div className="k">Margin</div><div className="v">{usd(plan.totalMargin)}</div></div>
                    <div className="stat"><div className="k">Liq range</div><div className="v">{px(plan.liqLow)}–{px(plan.liqHigh).replace('$', '')}</div></div>
                    <div className="stat"><div className="k">Fees · time</div><div className="v">{usd(plan.feesUsd)} · {Math.ceil(plan.totalDurationSec / 60)}m</div></div>
                  </div>
                  <LadderChart
                    refPx={plan.refPx}
                    single={plan.singleLiqPx}
                    liqs={plan.slices.map((s) => ({ px: s.liqPx, weight: s.notional }))}
                    height={130}
                  />
                  <p className="muted" style={{ fontSize: 13, margin: '6px 0 16px' }}>
                    As one account this would liquidate at exactly <span className="danger mono">{px(plan.singleLiqPx)}</span>. Split, liquidation is spread from{' '}
                    <span className="accent mono">{px(plan.liqLow)}</span> to <span className="accent mono">{px(plan.liqHigh)}</span>.
                  </p>
                  <div className="scroll-x">
                    <table className="tracker">
                      <thead>
                        <tr><th>Slice</th><th className="r">Size</th><th className="r">Notional</th><th className="r">Margin</th><th className="r">Lev</th><th className="r">Liq</th><th className="r">Opens</th><th className="r">Status</th></tr>
                      </thead>
                      <tbody>
                        {plan.slices.map((s) => {
                          const r = runs[s.index]
                          return (
                            <tr key={s.index}>
                              <td>{s.index + 1}</td>
                              <td className="r">{s.size} {coin}</td>
                              <td className="r">{usd(s.notional)}</td>
                              <td className="r">{usd(s.margin)}</td>
                              <td className="r">{(s.notional / s.margin).toFixed(1)}x</td>
                              <td className="r">{px(s.liqPx)}</td>
                              <td className="r">{s.delay ? `+${s.delay}s` : 'first'}</td>
                              <td className={`r ${r?.state === 'open' ? 'ok' : r?.state === 'failed' ? 'danger' : 'muted'}`} title={r?.error}>{r?.state ?? '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {plan.warnings.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      {plan.warnings.map((w) => <div key={w} className={`note ${blocking.includes(w) ? 'err' : 'warn'}`}>{w}</div>)}
                    </div>
                  )}
                  <div className="row" style={{ marginTop: 16 }}>
                    {running ? (
                      <button className="btn btn-danger" onClick={() => abort.current?.abort()}>Stop opening slices</button>
                    ) : (
                      <button className="btn btn-primary btn-lg" disabled={!canRun} onClick={() => (paper ? execute() : setConfirming(true))}>
                        {paper ? `Paper trade ${plan.slices.length} slices` : `Open ${plan.slices.length} slices`}
                      </button>
                    )}
                    <span className="muted" style={{ fontSize: 13 }}>
                      {paper ? (paperShort ? `Needs ${usd(paperCost)}; paper balance is ${usd(book.balance)}.` : blocking.length ? 'Fix the issues above.' : running ? (skipWaits ? 'Filling against the live book…' : 'Opening on a random schedule. Keep this tab open.') : 'Simulated against the live order book. Nothing is sent.') : !wallet.address ? 'Connect a wallet to continue.' : !accounts ? 'Create your slice accounts first.' : unfunded.length ? `${unfunded.length} slice account${unfunded.length > 1 ? 's need' : ' needs'} funding.` : blocking.length ? 'Fix the issues above.' : running ? 'Opening on a random schedule. Keep this tab open.' : 'Ready. Real orders on Hyperliquid mainnet.'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {plan && (
              <div className="panel">
                <div className="panel-title">What trackers will see</div>
                <TrackerView plan={plan} addresses={accounts?.map((a) => a.address)} />
              </div>
            )}

            <div className="panel">
              <div className="panel-title">{paper ? 'Paper positions' : 'Open positions'}</div>
              {paper ? (
                book.positions.length === 0 ? (
                  <p className="muted" style={{ margin: 0, fontSize: 14 }}>No paper positions yet. Plan a split and paper trade it.</p>
                ) : (
                  <div className="scroll-x">
                    <table className="tracker">
                      <thead>
                        <tr><th>Market</th><th className="r">Slices</th><th className="r">Size</th><th className="r">Entry</th><th className="r">Margin</th><th className="r">PnL</th><th className="r">Liq range</th><th /></tr>
                      </thead>
                      <tbody>
                        {book.positions.map((p) => {
                          const open = p.slices.filter((x) => x.state === 'open')
                          const size = open.reduce((a, x) => a + x.size, 0)
                          const entry = size ? open.reduce((a, x) => a + x.entryPx * x.size, 0) / size : 0
                          const mark = Number(mids[p.coin])
                          const pnl = p.slices.reduce((a, x) => a + (mark ? slicePnl(p, x, mark) : 0), 0)
                          const liqs = open.map((x) => x.liqPx)
                          const lost = p.slices.length - open.length
                          return (
                            <tr key={p.id}>
                              <td className={p.isLong ? 'ok' : 'danger'}>{p.isLong ? 'Long' : 'Short'} {p.coin}</td>
                              <td className="r">{open.length}{lost ? <span className="danger"> (+{lost} liq)</span> : ''}</td>
                              <td className="r">{size.toPrecision(4)}</td>
                              <td className="r">{entry ? px(entry) : '—'}</td>
                              <td className="r">{usd(open.reduce((a, x) => a + x.margin, 0))}</td>
                              <td className={`r ${pnl >= 0 ? 'ok' : 'danger'}`}>{usd(pnl)}</td>
                              <td className="r">{liqs.length ? `${px(Math.min(...liqs))}–${px(Math.max(...liqs)).replace('$', '')}` : '—'}</td>
                              <td className="r"><button className="btn btn-sm btn-danger" disabled={busy === 'close' || (running && p === book.positions[0])} onClick={() => closePaper(p)}>Close all</button></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : !accounts ? (
                <p className="muted" style={{ margin: 0, fontSize: 14 }}>Create your slice accounts to see positions.</p>
              ) : positions.length === 0 ? (
                <p className="muted" style={{ margin: 0, fontSize: 14 }}>No open positions in your slice accounts.</p>
              ) : (
                <div className="scroll-x">
                  <table className="tracker">
                    <thead>
                      <tr><th>Market</th><th className="r">Slices</th><th className="r">Size</th><th className="r">Value</th><th className="r">Margin</th><th className="r">PnL</th><th className="r">Liq range</th><th /></tr>
                    </thead>
                    <tbody>
                      {positions.map(([c, g]) => {
                        const a = markets.find((m) => m.name === c)
                        return (
                          <tr key={c}>
                            <td className={g.size > 0 ? 'ok' : 'danger'}>{g.size > 0 ? 'Long' : 'Short'} {c}</td>
                            <td className="r">{g.count}</td>
                            <td className="r">{Math.abs(g.size).toPrecision(4)}</td>
                            <td className="r">{usd(g.value)}</td>
                            <td className="r">{usd(g.margin)}</td>
                            <td className={`r ${g.pnl >= 0 ? 'ok' : 'danger'}`}>{usd(g.pnl)}</td>
                            <td className="r">{g.liqs.length ? `${px(Math.min(...g.liqs))}–${px(Math.max(...g.liqs)).replace('$', '')}` : '—'}</td>
                            <td className="r">{a && <button className="btn btn-sm btn-danger" disabled={busy === 'close'} onClick={() => closeCoin(a)}>Close all</button>}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {paper && book.history.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Paper history</div>
                  <div className="scroll-x">
                    <table className="tracker">
                      <tbody>
                        {book.history.slice(0, 8).map((p) => {
                          const pnl = p.slices.reduce((a, x) => a + (x.pnl ?? 0), 0) - p.fees
                          const liq = p.slices.filter((x) => x.state === 'liquidated').length
                          return (
                            <tr key={p.id}>
                              <td>{p.isLong ? 'Long' : 'Short'} {p.coin}</td>
                              <td className="r muted">{p.slices.length} slices{liq ? `, ${liq} liquidated` : ''}</td>
                              <td className={`r ${pnl >= 0 ? 'ok' : 'danger'}`}>{usd(pnl)} net</td>
                              <td className="r muted">{new Date(p.closedAt ?? p.openedAt).toLocaleString()}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {log.length > 0 && (
                <div className="log" style={{ marginTop: 16 }}>
                  {log.map((e, i) => (
                    <div key={i} className={e.level === 'error' ? 'danger' : e.level === 'ok' ? 'ok' : 'muted'}>
                      {new Date(e.at).toLocaleTimeString()} {e.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirming && plan && (
        <div className="modal-bg" onClick={() => setConfirming(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Open on Hyperliquid mainnet?</h3>
            <p className="muted" style={{ fontSize: 14 }}>
              {isLong ? 'Long' : 'Short'} {plan.totalSize.toPrecision(4)} {coin} ({usd(plan.totalNotional)}) across {plan.slices.length} accounts, with {usd(plan.totalMargin)} margin and about {usd(plan.feesUsd)} in fees.
              Slices open over about {Math.ceil(plan.totalDurationSec / 60)} minutes. Keep this tab open until they finish.
            </p>
            <div className="note warn">These are real market orders with real funds. Entropy is early, unaudited software.</div>
            <div className="row" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={execute}>Open position</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
