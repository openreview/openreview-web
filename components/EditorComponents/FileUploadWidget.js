/* globals promptError: false */

import { useContext, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import EditorComponentContext from '../EditorComponentContext'
import SpinnerButton from '../SpinnerButton'
import { TrashButton } from '../IconButton'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyField } from '../../lib/utils'

import styles from '../../styles/components/FileUploadWidget.module.scss'

const FileUploadWidget = () => {
  const { field, onChange, value, invitation, error, clearError } =
    useContext(EditorComponentContext)
  const fileInputRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadPercentage, setUploadPercentage] = useState(2)

  const { accessToken } = useUser()
  const fieldName = Object.keys(field)[0]
  const [fileName, setFileName] = useState(prettyField(fieldName))
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
      })
      if (result.url) {
        // upload is completed
        onChange({ fieldName, value: result.url })
        clearError?.()
        setUploadPercentage(2)
      } else {
        setUploadPercentage(
          (
            (Object.values(result).filter((p) => p === 'completed').length * 100) /
            Object.values(result).length
          ).toFixed(0)
        )
      }
    } catch (apiError) {
      promptError(apiError.message)
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelected = async (e) => {
    try {
      const file = e.target.files[0]
      if (!file) return
      if (maxSize && file.size > 1024 * 1000 * maxSize)
        throw new Error(`File is too large. File size limit is ${maxSize} mb`)
      setIsLoading(true)
      const chunkSize = 1024 * 1000 * 5 // 5mb
      const chunkCount = Math.ceil(file.size / chunkSize)
      const clientUploadId = nanoid()
      const chunks = Array.from(
        new Array(chunkCount),
        (_e, chunkIndex) =>
          new File(
            [file.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize, file.type)],
            file.name
          )
      )

      const sendChunksPromises = chunks.reduce(
        (oldPromises, currentChunk, i) =>
          oldPromises.then(() =>
            uploadSingleFileChunk(currentChunk, i, chunkCount, clientUploadId)
          ),
        Promise.resolve()
      )
      await sendChunksPromises
      setFileName(file.name)
    } catch (apiError) {
      promptError(apiError.message)
      fileInputRef.current.value = ''
    }

    setIsLoading(false)
  }

  const handleDeleteFile = () => {
    onChange({ fieldName, value: undefined })
    fileInputRef.current.value = ''
  }

  return (
    <div className={styles.fileUploadContainer}>
      <input
        ref={fileInputRef}
        type="file"
        aria-label={fieldName}
        accept={extensions}
        onChange={handleFileSelected}
      />
      <SpinnerButton
        type="primary"
        className={`${styles.selectFileButton} ${error ? styles.invalidValue : ''}`}
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
      {value && (
        <>
          <span className={styles.fileUrl}>{`${fileName} (${value})`}</span>
          <TrashButton onClick={handleDeleteFile} />
        </>
      )}
    </div>
  )
}

export default FileUploadWidget
