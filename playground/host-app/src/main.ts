import { miniAppHost } from "@xray-network/mini-app-sdk/host"
import type {
  HostThemePayload,
  HostNetworkPayload,
  HostTipPayload,
  HostAccountStatePayload,
} from "@xray-network/mini-app-sdk"
import "./style.css"

// The demo mini app is not loaded automatically — the "Demo" button loads it.
const DEMO_MINI_APP_URL = "http://localhost:5174"

// Demo wallet state served to the embedded mini app.
const state = {
  theme: "light" as HostThemePayload,
  network: "preprod" as HostNetworkPayload,
  currency: "usd" as const,
  hideBalances: false,
  explorer: "cexplorer" as const,
  tip: {
    hash: "9f2c5e8a1b3d4f6a7c8e9d0b1a2c3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
    epochNo: 512,
    absSlot: 132_000_000,
    epochSlot: 220_000,
    blockNo: 10_450_000,
    blockTime: Math.floor(Date.now() / 1000),
  } satisfies HostTipPayload,
  accountState: {
    paymentAddress: "addr_test1_playground_payment_address",
    stakingAddress: "stake_test1_playground_staking_address",
    state: {
      utxos: [],
      balance: {
        value: 1_234_000_000n,
        assets: [],
      },
    },
    delegation: {
      delegation: "pool1_playground",
      rewards: 42_000_000n,
    },
  } satisfies HostAccountStatePayload,
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <header>
    <h1>XRAY Host Playground</h1>
    <div class="controls">
      <button id="theme-toggle" data-testid="theme-toggle">Toggle theme (current: <span id="theme-label">${state.theme}</span>)</button>
      <label>
        Network
        <select id="network-select" data-testid="network-select">
          <option value="preprod" selected>preprod</option>
          <option value="preview">preview</option>
          <option value="mainnet">mainnet</option>
        </select>
      </label>
    </div>
  </header>
  <main>
    <div>
      <form id="miniapp-form">
        <input id="miniapp-url" data-testid="miniapp-url" type="url" placeholder="Mini app URL" />
        <button type="submit" data-testid="miniapp-load">Load</button>
        <button type="button" id="load-demo" data-testid="load-demo">Demo</button>
      </form>
      <iframe id="mini-app" data-testid="mini-app" src="about:blank" title="Mini app"></iframe>
    </div>
    <section>
      <h2>Message log</h2>
      <ul id="log" data-testid="host-log"></ul>
    </section>
  </main>
`

const iframeElement = document.querySelector<HTMLIFrameElement>("#mini-app")!
const logElement = document.querySelector<HTMLUListElement>("#log")!
const themeLabel = document.querySelector<HTMLSpanElement>("#theme-label")!
const urlInput = document.querySelector<HTMLInputElement>("#miniapp-url")!

const iframe = () => iframeElement.contentWindow

// The mini app's route is two-way bound to the host page URL: client
// routeChanged messages become host history entries, and host URL changes
// (back/forward, or the path the page was opened on) are pushed into the mini
// app via sendRouteChanged. Everything goes through the history API — no
// page reloads. This tracker breaks the loop: each side only reacts when the
// route actually differs from what it already knows.
let miniAppRoute = "/"

// URL of the currently loaded mini app ("" when none is loaded).
let loadedUrl = ""

// The path of an entered URL is the route the mini app should open on.
const routeOf = (url: string) => {
  if (!url) return "/"
  try {
    return new URL(url).pathname
  } catch {
    return "/"
  }
}

// Mirror route changes back into the URL input, so it always shows the full
// mini app URL, current route included.
const syncUrlInput = () => {
  if (!loadedUrl) return
  try {
    urlInput.value = new URL(loadedUrl).origin + miniAppRoute
  } catch {
    // Unparsable URL — leave the input as typed.
  }
}

const stringify = (value: unknown) => JSON.stringify(value, (_key, val) => (typeof val === "bigint" ? `${val}n` : val))

const log = (direction: "in" | "out", type: string, payload?: unknown) => {
  const item = document.createElement("li")
  item.dataset.direction = direction
  item.textContent = `${direction === "in" ? "→" : "←"} ${type}${payload !== undefined ? ` ${stringify(payload)}` : ""}`
  logElement.prepend(item)
}

// Respond to mini app requests.
miniAppHost.listen(iframe(), "xray.client.handshake", ({ requestId }) => {
  log("in", "xray.client.handshake")
  miniAppHost.sendHandshake(iframe(), true, requestId)
  // If the host page was opened on a deep link, steer the freshly connected
  // mini app to that route.
  if (location.pathname !== miniAppRoute) {
    miniAppRoute = location.pathname
    syncUrlInput()
    log("out", "xray.host.routeChanged", miniAppRoute)
    miniAppHost.sendRouteChanged(iframe(), miniAppRoute, "host-route-init")
  }
})

miniAppHost.listen(iframe(), "xray.client.getTip", ({ requestId }) => {
  log("in", "xray.client.getTip")
  miniAppHost.sendTip(iframe(), state.tip, requestId)
})

miniAppHost.listen(iframe(), "xray.client.getAccountState", ({ requestId }) => {
  log("in", "xray.client.getAccountState")
  miniAppHost.sendAccountState(iframe(), state.accountState, requestId)
})

miniAppHost.listen(iframe(), "xray.client.getNetwork", ({ requestId }) => {
  log("in", "xray.client.getNetwork")
  miniAppHost.sendNetwork(iframe(), state.network, requestId)
})

miniAppHost.listen(iframe(), "xray.client.getTheme", ({ requestId }) => {
  log("in", "xray.client.getTheme")
  miniAppHost.sendTheme(iframe(), state.theme, requestId)
})

miniAppHost.listen(iframe(), "xray.client.getCurrency", ({ requestId }) => {
  log("in", "xray.client.getCurrency")
  miniAppHost.sendCurrency(iframe(), state.currency, requestId)
})

miniAppHost.listen(iframe(), "xray.client.getHideBalances", ({ requestId }) => {
  log("in", "xray.client.getHideBalances")
  miniAppHost.sendHideBalances(iframe(), state.hideBalances, requestId)
})

miniAppHost.listen(iframe(), "xray.client.getExplorer", ({ requestId }) => {
  log("in", "xray.client.getExplorer")
  miniAppHost.sendExplorer(iframe(), state.explorer, requestId)
})

// client route -> host URL: mirror mini app navigation into the browser URL
// as history entries, so back/forward walks the mini app's route history.
miniAppHost.listen(iframe(), "xray.client.routeChanged", ({ payload }) => {
  log("in", "xray.client.routeChanged", payload)
  if (payload === miniAppRoute) return
  miniAppRoute = payload
  syncUrlInput()
  history.pushState(null, "", payload)
})

// The playground auto-approves signing requests with fake hashes.
miniAppHost.listen(iframe(), "xray.client.signTx", ({ payload, requestId }) => {
  log("in", "xray.client.signTx", payload)
  miniAppHost.sendSignTx(iframe(), { success: true, hash: "f".repeat(64) }, requestId)
})

miniAppHost.listen(iframe(), "xray.client.submitTx", ({ payload, requestId }) => {
  log("in", "xray.client.submitTx", payload)
  miniAppHost.sendSubmitTx(iframe(), { success: true, hash: "0".repeat(64) }, requestId)
})

miniAppHost.listen(iframe(), "xray.client.signAndSubmitTx", ({ payload, requestId }) => {
  log("in", "xray.client.signAndSubmitTx", payload)
  miniAppHost.sendSignAndSubmitTx(iframe(), { success: true, hash: "1".repeat(64) }, requestId)
})

miniAppHost.listen(iframe(), "xray.client.signData", ({ payload, requestId }) => {
  log("in", "xray.client.signData", payload)
  miniAppHost.sendSignData(iframe(), { success: true, data: "deadbeef" }, requestId)
})

// Point the iframe at a mini app URL (empty unloads it). The iframe element
// (and thus its contentWindow proxy the listeners compare against) is reused,
// so all subscriptions keep working across navigations.
const loadMiniApp = (url: string) => {
  if (url === loadedUrl) {
    syncUrlInput()
    return
  }
  loadedUrl = url
  urlInput.value = url
  miniAppRoute = "/"
  if (url) log("out", "iframe.load", url)
  iframeElement.src = url || "about:blank"
  // Reflect the entered URL's path in the host URL: the handshake deep-link
  // push (miniAppRoute is "/", the host path is not) then steers the freshly
  // loaded mini app to that route.
  history.replaceState(null, "", routeOf(url))
}

// Load/Enter: load whatever is in the input (empty input unloads).
document.querySelector<HTMLFormElement>("#miniapp-form")!.addEventListener("submit", (event) => {
  event.preventDefault()
  loadMiniApp(urlInput.value.trim())
})

// Demo: load the demo mini app (loadMiniApp fills the input).
document.querySelector<HTMLButtonElement>("#load-demo")!.addEventListener("click", () => {
  loadMiniApp(DEMO_MINI_APP_URL)
})

// browser URL -> mini app: back/forward (and the initial path on page load,
// pushed after the handshake above) navigate the mini app to the host's path.
window.addEventListener("popstate", () => {
  const route = location.pathname
  if (route === miniAppRoute) return
  miniAppRoute = route
  syncUrlInput()
  log("out", "xray.host.routeChanged", route)
  miniAppHost.sendRouteChanged(iframe(), route, "host-route-push")
})

// Host-initiated pushes.
document.querySelector<HTMLButtonElement>("#theme-toggle")!.addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light"
  themeLabel.textContent = state.theme
  document.documentElement.dataset.theme = state.theme
  log("out", "xray.host.theme", state.theme)
  miniAppHost.sendTheme(iframe(), state.theme, "host-theme-push")
})

document.querySelector<HTMLSelectElement>("#network-select")!.addEventListener("change", (event) => {
  state.network = (event.target as HTMLSelectElement).value as HostNetworkPayload
  log("out", "xray.host.network", state.network)
  miniAppHost.sendNetwork(iframe(), state.network, "host-network-push")
})
