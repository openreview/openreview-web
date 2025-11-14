import { useContext } from 'react'
import BaseMenuBar from '../BaseMenuBar'
import QuerySearchInfoModal from '../QuerySearchInfoModal'
import WebFieldContext from '../../WebFieldContext'
import { pluralizeString } from '../../../lib/utils'

const DeskrejectedWithdrawnPapersMenuBar = ({
  tableRowsAll,
  tableRows,
  setRejectedPaperTabData,
  shortPhrase,
  enableQuerySearch,
}) => {
  const { submissionName } = useContext(WebFieldContext)
  const filterOperators = ['!=', '>=', '<=', '>', '<', '==', '=']
  const propertiesAllowed = {
    number: ['number'],
    id: ['note.id'],
    title: ['note.content.title', 'note.content.title.value'],
    author: [
      'note.content.authors.value',
      'note.content.authorids.value',
      'note.authorSearchValue',
    ],
    keywords: ['note.content.keywords', 'note.content.keywords.value'],
    reason: ['reason'],
  }
  const exportColumns = [
    { header: 'number', getValue: (p) => p.number },
    {
      header: 'forum',
      getValue: (p) => `https://openreview.net/forum?id=${p.note?.forum}`,
    },
    {
      header: 'title',
      getValue: (p) => p.note?.content?.title?.value,
    },
    {
      header: 'authors',
      getValue: (p) => p.note?.content?.authors?.value?.join('|') ?? 'N/A',
    },
    { header: 'reason', getValue: (p) => p.reason },
  ]

  const sortOptions = [
    {
      label: `${submissionName} Number`,
      value: 'Paper Number',
      getValue: (p) => p.number,
    },
    {
      label: `${submissionName} Title`,
      value: 'Paper Title',
      getValue: (p) => p.note?.content?.title?.value,
    },
    {
      label: 'Reason',
      value: 'Reason',
      getValue: (p) => p.reason,
    },
  ]

  const basicSearchFunction = (row, term) =>
    row.number == term || // eslint-disable-line eqeqeq
    row.note.content?.title?.value?.toLowerCase()?.includes(term)

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
      exportFileName={`Rejected Withdrawn ${submissionName} Status`}
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
      searchPlaceHolder={`Search desk rejected/withdrawn ${pluralizeString(
        submissionName
      ).toLowerCase()}`}
      extraClasses="rejected-paper-status-menu"
    />
  )
}

export default DeskrejectedWithdrawnPapersMenuBar
