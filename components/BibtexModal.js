import { Button, Modal, Typography } from 'antd'

const BibtexModal = ({ bibtexContent, showBibtex, setShowBibtex }) => {
  return (
    <Modal
      centered
      title="BibTeX Record"
      open={showBibtex}
      onCancel={() => setShowBibtex(false)}
      footer={
        <Button type="primary" onClick={() => setShowBibtex(false)}>
          Done
        </Button>
      }
    >
      <Typography.Paragraph copyable>
        <pre>{bibtexContent}</pre>
      </Typography.Paragraph>
    </Modal>
  )
}

export default BibtexModal
