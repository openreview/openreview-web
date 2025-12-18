import BaseMenuBar from './BaseMenuBar'
import QuerySearchInfoModal from './QuerySearchInfoModal'

const ReviewerConsoleMenuBar = ({
  venueId,
  tableRowsAll,
  tableRows,
  setReviewerConsoleData,
  submissionName,
}) => {
  const filterOperators = ['!=', '>=', '<=', '>', '<', '==', '=']
  const propertiesAllowed = {
    number: ['note.number'],
    id: ['note.id'],
    title: ['note.content.title.value'],
    venue: ['note.content.venue.value'],
  }

  const sortOptions = [
    {
      label: `${submissionName} Number`,
      value: 'Paper Number',
      getValue: (p) => p.note?.number,
    },
    {
      label: `${submissionName} Title`,
      value: 'Paper Title',
      getValue: (p) =>
        p.note?.version === 2 ? p.note?.content?.title?.value : p.note?.content?.title,
    },

    {
      label: 'Venue',
      value: 'Venue',
      getValue: (p) => p.note?.content?.venue?.value,
    },
  ]

  const basicSearchFunction = (row, term) =>
    row.note.number == term || row.note.content?.title?.value?.toLowerCase()?.includes(term)

  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      setData={setReviewerConsoleData}
      shortPhrase={venueId}
      enableQuerySearch={true}
      filterOperators={filterOperators}
      propertiesAllowed={propertiesAllowed}
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
      enablePDFDownload={true}
    />
  )
}

export default ReviewerConsoleMenuBar
