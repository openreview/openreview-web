import BaseMenuBar from '../BaseMenuBar'
import QuerySearchInfoModal from '../QuerySearchInfoModal'

const DeskrejectedWithdrawnPapersMenuBar = ({
  tableRowsAll,
  tableRows,
  setRejectedPaperTabData,
  shortPhrase,
  enableQuerySearch,
}) => {
  const filterOperators = ['!=', '>=', '<=', '>', '<', '==', '=']
  const propertiesAllowed = {
    number: ['number'],
    id: ['note.id'],
    title: ['note.content.title', 'note.content.title.value'],
    author: [
      'note.content.authors',
      'note.content.authorids',
      'note.content.authors.value',
      'note.content.authorids.value',
      'originalNote.content.authors',
      'originalNote.content.authorids',
    ],
    keywords: ['note.content.keywords', 'note.content.keywords.value'],
    reason: ['reason'],
  }
  const exportColumns = [
    { header: 'number', getValue: (p) => p.originalNote?.number ?? p.number },
    {
      header: 'forum',
      getValue: (p) =>
        `https://openreview.net/forum?id=${p.originalNote?.forum ?? p.note?.forum}`,
    },
    {
      header: 'title',
      getValue: (p, isV2Note) =>
        isV2Note
          ? p.note?.content?.title?.value
          : p.originalNote?.content?.title ?? p.note?.content?.title,
    },
    {
      header: 'authors',
      getValue: (p, isV2Note) =>
        (isV2Note
          ? p.note?.content?.authors?.value
          : p.originalNote?.content?.authors ?? p.note?.content?.authors
        )?.join('|'),
    },
    { header: 'reason', getValue: (p) => p.reason },
  ]

  const sortOptions = [
    {
      label: 'Paper Number',
      value: 'Paper Number',
      getValue: (p) => p.number,
    },
    {
      label: 'Paper Title',
      value: 'Paper Title',
      getValue: (p) =>
        p.note?.version === 2 ? p.note?.content?.title?.value : p.note?.content?.title,
    },
    {
      label: 'Reason',
      value: 'Reason',
      getValue: (p) => p.reason,
    },
  ]

  const basicSearchFunction = (row, term) => {
    const noteTitle =
      row.note.version === 2 ? row.note.content?.title?.value : row.note.content?.title
    return (
      row.number == term || // eslint-disable-line eqeqeq
      noteTitle.toLowerCase().includes(term)
    )
  }

  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      setData={setRejectedPaperTabData}
      shortPhrase={shortPhrase}
      enableQuerySearch={enableQuerySearch}
      filterOperators={filterOperators}
      propertiesAllowed={propertiesAllowed}
      exportColumns={exportColumns}
      exportFileName="Rejected Withdrawn Paper Status"
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
      searchPlaceHolder="Search desk rejected/withdrawn papers"
      extraClasses="rejected-paper-status-menu"
    />
  )
}

export default DeskrejectedWithdrawnPapersMenuBar
