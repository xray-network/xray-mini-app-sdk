import {
  type HostMessageType,
  type ClientMessageType,
  type HostMessagePayload,
  type ClientMessagePayload,
} from "xray-mini-app-sdk"


export interface UseMiniAppHostMessagingResult {
  sendMessage: <T extends HostMessageType>(type: T, payload?: HostMessagePayload<T>) => void
}

export interface UseMiniAppClientMessagingResult {
  sendMessage: <T extends ClientMessageType>(type: T, payload?: ClientMessagePayload<T>) => void
}