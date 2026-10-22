import ImageViewer from '../../../components/ImageViewer'

const DocumentViewer = ({ document, height = '70vh' }) => {
  const src = `${process.env.API_V2_URL}/profile-documents/${document.id}`

  if (document.extension === 'pdf') {
    return (
      <iframe
        title={document.filename ?? document.id}
        src={src}
        style={{
          width: '100%',
          height,
          border: '1px solid #f0f0f0',
          borderRadius: 4,
          background: '#fff',
        }}
      />
    )
  }
  return <ImageViewer src={src} alt={document.filename ?? 'Document'} height={height} />
}

export default DocumentViewer
