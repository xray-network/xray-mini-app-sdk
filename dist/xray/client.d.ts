import type { HostMessage, HostMessagePayloadMap } from "./types"
export declare const sendHandshake: (
  requestId?: string,
  timeout?: number
) => Promise<{
  type: "xray.host.handshake"
  payload: boolean
  requestId: string
} | null>
export declare const getTip: (
  requestId?: string,
  timeout?: number
) => Promise<{
  type: "xray.host.tip"
  payload: import("./types").HostTipPayload
  requestId: string
} | null>
export declare const getAccountState: (
  requestId?: string,
  timeout?: number
) => Promise<{
  type: "xray.host.accountState"
  payload: import("./types").HostAccountStatePayload
  requestId: string
} | null>
export declare const getNetwork: (
  requestId?: string,
  timeout?: number
) => Promise<{
  type: "xray.host.network"
  payload: import("./types").HostNetworkPayload
  requestId: string
} | null>
export declare const getTheme: (
  requestId?: string,
  timeout?: number
) => Promise<{
  type: "xray.host.theme"
  payload: import("./types").HostThemePayload
  requestId: string
} | null>
export declare const getCurrency: (
  requestId?: string,
  timeout?: number
) => Promise<{
  type: "xray.host.currency"
  payload: import("./types").HostCurrencyPayload
  requestId: string
} | null>
export declare const getHideBalances: (
  requestId?: string,
  timeout?: number
) => Promise<{
  type: "xray.host.hideBalances"
  payload: boolean
  requestId: string
} | null>
export declare const getExplorer: (
  requestId?: string,
  timeout?: number
) => Promise<{
  type: "xray.host.explorer"
  payload: import("./types").HostExplorerPayload
  requestId: string
} | null>
export declare const routeChanged: (
  newRoute: string,
  requestId?: string,
  timeout?: number
) => Promise<{
  type: "xray.host.routeChanged"
  payload: string
  requestId: string
} | null>
export declare const submitTx: (
  txCborHex: string,
  requestId?: string,
  timeout?: number
) => Promise<{
  type: "xray.host.txSubmitted"
  payload: import("./types").HostTxSubmittedPayload
  requestId: string
} | null>
export declare const signData: (
  address: string,
  data: string,
  requestId?: string,
  timeout?: number
) => Promise<{
  type: "xray.host.signData"
  payload: import("./types").HostSignDataPayload
  requestId: string
} | null>
export declare const listen: <MessageType extends keyof HostMessagePayloadMap>(
  messageType: MessageType,
  handler: ({
    type,
    payload,
    requestId,
  }: {
    type: MessageType
    payload: HostMessagePayloadMap[MessageType]
    requestId?: string
  }) => void
) => () => void
export declare const listenAll: (handler: (message: HostMessage) => void) => () => void
