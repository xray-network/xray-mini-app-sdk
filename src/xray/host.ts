import type {
  HostHandshakePayload,
  HostAccountStatePayload,
  HostTipPayload,
  HostNetworkPayload,
  HostThemePayload,
  HostCurrencyPayload,
  HostHideBalancesPayload,
  HostExplorerPayload,
  HostRouteChangedPayload,
  HostTxSubmittedPayload,
  ClientMessagePayloadMap,
  ClientMessage,
} from "./types"

const sendMessage = (iframe: Window | null | undefined, type: string, payload: any, requestId: string) => {
  if (!iframe) return
  iframe.postMessage({ type, payload, requestId }, "*")
}

export const sendHandshake = (iframe: Window | null | undefined, payload: HostHandshakePayload, requestId: string) => {
  sendMessage(iframe, "xray.host.handshake", payload, requestId)
}

export const sendTip = (iframe: Window | null | undefined, payload: HostTipPayload, requestId: string) => {
  sendMessage(iframe, "xray.host.tip", payload, requestId)
}

export const sendAccountState = (
  iframe: Window | null | undefined,
  payload: HostAccountStatePayload,
  requestId: string
) => {
  sendMessage(iframe, "xray.host.accountState", payload, requestId)
}

export const sendNetwork = (iframe: Window | null | undefined, payload: HostNetworkPayload, requestId: string) => {
  sendMessage(iframe, "xray.host.network", payload, requestId)
}

export const sendTheme = (iframe: Window | null | undefined, payload: HostThemePayload, requestId: string) => {
  sendMessage(iframe, "xray.host.theme", payload, requestId)
}

export const sendCurrency = (iframe: Window | null | undefined, payload: HostCurrencyPayload, requestId: string) => {
  sendMessage(iframe, "xray.host.currency", payload, requestId)
}

export const sendHideBalances = (
  iframe: Window | null | undefined,
  payload: HostHideBalancesPayload,
  requestId: string
) => {
  sendMessage(iframe, "xray.host.hideBalances", payload, requestId)
}

export const sendExplorer = (iframe: Window | null | undefined, payload: HostExplorerPayload, requestId: string) => {
  sendMessage(iframe, "xray.host.explorer", payload, requestId)
}

export const sendRouteChanged = (
  iframe: Window | null | undefined,
  payload: HostRouteChangedPayload,
  requestId: string
) => {
  sendMessage(iframe, "xray.host.routeChanged", payload, requestId)
}

export const sendTxSubmitted = (
  iframe: Window | null | undefined,
  payload: HostTxSubmittedPayload,
  requestId: string
) => {
  sendMessage(iframe, "xray.host.txSubmitted", payload, requestId)
}

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
