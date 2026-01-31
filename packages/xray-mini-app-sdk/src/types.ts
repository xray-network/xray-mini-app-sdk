// Shape definitions for host -> client messages and vice versa. These payloads
// are sent via `window.postMessage` to keep iframe communication strongly typed.

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

export type HostSignTxPayload = {
  success: boolean
  hash: string
}

export type HostSubmitTxPayload =
  | {
      success: true
      hash: string
    }
  | {
      success: false
      error: string
    }

export type HostSignAndSubmitTxPayload =
  | {
      success: true
      hash: string
    }
  | {
      success: false
      error: string
    }

export type HostSignDataPayload =
  | {
      success: true
      data: string
    }
  | {
      success: false
      error: string
    }

// Host -> client routing map
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
  "xray.host.signTx": HostSignTxPayload
  "xray.host.submitTx": HostSubmitTxPayload
  "xray.host.signAndSubmitTx": HostSignAndSubmitTxPayload
  "xray.host.signData": HostSignDataPayload
}

export type HostMessage = {
  [K in keyof HostMessagePayloadMap]: {
    type: K
    payload: HostMessagePayloadMap[K]
    requestId: string
  }
}[keyof HostMessagePayloadMap]

export type ClientRouteChangedPayload = string

export type ClientSignTxPayload = string

export type ClientSubmitTxPayload = string

export type ClientSignAndSubmitTxPayload = string

export type ClientSignDataPayload = {
  address: string
  data: string
}

// Client -> host routing map
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
  "xray.client.signTx": ClientSignTxPayload
  "xray.client.submitTx": ClientSubmitTxPayload
  "xray.client.signAndSubmitTx": ClientSignAndSubmitTxPayload
  "xray.client.signData": ClientSignDataPayload
}

export type ClientMessage = {
  [K in keyof ClientMessagePayloadMap]: {
    type: K
    payload: ClientMessagePayloadMap[K]
    requestId: string
  }
}[keyof ClientMessagePayloadMap]
