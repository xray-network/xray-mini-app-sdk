# xray-mini-app-sdk-react

React hooks and helpers that wrap `xray-mini-app-sdk` for idiomatic host/client messaging patterns.

## Installation

```sh
yarn add xray-mini-app-sdk-react
```

> React and `xray-mini-app-sdk` are peer dependencies so they are not bundled twice.

## Host usage example

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

## Client usage example

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

## Exposed hooks

- `useMiniAppHostMessaging`
- `useMiniAppClientMessaging`

Each hook wires up the underlying messenger, provides type-safe helpers, and ensures connections stay in sync with the iframe lifecycle.
