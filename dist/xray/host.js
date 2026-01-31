const sendMessage = (iframe, type, payload, requestId) => {
  if (!iframe) return
  iframe.postMessage({ type, payload, requestId }, "*")
}
export const sendHandshake = (iframe, payload, requestId) => {
  sendMessage(iframe, "xray.host.handshake", payload, requestId)
}
export const sendTip = (iframe, payload, requestId) => {
  sendMessage(iframe, "xray.host.tip", payload, requestId)
}
export const sendAccountState = (iframe, payload, requestId) => {
  sendMessage(iframe, "xray.host.accountState", payload, requestId)
}
export const sendNetwork = (iframe, payload, requestId) => {
  sendMessage(iframe, "xray.host.network", payload, requestId)
}
export const sendTheme = (iframe, payload, requestId) => {
  sendMessage(iframe, "xray.host.theme", payload, requestId)
}
export const sendCurrency = (iframe, payload, requestId) => {
  sendMessage(iframe, "xray.host.currency", payload, requestId)
}
export const sendHideBalances = (iframe, payload, requestId) => {
  sendMessage(iframe, "xray.host.hideBalances", payload, requestId)
}
export const sendExplorer = (iframe, payload, requestId) => {
  sendMessage(iframe, "xray.host.explorer", payload, requestId)
}
export const sendRouteChanged = (iframe, payload, requestId) => {
  sendMessage(iframe, "xray.host.routeChanged", payload, requestId)
}
export const sendTxSubmitted = (iframe, payload, requestId) => {
  sendMessage(iframe, "xray.host.txSubmitted", payload, requestId)
}
export const sendSignData = (iframe, payload, requestId) => {
  sendMessage(iframe, "xray.host.signData", payload, requestId)
}
export const listen = (iframe, messageType, handler) => {
  const handleMessage = (event) => {
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
export const listenAll = (iframe, handler) => {
  const handleMessage = (event) => {
    if (event.source !== iframe) return
    const { type, payload, requestId } = event.data ?? {}
    if (typeof type !== "string") return
    handler({ type, payload, requestId })
  }
  if (iframe) {
    window.addEventListener("message", handleMessage)
  }
  return () => {
    window.removeEventListener("message", handleMessage)
  }
}
//# sourceMappingURL=host.js.map
