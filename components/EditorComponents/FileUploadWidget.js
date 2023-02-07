import { useContext, useRef, useState } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import EditorComponentHeader from './EditorComponentHeader'
import SpinnerButton from '../SpinnerButton'
import { prettyField } from '../../lib/utils'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'

const FileUploadWidget = () => {
  const { field, onChange, value, invitation } = useContext(EditorComponentContext)
  const fileInputRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadPercentage, setUploadPercentage] = useState(2)
  const { accessToken } = useUser()
  const fieldName = Object.keys(field)[0]
  const maxSize = field[fieldName].value?.param?.maxSize
  const extensions = field[fieldName].value?.param?.extensions?.map((p) => `.${p}`)

  const uploadSingleFileChunk = async (chunk, index, chunkCount, clientUploadId) => {
    try {
      const data = new FormData()
      data.append('invitationId', invitation.id)
      data.append('name', fieldName)
      data.append('chunkIndex', index + 1)
      data.append('totalChunks', chunkCount)
      data.append('clientUploadId', clientUploadId)
      data.append('file', chunk)
      const result = await api.put('/attachment/chunk', data, {
        accessToken,
        contentType: 'unset',
        version: 2,
      })
      if (result.url) {
        //completed call update
      } else {
        setUploadPercentage(
          (
            (Object.values(result).filter((p) => p === 'completed').length * 100) /
            Object.values(result).length
          ).toFixed(0)
        )
      }
    } catch (error) {}
  }

  const onFileSelected = async (e) => {
    setIsLoading(true)
    try {
      const file = e.target.files[0]
      const chunkSize = 1024 * 1000 * 5 // 5mb
      const chunkCount = Math.ceil(file.size / chunkSize)
      const clientUploadId = nanoid()
      const chunks = Array.from(
        new Array(chunkCount),
        (e, chunkIndex) =>
          new File(
            [file.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize, file.type)],
            file.name
          )
      )
      const sendChunksPromises = chunks.reduce(
        (oldPromises, currentChunk, i) =>
          oldPromises.then(() => {
            return uploadSingleFileChunk(currentChunk, i, chunkCount, clientUploadId)
          }),
        Promise.resolve()
      )
      await sendChunksPromises
    } catch (error) {
      promprError(error.message)
    }

    setIsLoading(false)
  }

  return (
    <EditorComponentHeader>
      <input ref={fileInputRef} type="file" accept={extensions} onChange={onFileSelected} />
      <SpinnerButton
        type="primary"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        loading={isLoading}
      >{`Choose ${prettyField(fieldName)}`}</SpinnerButton>
      {isLoading && (
        <div className="progress">
          <div
            className="progress-bar progress-bar-striped active"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            style={{ width: `${uploadPercentage}%` }}
          />
        </div>
      )}
    </EditorComponentHeader>
  )
}

export default FileUploadWidget
