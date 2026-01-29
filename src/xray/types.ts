export type HostHandshakePayload = boolean

export type HostTipPayload = {
  hash: string
  epochNo: number
  absSlot: number
  epochSlot: number
  blockNo: number
  blockTime: number
} | null

export type HostAccountStatePayload = {
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

export type HostNetworkPayload = "mainnet" | "preprod" | "preview"

export type HostThemePayload = "light" | "dark"

export type HostCurrencyPayload = "usd" | "eur" | "gbp" | "jpy" | "cny"

export type HostHideBalancesPayload = boolean

export type HostExplorerPayload = "cardanoscan" | "cexplorer" | "adastat" | "xray"

export type HostRouteChangedPayload = string

export type HostTxSubmittedPayload = {
  success: boolean
  hash: string
}

export type HostMessagePayloadMap = {
  "xray.host.handshake": HostHandshakePayload
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

export type HostMessage = {
  [K in keyof HostMessagePayloadMap]: {
    type: K
    payload: HostMessagePayloadMap[K]
    requestId: string
  }
}[keyof HostMessagePayloadMap]

export type ClientRouteChangedPayload = string

export type ClientTxSubmitPayload = string

export type ClientMessagePayloadMap = {
  "xray.client.handshake": null
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

export type ClientMessage = {
  [K in keyof ClientMessagePayloadMap]: {
    type: K
    payload: ClientMessagePayloadMap[K]
    requestId: string
  }
}[keyof ClientMessagePayloadMap]
