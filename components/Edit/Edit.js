import { buildNoteTitle, forumDate, prettyList } from '../../lib/utils'
import EditContent from './EditContent'
import EditValue from './EditValue'

const Edit = ({ edit, options }) => (
  <div className={`edit ${options.extraClasses ?? ''}`}>
    <h4>{buildNoteTitle(edit.invitations[0], edit.signatures)}</h4>

    <ul className="edit_meta_info list-inline">
      <li>
        {forumDate(
          edit.cdate,
          edit.tcdate,
          edit.mdate,
          edit.tmdate,
          edit.content?.year?.value,
          edit.pdate,
          true
        )}
      </li>
    </ul>

    {options.showContents && (!edit.ddate || edit.ddate > Date.now()) && (
      <EditContent edit={edit} />
    )}

    <div className="edit_info">
      <h4>Edit Info</h4>
      <hr className="small" />
      <EditValue name="Readers" value={prettyList(edit.readers, 'long', 'unit')} />
      <EditValue name="Writers" value={prettyList(edit.writers, 'long', 'unit')} />
      <EditValue name="Signatures" value={prettyList(edit.signatures, 'long', 'unit')} />
    </div>
  </div>
)

export default Edit
