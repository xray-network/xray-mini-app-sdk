# SKILLS.md — Implementing `@xray-network/mini-app-sdk` in a React Mini App

A practical guide for building an XRAY Mini App (an iframe embedded in an XRAY host shell)
with React. The SDK talks to the host over `window.postMessage`; the React layer wraps that
in hooks with a live, cached store.

## 1. Install

```bash
yarn add @xray-network/mini-app-sdk
```

`react` (18 or 19) is an optional peer dependency — required only if you import from
`@xray-network/mini-app-sdk/react`. `zod` ships as a regular dependency.

### Subpath exports

| Import path | Use for |
| --- | --- |
| `@xray-network/mini-app-sdk` (= `/protocol`) | Message types, zod schemas, constants — shared by both sides |
| `@xray-network/mini-app-sdk/client` | Imperative client API for the mini app (iframe side) |
| `@xray-network/mini-app-sdk/host` | Host/container side (parent window) |
| `@xray-network/mini-app-sdk/testing` | `createMockHost()` / `createMockClient()` for tests without an iframe |
| `@xray-network/mini-app-sdk/react` | React hooks + optional `<MiniAppProvider>` (client side only) |

## 2. Quick start (React mini app)

No provider or setup call is required. The first hook that mounts triggers the handshake
with the host; all hooks share one module-level store.

```tsx
import { useMiniApp, useTheme, useAccountState } from "@xray-network/mini-app-sdk/react"

export const App = () => {
  const { connected, connecting } = useMiniApp()
  const theme = useTheme()
  const { accountState, refresh } = useAccountState()

  if (connecting) return <Spinner />
  if (!connected) return <p>Open this app inside the XRAY wallet.</p>

  return (
    <div data-theme={theme ?? "light"}>
      <p>Address: {accountState?.paymentAddress}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}
```

Connection semantics: `connected` is `null` while the handshake is in flight, then
`true`/`false`. The handshake is memoized — mounting many hooks never sends it twice.

## 3. Hook reference

All value hooks return `null` until the first response arrives, then stay live: the store
listens for unsolicited host pushes (theme toggles, network switches, account updates) and
re-renders subscribers via `useSyncExternalStore`.

### Connection

- `useMiniApp()` → `{ connected: boolean | null, connecting: boolean }`

### Live host values (fetch once, kept fresh by host pushes)

- `useTheme()` → `"light" | "dark" | null`
- `useNetwork()` → `"mainnet" | "preprod" | "preview" | null`
- `useCurrency()` → `"usd" | "eur" | "gbp" | "jpy" | "cny" | null`
- `useHideBalances()` → `boolean | null` — respect this: mask balances when `true`
- `useExplorer()` → `"cardanoscan" | "cexplorer" | "adastat" | "xray" | null`

### Refreshable values

- `useTip()` → `{ tip, refresh }` — chain tip (`hash`, `epochNo`, `absSlot`, `blockNo`, `blockTime`, …)
- `useAccountState()` → `{ accountState, refresh }` — `paymentAddress`, `stakingAddress`,
  UTxOs, balance, delegation. **Balances and quantities are `bigint`** (`value: 1_000_000_000n`
  = 1000 ADA in lovelace); don't `JSON.stringify` them without a replacer.

### Interactive requests (open host UI, wait for the user)

Each returns `{ execute-alias, pending, result, reset }`. `result` is `null` until
resolved — and stays `null` on timeout, so treat `null` after `pending` as "no answer",
not success or failure.

- `useSignTx()` → `signTx(txCborHex)` → `{ success, hash } | null`
- `useSubmitTx()` → `submitTx(txCborHex)` → `{ success: true, hash } | { success: false, error } | null`
- `useSignAndSubmitTx()` → `signAndSubmitTx(txCborHex)` → same shape as submit
- `useSignData()` → `signData(address, data)` → `{ success: true, data } | { success: false, error } | null`

```tsx
const { signAndSubmitTx, pending, result, reset } = useSignAndSubmitTx()

const onPay = async () => {
  const outcome = await signAndSubmitTx(txCborHex)
  if (!outcome) toast("Host did not respond")
  else if (outcome.success) toast(`Submitted: ${outcome.hash}`)
  else toast(`Rejected: ${outcome.error}`)
}
```

### Raw host messages

- `useHostMessage(type, handler)` — subscribe to any `xray.host.*` message for the
  component's lifetime. The handler lives in a ref, so re-renders never resubscribe and it
  is safe to pass an inline closure.

```tsx
useHostMessage("xray.host.routeChanged", (route) => navigate(route))
```

## 4. Route sync

Navigation is bidirectional:

- Mini app → host: call `miniAppClient.routeChanged(path)` (fire-and-forget) whenever your
  router navigates, so the host can update its URL/breadcrumbs.
- Host → mini app: listen with `useHostMessage("xray.host.routeChanged", …)` and drive your
  router.

```tsx
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router"
import { miniAppClient } from "@xray-network/mini-app-sdk/client"
import { useHostMessage } from "@xray-network/mini-app-sdk/react"

export const RouteSync = () => {
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    void miniAppClient.routeChanged(location.pathname + location.search)
  }, [location])
  useHostMessage("xray.host.routeChanged", (route) => navigate(route))
  return null
}
```

Guard against echo loops: skip `navigate(route)` if `route` already equals the current path.

## 5. Dropping below the hooks

For logic outside components (loaders, services, non-React code), use the imperative client:

```ts
import { miniAppClient } from "@xray-network/mini-app-sdk/client"

const tip = await miniAppClient.getTip()          // { payload } | null on timeout
const unsub = miniAppClient.listen("xray.host.theme", ({ payload }) => { … })
```

Every request resolves to `null` on timeout instead of throwing (defaults:
`DEFAULT_REQUEST_TIMEOUT` for reads, `DEFAULT_INTERACTIVE_TIMEOUT` for signing — both
exported from the protocol). Note: values fetched this way bypass the React store cache;
prefer hooks inside components.

There is also a CIP-30 style connector (`miniAppCip30Client` from `/client`) whose
`enable()` returns a standard CIP-30 API object (`getUtxos`, `getBalance`, `signTx`, …) —
use it when integrating libraries that expect a CIP-30 wallet. Unlike the core client, its
calls **throw** on timeout, matching CIP-30 semantics.

## 6. `<MiniAppProvider>` — when and why

Hooks work with no provider (they fall back to the shared module-level store). Mount
`MiniAppProvider` only to isolate a subtree or inject a custom store — the main use case
being tests:

```tsx
import { MiniAppProvider, createMiniAppStore } from "@xray-network/mini-app-sdk/react"

<MiniAppProvider store={createMiniAppStore()}>
  <ComponentUnderTest />
</MiniAppProvider>
```

## 7. Testing without an iframe

`createMockHost()` registers a fake host window, answers every request from canned state,
and records outgoing messages:

```tsx
import { createMockHost } from "@xray-network/mini-app-sdk/testing"
import { MiniAppProvider, createMiniAppStore } from "@xray-network/mini-app-sdk/react"
import { render, screen } from "@testing-library/react"

test("renders balance", async () => {
  const host = createMockHost({ state: { theme: "dark", network: "mainnet" } })
  render(
    <MiniAppProvider store={createMiniAppStore()}>
      <App />
    </MiniAppProvider>
  )
  expect(await screen.findByText(/addr1_mock_payment_address/)).toBeInTheDocument()
  expect(host.sent.map((m) => m.type)).toContain("xray.client.handshake")
  host.destroy()
})
```

- Always use a fresh `createMiniAppStore()` per test — the default store caches the
  handshake and values across tests.
- `host.emit("xray.host.theme", "dark")` simulates unsolicited pushes.
- `createMockHost({ autoRespond: false })` records requests but never answers — for
  timeout paths.
- `host.state` is mutable; edit it mid-test to change later responses.

## 8. Gotchas checklist

- **Build target is ESM-only** with subpath `exports`; use a modern bundler (Vite, etc.).
- **`null` means "not yet / no answer"**, everywhere: hook values before the first
  response, request results after a timeout, and `connected` during the handshake. Design
  loading states around it.
- **`bigint` in account state** — lovelace values and asset quantities are `bigint`.
- **Standalone mode**: opened outside an iframe (`window.parent === window`) there is no
  host window; every request resolves `null` and `connected` becomes `false` after the
  handshake times out. Render a "open inside XRAY" fallback rather than crashing.
- **SSR**: `getHostWindow()` returns `null` without a `window`, and hooks only touch the
  host in effects, so server rendering is safe — values are just `null` on first paint.
- **Host pushes reuse response message types** (`xray.host.theme` is both the `getTheme`
  response and the push on toggle), so `useHostMessage` handlers also fire for solicited
  responses — usually what you want.
- **Route echo loops** — see §4.

## 9. Host side in React (brief)

If you're embedding mini apps in a React host app, use `miniAppHost` from
`@xray-network/mini-app-sdk/host`: `listen(iframeWindow, type, handler)` for each
`xray.client.*` request and reply with the matching `send*` function, echoing the
`requestId` you received. Push state changes (theme, network, account) proactively with
the same `send*` functions. See [playground/host-app](playground/host-app/) for a complete
working responder, and `miniAppCip30Host` for the CIP-30 surface.
