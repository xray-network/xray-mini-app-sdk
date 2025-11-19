import { useCallback, useEffect, useRef, type RefObject } from "react"
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
  onMessage: (message: ClientMessage) => void,
): UseMiniAppHostMessagingResult {
  const onMessageRef = useRef(onMessage)
  const messengerRef = useRef<ReturnType<typeof createMiniAppHostMessenger> | null>(null)

  // Always keep the latest callback so the messenger handler stays stable.
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  // Create / destroy the host messenger whenever the iframe handle changes.
  useEffect(() => {
    if (typeof window === "undefined") return
    const iframe = iframeRef.current
    if (!iframe) return

    const messenger = createMiniAppHostMessenger(() => iframe.contentWindow ?? null)
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
  }, [iframeRef, iframeRef.current])

  const sendMessage = useCallback(
    <T extends HostMessageType>(type: T, payload?: HostMessagePayload<T>) => {
      messengerRef.current?.send(type, payload)
    },
    [],
  )

  return { sendMessage }
}
