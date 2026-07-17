import { miniAppHost } from "@xray-network/mini-app-sdk/host"
import type {
  HostThemePayload,
  HostNetworkPayload,
  HostTipPayload,
  HostAccountStatePayload,
} from "@xray-network/mini-app-sdk"
import "./style.css"

const MINI_APP_URL = new URLSearchParams(location.search).get("miniapp") ?? "http://localhost:5174"

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
    <iframe id="mini-app" data-testid="mini-app" src="${MINI_APP_URL}" title="Mini app"></iframe>
    <section>
      <h2>Message log</h2>
      <ul id="log" data-testid="host-log"></ul>
    </section>
  </main>
`

const iframeElement = document.querySelector<HTMLIFrameElement>("#mini-app")!
const logElement = document.querySelector<HTMLUListElement>("#log")!
const themeLabel = document.querySelector<HTMLSpanElement>("#theme-label")!

const iframe = () => iframeElement.contentWindow

const stringify = (value: unknown) => JSON.stringify(value, (_key, val) => (typeof val === "bigint" ? `${val}n` : val))

const log = (direction: "in" | "out", type: string, payload?: unknown) => {
  const item = document.createElement("li")
  item.dataset.direction = direction
  item.textContent = `${direction === "in" ? "←" : "→"} ${type}${payload !== undefined ? ` ${stringify(payload)}` : ""}`
  logElement.prepend(item)
}

// Respond to mini app requests.
miniAppHost.listen(iframe(), "xray.client.handshake", ({ requestId }) => {
  log("in", "xray.client.handshake")
  miniAppHost.sendHandshake(iframe(), true, requestId)
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

miniAppHost.listen(iframe(), "xray.client.routeChanged", ({ payload }) => {
  log("in", "xray.client.routeChanged", payload)
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
