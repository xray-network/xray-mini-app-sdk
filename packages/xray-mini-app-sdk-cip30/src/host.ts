import type {
  HostHandshakePayload,
  HostExtensionsPayload,
  HostNetworkIdPayload,
  HostUtxosPayload,
  HostCollateralPayload,
  HostBalancePayload,
  HostUsedAddressesPayload,
  HostUnusedAddressesPayload,
  HostChangeAddressPayload,
  HostRewardAddressesPayload,
  HostSignTxPayload,
  HostSignDataPayload,
  HostSubmitTxPayload,
  ClientMessagePayloadMap,
  ClientMessage,
} from "./types"

/** Post a message to an embedded iframe. Safe no-op when the iframe reference is missing. */
const sendMessage = (iframe: Window | null | undefined, type: string, payload: any, requestId: string) => {
  if (!iframe) return
  iframe.postMessage({ type, payload, requestId }, "*")
}

/** Confirm to the mini-app that the host is reachable and ready. */
export const sendHandshake = (iframe: Window | null | undefined, payload: HostHandshakePayload, requestId: string) => {
  sendMessage(iframe, "xray.cip30.host.handshake", payload, requestId)
}

/** Provide supported CIP-30 extensions to the mini-app. */
export const sendExtensions = (
  iframe: Window | null | undefined,
  payload: HostExtensionsPayload,
  requestId: string
) => {
  sendMessage(iframe, "xray.cip30.host.extensions", payload, requestId)
}

/** Provide current network id to the mini-app. */
export const sendNetworkId = (iframe: Window | null | undefined, payload: HostNetworkIdPayload, requestId: string) => {
  sendMessage(iframe, "xray.cip30.host.networkId", payload, requestId)
}

/** Provide UTXOs to the mini-app. */
export const sendUtxos = (iframe: Window | null | undefined, payload: HostUtxosPayload, requestId: string) => {
  sendMessage(iframe, "xray.cip30.host.utxos", payload, requestId)
}

/** Provide collateral UTXOs to the mini-app. */
export const sendCollateral = (
  iframe: Window | null | undefined,
  payload: HostCollateralPayload,
  requestId: string
) => {
  sendMessage(iframe, "xray.cip30.host.collateral", payload, requestId)
}

/** Provide balance to the mini-app. */
export const sendBalance = (iframe: Window | null | undefined, payload: HostBalancePayload, requestId: string) => {
  sendMessage(iframe, "xray.cip30.host.balance", payload, requestId)
}

/** Provide used addresses to the mini-app. */
export const sendUsedAddresses = (
  iframe: Window | null | undefined,
  payload: HostUsedAddressesPayload,
  requestId: string
) => {
  sendMessage(iframe, "xray.cip30.host.usedAddresses", payload, requestId)
}

/** Provide unused addresses to the mini-app. */
export const sendUnusedAddresses = (
  iframe: Window | null | undefined,
  payload: HostUnusedAddressesPayload,
  requestId: string
) => {
  sendMessage(iframe, "xray.cip30.host.unusedAddresses", payload, requestId)
}

/** Provide change address to the mini-app. */
export const sendChangeAddress = (
  iframe: Window | null | undefined,
  payload: HostChangeAddressPayload,
  requestId: string
) => {
  sendMessage(iframe, "xray.cip30.host.changeAddress", payload, requestId)
}

/** Provide reward addresses to the mini-app. */
export const sendRewardAddresses = (
  iframe: Window | null | undefined,
  payload: HostRewardAddressesPayload,
  requestId: string
) => {
  sendMessage(iframe, "xray.cip30.host.rewardAddresses", payload, requestId)
}

/** Provide signed transaction to the mini-app. */
export const sendSignTx = (iframe: Window | null | undefined, payload: HostSignTxPayload, requestId: string) => {
  sendMessage(iframe, "xray.cip30.host.signTx", payload, requestId)
}

/** Provide signed data to the mini-app. */
export const sendSignData = (iframe: Window | null | undefined, payload: HostSignDataPayload, requestId: string) => {
  sendMessage(iframe, "xray.cip30.host.signData", payload, requestId)
}

/** Provide submitted transaction hash to the mini-app. */
export const sendSubmitTx = (iframe: Window | null | undefined, payload: HostSubmitTxPayload, requestId: string) => {
  sendMessage(iframe, "xray.cip30.host.submitTx", payload, requestId)
}

/**
 * Subscribe to a specific client-originated message. Returns an unsubscribe
 * function for easy cleanup when the embedding page is torn down.
 */
export const listen = <MessageType extends keyof ClientMessagePayloadMap>(
  iframe: Window | null | undefined,
  messageType: MessageType,
  handler: ({
    type,
    payload,
    requestId,
  }: {
    type: MessageType
    payload: ClientMessagePayloadMap[MessageType]
    requestId: string
  }) => void
) => {
  const handleMessage = (event: MessageEvent) => {
    if (event.source !== iframe) return
    const { type, payload, requestId } = event.data ?? {}
    if (type !== messageType) return
    handler({ type, payload, requestId })
  }
  if (iframe) {
    window.addEventListener("message", handleMessage)
  }
  return () => {
    window.removeEventListener("message", handleMessage)
  }
}

/** Listen for all client messages and delegate handling to caller. */
export const listenAll = (iframe: Window | null | undefined, handler: (message: ClientMessage) => void) => {
  const handleMessage = (event: MessageEvent) => {
    if (event.source !== iframe) return
    const { type, payload, requestId } = event.data ?? {}
    if (typeof type !== "string") return
    handler({ type, payload, requestId } as ClientMessage)
  }
  if (iframe) {
    window.addEventListener("message", handleMessage)
  }
  return () => {
    window.removeEventListener("message", handleMessage)
  }
}
