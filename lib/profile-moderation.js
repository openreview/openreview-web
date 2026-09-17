import api from './api-client'

async function interpolateRejectionMessage(rejectionMessage, profileId) {
  let message = rejectionMessage
  if (message.includes('{{documentVerificationLink}}')) {
    const { url } = await api.post('/profile-documents/upload-link', {
      profileId,
      type: 'identity',
    })
    message = message.replaceAll('{{documentVerificationLink}}', url)
  }
  if (message.includes('{{underageConsentLink}}')) {
    const { url } = await api.post('/profile-documents/upload-link', {
      profileId,
      type: 'parentalConsent',
    })
    message = message.replaceAll('{{underageConsentLink}}', url)
  }
  return message
}

export function acceptProfile(profileId) {
  return api.post('/profile/moderate', { id: profileId, decision: 'accept' })
}

export async function rejectProfile(profileId, rejectionMessage) {
  const reason = await interpolateRejectionMessage(rejectionMessage ?? '', profileId)
  return api.post('/profile/moderate', { id: profileId, decision: 'reject', reason })
}
