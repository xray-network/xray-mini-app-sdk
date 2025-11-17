# XRAY Mini App SDK Monorepo

This repo houses the packages that let XRAY Mini Apps talk to host shells. You get a framework-agnostic JavaScript layer plus React hooks on top.

- `xray-mini-app-sdk` – core messaging utilities, types, and constants for secure iframe communication.
- `xray-mini-app-sdk-react` – React hooks that wrap the core messenger for idiomatic host and client patterns.

---

# JavaScript Package

```sh
yarn add xray-mini-app-sdk
```
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

- Location: `packages/xray-mini-app-sdk`
- Build output: `dist/index.js` plus `.d.ts` files from `tsc`.
- Key exports:
  - `createMiniAppHostMessenger(getTargetWindow)`
  - `createMiniAppClientMessenger()`
  - Typed helpers (`HostMessageType`, payload maps, type guards, and constants).

The core sandbox (`yarn serve:core`) mirrors this flow by embedding the client HTML, wiring button actions to messenger calls, and echoing responses for easy debugging.

---

# React Package

```sh
yarn add xray-mini-app-sdk-react
```
```tsx
import { useRef } from "react"
import { useMiniAppHostMessaging } from "xray-mini-app-sdk-react"

const MiniAppHost = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const { sendMessage } = useMiniAppHostMessaging(iframeRef, (message) => {
    console.log("Client message:", message)
  })

  return (
    <iframe
      ref={iframeRef}
      src="https://mini-app.example.com"
      onLoad={() =>
        sendMessage("host:handshake", {
          network: "mainnet",
          explorer: "cardanoscan",
          theme: "light",
          hideBalances: false,
        })
      }
    />
  )
}
```

```tsx
import { useMiniAppClientMessaging } from "xray-mini-app-sdk-react"

const MiniApp = () => {
  const { sendMessage } = useMiniAppClientMessaging((message) => {
    if (message.type === "host:themeChanged") {
      console.log("Host theme:", message.payload?.theme)
    }
  })

  return <button onClick={() => sendMessage("client:urlChanged", { url: window.location.href })}>Notify host</button>
}
```

- Location: `packages/xray-mini-app-sdk-react`
- Depends on `xray-mini-app-sdk`; React is declared as a peer dependency to avoid duplicate copies.
- Exposes hooks like `useMiniAppHostMessaging` and `useMiniAppClientMessaging` that wrap the core messenger.

---

## Key scripts

- `yarn install` – install dependencies. 
- `yarn build` – runs `tsc` in every workspace.
- `yarn clean` – removes `dist` folders for each package (if the package defines the script).
- `yarn publish:core` / `yarn publish:react` – publishes the respective package to npm (`--access public` is pre-configured).


## Publishing Checklist

1. Update versions in the relevant package(s).
2. Run `yarn install` if dependencies changed to refresh the lockfile.
3. Run `yarn build` to verify the emitted bundles.
4. Publish with `yarn publish:core` or `yarn publish:react`.

Both packages ship TypeScript declarations alongside ESM builds, so they work out of the box in modern bundlers.
