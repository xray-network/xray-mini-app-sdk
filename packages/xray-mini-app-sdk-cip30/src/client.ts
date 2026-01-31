export const version: string = "0.1.0"
export const name: string = "xrayIframeConnector"
export const icon: string = ""
export const supportedExtensions: { [key: string]: number }[] = [{ cip: 30 }]

export const isEnabled = async () => {
  return true
}

export const enable = async () => {
  return {
    experemental,
    getBalance,
    getChangeAddress,
    getCollateral,
    getExtensions,
    getNetworkId,
    getRewardAddresses,
    getUnusedAddresses,
    getUsedAddresses,
    getUtxos,
    signData,
    signTx,
    submitTx,
  }
}

const experemental = {}

const getBalance = async () => {
  return null
}

const getChangeAddress = async () => {
  return null
}

const getCollateral = async () => {
  return null
}

const getExtensions = async () => {
  return null
}

const getNetworkId = async () => {
  return null
}

const getRewardAddresses = async () => {
  return null
}

const getUnusedAddresses = async () => {
  return null
}

const getUsedAddresses = async () => {
  return null
}

const getUtxos = async () => {
  return null
}

const signData = async () => {
  return null
}

const signTx = async () => {
  return null
}

const submitTx = async () => {
  return null
}
