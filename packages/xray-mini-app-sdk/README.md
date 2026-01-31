# XRAY Mini App SDK

Utilities for messaging between an embedded XRAY mini app (the iframe) and the XRAY host page (the parent window). The SDK wraps `window.postMessage`, adds request/response correlation via `requestId`, and ships type-safe payloads for common wallet operations.

## Installation

```bash
yarn add xray-mini-app-sdk
# or
npm install xray-mini-app-sdk
```

Bundled output lives in `dist/` (ESM) and includes both runtime code and emitted `.d.ts` typings.

## How It Works

- The mini app runs inside an iframe and uses `miniAppClient.*` helpers to talk to the parent window.
- The host page calls `miniAppHost.*` helpers to respond or push events back into the iframe.
- Every message is tagged with a `requestId` so responses can be matched even when multiple requests are inflight.
- Helpers accept an optional `timeout` (ms). If no matching response arrives before the timeout, the Promise resolves to `null`.

## Quick Start (Mini App)

```ts
import { miniAppClient } from "xray-mini-app-sdk"

// Confirm the host is listening
await miniAppClient.sendHandshake()

// Ask for wallet context
const tip = await miniAppClient.getTip()
const account = await miniAppClient.getAccountState()

// Submit a transaction (CBOR hex string)
const submission = await miniAppClient.submitTx(cborHex)

// React to host-pushed updates
const unsubscribe = miniAppClient.listen("xray.host.network", ({ payload }) => {
  console.log("Network changed to", payload)
})
```

## Quick Start (Host Page)

```ts
import { miniAppHost } from "xray-mini-app-sdk"

const iframe = document.querySelector("iframe")?.contentWindow

// Receive client requests
const stop = miniAppHost.listen(iframe, "xray.client.getTip", ({ requestId }) => {
  miniAppHost.sendTip(iframe, currentTip, requestId)
})

// Push an event to the mini app
miniAppHost.sendTheme(iframe, "dark", "theme-req-1")
```

## API Surface

### Client (iframe) → Host

- `sendHandshake()` — verify host presence.
- `getTip()` — fetch current chain tip.
- `getAccountState()` — wallet UTxOs, balance, delegation.
- `getNetwork()` — `"mainnet" | "preprod" | "preview"`.
- `getTheme()` — `"light" | "dark"`.
- `getCurrency()` — `"usd" | "eur" | "gbp" | "jpy" | "cny"`.
- `getHideBalances()` — `boolean` privacy flag.
- `getExplorer()` — `"cardanoscan" | "cexplorer" | "adastat" | "xray"`.
- `routeChanged(newRoute)` — notify host of navigation (fire-and-forget).
- `signTx(txCborHex)` — host returns `{ success, hash }` for signature-only flows.
- `submitTx(txCborHex)` — host submits transaction; response includes `{ success, hash }`.
- `signAndSubmitTx(txCborHex)` — host signs, submits, returns `{ success, hash }`.
- `signData(address, data)` — request signature for arbitrary data.
- `listen(type, handler)` — subscribe to a specific host message.
- `listenAll(handler)` — receive all host messages.

### Host → Client (iframe)

- `sendHandshake(iframe, payload, requestId)`
- `sendTip(iframe, payload, requestId)`
- `sendAccountState(iframe, payload, requestId)`
- `sendNetwork(iframe, payload, requestId)`
- `sendTheme(iframe, payload, requestId)`
- `sendCurrency(iframe, payload, requestId)`
- `sendHideBalances(iframe, payload, requestId)`
- `sendExplorer(iframe, payload, requestId)`
- `sendRouteChanged(iframe, payload, requestId)`
- `sendSignTx(iframe, payload, requestId)`
- `sendSubmitTx(iframe, payload, requestId)`
- `sendSignAndSubmitTx(iframe, payload, requestId)`
- `sendSignData(iframe, payload, requestId)`
- `listen(iframe, type, handler)` — subscribe to a specific client message.
- `listenAll(iframe, handler)` — receive all client messages.

## Message Flow Example

1. Mini app calls `submitTx(txCborHex)`. SDK generates `requestId` and posts `{ type: "xray.client.submitTx", payload: txCborHex, requestId }`.
2. Host receives the message via `miniAppHost.listen`, submits the transaction, then calls `sendSubmitTx(iframe, { success: true, hash }, requestId)`.
3. Client Promise resolves with the host response. If the host never responds before the timeout, the Promise resolves to `null` so the app can show a retry/failed state.

## Tips & Notes

- Always capture and reuse the provided `requestId` when replying from the host so the client can correlate the response.
- For long-running operations (e.g., `submitTx`, `signData`), consider setting a higher `timeout` in client calls.
- `listen`/`listenAll` return an unsubscribe function—invoke it when unmounting React/Vue components to avoid leaking listeners.
- The SDK is ESM-only (`type: "module"`). Use native ESM in Node or a bundler that supports it.

## Development

```bash
cd packages/xray-mini-app-sdk
yarn build   # emits dist/index.js and dist/types.js
```

## License

MIT © XRAY/Network
