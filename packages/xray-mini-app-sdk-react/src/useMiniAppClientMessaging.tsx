import { useCallback, useEffect, useRef, useState } from "react"
import {
  createMiniAppClientMessenger,
  type HostMessage,
  type ClientMessagePayload,
  type ClientMessageType,
} from "xray-mini-app-sdk"

import { type UseMiniAppClientMessagingResult } from "./types.js"

/**
 * Hook for mini apps running inside the iframe. It hides the shared messenger connection manager
 * and exposes a minimal API tailored for components.
 */
export function useMiniAppClientMessaging(onMessage: (message: HostMessage) => void): UseMiniAppClientMessagingResult {
  const onMessageRef = useRef(onMessage)
  const messengerRef = useRef<ReturnType<typeof createMiniAppClientMessenger> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Store latest callback in a ref so we do not recreate messenger handlers unnecessarily.
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  // Lazily create the client messenger on mount and dispose it automatically during cleanup.
  useEffect(() => {
    if (typeof window === "undefined") return

    const messenger = createMiniAppClientMessenger()
    messenger.setConnectionStateHandler((connected) => {
      setIsConnected(connected)
    })
    messenger.setMessageHandler((message) => {
      setIsConnected(true)
      onMessageRef.current?.(message)
    })
    messenger.connect()
    messengerRef.current = messenger
    setIsConnected(messenger.isConnected())

    return () => {
      messenger.setMessageHandler(null)
      messenger.setConnectionStateHandler(null)
      messenger.disconnect()
      messengerRef.current = null
      setIsConnected(false)
    }
  }, [])

  const sendMessage = useCallback(<T extends ClientMessageType>(type: T, payload?: ClientMessagePayload<T>) => {
    messengerRef.current?.send(type, payload)
  }, [])

  return { sendMessage, isConnected }
}
