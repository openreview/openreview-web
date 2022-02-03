import { buildNoteTitle } from '../../lib/utils'

const EditTitle = ({ invitation, signatures }) => (
  <h4>{buildNoteTitle(invitation, signatures)}</h4>
)

export default EditTitle
