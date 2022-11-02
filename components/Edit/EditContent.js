import { prettyContentValue, prettyField, prettyId, prettyList } from '../../lib/utils'
import Icon from '../Icon'
import EditContentValue from './EditContentValue'

const EditContent = ({ edit, type = 'note' }) => {
  if (!edit) return null

  const noteContent = {
    ...edit[type]?.content,
    ...(edit[type]?.readers && {
      Readers: { value: prettyList(edit[type].readers, 'long', 'unit') },
    }),
    ...(edit[type]?.writers && {
      Writers: { value: prettyList(edit[type].writers, 'long', 'unit') },
    }),
    ...(edit[type]?.signatures && {
      Signatures: { value: prettyList(edit[type].signatures, 'long', 'unit') },
    }),
  }

  const contentOrder = edit.details?.presentation?.length > 0
    ? [
        ...edit.details.presentation.map((p) => p.name),
        ...(noteContent.Readers ? ['Readers'] : []),
        ...(noteContent.Writers ? ['Writers'] : []),
        ...(noteContent.Signatures ? ['Signatures'] : []),
      ]
    : Object.keys(noteContent)

  return (
    <ul className="list-unstyled note-content">
      {contentOrder.map((fieldName) => {
        const field = noteContent[fieldName]
        if (field === undefined) return null // no such field

        const fieldReaders = Array.isArray(field?.readers) ? field.readers.sort() : null
        const showPrivateIcon =
          fieldReaders && edit.readers && !fieldReaders.every((p, i) => p === edit.readers[i])
        const fieldValue = prettyContentValue(field?.value)
        const enableMarkdown = edit.details?.presentation?.find(
          (p) => p.name === fieldName
        )?.markdown

        const isEmptyValue = field === null ||
          (field instanceof Object && (field.value === undefined || field.value === null))

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
                (empty)
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
