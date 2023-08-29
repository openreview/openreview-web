import { prettyId } from '../../lib/utils'

export default function GroupEditInvitationsSelector({ invitations, selectedInvitation, setSelected }) {
  if (!invitations || selectedInvitation) return null

  if (invitations.length === 0) {
    return (
      <div className="group-invitations-selector">
        <h4>You do not have permission to edit this group.</h4>
      </div>
    )
  }

  return (
    <div className="group-invitations-selector">
      <h4>Available group edits:</h4>
      <ul className="list-unstyled">
        {invitations?.map((invitation) => (
          <li key={invitation.id}>
            <button className="btn btn-primary mb-3" onClick={() => setSelected(invitation)}>
              {prettyId(invitation.id)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
