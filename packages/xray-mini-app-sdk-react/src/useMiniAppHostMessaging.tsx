import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import {
  createMiniAppHostMessenger,
  type ClientMessage,
  type HostMessagePayload,
  type HostMessageType,
} from "xray-mini-app-sdk"

import { type UseMiniAppHostMessagingResult } from "./types.js"

/**
 * Hook for host applications. It provides a stable `sendMessage` helper and wires host messenger lifecycle
 * to the iframe ref passed from the caller.
 */
export function useMiniAppHostMessaging(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  onMessage: (message: ClientMessage) => void
): UseMiniAppHostMessagingResult {
  const onMessageRef = useRef(onMessage)
  const messengerRef = useRef<ReturnType<typeof createMiniAppHostMessenger> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Always keep the latest callback so the messenger handler stays stable.
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  // Create / destroy the host messenger whenever the iframe handle changes.
  useEffect(() => {
    if (typeof window === "undefined") return
    const iframe = iframeRef.current
    if (!iframe) {
      setIsConnected(false)
      return
    }

    const messenger = createMiniAppHostMessenger(() => iframe.contentWindow ?? null)
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
  }, [iframeRef, iframeRef.current])

  const sendMessage = useCallback(<T extends HostMessageType>(type: T, payload?: HostMessagePayload<T>) => {
    messengerRef.current?.send(type, payload)
  }, [])

  return { sendMessage, isConnected }
}
