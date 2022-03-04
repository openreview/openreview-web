import { prettyContentValue, prettyField, prettyId, prettyList } from '../../lib/utils'
import Icon from '../Icon'
import EditContentValue from './EditContentValue'

const EditContent = ({ edit }) => {
  const noteContent = {
    ...edit?.note?.content,
    ...(edit?.note?.readers && {
      Readers: { value: prettyList(edit.note.readers, 'long', 'unit') },
    }),
    ...(edit?.note?.writers && {
      Writers: { value: prettyList(edit.note.writers, 'long', 'unit') },
    }),
    ...(edit?.note?.signatures && {
      Signatures: { value: prettyList(edit.note.signatures, 'long', 'unit') },
    }),
  }

  const contentOrder = edit.details?.presentation?.length
    ? edit.details.presentation.map((p) => p.name)
    : Object.keys(noteContent)

  return (
    <ul className="list-unstyled note-content">
      {contentOrder.map((fieldName) => {
        if (fieldName.startsWith('_')) return null

        const fieldValue = prettyContentValue(noteContent[fieldName]?.value)
        if (!fieldValue) return null
        const enableMarkdown = edit.details?.presentation?.find(
          (p) => p.name === fieldName
        )?.markdown
        const fieldReaders = noteContent[fieldName]?.readers?.sort()
        const showPrivateIcon =
          fieldReaders && edit.readers && !fieldReaders.every((p, i) => p === edit.readers[i])

        return (
          <li key={fieldName}>
            <strong className="note-content-field">{prettyField(fieldName)}:</strong>{' '}
            {showPrivateIcon && (
              <Icon
                name="eye-open"
                extraClasses="private-contents-icon"
                tooltip={`privately revealed to ${fieldReaders
                  .map((p) => prettyId(p))
                  .join(', ')}`}
              />
            )}
            <EditContentValue
              editId={edit.id}
              fieldName={fieldName}
              fieldValue={fieldValue}
              enableMarkdown={enableMarkdown}
            />
          </li>
        )
      })}
    </ul>
  )
}

export default EditContent
