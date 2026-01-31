import type { ClientMessagePayloadMap, HostMessage, HostMessagePayloadMap } from "./types"

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
 * response arrives. A timeout returns null to avoid hanging the caller.
 */
const sendMessageAsync = async <
  RequestType extends keyof ClientMessagePayloadMap,
  ResponseType extends keyof HostMessagePayloadMap,
>(
  requestType: RequestType,
  payload: ClientMessagePayloadMap[RequestType],
  responseType: ResponseType,
  timeout: number,
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

/**
 * Initiate handshake with the host mini-app container. Returns host info.
 */
export const sendHandshake = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.handshake", "xray.host.handshake">(
    "xray.client.handshake",
    null,
    "xray.host.handshake",
    (timeout = 1_000),
    requestId
  )
}

/**
 * Ask the host wallet for the latest chain tip. Returns block metadata or null
 * when the host did not respond in time.
 */
export const getTip = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getTip", "xray.host.tip">(
    "xray.client.getTip",
    null,
    "xray.host.tip",
    (timeout = 1_000),
    requestId
  )
}

/**
 * Fetch the wallet's current account state (UTxOs, balance, delegation).
 */
export const getAccountState = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getAccountState", "xray.host.accountState">(
    "xray.client.getAccountState",
    null,
    "xray.host.accountState",
    (timeout = 1_000),
    requestId
  )
}

/** Resolve which Cardano network the host is connected to. */
export const getNetwork = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getNetwork", "xray.host.network">(
    "xray.client.getNetwork",
    null,
    "xray.host.network",
    (timeout = 1_000),
    requestId
  )
}

/** Retrieve the host's active theme so the mini-app can mirror UI styling. */
export const getTheme = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getTheme", "xray.host.theme">(
    "xray.client.getTheme",
    null,
    "xray.host.theme",
    (timeout = 1_000),
    requestId
  )
}

/** Retrieve the user's preferred display currency (usd, eur, etc.). */
export const getCurrency = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getCurrency", "xray.host.currency">(
    "xray.client.getCurrency",
    null,
    "xray.host.currency",
    (timeout = 1_000),
    requestId
  )
}

/** Determine whether balances should be hidden for privacy. */
export const getHideBalances = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getHideBalances", "xray.host.hideBalances">(
    "xray.client.getHideBalances",
    null,
    "xray.host.hideBalances",
    (timeout = 1_000),
    requestId
  )
}

/** Discover which explorer base URL the host prefers the app to link to. */
export const getExplorer = async (requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.getExplorer", "xray.host.explorer">(
    "xray.client.getExplorer",
    null,
    "xray.host.explorer",
    (timeout = 1_000),
    requestId
  )
}

/**
 * Inform the host that the mini-app navigated to a new route. Fire-and-forget.
 */
export const routeChanged = async (newRoute: string, requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.routeChanged", "xray.host.routeChanged">(
    "xray.client.routeChanged",
    newRoute,
    "xray.host.routeChanged",
    (timeout = 1_000),
    requestId,
    false
  )
}

/**
 * Request the host to sign a transaction. Returns signed tx cbor hex or null on timeout.
 */
export const signTx = async (txCborHex: string, requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.signTx", "xray.host.signTx">(
    "xray.client.signTx",
    txCborHex,
    "xray.host.signTx",
    (timeout = 600_000),
    requestId
  )
}

/**
 * Request the host to submit a transaction. Returns tx hash or null on timeout.
 */
export const submitTx = async (txCborHex: string, requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.submitTx", "xray.host.submitTx">(
    "xray.client.submitTx",
    txCborHex,
    "xray.host.submitTx",
    (timeout = 600_000),
    requestId
  )
}

/**
 * Request the host to sign and submit a transaction. Returns hash or null on timeout.
 */
export const signAndSubmitTx = async (txCborHex: string, requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.submitTx", "xray.host.submitTx">(
    "xray.client.submitTx",
    txCborHex,
    "xray.host.submitTx",
    (timeout = 600_000),
    requestId
  )
}

/**
 * Request the host to sign arbitrary data using a specific address. Caller is
 * responsible for encoding data as hex/base64 per host expectations.
 */
export const signData = async (address: string, data: string, requestId?: string, timeout?: number) => {
  return await sendMessageAsync<"xray.client.signData", "xray.host.signData">(
    "xray.client.signData",
    { address, data },
    "xray.host.signData",
    (timeout = 600_000),
    requestId
  )
}

/**
 * Subscribe to a specific host message. Returns an unsubscribe function to
 * simplify lifecycle management in SPA frameworks.
 */
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

/**
 * Listen for any host message regardless of type. Handy for debugging or when
 * the consumer implements its own dispatching logic.
 */
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
