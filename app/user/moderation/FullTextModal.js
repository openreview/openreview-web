import BasicModal from '../../../components/BasicModal'

export default function FullTextModal({ id, textToView, setTextToView }) {
  return (
    <BasicModal
      id={id}
      onClose={() => setTextToView(null)}
      primaryButtonText={null}
      cancelButtonText="OK"
    >
      {textToView}
    </BasicModal>
  )
}
