# xray-mini-app-protocol

Shared message types, [zod](https://zod.dev) schemas, and constants for the XRAY Mini App SDK. Both `xray-mini-app-client` and `xray-mini-app-host` build on this package, so the two sides of the iframe boundary can never drift apart.

## Installation

```bash
yarn add xray-mini-app-protocol
```

## What's inside

- **Envelope** – every message travels as `{ type, payload, requestId }`. `parseMessage(schemas, data)` validates unknown `event.data` against a schema map and returns a typed message or `null`.
- **Core protocol** (`xray.client.*` / `xray.host.*`) – handshake, chain tip, account state, network, theme, currency, hide-balances, explorer, route changes, and sign/submit flows. Schemas in `clientMessageSchemas` / `hostMessageSchemas`, payload types inferred from them (`HostTipPayload`, `ClientSignTxPayload`, …).
- **CIP-30 protocol** (`xray.cip30.client.*` / `xray.cip30.host.*`) – the standard Cardano dApp connector surface. Schemas in `cip30ClientMessageSchemas` / `cip30HostMessageSchemas`, types prefixed with `Cip30`.
- **Constants** – `DEFAULT_REQUEST_TIMEOUT` (1s, quick getters), `DEFAULT_INTERACTIVE_TIMEOUT` (10min, signing flows), message type prefixes, and `PROTOCOL_VERSION`.

## Validating incoming messages

```ts
import { parseMessage, clientMessageSchemas } from "xray-mini-app-protocol"

window.addEventListener("message", (event) => {
  const message = parseMessage(clientMessageSchemas, event.data)
  if (!message) return // not a well-formed client message
  // message is now fully typed and runtime-validated
})
```

## License

MIT © XRAY/Network
