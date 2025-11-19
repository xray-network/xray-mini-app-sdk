import { MINI_APP_SDK_FLAG, CHANNEL_TRANSFER, CHANNEL_REQUEST, CLIENT_HANDSHAKE_TYPE, HOST_HANDSHAKE_TYPE } from "./constants.js"
import { isClientMessageType, isHostMessageType, isRecord, isMiniAppSdkEvent, getParentWindow } from "./utils.js"
import type {
  ClientMessage,
  ClientMessageType,
  ClientMessagePayload,
  ClientMessengerHandler,
  HostMessage,
  HostMessageType,
  HostMessagePayload,
  MiniAppHostMessenger,
  MiniAppClientMessenger,
} from "./types.js"

export const createMiniAppHostMessenger = (getTargetWindow: () => Window | null): MiniAppHostMessenger => {
  let port: MessagePort | null = null
  let connected = false
  let messageHandler: ((message: ClientMessage) => void) | null = null
  let handshakeListenerAttached = false

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

  const handlePortMessage = (event: MessageEvent<ClientMessage>) => {
    const data = event.data
    if (!isRecord(data)) return
    const { type, payload } = data
    if (typeof type !== "string") return
    if (!isClientMessageType(type)) return
    connected = true
    messageHandler?.({ type, payload } as ClientMessage<typeof type>)
  }

  const establishPort = () => {
    const targetWindow = getTargetWindow()
    if (!targetWindow) return

    cleanupPort()
    const channel = new MessageChannel()
    port = channel.port1
    port.onmessage = handlePortMessage
    try {
      port.start()
    } catch {
      // noop - some browsers auto-start ports when using onmessage
    }

    try {
      targetWindow.postMessage({ [MINI_APP_SDK_FLAG]: CHANNEL_TRANSFER }, "*", [channel.port2])
      port.postMessage({ type: HOST_HANDSHAKE_TYPE })
    } catch (error) {
      cleanupPort()
      throw error
    }
  }

  const handleHandshakeRequest = (event: MessageEvent) => {
    const targetWindow = getTargetWindow()
    if (!targetWindow || event.source !== targetWindow) {
      return
    }

    if (!isMiniAppSdkEvent(event.data, CHANNEL_REQUEST)) {
      return
    }

    establishPort()
  }

  const connect = () => {
    if (typeof window === "undefined") return
    if (handshakeListenerAttached) return
    window.addEventListener("message", handleHandshakeRequest)
    handshakeListenerAttached = true
  }

  const disconnect = () => {
    if (handshakeListenerAttached && typeof window !== "undefined") {
      window.removeEventListener("message", handleHandshakeRequest)
      handshakeListenerAttached = false
    }
    cleanupPort()
  }

  const send = <T extends HostMessageType>(type: T, payload?: HostMessagePayload<T>) => {
    if (!isHostMessageType(type)) return false
    if (!port) return false
    const message = (payload === undefined ? { type } : { type, payload }) as HostMessage<T>
    port.postMessage(message)
    return true
  }

  const setMessageHandler = (handler: ((message: ClientMessage) => void) | null) => {
    messageHandler = handler
  }

  const isConnected = () => connected

  return {
    connect,
    disconnect,
    send,
    setMessageHandler,
    isConnected,
  }
}

const createClientMessengerConnectionManager = () => {
  let port: MessagePort | null = null
  let connected = false
  let handshakeListenerAttached = false
  let connectionRefCount = 0
  const messageHandlers = new Map<symbol, ClientMessengerHandler>()

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

  const handlePortMessage = (event: MessageEvent<HostMessage>) => {
    const data = event.data
    if (!isRecord(data)) return
    const { type, payload } = data
    if (typeof type !== "string") return
    if (!isHostMessageType(type)) return
    connected = true
    dispatchMessage({ type, payload } as HostMessage<typeof type>)
  }

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

  const requestPortFromHost = () => {
    const parentWindow = getParentWindow()
    if (!parentWindow) return
    try {
      parentWindow.postMessage({ [MINI_APP_SDK_FLAG]: CHANNEL_REQUEST }, "*")
    } catch {
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

  const connectInstance = () => {
    if (typeof window === "undefined") return
    connectionRefCount += 1
    attachHandshakeListener()
    if (!port) {
      requestPortFromHost()
    }
  }

  const disconnectInstance = () => {
    if (connectionRefCount === 0) return
    connectionRefCount -= 1
    if (connectionRefCount === 0) {
      detachHandshakeListener()
      cleanupPort()
    }
  }

  const send = <T extends ClientMessageType>(type: T, payload?: ClientMessagePayload<T>) => {
    if (!isClientMessageType(type)) return false
    if (!port) return false
    const message = (payload === undefined ? { type } : { type, payload }) as ClientMessage<T>
    port.postMessage(message)
    return true
  }

  const setHandler = (id: symbol, handler: ClientMessengerHandler) => {
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
