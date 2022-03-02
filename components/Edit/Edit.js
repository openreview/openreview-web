import { forumDate, prettyList } from '../../lib/utils'
import { NoteContentV2 } from '../NoteContent'
import EditTitle from './EditTitle'
import EditValue from './EditValue'

const Edit = ({ edit, options }) => (
  <div className={`edit ${options.extraClasses ?? ''}`}>
    <EditTitle edit={edit} options={options} />

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
          ...(edit?.note?.readers && { Readers: { value: prettyList(edit.note.readers) } }),
          ...(edit?.note?.writers && { Writers: { value: prettyList(edit.note.writers) } }),
          ...(edit?.note?.signatures && {
            Signatures: { value: prettyList(edit.note.signatures) },
          }),
        }}
        isEdit={options.isReference}
        presentation={edit.details?.presentation}
        noteReaders={edit.readers?.sort()}
        include={Object.keys(edit.note?.content ?? {})}
      />
    )}

    <div className="edit_info">
      <h4>Edit Info</h4>
      <hr className="small" />
      <EditValue name="Readers" value={prettyList(edit.readers)} />
      <EditValue name="Writers" value={prettyList(edit.writers)} />
      <EditValue name="Signatures" value={prettyList(edit.signatures)} />
    </div>
  </div>
)

export default Edit
