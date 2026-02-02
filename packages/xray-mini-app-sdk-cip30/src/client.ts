import type {
  ClientMessagePayloadMap,
  HostMessagePayloadMap,
  ClientUtxosPayload,
  ClientUsedAddressesPayload,
  ClientSignTxPayload,
  ClientSignDataPayload,
  ClientSubmitTxPayload,
} from "./types"

export const version: string = "0.1.0"
export const name: string = "xrayIframeConnector"
export const icon: string = ""
export const supportedExtensions: { [key: string]: number }[] = [{ cip: 30 }]

/**
 * Resolve the embedding window (likely the host iframe). Returns null when the
 * mini-app is top-level or running in a non-browser environment.
 */
const getParentWindow = () => {
  if (typeof window === "undefined") return null
  if (!window.parent || window.parent === window) return null
  return window.parent
}

/**
 * Generate a request correlation id, preferring `crypto.randomUUID` when
 * available to minimize collision risk across concurrent calls.
 */
const getRequestId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * Post a message to the host window and (optionally) resolve when a correlated
 * response arrives. A timeout rejects to avoid hanging the caller.
 */
const sendMessageAsync = async <
  RequestType extends keyof ClientMessagePayloadMap,
  ResponseType extends keyof HostMessagePayloadMap,
>(
  requestType: RequestType,
  payload: ClientMessagePayloadMap[RequestType],
  responseType: ResponseType,
  requestId: string = getRequestId(),
  timeout: number = 600_000
): Promise<HostMessagePayloadMap[ResponseType]> => {
  const parentWindow = getParentWindow()
  if (!parentWindow) throw new Error("No parent window found")

  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== parentWindow) return
      const { type, payload: responsePayload, requestId: responseId } = event.data ?? {}
      if (responseId !== requestId || type !== responseType) return
      window.removeEventListener("message", handleMessage)
      clearTimeout(timer)
      resolve(responsePayload)
    }
    const timer = setTimeout(() => {
      window.removeEventListener("message", handleMessage)
      reject(new Error(`Timeout waiting for response to ${requestType}. Request ID: ${requestId}`))
      console.log(`MiniAppSDKTimeout: ${requestType} :: ${timeout}ms :: ${requestId}`)
    }, timeout)
    window.addEventListener("message", handleMessage)
    parentWindow.postMessage({ type: requestType, payload, requestId }, "*")
  })
}

export const isEnabled = async () => {
  return await sendMessageAsync<"xray.cip30.client.handshake", "xray.cip30.host.handshake">(
    "xray.cip30.client.handshake",
    null,
    "xray.cip30.host.handshake",
    undefined,
    1_000
  )
}

export const enable = async () => {
  const enabled = await isEnabled()
  if (!enabled) {
    throw new Error("XRAY CIP-30 extension not enabled in host wallet")
  }
  return {
    experemental,
    getExtensions,
    getNetworkId,
    getUtxos,
    getCollateral,
    getBalance,
    getUsedAddresses,
    getUnusedAddresses,
    getChangeAddress,
    getRewardAddresses,
    signTx,
    signData,
    submitTx,
  }
}

const experemental = {}

const getExtensions = async () => {
  return await sendMessageAsync<"xray.cip30.client.getExtensions", "xray.cip30.host.extensions">(
    "xray.cip30.client.getExtensions",
    null,
    "xray.cip30.host.extensions"
  )
}

const getNetworkId = async () => {
  return await sendMessageAsync<"xray.cip30.client.getNetworkId", "xray.cip30.host.networkId">(
    "xray.cip30.client.getNetworkId",
    null,
    "xray.cip30.host.networkId"
  )
}

const getUtxos = async (amount?: ClientUtxosPayload["amount"], paginate?: ClientUtxosPayload["paginate"]) => {
  return await sendMessageAsync<"xray.cip30.client.getUtxos", "xray.cip30.host.utxos">(
    "xray.cip30.client.getUtxos",
    { amount, paginate },
    "xray.cip30.host.utxos"
  )
}

const getCollateral = async () => {
  return await sendMessageAsync<"xray.cip30.client.getCollateral", "xray.cip30.host.collateral">(
    "xray.cip30.client.getCollateral",
    null,
    "xray.cip30.host.collateral"
  )
}

const getBalance = async () => {
  return await sendMessageAsync<"xray.cip30.client.getBalance", "xray.cip30.host.balance">(
    "xray.cip30.client.getBalance",
    null,
    "xray.cip30.host.balance"
  )
}

const getUsedAddresses = async (paginate?: ClientUsedAddressesPayload["paginate"]) => {
  return await sendMessageAsync<"xray.cip30.client.getUsedAddresses", "xray.cip30.host.usedAddresses">(
    "xray.cip30.client.getUsedAddresses",
    { paginate },
    "xray.cip30.host.usedAddresses"
  )
}

const getUnusedAddresses = async () => {
  return await sendMessageAsync<"xray.cip30.client.getUnusedAddresses", "xray.cip30.host.unusedAddresses">(
    "xray.cip30.client.getUnusedAddresses",
    null,
    "xray.cip30.host.unusedAddresses"
  )
}

const getChangeAddress = async () => {
  return await sendMessageAsync<"xray.cip30.client.getChangeAddress", "xray.cip30.host.changeAddress">(
    "xray.cip30.client.getChangeAddress",
    null,
    "xray.cip30.host.changeAddress"
  )
}

const getRewardAddresses = async () => {
  return await sendMessageAsync<"xray.cip30.client.getRewardAddresses", "xray.cip30.host.rewardAddresses">(
    "xray.cip30.client.getRewardAddresses",
    null,
    "xray.cip30.host.rewardAddresses"
  )
}

const signTx = async (tx: ClientSignTxPayload["tx"], partialSign: ClientSignTxPayload["partialSign"] = false) => {
  return await sendMessageAsync<"xray.cip30.client.signTx", "xray.cip30.host.signTx">(
    "xray.cip30.client.signTx",
    { tx, partialSign },
    "xray.cip30.host.signTx"
  )
}

const signData = async (address: ClientSignDataPayload["address"], data: ClientSignDataPayload["data"]) => {
  return await sendMessageAsync<"xray.cip30.client.signData", "xray.cip30.host.signData">(
    "xray.cip30.client.signData",
    { address, data },
    "xray.cip30.host.signData"
  )
}

const submitTx = async (tx: ClientSubmitTxPayload) => {
  return await sendMessageAsync<"xray.cip30.client.submitTx", "xray.cip30.host.submitTx">(
    "xray.cip30.client.submitTx",
    tx,
    "xray.cip30.host.submitTx"
  )
}
