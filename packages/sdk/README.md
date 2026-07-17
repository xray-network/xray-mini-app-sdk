# @xray-network/mini-app-sdk

SDK for building and hosting XRAY Mini Apps — iframes talking to a host shell over `window.postMessage`, with request/response correlation via `requestId`, zod-validated payloads, and an optional CIP-30 wallet-style surface.

One package, four entry points:

| Import                               | Contents                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `@xray-network/mini-app-sdk`         | Shared protocol: message types, [zod](https://zod.dev) schemas, constants (also at `/protocol`) |
| `@xray-network/mini-app-sdk/client`  | SDK for the mini app (iframe side), incl. CIP-30 connector                                      |
| `@xray-network/mini-app-sdk/host`    | SDK for the container app (parent window side), incl. CIP-30 responders                         |
| `@xray-network/mini-app-sdk/testing` | `createMockHost()` / `createMockClient()` for tests without an iframe                           |
| `@xray-network/mini-app-sdk/react`   | React hooks for the client side (optional — requires `react` to be installed)                   |

Because everything ships in one package, a protocol change is always released to both sides atomically — client and host can never disagree on message shapes.

## Installation

```bash
yarn add @xray-network/mini-app-sdk
```

## Mini app (client side)

```ts
import { miniAppClient } from "@xray-network/mini-app-sdk/client"

await miniAppClient.sendHandshake()

const tip = await miniAppClient.getTip()
const account = await miniAppClient.getAccountState()
const submission = await miniAppClient.submitTx(cborHex)

const unsubscribe = miniAppClient.listen("xray.host.network", ({ payload }) => {
  console.log("Network changed to", payload)
})
```

Available: `sendHandshake`, getters (`getTip`, `getAccountState`, `getNetwork`, `getTheme`, `getCurrency`, `getHideBalances`, `getExplorer`), `routeChanged` (fire-and-forget), signing flows (`signTx`, `submitTx`, `signAndSubmitTx`, `signData`), and `listen`/`listenAll` (both return an unsubscribe function).

Every helper accepts an optional trailing `timeout` (ms) and resolves to `null` when the host doesn't answer in time. Getters default to 1s, signing flows to 10min.

### CIP-30 connector

```ts
import { miniAppCip30Client } from "@xray-network/mini-app-sdk/client"

const api = await miniAppCip30Client.enable()
const utxos = await api.getUtxos()
const signed = await api.signTx(cborHex, true)
```

CIP-30 calls **reject** on timeout (matching connector semantics) instead of resolving to `null`.

## Host (container side)

```ts
import { miniAppHost } from "@xray-network/mini-app-sdk/host"

const iframe = document.querySelector("iframe")?.contentWindow

// Answer client requests — always reply with the provided requestId
const stop = miniAppHost.listen(iframe, "xray.client.getTip", ({ requestId }) => {
  miniAppHost.sendTip(iframe, currentTip, requestId)
})

// Push an event to the mini app
miniAppHost.sendTheme(iframe, "dark", "theme-push-1")
```

All senders take `(iframe, payload, requestId)` and are safe no-ops when the iframe reference is missing. `miniAppCip30Host` mirrors the same API for the CIP-30 surface (`sendUtxos`, `sendBalance`, `sendSignTx`, `listen`, …).

See [`playground/host-app`](../../playground/host-app) for a complete working host.

## Protocol

```ts
import { parseMessage, clientMessageSchemas } from "@xray-network/mini-app-sdk"

window.addEventListener("message", (event) => {
  const message = parseMessage(clientMessageSchemas, event.data)
  if (!message) return // not a well-formed client message
  // message is now fully typed and runtime-validated
})
```

Every message travels as `{ type, payload, requestId }`. Schemas are the source of truth — payload types (`HostTipPayload`, `ClientSignTxPayload`, `Cip30*`, …) are inferred from them. Constants: `DEFAULT_REQUEST_TIMEOUT` (1s), `DEFAULT_INTERACTIVE_TIMEOUT` (10min), message type prefixes, `PROTOCOL_VERSION`.

## React

React is an **optional** peer dependency — only the `/react` entry needs it, other entries never import it.

```tsx
import { useMiniApp, useTheme, useTip, useSignTx } from "@xray-network/mini-app-sdk/react"

const Wallet = () => {
  const { connected, connecting } = useMiniApp()
  const theme = useTheme() // live — updates when the host pushes a change
  const { tip, refresh } = useTip()
  const { signTx, pending, result } = useSignTx()

  if (connecting) return <p>Connecting…</p>
  if (!connected) return <p>No host found</p>
  return (
    <div data-theme={theme ?? "light"}>
      <p>Tip: #{tip?.blockNo}</p>
      <button onClick={() => signTx(cborHex)} disabled={pending}>
        Sign
      </button>
      {result?.success && <p>Signed: {result.hash}</p>}
    </div>
  )
}
```

Hooks are self-contained: they share one module-level connection store, so the handshake runs once per page no matter how many components use them, and `useTheme`/`useNetwork`/`useCurrency`/`useHideBalances`/`useExplorer` stay live via host pushes. `useTip`/`useAccountState` fetch once and expose `refresh()`. `useHostMessage(type, handler)` is the raw subscription hook; `useSignTx`/`useSubmitTx`/`useSignAndSubmitTx`/`useSignData` wrap the interactive flows with `pending`/`result` state.

`<MiniAppProvider>` is **optional**. Mount it only to isolate a subtree or inject a custom store:

```tsx
import { MiniAppProvider, createMiniAppStore } from "@xray-network/mini-app-sdk/react"

// In tests: fresh store per render, wired to a mock host
const store = createMiniAppStore()
render(
  <MiniAppProvider store={store}>
    <App />
  </MiniAppProvider>
)
```

Without a provider, hooks use the shared `defaultMiniAppStore` — call `defaultMiniAppStore.reset()` between jsdom tests (e.g. in `afterEach`) to clear cached state, or avoid the singleton entirely by mounting a provider per test.

## Testing

Works in jsdom (vitest/jest) and real browsers — no iframe required.

Testing a mini app: `createMockHost()` registers itself as the client SDK's host window, records outgoing messages, and answers from canned state:

```ts
import { createMockHost } from "@xray-network/mini-app-sdk/testing"
import { miniAppClient } from "@xray-network/mini-app-sdk/client"

const host = createMockHost({ state: { network: "mainnet" } })

const network = await miniAppClient.getNetwork()
expect(network?.payload).toBe("mainnet")
expect(host.sent.map((m) => m.type)).toContain("xray.client.getNetwork")

host.emit("xray.host.theme", "dark") // push an unsolicited host event
host.destroy()
```

Options: `state` (overrides merged over `defaultMockHostState`, including a `cip30` section), `autoRespond: false` (record but never answer — for timeout tests), `target`.

Testing a host app: `createMockClient()` returns a fake iframe window — pass it to host SDK helpers as the `iframe` argument:

```ts
import { createMockClient } from "@xray-network/mini-app-sdk/testing"
import { miniAppHost } from "@xray-network/mini-app-sdk/host"

const client = createMockClient()

miniAppHost.listen(client.clientWindow, "xray.client.getTip", ({ requestId }) => {
  miniAppHost.sendTip(client.clientWindow, someTip, requestId)
})

client.send("xray.client.getTip", null)
const tip = await client.waitFor("xray.host.tip")
```

## License

MIT © XRAY/Network
