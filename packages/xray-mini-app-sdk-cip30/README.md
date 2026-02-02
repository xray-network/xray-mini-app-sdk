# XRAY Mini App SDK — CIP-30

Message helpers for exposing a CIP-30 compatible wallet API to XRAY mini apps. The client side runs inside the iframe and mirrors the Cardano CIP-30 surface, while the host side wires those requests to your wallet implementation using `window.postMessage` with request/response correlation.

## Installation

```bash
yarn add xray-mini-app-sdk-cip30
# or
npm install xray-mini-app-sdk-cip30
```

Bundled output lives in `dist/` (ESM) and ships runtime code plus emitted `.d.ts` typings.

## How It Works

- The mini app iframe calls `miniAppCip30Client.*` (CIP-30 shaped methods) to talk to the embedding page.
- The host page responds via `miniAppCip30Host.*`, echoing the provided `requestId` so the client can pair responses with in-flight requests.
- `enable()` first checks `isEnabled()` (handshake). If the host wallet is not registered, it throws.
- Each request waits for a matching response event; if none arrives before the default timeout (10 minutes for signing/submission, 1s for handshake), the Promise rejects.

## Quick Start (Mini App)

```ts
import { miniAppCip30Client } from "xray-mini-app-sdk-cip30"

// Ask the host wallet to expose CIP-30
const wallet = await miniAppCip30Client.enable()

// Read-only calls
const networkId = await wallet.getNetworkId()          // 0 = testnet, 1 = mainnet
const utxos = await wallet.getUtxos()                  // can pass { amount, paginate }
const balance = await wallet.getBalance()

// Signing & submission
const signed = await wallet.signTx(txCborHex)          // can pass partialSign = true as 2nd arg
const hash = await wallet.submitTx(txCborHex)

// Extensions
const extensions = await wallet.getExtensions()        // supported CIP-30 extensions
```

## Quick Start (Host Page)

```ts
import { miniAppCip30Host } from "xray-mini-app-sdk-cip30"

const iframe = document.querySelector("iframe")?.contentWindow

// Respond to client requests
const stop = miniAppCip30Host.listen(iframe, "xray.cip30.client.getNetworkId", ({ requestId }) => {
  miniAppCip30Host.sendNetworkId(iframe, 1, requestId) // 1 = mainnet
})

// Push data for other routes as needed
miniAppCip30Host.listen(iframe, "xray.cip30.client.getBalance", ({ requestId }) => {
  miniAppCip30Host.sendBalance(iframe, "12345678", requestId)
})
```

## API Surface

### Client (iframe) → Host wallet

- `isEnabled()` — lightweight handshake; resolves `boolean`.
- `enable()` — throws if the host wallet is unavailable; returns CIP-30 method bundle below.
- `getExtensions()` — array of supported extensions `{ cip: 30 }`.
- `getNetworkId()` — `0 | 1`.
- `getUtxos(amount?, paginate?)` — optional `{ amount, paginate: { page, limit } }`.
- `getCollateral()` — collateral UTxOs or `null`.
- `getBalance()` — Lovelace balance string.
- `getUsedAddresses(paginate?)` — addresses (with optional pagination).
- `getUnusedAddresses()` — array of bech32 strings.
- `getChangeAddress()` — bech32 change address.
- `getRewardAddresses()` — staking reward addresses.
- `signTx(tx, partialSign?)` — returns signed tx CBOR hex.
- `signData(address, data)` — returns `{ key, signature }`.
- `submitTx(tx)` — returns submitted transaction hash.

### Host → Client (iframe)

- `sendHandshake(iframe, payload, requestId)`
- `sendExtensions(iframe, payload, requestId)`
- `sendNetworkId(iframe, payload, requestId)`
- `sendUtxos(iframe, payload, requestId)`
- `sendCollateral(iframe, payload, requestId)`
- `sendBalance(iframe, payload, requestId)`
- `sendUsedAddresses(iframe, payload, requestId)`
- `sendUnusedAddresses(iframe, payload, requestId)`
- `sendChangeAddress(iframe, payload, requestId)`
- `sendRewardAddresses(iframe, payload, requestId)`
- `sendSignTx(iframe, payload, requestId)`
- `sendSignData(iframe, payload, requestId)`
- `sendSubmitTx(iframe, payload, requestId)`
- `listen(iframe, type, handler)` — subscribe to a specific client message.
- `listenAll(iframe, handler)` — receive all client messages.

## Message Flow Example

1. Mini app calls `wallet.signTx(txCborHex)`. SDK generates a `requestId` and posts `{ type: "xray.cip30.client.signTx", payload: { tx, partialSign }, requestId }` to the parent.
2. Host receives the message via `miniAppCip30Host.listen`, performs signing, then calls `sendSignTx(iframe, signedTxHex, requestId)`.
3. Client Promise resolves with the host response. If the host never replies before the timeout, the Promise rejects so the app can show an error or retry option.

## Tips & Notes

- Keep and reuse the provided `requestId` when replying from the host to avoid mismatched responses.
- For long-running wallet actions (signing, submitting), raise the timeout in client calls if needed.
- `listen`/`listenAll` return an unsubscribe function—call it when tearing down the iframe or unmounting UI components.
- The client exports CIP-30 metadata: `name`, `icon`, `version`, and `supportedExtensions` (used by hosts that index available wallets).

## Development

```bash
cd packages/xray-mini-app-sdk-cip30
yarn build   # emits dist/index.js and dist/types.js
```

## License

MIT © XRAY/Network
