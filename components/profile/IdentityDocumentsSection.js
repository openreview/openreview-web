import { Flex, Image } from 'antd'

const getFileExtension = (documentUrl) => documentUrl?.split('.').pop()?.toLowerCase() ?? ''

const pdfThumbnail = '/images/pdf_icon_blue.svg'

const IdentityDocumentsSection = ({ identityDocuments, profileId }) => {
  const documents = Array.isArray(identityDocuments) ? identityDocuments : []
  if (!documents.length) return null

  const items = documents.map((documentUrl, index) => ({
    key: documentUrl ?? index,
    src: `${process.env.API_V2_URL}/profiles/attachment?id=${profileId}&name=identityDocuments&index=${index}`,
    isPdf: getFileExtension(documentUrl) === 'pdf',
  }))

  return (
    <Image.PreviewGroup
      preview={{
        imageRender: (originalNode, { current }) => {
          const item = items[current]
          if (!item?.isPdf) return originalNode
          return (
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
  )
}

export default IdentityDocumentsSection
