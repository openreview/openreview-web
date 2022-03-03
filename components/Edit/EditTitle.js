import { buildNoteTitle } from '../../lib/utils'

const EditTitle = ({ edit }) => <h4>{buildNoteTitle(edit.invitations[0], edit.signatures)}</h4>

export default EditTitle
