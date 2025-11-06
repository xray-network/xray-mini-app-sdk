import { HOST_ALLOWED_MESSAGE_TYPES, CLIENT_ALLOWED_MESSAGE_TYPES, MINI_APP_SDK_FLAG } from "./constants.js"
import type { HostMessageType, ClientMessageType } from "./types.js"

export const isHostMessageType = (value: string): value is HostMessageType => HOST_ALLOWED_MESSAGE_TYPES.has(value)
export const isClientMessageType = (value: string): value is ClientMessageType =>
  CLIENT_ALLOWED_MESSAGE_TYPES.has(value)

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

export const isMiniAppSdkEvent = (value: unknown, action: string): boolean => {
  if (!isRecord(value)) return false
  return value[MINI_APP_SDK_FLAG] === action
}

export const getParentWindow = () => {
  if (typeof window === "undefined") return null
  if (!window.parent || window.parent === window) return null
  return window.parent
}
