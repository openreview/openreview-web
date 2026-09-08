let pendingVerification = null
let notifyModal

export const getHumanVerificationToken = async () => {
  if (pendingVerification) return null
  return new Promise((resolve) => {
    pendingVerification = { resolve }
    notifyModal()
  })
}

export const subscribeShouldShowHumanVerificationModal = (callback) => {
  notifyModal = callback
  return () => {
    notifyModal = undefined
  }
}

export const updateHumanVerificationTurnstileToken = (token) => {
  pendingVerification?.resolve(token)
  pendingVerification = null
  notifyModal()
}

export const shouldShowHumanVerificationModal = () => pendingVerification !== null
