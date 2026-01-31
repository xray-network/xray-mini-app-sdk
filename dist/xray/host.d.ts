import type {
  HostHandshakePayload,
  HostAccountStatePayload,
  HostTipPayload,
  HostNetworkPayload,
  HostThemePayload,
  HostCurrencyPayload,
  HostHideBalancesPayload,
  HostExplorerPayload,
  HostRouteChangedPayload,
  HostTxSubmittedPayload,
  ClientMessagePayloadMap,
  ClientMessage,
} from "./types"
export declare const sendHandshake: (
  iframe: Window | null | undefined,
  payload: HostHandshakePayload,
  requestId: string
) => void
export declare const sendTip: (iframe: Window | null | undefined, payload: HostTipPayload, requestId: string) => void
export declare const sendAccountState: (
  iframe: Window | null | undefined,
  payload: HostAccountStatePayload,
  requestId: string
) => void
export declare const sendNetwork: (
  iframe: Window | null | undefined,
  payload: HostNetworkPayload,
  requestId: string
) => void
export declare const sendTheme: (
  iframe: Window | null | undefined,
  payload: HostThemePayload,
  requestId: string
) => void
export declare const sendCurrency: (
  iframe: Window | null | undefined,
  payload: HostCurrencyPayload,
  requestId: string
) => void
export declare const sendHideBalances: (
  iframe: Window | null | undefined,
  payload: HostHideBalancesPayload,
  requestId: string
) => void
export declare const sendExplorer: (
  iframe: Window | null | undefined,
  payload: HostExplorerPayload,
  requestId: string
) => void
export declare const sendRouteChanged: (
  iframe: Window | null | undefined,
  payload: HostRouteChangedPayload,
  requestId: string
) => void
export declare const sendTxSubmitted: (
  iframe: Window | null | undefined,
  payload: HostTxSubmittedPayload,
  requestId: string
) => void
export declare const sendSignData: (
  iframe: Window | null | undefined,
  payload: {
    success: boolean
    data: string
  },
  requestId: string
) => void
export declare const listen: <MessageType extends keyof ClientMessagePayloadMap>(
  iframe: Window | null | undefined,
  messageType: MessageType,
  handler: ({
    type,
    payload,
    requestId,
  }: {
    type: MessageType
    payload: ClientMessagePayloadMap[MessageType]
    requestId: string
  }) => void
) => () => void
export declare const listenAll: (
  iframe: Window | null | undefined,
  handler: (message: ClientMessage) => void
) => () => void
