import { Button, Tag, Tooltip, Upload } from 'antd'
import { nanoid } from 'nanoid'
import { Fragment, useEffect, useRef, useState } from 'react'
import useTurnstileToken from '../../hooks/useTurnstileToken'
import api from '../../lib/api-client'
import { inflect } from '../../lib/utils'
import { TrashButton } from '../IconButton'
import LoadingSpinner from '../LoadingSpinner'

import styles from '../../styles/components/DocumentUploadSection.module.scss'
import {
  getBootstrap337LabelColor,
  moderation as legacyStyles,
} from '../../lib/legacy-bootstrap-styles'

const identityVerificationInvitaitonId = '~/-/Identity_Verification'

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
      'This file is only stored in your browser and will be discarded if you leave this section.. Click Upload to save it to the server.',
    removable: true,
  }
}

const getFormatSeparator = (index, total) => {
  if (index === 0) return ''
  if (index < total - 1) return ', '
  return total > 2 ? ', or ' : ' or '
}

const formatProfileDocuments = (profileDocuments) =>
  (Array.isArray(profileDocuments) ? profileDocuments : [])
    .filter((doc) => doc?.url)
    .map((doc, index) => {
      const uid = String(doc.id ?? `existing-${index}`)
      return { id: uid, uid, name: doc.name ?? doc.url, url: doc.url, status: 'done' }
    })

const DocumentUploadSection = ({ profileDocuments, updateDocuments }) => {
  const [documents, setDocuments] = useState(() => formatProfileDocuments(profileDocuments))
  const [hasHumanVerificationError, setHasHumanVerificationError] = useState(false)
  const { turnstileToken, turnstileContainerRef } = useTurnstileToken(
    'documentUpload',
    hasHumanVerificationError
  )
  const [identityVerificationInvitation, setIdentityVerificationInvitation] = useState(null)
  const pendingUploadsRef = useRef(new Map())

  const acceptedFileTypes =
    identityVerificationInvitation?.edit?.profile?.content?.identityDocuments?.value?.param
      ?.extensions
  const maxSize =
    identityVerificationInvitation?.edit?.profile?.content?.identityDocuments?.value?.param
      ?.maxSize
  const maxFileCount =
    identityVerificationInvitation?.edit?.profile?.content?.identityDocuments?.value?.param
      ?.maxItems

  const isUploading = documents.some((file) => file.status === 'uploading')
  const pendingCount = documents.filter((file) => !file.url).length

  const selectDisabled =
    hasHumanVerificationError || isUploading || documents.length >= maxFileCount

  const updateDocumentState = (id, stateUpdate) => {
    setDocuments((currentDocuments) =>
      currentDocuments.map((p) => (p.id === id ? { ...p, ...stateUpdate } : p))
    )
  }

  const runUpload = async (file, token) => {
    try {
      const data = new FormData()
      data.append('invitationId', identityVerificationInvitaitonId)
      data.append('name', 'identityDocuments')
      data.append('file', file.originFileObj)
      const result = await api.put('/attachment', data, {
        contentType: 'unset',
        'cf-turnstile-token': token,
      })
      pendingUploadsRef.current.delete(file.id)
      updateDocumentState(file.id, { status: 'done', url: result.url })
    } catch (apiError) {
      if (apiError.name === 'HumanVerificationRequiredError') {
        pendingUploadsRef.current.set(file.id, file)
        setHasHumanVerificationError(true)
      } else {
        pendingUploadsRef.current.delete(file.id)
        updateDocumentState(file.id, { status: 'error', errorMessage: apiError.message })
      }
    }
  }

  const uploadPendingFiles = (token) => {
    const pendingFiles = documents.filter((file) => !file.url && file.status !== 'uploading')
    pendingFiles.forEach((file) =>
      updateDocumentState(file.id, { status: 'uploading', errorMessage: undefined })
    )
    pendingFiles.forEach((file) => runUpload(file, token))
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
    pendingUploadsRef.current.delete(file.id)
    setDocuments((current) => current.filter((doc) => doc.id !== file.id))
  }

  const handlePreview = (file) => {
    if (!(file.originFileObj instanceof Blob)) return
    window.open(URL.createObjectURL(file.originFileObj), '_blank', 'noopener,noreferrer')
  }

  const loadIdentityVerificationInvitation = async () => {
    try {
      const result = await api.getInvitationById(identityVerificationInvitaitonId)
      setIdentityVerificationInvitation(result)
    } catch {}
  }

  useEffect(() => {
    loadIdentityVerificationInvitation()
  }, [])

  useEffect(() => {
    const uploadedDocuments = documents.flatMap((p) => {
      if (!p.url) return []
      return p.url
    })
    updateDocuments(uploadedDocuments)
  }, [documents])

  useEffect(() => {
    if (!turnstileToken || !hasHumanVerificationError || !pendingUploadsRef.current.size)
      return
    setHasHumanVerificationError(false)
    const pendingFiles = Array.from(pendingUploadsRef.current.values())
    pendingFiles.forEach((file) => runUpload(file, turnstileToken))
  }, [turnstileToken, hasHumanVerificationError])

  if (!identityVerificationInvitation) return <LoadingSpinner inline />

  return (
    <>
      <div className="instructions">
        <div>
          Upload any files that you think are necessary to support your profile creation
          request.
        </div>
        <div>You may upload up to {inflect(maxFileCount, 'file', 'files', true)}.</div>
        <div>
          Accepted formats:{' '}
          {acceptedFileTypes.map((type, index) => (
            <Fragment key={type}>
              {getFormatSeparator(index, acceptedFileTypes.length)}
              <strong>{type.toUpperCase()}</strong>
            </Fragment>
          ))}
          .
        </div>
        <div>
          Each file must be no larger than <strong>{maxSize}&nbsp;MB</strong>.
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
                {file.originFileObj instanceof Blob ? (
                  <a onClick={() => handlePreview(file)}>{file.name}</a>
                ) : (
                  file.name
                )}
                {file.url ? ` (${file.url})` : ''}
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
          onClick={() => uploadPendingFiles(turnstileToken)}
          disabled={!pendingCount || isUploading || hasHumanVerificationError}
          loading={isUploading}
        >
          {pendingCount ? `Upload ${inflect(pendingCount, 'file', 'files', true)}` : 'Upload'}
        </Button>
        <div ref={turnstileContainerRef} />
      </div>
    </>
  )
}

export default DocumentUploadSection
