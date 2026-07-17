# xray-mini-app-client

Client SDK for XRAY Mini Apps — code that runs **inside the iframe** and talks to the host page. Wraps `window.postMessage` with request/response correlation via `requestId` and type-safe payloads from [`xray-mini-app-protocol`](../protocol/README.md).

## Installation

```bash
yarn add xray-mini-app-client
```

## Quick start

```ts
import { miniAppClient } from "xray-mini-app-client"

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

Every helper accepts an optional trailing `timeout` (ms). If no matching response arrives in time, the Promise resolves to `null` so the app can show a retry/failed state. Getters default to 1s, signing flows to 10min.

## API surface

- `sendHandshake()` — verify host presence.
- `getTip()` / `getAccountState()` / `getNetwork()` / `getTheme()` / `getCurrency()` / `getHideBalances()` / `getExplorer()` — wallet context getters.
- `routeChanged(newRoute)` — notify host of navigation (fire-and-forget).
- `signTx(txCborHex)` / `submitTx(txCborHex)` / `signAndSubmitTx(txCborHex)` / `signData(address, data)` — signing flows.
- `listen(type, handler)` / `listenAll(handler)` — subscribe to host messages; both return an unsubscribe function.

## CIP-30 connector

The package also exposes a standard Cardano dApp connector backed by the same postMessage transport:

```ts
import { miniAppCip30Client } from "xray-mini-app-client"

const api = await miniAppCip30Client.enable()
const utxos = await api.getUtxos()
const signed = await api.signTx(cborHex, true)
```

CIP-30 calls **reject** on timeout (matching connector semantics) instead of resolving to `null`.

## Testing

`setHostWindow(win)` overrides where messages are sent — used by [`xray-mini-app-testing`](../testing/README.md) to run mini app code without an iframe.

## License

MIT © XRAY/Network
