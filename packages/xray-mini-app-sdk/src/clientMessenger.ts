import {
  MINI_APP_SDK_FLAG,
  CHANNEL_TRANSFER,
  CHANNEL_REQUEST,
  CLIENT_HANDSHAKE_TYPE,
} from "./constants.js"
import {
  getParentWindow,
  isRecord,
  isMiniAppSdkEvent,
  isHostMessageType,
  isClientMessageType,
} from "./utils.js"
import type {
  ClientMessage,
  ClientMessagePayload,
  ClientMessageType,
  ClientMessengerHandler,
  HostMessage,
  MiniAppClientMessenger,
} from "./types.js"

/**
 * One shared connection manager keeps a single MessagePort alive and fans out
 * incoming HostMessage objects to every active client messenger instance.
 */
const createClientMessengerConnectionManager = () => {
  let port: MessagePort | null = null
  let connected = false
  let handshakeListenerAttached = false
  let connectionRefCount = 0
  const messageHandlers = new Map<symbol, ClientMessengerHandler>()

  /** Fully resets the current MessagePort. */
  const cleanupPort = () => {
    if (!port) return
    port.onmessage = null
    try {
      port.close()
    } catch {
      // Ignore failures when closing an already closed port
    }
    port = null
    connected = false
  }

  const dispatchMessage = (message: HostMessage) => {
    messageHandlers.forEach((handler) => {
      handler?.(message)
    })
  }

  /** Handles messages arriving from the host via the current port. */
  const handlePortMessage = (event: MessageEvent<HostMessage>) => {
    const data = event.data
    if (!isRecord(data)) return
    const { type, payload } = data
    if (typeof type !== "string") return
    if (!isHostMessageType(type)) return
    connected = true
    dispatchMessage({ type, payload } as HostMessage<typeof type>)
  }

  /**
   * Accepts a transferred MessagePort from the host and performs the client handshake.
   * If the host did not attach a port, another request is triggered.
   */
  const handlePortTransfer = (event: MessageEvent) => {
    const parentWindow = getParentWindow()
    if (!parentWindow || event.source !== parentWindow) {
      return
    }

    if (!isMiniAppSdkEvent(event.data, CHANNEL_TRANSFER)) {
      return
    }

    const incomingPort = event.ports?.[0]
    if (!incomingPort) {
      if (connectionRefCount > 0) {
        requestPortFromHost()
      }
      return
    }

    // All message handlers share the same port, so older connections can be safely discarded
    cleanupPort()
    port = incomingPort
    port.onmessage = handlePortMessage
    try {
      port.start()
    } catch {
      // noop - some browsers auto-start ports when using onmessage
    }
    connected = true
    try {
      port.postMessage({ type: CLIENT_HANDSHAKE_TYPE })
    } catch {
      // Ignore failures if the port rejects the handshake
      connected = false
      cleanupPort()
      if (connectionRefCount > 0) {
        requestPortFromHost()
      }
      return
    }
  }

  /** Requests that the host deliver a MessagePort via postMessage. */
  const requestPortFromHost = () => {
    const parentWindow = getParentWindow()
    if (!parentWindow) return
    try {
      parentWindow.postMessage({ [MINI_APP_SDK_FLAG]: CHANNEL_REQUEST }, "*")
    } catch {
      // Ignore failures - a follow-up request will be triggered on reconnect
    }
  }

  const attachHandshakeListener = () => {
    if (handshakeListenerAttached || typeof window === "undefined") return
    window.addEventListener("message", handlePortTransfer)
    handshakeListenerAttached = true
  }

  const detachHandshakeListener = () => {
    if (!handshakeListenerAttached || typeof window === "undefined") return
    window.removeEventListener("message", handlePortTransfer)
    handshakeListenerAttached = false
  }

  /**
   * Increments the consumer count and initiates the connection if needed.
   * Every messenger instance shares the same underlying MessagePort.
   */
  const connectInstance = () => {
    if (typeof window === "undefined") return
    connectionRefCount += 1
    attachHandshakeListener()
    if (!port) {
      requestPortFromHost()
    }
  }

  /**
   * Decrements the consumer count and tears down the connection when the last instance disconnects.
   */
  const disconnectInstance = () => {
    if (connectionRefCount === 0) return
    connectionRefCount -= 1
    if (connectionRefCount === 0) {
      detachHandshakeListener()
      cleanupPort()
    }
  }

  /**
   * Sends a client message if a port is available and the type is valid.
   */
  const send = <T extends ClientMessageType>(type: T, payload?: ClientMessagePayload<T>) => {
    if (!isClientMessageType(type)) return false
    if (!port) return false
    const message = (payload === undefined ? { type } : { type, payload }) as ClientMessage<T>
    port.postMessage(message)
    return true
  }

  /**
   * Registers or removes the callback for a specific messenger instance.
   * When handler is nullish, it removes the handler to avoid memory leaks.
   */
  const setHandler = (id: symbol, handler: ClientMessengerHandler | null) => {
    if (!handler) {
      messageHandlers.delete(id)
      return
    }
    messageHandlers.set(id, handler)
  }

  const isConnected = () => connected

  return {
    connectInstance,
    disconnectInstance,
    send,
    setHandler,
    isConnected,
  }
}

const clientMessengerConnection = createClientMessengerConnectionManager()

/**
 * Creates a messenger that runs inside the mini app iframe.
 * Many feature hooks/components can call this factory, yet they all share a single connection
 * managed by clientMessengerConnection to avoid spawning multiple ports.
 */
export const createMiniAppClientMessenger = (): MiniAppClientMessenger => {
  const handlerId = Symbol("clientMessengerHandler")
  let instanceConnected = false

  const connect = () => {
    if (instanceConnected) return
    instanceConnected = true
    clientMessengerConnection.connectInstance()
  }

  const disconnect = () => {
    if (!instanceConnected) return
    instanceConnected = false
    clientMessengerConnection.setHandler(handlerId, null)
    clientMessengerConnection.disconnectInstance()
  }

  const send = <T extends ClientMessageType>(type: T, payload?: ClientMessagePayload<T>) => {
    return clientMessengerConnection.send(type, payload)
  }

  const setMessageHandler = (handler: ((message: HostMessage) => void) | null) => {
    clientMessengerConnection.setHandler(handlerId, handler)
  }

  const isConnected = () => clientMessengerConnection.isConnected()

  return {
    connect,
    disconnect,
    send,
    setMessageHandler,
    isConnected,
  }
}
