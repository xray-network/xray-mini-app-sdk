import { MINI_APP_SDK_FLAG, CHANNEL_TRANSFER, CHANNEL_REQUEST, CLIENT_HANDSHAKE_TYPE } from "./constants.js"
import { isClientMessageType, isHostMessageType, isRecord, isMiniAppSdkEvent, getParentWindow } from "./utils.js"
import type {
  ClientMessage,
  ClientMessageType,
  ClientMessagePayload,
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

export const createMiniAppClientMessenger = (): MiniAppClientMessenger => {
  let port: MessagePort | null = null
  let connected = false
  let messageHandler: ((message: HostMessage) => void) | null = null
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

  const handlePortMessage = (event: MessageEvent<HostMessage>) => {
    const data = event.data
    if (!isRecord(data)) return
    const { type, payload } = data
    if (typeof type !== "string") return
    if (!isHostMessageType(type)) return
    connected = true
    messageHandler?.({ type, payload } as HostMessage<typeof type>)
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
      return
    }

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
    }
  }

  const requestPortFromHost = () => {
    const parentWindow = getParentWindow()
    if (!parentWindow) return
    parentWindow.postMessage({ [MINI_APP_SDK_FLAG]: CHANNEL_REQUEST }, "*")
  }

  const connect = () => {
    if (typeof window === "undefined") return
    if (!handshakeListenerAttached) {
      window.addEventListener("message", handlePortTransfer)
      handshakeListenerAttached = true
    }
    requestPortFromHost()
  }

  const disconnect = () => {
    if (handshakeListenerAttached && typeof window !== "undefined") {
      window.removeEventListener("message", handlePortTransfer)
      handshakeListenerAttached = false
    }
    cleanupPort()
  }

  const send = <T extends ClientMessageType>(type: T, payload?: ClientMessagePayload<T>) => {
    if (!isClientMessageType(type)) return false
    if (!port) return false
    const message = (payload === undefined ? { type } : { type, payload }) as ClientMessage<T>
    port.postMessage(message)
    return true
  }

  const setMessageHandler = (handler: ((message: HostMessage) => void) | null) => {
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
