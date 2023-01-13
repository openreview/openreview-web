import DownloadPDFButton from '../DownloadPDFButton'

const ReviewerConsoleMenuBar = ({ venueId, records }) => {
  return (
    <div className="menu-bar">
      <DownloadPDFButton
        records={records?.map((p) => ({ note: p }))}
        fileName={`${venueId}_pdfs.zip`}
        text="Download all PDFs"
      />
      <div className="space-taker" />
    </div>
  )
}

export default ReviewerConsoleMenuBar
