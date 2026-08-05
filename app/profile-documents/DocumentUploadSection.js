import { Button, Tag, Tooltip, Upload } from 'antd'
import { useState } from 'react'
import { TrashButton } from '../../components/IconButton'
import LoadingIcon from '../../components/LoadingIcon'
import api from '../../lib/api-client'
import { inflect } from '../../lib/utils'

import styles from '../../styles/components/DocumentUploadSection.module.scss'
import {
  getBootstrap337LabelColor,
  moderation as legacyStyles,
} from '../../lib/legacy-bootstrap-styles'

const getFileLocationStatus = (file) => {
  if (file.url) return { color: 'success', label: 'Uploaded', removable: false }
  if (file.status === 'uploading')
    return { color: 'processing', label: 'Uploading', removable: false }
  if (file.status === 'error')
    return {
      color: 'error',
      label: 'Upload failed',
      tooltip: file.errorMessage || 'Something went wrong. Please try uploading again.',
      removable: true,
    }
  return {
    color: 'warning',
    label: 'pending',
    tooltip:
      'This file is only stored in your browser and will be discarded if you leave this page. Click Upload to save it to the server.',
    removable: true,
  }
}

const DocumentUploadSection = ({
  type,
  token,
  maxSize = 3,
  maxFileCount = 5,
  instructions = 'Upload any files that you think are necessary to support your profile creation request.',
}) => {
  const [documents, setDocuments] = useState([])

  const acceptedFileTypes = ['pdf', 'jpg', 'jpeg', 'png']

  const isUploading = documents.some((file) => file.status === 'uploading')
  const pendingCount = documents.filter((file) => !file.url).length

  const selectDisabled = isUploading || documents.length >= maxFileCount

  const updateDocumentState = (id, stateUpdate) => {
    setDocuments((currentDocuments) =>
      currentDocuments.map((p) => (p.id === id ? { ...p, ...stateUpdate } : p))
    )
  }

  const uploadPendingFiles = async () => {
    const pendingFiles = documents.filter((file) => !file.url && file.status !== 'uploading')
    for (const file of pendingFiles) {
      updateDocumentState(file.id, { status: 'uploading', errorMessage: undefined })
      try {
        const data = new FormData()
        data.append('file', file.originFileObj)
        const result = await api.post(`/profile-documents/${type}/${token}`, data, {
          contentType: 'unset',
        })
        updateDocumentState(file.id, { status: 'done', url: result.id })
      } catch (apiError) {
        updateDocumentState(file.id, { status: 'error', errorMessage: apiError.message })
        promptError(apiError.message)
      }
    }
  }

  const beforeUpload = (file) => {
    if (file.size > 1024 * 1000 * maxSize) {
      promptError(`File is too large. File size limit is ${maxSize} mb`)
      return Upload.LIST_IGNORE
    }
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!acceptedFileTypes.includes(fileExtension)) {
      promptError(`File type not allowed. Accepted types: ${acceptedFileTypes.join(', ')}`)
      return Upload.LIST_IGNORE
    }
    return false
  }

  const handleChange = (info) => {
    setDocuments(
      info.fileList.map((file) => ({
        id: file.uid,
        uid: file.uid,
        name: file.name,
        status: file.status,
        url: file.url,
        errorMessage: file.errorMessage,
        originFileObj: file.originFileObj,
      }))
    )
  }

  const removeDocument = (file) => {
    setDocuments((current) => current.filter((doc) => doc.id !== file.id))
  }

  const handlePreview = (file) => {
    if (!(file.originFileObj instanceof Blob)) return
    window.open(URL.createObjectURL(file.originFileObj), '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div className={styles.instructions}>
        <div>{instructions}</div>
        <div>You may upload up to {maxFileCount} files.</div>
        <div>
          Accepted formats: <strong>PDF</strong>, <strong>JPG</strong>, <strong>JPEG</strong>,
          or <strong>PNG</strong>.
        </div>
        <div>
          Each file must be no larger than <strong>{maxSize} MB</strong>.
        </div>
      </div>
      <div className={styles.fileUploadContainer}>
        <Upload
          maxCount={maxFileCount}
          accept={acceptedFileTypes.map((p) => `.${p}`).join(',')}
          fileList={documents}
          showUploadList={false}
          disabled={selectDisabled}
          beforeUpload={beforeUpload}
          onChange={handleChange}
        >
          <Button type="primary" disabled={selectDisabled}>
            Select files
          </Button>
        </Upload>

        {documents.map((file) => {
          const fileStatus = getFileLocationStatus(file)
          return (
            <div key={file.id} className={styles.fileRow}>
              <span className={styles.fileUrl}>
                {file.originFileObj instanceof Blob && (
                  <a onClick={() => handlePreview(file)}>{file.name}</a>
                )}
                {file.url ? ` ${file.url}` : ''}
              </span>
              <Tooltip title={fileStatus.tooltip}>
                <Tag
                  variant="solid"
                  color={getBootstrap337LabelColor(fileStatus.color)}
                  styles={{
                    root: {
                      ...legacyStyles.statusTag,
                      lineHeight: 1.5,
                      marginLeft: '0.25rem',
                    },
                  }}
                >
                  {fileStatus.label}
                </Tag>
              </Tooltip>
              {fileStatus.removable && <TrashButton onClick={() => removeDocument(file)} />}
            </div>
          )
        })}
        <Button
          type="primary"
          iconPlacement="end"
          loading={isUploading ? { icon: <LoadingIcon /> } : false}
          onClick={uploadPendingFiles}
          disabled={!pendingCount}
        >
          {pendingCount ? `Upload ${inflect(pendingCount, 'file', 'files', true)}` : 'Upload'}
        </Button>
      </div>
    </>
  )
}

export default DocumentUploadSection
