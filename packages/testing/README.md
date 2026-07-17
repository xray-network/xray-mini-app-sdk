# xray-mini-app-testing

Mock host and client for testing XRAY Mini App integrations **without an iframe** — works in jsdom (vitest/jest) and real browsers.

## Installation

```bash
yarn add -D xray-mini-app-testing
```

## Testing a mini app (client side)

`createMockHost()` registers itself as the client SDK's host window, records every outgoing client message, and answers requests from canned state:

```ts
import { createMockHost } from "xray-mini-app-testing"
import { miniAppClient } from "xray-mini-app-client"

const host = createMockHost({ state: { network: "mainnet" } })

const network = await miniAppClient.getNetwork()
expect(network?.payload).toBe("mainnet")
expect(host.sent.map((m) => m.type)).toContain("xray.client.getNetwork")

// Push an unsolicited host event
host.emit("xray.host.theme", "dark")

host.destroy() // restore normal parent-window resolution
```

Options: `state` (overrides merged over `defaultMockHostState`, including a `cip30` section), `autoRespond: false` (record requests but never answer — for timeout tests), and `target` (window to dispatch events on).

## Testing a host app (host side)

`createMockClient()` returns a fake iframe window. Pass it to host SDK helpers as the `iframe` argument; use `send()` to emit client messages and `received`/`waitFor()` to observe host responses:

```ts
import { createMockClient } from "xray-mini-app-testing"
import { miniAppHost } from "xray-mini-app-host"

const client = createMockClient()

miniAppHost.listen(client.clientWindow, "xray.client.getTip", ({ requestId }) => {
  miniAppHost.sendTip(client.clientWindow, someTip, requestId)
})

client.send("xray.client.getTip", null)
const tip = await client.waitFor("xray.host.tip")
```

## License

MIT © XRAY/Network
