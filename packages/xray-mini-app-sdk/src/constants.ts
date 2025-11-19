import type { HostMessageType, ClientMessageType } from "./types.js"

export const HOST_MESSAGE_TYPES = [
  "host:initialData",
  "host:tipUpdated",
  "host:accountStateUpdated",
  "host:networkChanged",
  "host:themeChanged",
  "host:hideBalanceChanged",
  "host:explorerChanged",
  "host:signResponse",
  "host:submitResponse",
  "host:signAndSubmitResponse",
] as const

export const CLIENT_MESSAGE_TYPES = [
  "client:urlChanged",
  "client:signRequest",
  "client:submitRequest",
  "client:signAndSubmitRequest",
] as const

export const HOST_ALLOWED_MESSAGE_TYPES = new Set<string>([...HOST_MESSAGE_TYPES])
export const CLIENT_ALLOWED_MESSAGE_TYPES = new Set<string>([...CLIENT_MESSAGE_TYPES])

export const MINI_APP_SDK_FLAG = "__miniAppSdk"
export const CHANNEL_REQUEST = "requestPort"
export const CHANNEL_TRANSFER = "transferPort"
