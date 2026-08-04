import { Button, Flex, Image, Space } from 'antd'
import api from '../../lib/api-client'
import { formatDateTime, inflect } from '../../lib/utils'
import LoadingSpinner from '../LoadingSpinner'

import styles from '../../styles/components/IdentityDocumentsSection.module.scss'

const pdfThumbnail = '/images/pdf_icon_blue.svg'

const DocumentMetadata = ({ item, loadIdentityDocuments }) => {
  const properties = [
    { label: 'File Name', value: item.filename },
    { label: 'Document Type', value: item.type },
    { label: 'File Type', value: item.extension },
    { label: 'Size', value: item.size },
    {
      label: 'Uploaded',
      value: item.tcdate ? formatDateTime(item.tcdate, { second: undefined }) : null,
    },
  ]
  const isDeletable = item.type !== 'parentalConsent'

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
    <div className={styles.documentMetadata} onMouseDown={(e) => e.stopPropagation()}>
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

const IdentityDocumentsSection = ({ profileId, profileDocuments, loadIdentityDocuments }) => {
  if (!profileDocuments) return <LoadingSpinner inline />
  if (!profileDocuments.length) return 'No Identity Documents'

  const items = profileDocuments.map(
    ({ id, type, extension, filename, size, tcdate }, index) => ({
      key: id ?? index,
      id,
      src: `${process.env.API_V2_URL}/profile-documents/${id}`,
      isPdf: extension === 'pdf',
      type,
      extension,
      filename,
      size,
      tcdate,
    })
  )

  const deleteAllDocuments = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete all identity documents of ${profileId}? This action cannot be undone.`
    )
    if (!confirmDelete) return
    try {
      const { deletedCount } = await api.delete(
        `/profile-documents/identity/profiles/${profileId}`
      )
      promptMessage(
        `${inflect(deletedCount, 'document has', 'documents have', true)} been deleted`
      )
      loadIdentityDocuments()
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <div>
      <Image.PreviewGroup
        preview={{
          imageRender: (originalNode, { current }) => {
            const item = items[current]
            if (!item) return originalNode
            const content = item.isPdf ? (
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
            ) : (
              originalNode
            )
            return (
              <>
                {content}
                <DocumentMetadata item={item} loadIdentityDocuments={loadIdentityDocuments} />
              </>
            )
          },

          actionsRender: (originalNode, { current }) =>
            items[current]?.isPdf ? null : originalNode,
        }}
      >
        <Flex gap="small" wrap align="flex-start">
          {items.map((item, index) =>
            item.isPdf ? (
              <Image
                key={item.key}
                src={pdfThumbnail}
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
            ) : (
              <Image
                key={item.key}
                src={item.src}
                alt={`Identity document ${index + 1}`}
                height={100}
                style={{ borderRadius: 4 }}
              />
            )
          )}
        </Flex>
      </Image.PreviewGroup>
      <Button type="primary" style={{ marginTop: '.25rem' }} onClick={deleteAllDocuments}>
        Delete All Identity Documents
      </Button>
    </div>
  )
}

export default IdentityDocumentsSection
