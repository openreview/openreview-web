import isEmpty from 'lodash/isEmpty'
import EditContent from './EditContent'
import EditValue from './EditValue'
import EditContentValue from './EditContentValue'
import { buildNoteTitle, forumDate, prettyList, prettyField, prettyContentValue } from '../../lib/utils'

function EditFields({ editId, displayObj, omitFields = [], label = 'Edit' }) {
  const formatGroupMemberEdit = (membersObj) => {
    if (Array.isArray(membersObj) && membersObj.length === 0) return '(empty list)'
    if (isEmpty(membersObj)) return '(empty)'

    const updates = []
    if (membersObj.append) {
      updates.push(`**Added**: ${membersObj.append.join(', ')}`)
    }
    if (membersObj.remove) {
      updates.push(`**Removed**: ${membersObj.remove.join(', ')}`)
    }
    if (membersObj.value) {
      updates.push(`**New Members**: ${membersObj.value.join(', ')}`)
    }
    return updates.join('\n\n')
  }

  return (
    <ul className="list-unstyled note-content">
      {Object.keys(displayObj).map((fieldName) => {
        if (omitFields.includes(fieldName)) return null

        const field = fieldName === 'members'
          ? formatGroupMemberEdit(displayObj[fieldName])
          : displayObj[fieldName]
        const isJsonValue = field instanceof Object && !Array.isArray(field)
        const isEmptyValue = field === null ||
          (field instanceof Object && !Array.isArray(field) && (field.value === undefined || field.value === null))
        const isEmptyArray = Array.isArray(field) && field.length === 0
        const enableMarkdown = fieldName === 'members' && !field.startsWith('(empty')

        return (
          <li key={`${editId}-${fieldName}`}>
            <strong className="note-content-field">{label} – {prettyField(fieldName)}:</strong>
            {' '}
            {isEmptyValue || isEmptyArray ? (
              <span className="empty-value">
                {`(empty${isEmptyArray ? ' list' : ''})`}
              </span>
            ) : (
              <EditContentValue
                editId={editId}
                fieldName={fieldName}
                fieldValue={prettyContentValue(field)}
                isJsonValue={isJsonValue}
                enableMarkdown={enableMarkdown}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function Edit({ edit, type, className, showContents }) {
  const omitFields = ['id', 'content', 'edit', 'mdate', 'tmdate', 'cdate', 'tcdate', 'number', 'forum']

  return (
    <div className={`edit ${className ?? ''}`}>
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

      {type === 'group' && edit.group && (
        <EditFields
          editId={edit.id}
          displayObj={edit.group}
          omitFields={omitFields}
          label="Group"
        />
      )}

      {type === 'invitation' && edit.invitation && (
        <EditFields
          editId={edit.id}
          displayObj={edit.invitation}
          omitFields={omitFields}
          label="Invitation"
        />
      )}

      {showContents && (!edit.ddate || edit.ddate > Date.now()) && (
        <EditContent edit={edit} type={type} />
      )}

      {type === 'note' && edit.note && (
        <EditFields
          editId={edit.id}
          displayObj={edit.note}
          omitFields={omitFields}
          label="Note"
        />
      )}

      {type === 'invitation' && edit.invitation.edit && (
        <EditFields
          editId={edit.id}
          displayObj={edit.invitation.edit}
          exclude={['note']}
          label="Invitation - Edit"
        />
      )}

      {type === 'invitation' && edit.invitation.edit?.note && (
        <EditFields
          editId={edit.id}
          displayObj={edit.invitation.edit.note}
          exclude={['content']}
          label="Edit - Invitation - Note"
        />
      )}

      {showContents && type === 'invitation' && edit.invitation.edit?.note?.content && (
        <EditContent edit={edit.invitation.edit} type={'note'} />
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
