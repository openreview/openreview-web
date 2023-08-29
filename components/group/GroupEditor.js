export default function GroupEditor({ group, invitation, profileId, accessToken }) {
  if (!group || !invitation) return null

  return (
    <div>
      <h2>{invitation.id}</h2>
    </div>
  )
}
