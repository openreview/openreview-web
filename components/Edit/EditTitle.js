import { buildNoteTitle } from '../../lib/utils'

export const EditTitle = ({ invitation, signatures }) => {
  return <h4>{buildNoteTitle(invitation, signatures)}</h4>
}
