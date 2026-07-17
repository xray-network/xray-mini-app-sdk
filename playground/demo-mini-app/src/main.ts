import { miniAppClient } from "@xray-network/mini-app-sdk/client"
import "./style.css"

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <h1>Demo Mini App</h1>
  <dl>
    <dt>Handshake</dt>
    <dd id="handshake" data-testid="handshake">pending…</dd>
    <dt>Network</dt>
    <dd id="network" data-testid="network">–</dd>
    <dt>Theme</dt>
    <dd id="theme" data-testid="theme">–</dd>
    <dt>Tip</dt>
    <dd id="tip" data-testid="tip">–</dd>
    <dt>Balance (lovelace)</dt>
    <dd id="balance" data-testid="balance">–</dd>
  </dl>
  <div class="actions">
    <button id="sign-tx" data-testid="sign-tx">Sign demo tx</button>
    <button id="sign-data" data-testid="sign-data">Sign demo data</button>
  </div>
  <p id="action-result" data-testid="action-result"></p>
`

const el = (id: string) => document.querySelector<HTMLElement>(`#${id}`)!

const applyTheme = (theme: string) => {
  document.documentElement.dataset.theme = theme
  el("theme").textContent = theme
}

const bootstrap = async () => {
  const handshake = await miniAppClient.sendHandshake()
  el("handshake").textContent = handshake?.payload ? "connected" : "no host"
  if (!handshake?.payload) return

  const [tip, network, theme, accountState] = await Promise.all([
    miniAppClient.getTip(),
    miniAppClient.getNetwork(),
    miniAppClient.getTheme(),
    miniAppClient.getAccountState(),
  ])

  if (tip?.payload) el("tip").textContent = `#${tip.payload.blockNo} (${tip.payload.hash.slice(0, 16)}…)`
  if (network) el("network").textContent = network.payload
  if (theme) applyTheme(theme.payload)
  const balance = accountState?.payload?.state?.balance.value
  if (balance !== undefined) el("balance").textContent = balance.toString()

  miniAppClient.routeChanged("/")
}

// Live updates pushed by the host.
miniAppClient.listen("xray.host.theme", ({ payload }) => applyTheme(payload))
miniAppClient.listen("xray.host.network", ({ payload }) => {
  el("network").textContent = payload
})

el("sign-tx").addEventListener("click", async () => {
  el("action-result").textContent = "signing…"
  const result = await miniAppClient.signTx("84a300_demo_tx_cbor")
  el("action-result").textContent = result?.payload.success ? `signed: ${result.payload.hash}` : "sign failed"
})

el("sign-data").addEventListener("click", async () => {
  el("action-result").textContent = "signing…"
  const result = await miniAppClient.signData("addr_test1_demo", "68656c6c6f")
  el("action-result").textContent = result?.payload.success ? `signed data: ${result.payload.data}` : "sign failed"
})

bootstrap()
