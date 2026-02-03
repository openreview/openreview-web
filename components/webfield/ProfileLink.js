/* globals promptError: false */
import api from '../../lib/api-client'
import { isValidEmail } from '../../lib/utils'

const ProfileLink = ({ id, name, preferredEmailInvitationId }) => {
  const lookUpOpenId = async (email) => {
    try {
      const result = await api.get(`/edges`, {
        invitation: preferredEmailInvitationId,
        tail: email,
      })
      const profileId = result.edges?.[0]?.head
      if (!profileId) throw new Error('Profile is not available.')
      window.open(`/profile?id=${profileId}`, '_blank', 'noopener,noreferrer')
    } catch (error) {
      promptError(error.message)
    }
  }

  if (id.startsWith('~')) {
    return (
      <a href={`/profile?id=${id}`} target="_blank" rel="noopener noreferrer">
        {name || id}
      </a>
    )
  }
  if (!isValidEmail(id) || !preferredEmailInvitationId) return <span>{name}</span>

  return (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a
      role="button"
      onClick={(e) => {
        e.preventDefault()
        lookUpOpenId(id)
      }}
    >
      {name}
    </a>
  )
}

export default ProfileLink
