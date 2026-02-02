// Shape definitions for host -> client messages and vice versa. These payloads
// are sent via `window.postMessage` to keep iframe communication strongly typed.

export type HostHandshakePayload = boolean

export type HostExtensionsPayload = { [key: string]: number }[]

export type HostNetworkIdPayload = number

export type HostUtxosPayload = string[] | null

export type HostCollateralPayload = string[] | null

export type HostBalancePayload = string

export type HostUsedAddressesPayload = string[]

export type HostUnusedAddressesPayload = string[]

export type HostChangeAddressPayload = string

export type HostRewardAddressesPayload = string[]

export type HostSignTxPayload = string

export type HostSignDataPayload = {
  key: string
  signature: string
}

export type HostSubmitTxPayload = string

// Host -> client routing map
export type HostMessagePayloadMap = {
  "xray.cip30.host.handshake": HostHandshakePayload
  "xray.cip30.host.extensions": HostExtensionsPayload
  "xray.cip30.host.networkId": HostNetworkIdPayload
  "xray.cip30.host.utxos": HostUtxosPayload
  "xray.cip30.host.collateral": HostCollateralPayload
  "xray.cip30.host.balance": HostBalancePayload
  "xray.cip30.host.usedAddresses": HostUsedAddressesPayload
  "xray.cip30.host.unusedAddresses": HostUnusedAddressesPayload
  "xray.cip30.host.changeAddress": HostChangeAddressPayload
  "xray.cip30.host.rewardAddresses": HostRewardAddressesPayload
  "xray.cip30.host.signTx": HostSignTxPayload
  "xray.cip30.host.signData": HostSignDataPayload
  "xray.cip30.host.submitTx": HostSubmitTxPayload
}

export type HostMessage = {
  [K in keyof HostMessagePayloadMap]: HostMessagePayloadMap[K]
}[keyof HostMessagePayloadMap]

export type ClientUtxosPayload = {
  amount?: string
  paginate?: {
    page: number
    limit: number
  }
}

export type ClientUsedAddressesPayload = {
  paginate?: {
    page: number
    limit: number
  }
}

export type ClientSignTxPayload = {
  tx: string
  partialSign?: boolean
}

export type ClientSignDataPayload = {
  address: string
  data: string
}

export type ClientSubmitTxPayload = string

// Client -> host routing map
export type ClientMessagePayloadMap = {
  "xray.cip30.client.handshake": null
  "xray.cip30.client.getExtensions": null
  "xray.cip30.client.getNetworkId": null
  "xray.cip30.client.getUtxos": ClientUtxosPayload
  "xray.cip30.client.getCollateral": null
  "xray.cip30.client.getBalance": null
  "xray.cip30.client.getUsedAddresses": ClientUsedAddressesPayload
  "xray.cip30.client.getUnusedAddresses": null
  "xray.cip30.client.getChangeAddress": null
  "xray.cip30.client.getRewardAddresses": null
  "xray.cip30.client.signTx": ClientSignTxPayload
  "xray.cip30.client.signData": ClientSignDataPayload
  "xray.cip30.client.submitTx": ClientSubmitTxPayload
}

export type ClientMessage = {
  [K in keyof ClientMessagePayloadMap]: {
    type: K
    payload: ClientMessagePayloadMap[K]
    requestId: string
  }
}[keyof ClientMessagePayloadMap]
