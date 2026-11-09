import { stringify } from 'query-string'
import api from './api-client'

const base64Url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

async function signGuestToken(secret, payload) {
  const encoder = new TextEncoder()
  const header = base64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = base64Url(encoder.encode(JSON.stringify(payload)))
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`))
  return `${header}.${body}.${base64Url(signature)}`
}

async function getVouchRequestLink(profileId) {
  const invitationId = `${process.env.SUPER_USER}/Support/-/Vouch_Request`
  const [{ invitations }, { profiles }] = await Promise.all([
    api.get('/invitations', { id: invitationId }),
    api.get('/profiles', { id: profileId }),
  ])
  const { secret, content } = invitations[0]
  const key = await signGuestToken(secret, {
    group: profileId,
    invitation: invitationId,
    exp: Math.floor(Date.now() / 1000) + content.linkExpirationDays.value * 24 * 60 * 60,
  })
  return `${window.location.origin}/invitation?${stringify({ id: invitationId, user: profileId, email: profiles[0].content.preferredEmail, key })}`
}

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
  if (message.includes('{{vouchRequestLink}}')) {
    message = message.replaceAll('{{vouchRequestLink}}', await getVouchRequestLink(profileId))
  }
  return message
}

export async function acceptProfile(profileId) {
  return api.post('/profile/moderate', { id: profileId, decision: 'accept' })
}

export async function rejectProfile(profileId, rejectionMessage, labels) {
  const reason = await interpolateRejectionMessage(rejectionMessage ?? '', profileId)
  return api.post('/profile/moderate', {
    id: profileId,
    decision: 'reject',
    reason,
    ...(labels?.length ? { labels } : {}),
  })
}

export async function deleteIdentityDocuments(profileId) {
  return api.delete(`/profile-documents/identity/profiles/${profileId}`)
}
