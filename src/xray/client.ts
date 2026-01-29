import type { ClientMessagePayloadMap, HostMessage, HostMessagePayloadMap } from "./types"

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

const sendMessageAsync = async <
  RequestType extends keyof ClientMessagePayloadMap,
  ResponseType extends keyof HostMessagePayloadMap,
>(
  requestType: RequestType,
  payload: ClientMessagePayloadMap[RequestType],
  responseType: ResponseType,
  timeout: number = 1_000,
  requestId: string = getRequestId(),
  expectResponse: boolean = true
): Promise<{ type: ResponseType; payload: HostMessagePayloadMap[ResponseType]; requestId: string } | null> => {
  const parentWindow = getParentWindow()
  if (!parentWindow) return null

  return new Promise((resolve, reject) => {
    if (expectResponse) {
      const handleMessage = (event: MessageEvent) => {
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

export const sendHandshake = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.handshake", "xray.host.handshake">(
    "xray.client.handshake",
    null,
    "xray.host.handshake",
    timeout,
    requestId
  )
}

export const getTip = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getTip", "xray.host.tip">(
    "xray.client.getTip",
    null,
    "xray.host.tip",
    timeout,
    requestId
  )
}

export const getAccountState = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getAccountState", "xray.host.accountState">(
    "xray.client.getAccountState",
    null,
    "xray.host.accountState",
    timeout,
    requestId
  )
}

export const getNetwork = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getNetwork", "xray.host.network">(
    "xray.client.getNetwork",
    null,
    "xray.host.network",
    timeout,
    requestId
  )
}

export const getTheme = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getTheme", "xray.host.theme">(
    "xray.client.getTheme",
    null,
    "xray.host.theme",
    timeout,
    requestId
  )
}

export const getCurrency = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getCurrency", "xray.host.currency">(
    "xray.client.getCurrency",
    null,
    "xray.host.currency",
    timeout,
    requestId
  )
}

export const getHideBalances = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getHideBalances", "xray.host.hideBalances">(
    "xray.client.getHideBalances",
    null,
    "xray.host.hideBalances",
    timeout,
    requestId
  )
}

export const getExplorer = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getExplorer", "xray.host.explorer">(
    "xray.client.getExplorer",
    null,
    "xray.host.explorer",
    timeout,
    requestId
  )
}

export const routeChanged = async (newRoute: string, requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.routeChanged", "xray.host.routeChanged">(
    "xray.client.routeChanged",
    newRoute,
    "xray.host.routeChanged",
    timeout,
    requestId,
    false
  )
}

export const submitTx = async (txCborHex: string, requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.submitTx", "xray.host.txSubmitted">(
    "xray.client.submitTx",
    txCborHex,
    "xray.host.txSubmitted",
    timeout,
    requestId
  )
}

export const listen = <MessageType extends keyof HostMessagePayloadMap>(
  messageType: MessageType,
  handler: ({
    type,
    payload,
    requestId,
  }: {
    type: MessageType
    payload: HostMessagePayloadMap[MessageType]
    requestId?: string
  }) => void
) => {
  const parentWindow = getParentWindow()
  const handleMessage = (event: MessageEvent) => {
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

export const listenAll = (handler: (message: HostMessage) => void) => {
  const parentWindow = getParentWindow()
  const handleMessage = (event: MessageEvent) => {
    if (event.source !== parentWindow) return
    const { type, payload, requestId } = event.data ?? {}
    if (typeof type !== "string") return
    handler({ type, payload, requestId } as HostMessage)
  }
  if (parentWindow) {
    window.addEventListener("message", handleMessage)
  }
  return () => {
    window.removeEventListener("message", handleMessage)
  }
}
