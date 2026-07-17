# xray-mini-app-host

Host SDK for container apps that **embed XRAY Mini Apps** in an iframe. Responds to client requests and pushes events into the mini app, using type-safe payloads from [`xray-mini-app-protocol`](../protocol/README.md).

## Installation

```bash
yarn add xray-mini-app-host
```

## Quick start

```ts
import { miniAppHost } from "xray-mini-app-host"

const iframe = document.querySelector("iframe")?.contentWindow

// Answer client requests — always reply with the provided requestId
const stop = miniAppHost.listen(iframe, "xray.client.getTip", ({ requestId }) => {
  miniAppHost.sendTip(iframe, currentTip, requestId)
})

// Push an event to the mini app
miniAppHost.sendTheme(iframe, "dark", "theme-push-1")
```

## API surface

- `sendHandshake` / `sendTip` / `sendAccountState` / `sendNetwork` / `sendTheme` / `sendCurrency` / `sendHideBalances` / `sendExplorer` / `sendRouteChanged` — context responses and pushes.
- `sendSignTx` / `sendSubmitTx` / `sendSignAndSubmitTx` / `sendSignData` — signing flow results.
- `listen(iframe, type, handler)` / `listenAll(iframe, handler)` — subscribe to client messages; both return an unsubscribe function.

All senders take `(iframe, payload, requestId)` and are safe no-ops when the iframe reference is missing.

## CIP-30 responders

`miniAppCip30Host` mirrors the same API for the CIP-30 surface (`sendUtxos`, `sendBalance`, `sendSignTx`, `listen`, …) so hosts can serve standard Cardano dApp connectors.

```ts
import { miniAppCip30Host } from "xray-mini-app-host"

miniAppCip30Host.listen(iframe, "xray.cip30.client.getBalance", ({ requestId }) => {
  miniAppCip30Host.sendBalance(iframe, balanceCbor, requestId)
})
```

## Reference implementation

See [`playground/host-app`](../../playground/host-app) for a complete working host.

## License

MIT © XRAY/Network
