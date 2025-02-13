/* globals promptError: false */
import EditorComponentHeader from './EditorComponents/EditorComponentHeader'
import Signatures from './Signatures'

const EditSignatures = ({
  fieldDescription,
  setLoading,
  editorData,
  setEditorData,
  closeEditor,
  errors,
  setErrors,
  extraClasses,
}) => {
  const fieldName = 'editSignatureInputValues'
  const error = errors?.find((e) => e.fieldName === fieldName)

  const onChange = ({ loading, value }) => {
    setLoading((existingLoadingState) => ({
      ...existingLoadingState,
      editSignatures: loading,
    }))
    if (value) setEditorData({ fieldName, value })
  }

  const onError = (errorMessage) => {
    promptError(errorMessage)
    closeEditor()
  }

  if (!fieldDescription) return null

  return (
    <EditorComponentHeader fieldNameOverwrite="Signatures" inline={true} error={error}>
      <Signatures
        fieldDescription={fieldDescription}
        onChange={onChange}
        currentValue={editorData?.[fieldName]}
        onError={onError}
        extraClasses={extraClasses}
        clearError={() =>
          setErrors((existingErrors) =>
            existingErrors.filter((p) => p.fieldName !== fieldName)
          )
        }
      />
    </EditorComponentHeader>
  )
}

export default EditSignatures
