# XRAY Mini App SDK Monorepo

This workspace houses two sibling packages that make it easy to integrate XRAY mini apps with a host shell:

- `xray-mini-app-sdk`: framework-agnostic messaging utilities, types, and constants for establishing a secure channel between a host iframe and a mini app.
- `xray-mini-app-sdk-react`: lightweight React hooks that wrap the core messaging layer.

## Getting Started

```bash
yarn install
yarn build
```

Key scripts:

- `yarn build` – runs `tsc` in every workspace.
- `yarn clean` – removes `dist` folders for each package (if the package defines the script).
- `yarn publish:core` / `yarn publish:react` – publishes the respective package to npm (`--access public` is pre-configured).

## Sandboxes

> Build everything first (`yarn workspaces run build`). Then run `yarn serve:core` or `yarn serve:react`, which serve
> each package folder (so both `dist` and `sandbox` are available). Open `/sandbox/host.html` in the reported URL.

### Core messaging sandbox

- Files: `packages/xray-mini-app-sdk/sandbox/host.html`, `packages/xray-mini-app-sdk/sandbox/client.html`.
- Host HTML spins up the messenger, embeds the client iframe, and exposes buttons to send handshake/theme/tip messages.
- Client HTML listens for host events and can issue URL/signature requests back to the host.

## Package Details

### `xray-mini-app-sdk`

- Location: `packages/xray-mini-app-sdk`
- Exports:
  - `createMiniAppHostMessenger(getTargetWindow)`
  - `createMiniAppClientMessenger()`
  - Typed helpers (`HostMessageType`, payload maps, etc.) plus constants and utility guards.
- Build output: `dist/index.js` + type declarations via `tsc`.

**Host usage example:**

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

### `xray-mini-app-sdk-react`

- Location: `packages/xray-mini-app-sdk-react`
- Depends on `xray-mini-app-sdk` and exposes idiomatic hooks.

**React host usage example:**

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

**React mini-app usage example:**

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

## Publishing Checklist

1. Update versions in the relevant package(s).
2. Run `yarn install` to refresh the lockfile if dependencies changed.
3. `yarn build` to verify the emitted bundles.
4. Use `yarn publish:core` or `yarn publish:react` (both commands call `yarn workspace <pkg> publish --access public`).

Both packages ship TypeScript declarations alongside ESM builds, so they work out of the box in modern bundlers. React is declared as a peer dependency for the hook package to prevent duplicate copies in consuming apps.
