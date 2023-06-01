import { prettyContentValue, prettyField, prettyId, prettyList } from '../../lib/utils'
import Icon from '../Icon'
import EditContentValue from './EditContentValue'

const EditContent = ({ edit, type = 'note' }) => {
  if (!edit?.[type]?.content) return null

  const noteContent = edit[type].content
  const contentOrder = edit.details?.presentation?.length > 0
    ? edit.details.presentation.map((p) => p.name)
    : Object.keys(noteContent)

  return (
    <ul className="list-unstyled note-content">
      {contentOrder.map((fieldName) => {
        const field = noteContent[fieldName]
        if (field === undefined) return null // no such field

        const fieldReaders = Array.isArray(field?.readers) ? field.readers.sort() : null
        const showPrivateIcon =
          fieldReaders && edit.readers && !edit.readers.every((p, i) => p === fieldReaders[i])
        const fieldValue = prettyContentValue(field?.value)
        const enableMarkdown = edit.details?.presentation?.find(
          (p) => p.name === fieldName
        )?.markdown
        const isEmptyValue = field === null ||
          (field instanceof Object && !Array.isArray(field) && (field.value === undefined || field.value === null))
        const isEmptyArray = Array.isArray(field) && field.length === 0

        return (
          <li key={fieldName}>
            <strong className="note-content-field">{prettyField(fieldName)}:</strong>{' '}
            {showPrivateIcon && (
              <Icon
                name="eye-open"
                extraClasses="private-contents-icon"
                tooltip={`Privately revealed to ${fieldReaders
                  .map((p) => prettyId(p))
                  .join(', ')}`}
              />
            )}
            {isEmptyValue ? (
              <span className="empty-value">
                {`(empty${isEmptyArray ? ' list' : ''})`}
              </span>
            ) : (
              <EditContentValue
                editId={edit.id}
                fieldName={fieldName}
                fieldValue={fieldValue}
                enableMarkdown={enableMarkdown}
              />
            )}
            {field?.readers?.delete && (
              <span className="empty-value pl-1">(readers deleted)</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default EditContent
