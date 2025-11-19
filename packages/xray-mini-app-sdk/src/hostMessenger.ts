import { MINI_APP_SDK_FLAG, CHANNEL_TRANSFER, CHANNEL_REQUEST } from "./constants.js"
import { isRecord, isMiniAppSdkEvent, isClientMessageType, isHostMessageType } from "./utils.js"
import type { ClientMessage, HostMessage, HostMessageType, HostMessagePayload, MiniAppHostMessenger } from "./types.js"

/**
 * Creates a messenger that lives inside the host application (the page that embeds the mini app).
 * The host waits for the mini app to request a MessageChannel, transfers one across,
 * and uses that channel to send HostMessage objects.
 *
 * @param getTargetWindow - Returns the window that receives messages (usually the iframe contentWindow)
 */
export const createMiniAppHostMessenger = (getTargetWindow: () => Window | null): MiniAppHostMessenger => {
  let port: MessagePort | null = null
  let connected = false
  let messageHandler: ((message: ClientMessage) => void) | null = null
  let connectionStateHandler: ((connected: boolean) => void) | null = null
  let handshakeListenerAttached = false

  const updateConnectedState = (state: boolean) => {
    if (connected === state) return
    connected = state
    connectionStateHandler?.(connected)
  }

  /** Closes the existing MessagePort and resets connection state. */
  const cleanupPort = () => {
    if (!port) return
    port.onmessage = null
    try {
      port.close()
    } catch {
      // Ignore failures when closing an already closed port
    }
    port = null
    updateConnectedState(false)
  }

  /** Pushes incoming client messages to the handler once the channel is established. */
  const handlePortMessage = (event: MessageEvent<ClientMessage>) => {
    const data = event.data
    if (!isRecord(data)) return
    const { type, payload } = data
    if (typeof type !== "string") return
    if (!isClientMessageType(type)) return
    updateConnectedState(true)
    messageHandler?.({ type, payload } as ClientMessage<typeof type>)
  }

  /**
   * Establishes a brand-new MessageChannel with the mini app.
   * Port1 stays with the host, Port2 is transferred to the client iframe.
   */
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
      updateConnectedState(true)
    } catch (error) {
      cleanupPort()
      throw error
    }
  }

  /**
   * Responds to channel requests originating from the mini app by setting up a channel.
   * The host only honors requests coming from the provided target window.
   */
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

  /**
   * Sends a host message to the mini app over the active port.
   * Returns true when the message was queued, false when no connection exists or the type is invalid.
   */
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

  const setConnectionStateHandler = (handler: ((connected: boolean) => void) | null) => {
    connectionStateHandler = handler
    if (handler) {
      handler(connected)
    }
  }

  const isConnected = () => connected

  return {
    connect,
    disconnect,
    send,
    setMessageHandler,
    setConnectionStateHandler,
    isConnected,
  }
}
