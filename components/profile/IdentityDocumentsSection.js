import { Flex, Image } from 'antd'
import Icon from '../Icon'

const getFileExtension = (documentUrl) => documentUrl?.split('.').pop()?.toLowerCase() ?? ''

const IdentityDocumentsSection = ({ identityDocuments, profileId }) => {
  const documents = Array.isArray(identityDocuments) ? identityDocuments : []
  if (!documents.length) return null

  return (
    <Image.PreviewGroup>
      <Flex vertical gap="small" align="flex-start">
        {documents.map((documentUrl, index) => {
          const src = `${process.env.API_V2_URL}/profiles/attachment?id=${profileId}&name=identityDocuments&index=${index}`

          if (getFileExtension(documentUrl) === 'pdf') {
            return (
              <a
                key={documentUrl ?? index}
                href={src}
                title="Open identity document"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="download-alt" /> Document {index + 1} (PDF)
              </a>
            )
          }

          return (
            <Image
              key={documentUrl ?? index}
              src={src}
              alt={`Identity document ${index + 1}`}
              height={100}
              style={{ borderRadius: 4 }}
            />
          )
        })}
      </Flex>
    </Image.PreviewGroup>
  )
}

export default IdentityDocumentsSection
