import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { stringToHex, type Hex } from 'viem'

export type Eip1193 = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
  on?(event: string, fn: (...args: unknown[]) => void): void
  removeListener?(event: string, fn: (...args: unknown[]) => void): void
}

declare global {
  interface Window {
    ethereum?: Eip1193
  }
}

type Wallet = {
  provider: Eip1193 | undefined
  address: Hex | undefined
  connecting: boolean
  error: string | undefined
  connect(): Promise<void>
  disconnect(): void
  signMessage(message: string): Promise<Hex>
}

const Ctx = createContext<Wallet | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const provider = typeof window !== 'undefined' ? window.ethereum : undefined
  const [address, setAddress] = useState<Hex>()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!provider) return
    provider.request({ method: 'eth_accounts' }).then((a) => setAddress((a as Hex[])[0])).catch(() => {})
    const on = (a: unknown) => setAddress((a as Hex[])[0])
    provider.on?.('accountsChanged', on)
    return () => provider.removeListener?.('accountsChanged', on)
  }, [provider])

  const connect = useCallback(async () => {
    if (!provider) {
      setError('No wallet found. Install MetaMask or Rabby, then reload.')
      return
    }
    setConnecting(true)
    setError(undefined)
    try {
      const a = (await provider.request({ method: 'eth_requestAccounts' })) as Hex[]
      setAddress(a[0])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection rejected')
    } finally {
      setConnecting(false)
    }
  }, [provider])

  const signMessage = useCallback(
    async (message: string) => {
      if (!provider || !address) throw new Error('Connect a wallet first')
      return (await provider.request({ method: 'personal_sign', params: [stringToHex(message), address] })) as Hex
    },
    [provider, address],
  )

  return (
    <Ctx.Provider value={{ provider, address, connecting, error, connect, disconnect: () => setAddress(undefined), signMessage }}>
      {children}
    </Ctx.Provider>
  )
}

export function useWallet(): Wallet {
  const w = useContext(Ctx)
  if (!w) throw new Error('useWallet outside WalletProvider')
  return w
}

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`
