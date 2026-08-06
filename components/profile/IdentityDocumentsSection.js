import { Button, Flex, Image, Space } from 'antd'
import api from '../../lib/api-client'
import { formatDateTime, inflect } from '../../lib/utils'
import LoadingSpinner from '../LoadingSpinner'

import styles from '../../styles/components/IdentityDocumentsSection.module.scss'

const pdfThumbnail = '/images/pdf_icon_blue.svg'
const deletedThumbnail =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="76" height="100"><rect width="76" height="100" fill="%23f5f5f5"/></svg>'

const DocumentMetadata = ({ item, loadIdentityDocuments, inline = false }) => {
  const properties = [
    { label: 'File Name', value: item.filename },
    { label: 'Document Type', value: item.type },
    { label: 'File Type', value: item.extension },
    { label: 'Size', value: item.size },
    {
      label: 'Uploaded',
      value: item.tcdate ? formatDateTime(item.tcdate, { second: undefined }) : null,
    },
    ...(item.ddate
      ? [
          {
            label: 'Deleted',
            value: formatDateTime(item.ddate, { second: undefined }),
          },
        ]
      : []),
  ]
  const isDeletable = item.type !== 'parentalConsent' && !item.ddate

  const deleteDocument = async () => {
    try {
      await api.delete(`/profile-documents/${item.id}`)
      loadIdentityDocuments()
      promptMessage(`${item.id} has been deleted`)
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <div
      className={inline ? undefined : styles.documentMetadata}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Space vertical>
        {properties.map(({ label, value }) => (
          <div key={label} className={styles.fileMeta}>
            <span className={styles.propertyLabel}>{label}: </span>
            {value}
          </div>
        ))}
        {isDeletable && (
          <Button type="primary" style={{ marginTop: '1rem' }} onClick={deleteDocument}>
            Delete
          </Button>
        )}
      </Space>
    </div>
  )
}

const IdentityDocumentsSection = ({
  profileId,
  profileDocuments,
  loadIdentityDocuments,
  deleteAllLabel = 'Delete All Identity Documents',
  onBeforeDeleteAll,
  onAfterDeleteAll,
}) => {
  if (!profileDocuments) return <LoadingSpinner inline />
  if (!profileDocuments.length) return 'No Identity Documents'
  const shouldShowActionButton = profileDocuments.some(
    ({ type, ddate }) => type !== 'parentalConsent' && !ddate
  )

  const items = profileDocuments.map(
    ({ id, type, extension, filename, size, tcdate, ddate }, index) => ({
      key: id ?? index,
      id,

      src: ddate
        ? `${deletedThumbnail}#${id ?? index}`
        : `${process.env.API_V2_URL}/profile-documents/${id}`,
      isPdf: extension === 'pdf',
      type,
      extension,
      filename,
      size,
      tcdate,
      ddate,
    })
  )

  const deleteAllDocuments = async () => {
    const confirmDelete = window.confirm(
      `Identity documents of ${profileId} will be deleted. This action cannot be undone.`
    )
    if (!confirmDelete) return
    try {
      await onBeforeDeleteAll?.()
      const { deletedCount } = await api.delete(
        `/profile-documents/identity/profiles/${profileId}`
      )
      promptMessage(
        `${inflect(deletedCount, 'document has', 'documents have', true)} been deleted`
      )
      loadIdentityDocuments()
      onAfterDeleteAll?.()
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <div>
      <Image.PreviewGroup
        items={items.map((item) => ({ src: item.src }))}
        preview={{
          imageRender: (originalNode, { current }) => {
            const item = items[current]
            if (!item) return originalNode
            if (item.ddate) {
              return (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    background: '#fff',
                    borderRadius: 4,
                    padding: '2.5rem 3rem',
                    maxWidth: 480,
                    textAlign: 'left',
                  }}
                >
                  <DocumentMetadata
                    item={item}
                    loadIdentityDocuments={loadIdentityDocuments}
                    inline
                  />
                </div>
              )
            }
            let content = originalNode
            if (item.isPdf) {
              content = (
                <iframe
                  title={`Identity document ${current + 1}`}
                  src={item.src}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    width: '80vw',
                    height: '90vh',
                    border: 'none',
                    borderRadius: 4,
                    background: '#fff',
                  }}
                />
              )
            }
            return (
              <>
                {content}
                <DocumentMetadata item={item} loadIdentityDocuments={loadIdentityDocuments} />
              </>
            )
          },

          actionsRender: (originalNode, { current }) =>
            items[current]?.isPdf || items[current]?.ddate ? null : originalNode,
        }}
      >
        <Flex gap="small" wrap align="flex-start">
          {items.map((item, index) => {
            if (item.ddate) {
              return (
                <div key={item.key} style={{ position: 'relative' }}>
                  <Image
                    src={item.src}
                    alt={`Identity document ${index + 1} (deleted)`}
                    width={76}
                    height={100}
                    style={{
                      boxSizing: 'border-box',
                      border: '1px dashed #d9d9d9',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#999',
                      fontSize: '0.75rem',
                      pointerEvents: 'none',
                    }}
                  >
                    Deleted
                  </span>
                </div>
              )
            }
            if (item.isPdf) {
              return (
                <Image
                  key={item.key}
                  src={pdfThumbnail}
                  preview={{ src: item.src }}
                  alt={`Identity document ${index + 1} (PDF)`}
                  width={76}
                  height={100}
                  style={{
                    boxSizing: 'border-box',
                    padding: 18,
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: 4,
                    objectFit: 'contain',
                    cursor: 'pointer',
                  }}
                />
              )
            }
            return (
              <Image
                key={item.key}
                src={item.src}
                alt={`Identity document ${index + 1}`}
                height={100}
                style={{ borderRadius: 4 }}
              />
            )
          })}
        </Flex>
      </Image.PreviewGroup>
      {shouldShowActionButton && (
        <Button type="primary" style={{ marginTop: '.25rem' }} onClick={deleteAllDocuments}>
          {deleteAllLabel}
        </Button>
      )}
    </div>
  )
}

export default IdentityDocumentsSection
