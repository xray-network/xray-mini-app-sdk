import { HOST_MESSAGE_TYPES, CLIENT_MESSAGE_TYPES } from "./constants.js"

export type Network = "mainnet" | "preprod" | "preview"
export type Explorer = "cardanoscan" | "cexplorer" | "adastat"
export type Theme = "light" | "dark"

export type HostAccountStatePayload = {
  accountState: {
    paymentAddress: string
    stakingAddress: string | null
    state: {
      utxos: {
        transaction: {
          id: string
        }
        index: number
        address: string
        value: bigint
        assets: {
          policyId: string
          assetName: string
          quantity: bigint
          decimals?: number
        }[]
        datumHash: string | null
        datumType: "inline" | "hash" | null
        scriptHash: string | null
        datum?: string | null
        script?: {
          language: "PlutusV1" | "PlutusV2" | "PlutusV3" | "Native"
          script: string
        } | null
      }[]
      balance: {
        value: bigint
        assets: {
          policyId: string
          assetName: string
          quantity: bigint
          decimals?: number
          fingerprint: string
          assetNameAscii: string
        }[]
      }
    } | null
    delegation: {
      delegation: string | null
      rewards: bigint
    } | null
  } | null
}

export type HostTipPayload = {
  tip: {
    hash: string
    epochNo: number
    absSlot: number
    epochSlot: number
    blockNo: number
    blockTime: number
  } | null
}

export type HostNetworkPayload = {
  network: Network
}

export type HostThemePayload = {
  theme: "light" | "dark"
}

export type HostCurrencyPayload = {
  currency: "usd" | "eur" | "gbp" | "jpy" | "cny"
}

export type HostHideBalancesPayload = {
  hideBalances: boolean
}

export type HostExplorerPayload = {
  explorer: Explorer
}

export type HostRouteChangedPayload = {
  route: string
}

export type HostTxSubmittedPayload = {
  success: boolean
  hash: string
}


export type HostMessagePayloadMap = {
  "xray.host.tip": HostTipPayload
  "xray.host.accountState": HostAccountStatePayload
  "xray.host.network": HostNetworkPayload
  "xray.host.theme": HostThemePayload
  "xray.host.currency": HostCurrencyPayload
  "xray.host.hideBalances": HostHideBalancesPayload
  "xray.host.explorer": HostExplorerPayload
  "xray.host.routeChanged": HostRouteChangedPayload
  "xray.host.txSubmitted": HostTxSubmittedPayload
}

export type ClientRouteChangedPayload = {
  route: string
}

export type ClientTxSubmitPayload = {
  tx: string
}

export type ClientMessagePayloadMap = {
  "xray.client.getTip": null
  "xray.client.getNetwork": null
  "xray.client.getAccountState": null
  "xray.client.getTheme": null
  "xray.client.getCurrency": null
  "xray.client.getHideBalances": null
  "xray.client.getExplorer": null
  "xray.client.routeChanged": ClientRouteChangedPayload
  "xray.client.submitTx": ClientTxSubmitPayload
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
