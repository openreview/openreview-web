import { forumDate } from '../../lib/utils'
import { NoteContentV2 } from '../NoteContent'
import EditTitle from './EditTitle'
import EditValue from './EditValue'

const Edit = ({ edit, options }) => (
  <div className={`edit ${options.extraClasses ?? ''}`}>
    <EditTitle invitation={edit.invitations[0]} signatures={edit.signatures} />

    <ul className="edit_meta_info list-inline">
      <li>
        {forumDate(
          edit.cdate,
          edit.tcdate,
          edit.mdate,
          edit.tmdate,
          edit.content?.year?.value
        )}
      </li>
    </ul>

    {options.showContents && (!edit.ddate || edit.ddate > Date.now()) && (
      <NoteContentV2
        id={edit.id}
        content={{
          ...edit?.note?.content,
          ...(edit?.note?.readers && { 'Note readers': { value: edit.note.readers } }),
          ...(edit?.note?.writers && { 'Note writers': { value: edit.note.writers } }),
          ...(edit?.note?.signatures && {
            'Note signatures': { value: edit.note.signatures },
          }),
        }}
        omit={options.omitFields}
        isEdit={options.isReference}
        presentation={edit.details?.presentation}
        noteReaders={edit.readers?.sort()}
      />
    )}
    <div className="edit_info">
      <h4>Edit Info</h4>
      <hr className="small" />
      <EditValue name="Readers" value={edit.readers} />
      <EditValue name="Writers" value={edit.writers} />
      <EditValue name="Signatures" value={edit.signatures} />
    </div>
  </div>
)

export default Edit
