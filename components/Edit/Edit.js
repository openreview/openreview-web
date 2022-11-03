import EditContent from './EditContent'
import EditValue from './EditValue'
import EditContentValue from './EditContentValue'
import { buildNoteTitle, forumDate, prettyList, prettyField, prettyContentValue } from '../../lib/utils'

export default function Edit({ edit, type, options }) {
  return (
    <div className={`edit ${options.extraClasses ?? ''}`}>
      <h4>{buildNoteTitle(edit.invitations?.[0] ?? edit.invitation, edit.signatures)}</h4>

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
        <EditContent edit={edit} type={type} />
      )}

      {options.showContents && type === 'invitation' && edit.invitation.edit && (
        <ul className="list-unstyled note-content">
          {Object.keys(edit.invitation.edit).map((fieldName) => {
            const field = edit.invitation.edit[fieldName]
            const isJsonValue = field instanceof Object && !Array.isArray(field)

            return (
              <li key={`${edit.id}-${fieldName}`}>
                <strong className="note-content-field">Edit – {prettyField(fieldName)}:</strong>
                {' '}
                <EditContentValue
                  editId={edit.id}
                  fieldName={fieldName}
                  fieldValue={prettyContentValue(field)}
                  isJsonValue={isJsonValue}
                />
              </li>
            )
          })}
        </ul>
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
}
