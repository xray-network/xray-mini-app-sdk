import { HOST_MESSAGE_TYPES, CLIENT_MESSAGE_TYPES } from "./constants.js"

export type Network = "mainnet" | "preprod" | "preview"
export type Explorer = "cardanoscan" | "cexplorer" | "adastat"
export type Theme = "light" | "dark"
export type SerializableRecord = Record<string, unknown>

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

export type HostCurrencyChangedPayload = {
  currency: "usd" | "eur" | "gbp" | "jpy" | "cny" 
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
  "tipUpdated": HostTipUpdatedPayload
  "accountStateUpdated": HostAccountStateUpdatedPayload
  "networkChanged": HostNetworkChangedPayload
  "themeChanged": HostThemeChangedPayload
  "currencyChanged": HostCurrencyChangedPayload
  "hideBalanceChanged": HostHideBalanceChangedPayload
  "explorerChanged": HostExplorerChangedPayload
  "signResponse": HostTxResponsePayload
  "submitResponse": HostTxResponsePayload
  "signAndSubmitResponse": HostTxResponsePayload
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
  "urlChanged": ClientNavigationUrlChangedPayload
  "signRequest": ClientTxSignRequestPayload
  "submitRequest": ClientTxSubmitRequestPayload
  "signAndSubmitRequest": ClientTxSignAndSubmitRequestPayload
}

export type HostMessagePayload<T extends HostMessageType> = HostMessagePayloadMap[T]
export type ClientMessagePayload<T extends ClientMessageType> = ClientMessagePayloadMap[T]

export interface MiniAppHostMessenger {
  connect: () => void
  disconnect: () => void
  send: <T extends HostMessageType>(type: T, payload?: HostMessagePayload<T>) => boolean
  setMessageHandler: (handler: ((message: ClientMessage) => void) | null) => void
  setConnectionStateHandler: (handler: ((connected: boolean) => void) | null) => void
  isConnected: () => boolean
}

export interface MiniAppClientMessenger {
  connect: () => void
  disconnect: () => void
  send: <T extends ClientMessageType>(type: T, payload?: ClientMessagePayload<T>) => boolean
  setMessageHandler: (handler: ((message: HostMessage) => void) | null) => void
  setConnectionStateHandler: (handler: ((connected: boolean) => void) | null) => void
  isConnected: () => boolean
}

export type HostMessageType = (typeof HOST_MESSAGE_TYPES)[number]
export type ClientMessageType = (typeof CLIENT_MESSAGE_TYPES)[number]

type ClientMessageBase<T extends ClientMessageType> = {
  type: T
  id?: string
  payload: ClientMessagePayload<T>
}

type HostMessageBase<T extends HostMessageType> = {
  type: T
  id?: string
  payload: HostMessagePayload<T>
}

export type ClientMessage<T extends ClientMessageType = ClientMessageType> = T extends ClientMessageType
  ? ClientMessageBase<T>
  : never

export type HostMessage<T extends HostMessageType = HostMessageType> = T extends HostMessageType
  ? HostMessageBase<T>
  : never

export type ClientMessengerHandler = ((message: HostMessage) => void) | null
