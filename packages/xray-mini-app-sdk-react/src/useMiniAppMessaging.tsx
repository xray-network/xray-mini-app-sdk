import { useCallback, useEffect, useRef, type RefObject } from "react"
import {
  createMiniAppHostMessenger,
  createMiniAppClientMessenger,
  type UseMiniAppHostMessagingResult,
  type UseMiniAppClientMessagingResult,
  type HostMessage,
  type ClientMessage,
  type HostMessageType,
  type ClientMessageType,
  type HostMessagePayload,
  type ClientMessagePayload,
} from "xray-mini-app-sdk"

export * from "xray-mini-app-sdk"

export function useMiniAppHostMessaging(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  onMessage: (message: ClientMessage) => void
): UseMiniAppHostMessagingResult {
  const onMessageRef = useRef(onMessage)
  const messengerRef = useRef<ReturnType<typeof createMiniAppHostMessenger> | null>(null)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

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
      messenger.disconnect()
      messengerRef.current = null
    }
  }, [iframeRef, iframeRef.current])

  const sendMessage = useCallback(<T extends HostMessageType>(type: T, payload?: HostMessagePayload<T>) => {
    messengerRef.current?.send(type, payload)
  }, [])

  return { sendMessage }
}

export function useMiniAppClientMessaging(onMessage: (message: HostMessage) => void): UseMiniAppClientMessagingResult {
  const onMessageRef = useRef(onMessage)
  const messengerRef = useRef<ReturnType<typeof createMiniAppClientMessenger> | null>(null)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (typeof window === "undefined") return

    const messenger = createMiniAppClientMessenger()
    messenger.setMessageHandler((message) => {
      onMessageRef.current?.(message)
    })
    messenger.connect()
    messengerRef.current = messenger

    return () => {
      messenger.disconnect()
      messengerRef.current = null
    }
  }, [])

  const sendMessage = useCallback(<T extends ClientMessageType>(type: T, payload?: ClientMessagePayload<T>) => {
    messengerRef.current?.send(type, payload)
  }, [])

  return { sendMessage }
}
