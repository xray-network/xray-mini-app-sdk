import type { HostMessageType, ClientMessageType } from "./types.js"

export const HOST_MESSAGE_TYPES = [
  "xray.host.tip",
  "xray.host.accountState",
  "xray.host.network",
  "xray.host.theme",
  "xray.host.currency",
  "xray.host.hideBalances",
  "xray.host.explorer",
  "xray.host.routeChanged",
] as const

export const CLIENT_MESSAGE_TYPES = [
  "xray.client.getTip",
  "xray.client.getNetwork",
  "xray.client.getAccountState",
  "xray.client.getTheme",
  "xray.client.getCurrency",
  "xray.client.getHideBalances",
  "xray.client.getExplorer",
  "xray.client.routeChanged",
  // "cip30.getNetworkId",
  // "cip30.getUtxos",
  // "cip30.getBalance",
  // "cip30.getUsedAddresses",
  // "cip30.getUnusedAddresses",
  // "cip30.getChangeAddress",
  // "cip30.getRewardAddresses",
  // "cip30.signTx",
  // "cip30.signData",
  // "cip30.submitTx",
] as const

export const HOST_ALLOWED_MESSAGE_TYPES = new Set<string>([...HOST_MESSAGE_TYPES])
export const CLIENT_ALLOWED_MESSAGE_TYPES = new Set<string>([...CLIENT_MESSAGE_TYPES])

export const MINI_APP_SDK_FLAG = "__miniAppSdk"
export const CHANNEL_REQUEST = "requestPort"
export const CHANNEL_TRANSFER = "transferPort"
