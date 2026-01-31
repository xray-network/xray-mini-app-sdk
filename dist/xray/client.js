const getParentWindow = () => {
  if (typeof window === "undefined") return null
  if (!window.parent || window.parent === window) return null
  return window.parent
}
const getRequestId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
const sendMessageAsync = async (
  requestType,
  payload,
  responseType,
  timeout,
  requestId = getRequestId(),
  expectResponse = true
) => {
  const parentWindow = getParentWindow()
  if (!parentWindow) return null
  return new Promise((resolve, reject) => {
    if (expectResponse) {
      const handleMessage = (event) => {
        if (event.source !== parentWindow) return
        const { type, payload: responsePayload, requestId: responseId } = event.data ?? {}
        if (responseId !== requestId || type !== responseType) return
        window.removeEventListener("message", handleMessage)
        clearTimeout(timer)
        resolve({ type, payload: responsePayload, requestId: responseId })
      }
      const timer = setTimeout(() => {
        window.removeEventListener("message", handleMessage)
        resolve(null)
        console.log(`MiniAppSDKTimeout: ${requestType} :: ${timeout}ms :: ${requestId}`)
      }, timeout)
      window.addEventListener("message", handleMessage)
    } else {
      resolve(null)
    }
    parentWindow.postMessage({ type: requestType, payload, requestId }, "*")
  })
}
export const sendHandshake = async (requestId, timeout) => {
  return await sendMessageAsync("xray.client.handshake", null, "xray.host.handshake", (timeout = 1_000), requestId)
}
export const getTip = async (requestId, timeout) => {
  return await sendMessageAsync("xray.client.getTip", null, "xray.host.tip", (timeout = 1_000), requestId)
}
export const getAccountState = async (requestId, timeout) => {
  return await sendMessageAsync(
    "xray.client.getAccountState",
    null,
    "xray.host.accountState",
    (timeout = 1_000),
    requestId
  )
}
export const getNetwork = async (requestId, timeout) => {
  return await sendMessageAsync("xray.client.getNetwork", null, "xray.host.network", (timeout = 1_000), requestId)
}
export const getTheme = async (requestId, timeout) => {
  return await sendMessageAsync("xray.client.getTheme", null, "xray.host.theme", (timeout = 1_000), requestId)
}
export const getCurrency = async (requestId, timeout) => {
  return await sendMessageAsync("xray.client.getCurrency", null, "xray.host.currency", (timeout = 1_000), requestId)
}
export const getHideBalances = async (requestId, timeout) => {
  return await sendMessageAsync(
    "xray.client.getHideBalances",
    null,
    "xray.host.hideBalances",
    (timeout = 1_000),
    requestId
  )
}
export const getExplorer = async (requestId, timeout) => {
  return await sendMessageAsync("xray.client.getExplorer", null, "xray.host.explorer", (timeout = 1_000), requestId)
}
export const routeChanged = async (newRoute, requestId, timeout) => {
  return await sendMessageAsync(
    "xray.client.routeChanged",
    newRoute,
    "xray.host.routeChanged",
    (timeout = 1_000),
    requestId,
    false
  )
}
export const submitTx = async (txCborHex, requestId, timeout) => {
  return await sendMessageAsync(
    "xray.client.submitTx",
    txCborHex,
    "xray.host.txSubmitted",
    (timeout = 600_000),
    requestId
  )
}
export const signData = async (address, data, requestId, timeout) => {
  return await sendMessageAsync(
    "xray.client.signData",
    { address, data },
    "xray.host.signData",
    (timeout = 600_000),
    requestId
  )
}
export const listen = (messageType, handler) => {
  const parentWindow = getParentWindow()
  const handleMessage = (event) => {
    if (event.source !== parentWindow) return
    const { type, payload, requestId } = event.data ?? {}
    if (type !== messageType) return
    handler({ type, payload, requestId })
  }
  if (parentWindow) {
    window.addEventListener("message", handleMessage)
  }
  return () => {
    window.removeEventListener("message", handleMessage)
  }
}
export const listenAll = (handler) => {
  const parentWindow = getParentWindow()
  const handleMessage = (event) => {
    if (event.source !== parentWindow) return
    const { type, payload, requestId } = event.data ?? {}
    if (typeof type !== "string") return
    handler({ type, payload, requestId })
  }
  if (parentWindow) {
    window.addEventListener("message", handleMessage)
  }
  return () => {
    window.removeEventListener("message", handleMessage)
  }
}
//# sourceMappingURL=client.js.map
