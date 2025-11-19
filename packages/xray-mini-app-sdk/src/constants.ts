import type { HostMessageType, ClientMessageType } from "./types.js"

export const HOST_MESSAGE_TYPES = [
  "tipUpdated",
  "accountStateUpdated",
  "networkChanged",
  "themeChanged",
  "currencyChanged",
  "hideBalanceChanged",
  "explorerChanged",
  "signResponse",
  "submitResponse",
  "signAndSubmitResponse",
] as const

export const CLIENT_MESSAGE_TYPES = [
  "urlChanged",
  "signRequest",
  "submitRequest",
  "signAndSubmitRequest",
] as const

export const HOST_ALLOWED_MESSAGE_TYPES = new Set<string>([...HOST_MESSAGE_TYPES])
export const CLIENT_ALLOWED_MESSAGE_TYPES = new Set<string>([...CLIENT_MESSAGE_TYPES])

export const MINI_APP_SDK_FLAG = "__miniAppSdk"
export const CHANNEL_REQUEST = "requestPort"
export const CHANNEL_TRANSFER = "transferPort"
