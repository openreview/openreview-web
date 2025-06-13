import isEmpty from 'lodash/isEmpty'
import EditContent from './EditContent'
import EditValue from './EditValue'
import EditContentValue from './EditContentValue'
import {
  buildNoteTitle,
  forumDate,
  prettyList,
  prettyField,
  prettyContentValue,
} from '../../lib/utils'
import { getNoteContentValues } from '../../lib/forum-utils'

function EditFields({ editId, displayObj, omitFields = [], label = 'Edit' }) {
  const formatGroupMemberEdit = (membersObj) => {
    if (Array.isArray(membersObj)) {
      return membersObj.length > 0 ? membersObj.join(', ') : '(empty list)'
    }
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

        const field =
          fieldName === 'members'
            ? formatGroupMemberEdit(displayObj[fieldName])
            : displayObj[fieldName]
        const isJsonValue = field instanceof Object && !Array.isArray(field)
        const isEmptyValue =
          field === null ||
          (field instanceof Object && !Array.isArray(field) && Object.keys(field).length === 0)
        const isEmptyArray = Array.isArray(field) && field.length === 0
        const enableMarkdown = fieldName === 'members' && !field.startsWith('(empty')

        return (
          <li key={`${editId}-${fieldName}`}>
            <strong className="note-content-field">
              {label} – {prettyField(fieldName)}:
            </strong>{' '}
            {isEmptyValue || isEmptyArray ? (
              <span className="empty-value">{`(empty${isEmptyArray ? ' list' : ''})`}</span>
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
  const omitFields = [
    'id',
    'content',
    'edit',
    'mdate',
    'tmdate',
    'cdate',
    'tcdate',
    'number',
    'forum',
  ]

  return (
    <div className={`edit ${className ?? ''}`} id={edit.id}>
      <h4>
        {buildNoteTitle(edit.invitations?.[0] ?? edit.invitation, edit.signatures, true)}
      </h4>

      <ul className="edit_meta_info list-inline">
        <li>
          {forumDate(
            edit.cdate,
            edit.tcdate,
            edit.mdate,
            edit.tmdate,
            edit.content?.year?.value,
            edit.pdate,
            true,
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
          omitFields={['id', 'edit', 'mdate', 'tmdate']}
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
          omitFields={['note']}
          label="Invitation / Edit"
        />
      )}

      {type === 'invitation' && edit.invitation.edit?.note && (
        <EditFields
          editId={edit.id}
          displayObj={edit.invitation.edit.note}
          label="Invitation / Edit / Note"
        />
      )}

      <div className="edit_info">
        <h4>Edit Info</h4>
        <hr className="small" />
        {edit.content && (
          <EditFields
            editId={edit.id}
            displayObj={getNoteContentValues(edit.content)}
            label="Content"
          />
        )}
        <EditValue name="Readers" value={prettyList(edit.readers, 'long', 'unit')} />
        <EditValue name="Writers" value={prettyList(edit.writers, 'long', 'unit')} />
        <EditValue name="Signatures" value={prettyList(edit.signatures, 'long', 'unit')} />
      </div>
    </div>
  )
}
