# xray-mini-app-sdk

Core messaging utilities, types, and constants that let XRAY Mini Apps communicate securely with their host iframes.

## Installation

```sh
yarn add xray-mini-app-sdk
```

## Host usage example

```ts
import { createMiniAppHostMessenger } from "xray-mini-app-sdk"

const messenger = createMiniAppHostMessenger(() => iframeRef.current?.contentWindow ?? null)
messenger.setMessageHandler((message) => {
  if (message.type === "client:urlChanged") {
    console.log("Mini app navigated to", message.payload?.url)
  }
})
messenger.connect()
```

## Key exports

- `createMiniAppHostMessenger(getTargetWindow)`
- `createMiniAppClientMessenger()`
- Typed helpers (`HostMessageType`, payload maps, type guards, and constants).

## Build output

`tsc` emits `dist/index.js` alongside `.d.ts` files for every public API surface.

## Sandbox

`yarn serve:core` spins up a host/client sandbox that mirrors common flows, wires button actions to messenger calls, and echoes responses for quick debugging.
