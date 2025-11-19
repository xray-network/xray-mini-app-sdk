import { useCallback, useEffect, useRef } from "react"
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

  // Store latest callback in a ref so we do not recreate messenger handlers unnecessarily.
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  // Lazily create the client messenger on mount and dispose it automatically during cleanup.
  useEffect(() => {
    if (typeof window === "undefined") return

    const messenger = createMiniAppClientMessenger()
    messenger.setMessageHandler((message) => {
      onMessageRef.current?.(message)
    })
    messenger.connect()
    messengerRef.current = messenger

    return () => {
      messenger.setMessageHandler(null)
      messenger.disconnect()
      messengerRef.current = null
    }
  }, [])

  const sendMessage = useCallback(<T extends ClientMessageType>(type: T, payload?: ClientMessagePayload<T>) => {
    messengerRef.current?.send(type, payload)
  }, [])

  return { sendMessage }
}
