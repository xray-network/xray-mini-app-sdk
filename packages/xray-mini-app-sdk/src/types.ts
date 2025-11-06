import { HOST_MESSAGE_TYPES, CLIENT_MESSAGE_TYPES } from "./constants"

type Network = "mainnet" | "preprod" | "preview"
type Explorer = "cardanoscan" | "cexplorer" | "adastat"
type Theme = "light" | "dark"
type SerializableRecord = Record<string, unknown>

export type HostHandshakePayload = {
  network: Network
  theme: Theme
  hideBalances: boolean
  explorer: Explorer
}

export type HostTipUpdatedPayload = SerializableRecord

export type HostAccountStateUpdatedPayload = {
  paymentAddress: string
  stakingAddress: string | null
  state: SerializableRecord | null
  delegation: SerializableRecord | null
}

export type HostThemeChangedPayload = {
  theme: "light" | "dark"
}

export type HostNetworkChangedPayload = {
  network: Network
}

export type HostHideBalanceChangedPayload = {
  hideBalances: boolean
}

export type HostExplorerChangedPayload = {
  explorer: Explorer
}

export type HostTxResponsePayload = {
  status: "success" | "error"
  signedTxCbor?: string
  txHash?: string
  errorMessage?: string
}

export type HostMessagePayloadMap = {
  "host:handshake": HostHandshakePayload
  "host:tipUpdated": HostTipUpdatedPayload
  "host:accountStateUpdated": HostAccountStateUpdatedPayload
  "host:networkChanged": HostNetworkChangedPayload
  "host:themeChanged": HostThemeChangedPayload
  "host:hideBalanceChanged": HostHideBalanceChangedPayload
  "host:explorerChanged": HostExplorerChangedPayload
  "host:signResponse": HostTxResponsePayload
  "host:submitResponse": HostTxResponsePayload
  "host:signAndSubmitResponse": HostTxResponsePayload
}

export type ClientNavigationUrlChangedPayload = {
  url: string
}

export type ClientTxSignRequestPayload = {
  unsignedTxCbor: string
}

export type ClientTxSubmitRequestPayload = {
  signedTxCbor: string
}

export type ClientTxSignAndSubmitRequestPayload = {
  unsignedTxCbor: string
}

export type ClientMessagePayloadMap = {
  "client:handshake": undefined
  "client:urlChanged": ClientNavigationUrlChangedPayload
  "client:signRequest": ClientTxSignRequestPayload
  "client:submitRequest": ClientTxSubmitRequestPayload
  "client:signAndSubmitRequest": ClientTxSignAndSubmitRequestPayload
}

export type HostMessagePayload<T extends HostMessageType> = HostMessagePayloadMap[T]
export type ClientMessagePayload<T extends ClientMessageType> = ClientMessagePayloadMap[T]

export interface MiniAppHostMessenger {
  connect: () => void
  disconnect: () => void
  send: <T extends HostMessageType>(type: T, payload?: HostMessagePayload<T>) => boolean
  setMessageHandler: (handler: ((message: ClientMessage) => void) | null) => void
  isConnected: () => boolean
}

export interface MiniAppClientMessenger {
  connect: () => void
  disconnect: () => void
  send: <T extends ClientMessageType>(type: T, payload?: ClientMessagePayload<T>) => boolean
  setMessageHandler: (handler: ((message: HostMessage) => void) | null) => void
  isConnected: () => boolean
}

export type HostMessageType = (typeof HOST_MESSAGE_TYPES)[number]
export type ClientMessageType = (typeof CLIENT_MESSAGE_TYPES)[number]

export type ClientMessage<T extends ClientMessageType = ClientMessageType> = {
  type: T
  id?: string
  payload?: ClientMessagePayload<T>
}

export type HostMessage<T extends HostMessageType = HostMessageType> = {
  type: T
  id?: string
  payload?: HostMessagePayload<T>
}

export interface UseMiniAppHostMessagingResult {
  sendMessage: <T extends HostMessageType>(type: T, payload?: HostMessagePayload<T>) => void
}

export interface UseMiniAppClientMessagingResult {
  sendMessage: <T extends ClientMessageType>(type: T, payload?: ClientMessagePayload<T>) => void
}
