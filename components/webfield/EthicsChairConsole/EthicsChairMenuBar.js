/* globals promptError: false */
import { useContext } from 'react'
import WebFieldContext from '../../WebFieldContext'
import BaseMenuBar from '../BaseMenuBar'
import QuerySearchInfoModal from '../QuerySearchInfoModal'

const EthicsChairMenuBar = ({ tableRowsAll, tableRows, setPaperStatusTabData }) => {
  const {
    shortPhrase,
    paperStatusExportColumns: exportColumnsConfig,
    filterOperators: filterOperatorsConfig,
    propertiesAllowed: propertiesAllowedConfig,
  } = useContext(WebFieldContext)
  const filterOperators = filterOperatorsConfig ?? ['!=', '>=', '<=', '>', '<', '==', '=']
  const propertiesAllowed = propertiesAllowedConfig ?? {
    number: ['note.number'],
    id: ['note.id'],
    title: ['note.content.title.value'],
    author: ['note.content.authors.value', 'note.content.authorids.value'],
    keywords: ['note.content.keywords.value'],
    reviewer: ['reviewers'],
    numReviewersAssigned: ['numReviewersAssigned'],
    numReviewsDone: ['numReviewsDone'],
    replyCount: ['replyCount'],
  }

  const getValueWithDefault = (value) => {
    if (!value || value === 'N/A') return 0
    return value
  }

  const sortOptions = [
    { label: 'Paper Number', value: 'Paper Number', getValue: (p) => p.note?.number },
    {
      label: 'Paper Title',
      value: 'Paper Title',
      getValue: (p) => p.note?.content?.title?.value,
    },
    {
      label: 'Number of Forum Replies',
      value: 'Number of Forum Replies',
      getValue: (p) => p.replyCount,
      initialDirection: 'desc',
    },
    {
      label: 'Number of Reviewers Assigned',
      value: 'Number of Reviewers Assigned',
      getValue: (p) => p.numReviewersAssigned,
      initialDirection: 'desc',
    },
    {
      label: 'Number of Reviews Submitted',
      value: 'Number of Reviews Submitted',
      getValue: (p) => p.numReviewsDone,
      initialDirection: 'desc',
    },
    {
      label: 'Number of Reviews Missing',
      value: 'Number of Reviews Missing',
      getValue: (p) =>
        getValueWithDefault(p.numReviewersAssigned) - getValueWithDefault(p.numReviewsDone),
      initialDirection: 'desc',
    },
  ]
  const basicSearchFunction = (row, term) =>
    row.note.number == term || // eslint-disable-line eqeqeq
    row.note.content?.title?.value?.toLowerCase()?.includes(term)
  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      setData={setPaperStatusTabData}
      shortPhrase={shortPhrase}
      enableQuerySearch={true}
      filterOperators={filterOperators}
      propertiesAllowed={propertiesAllowed}
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
      extraClasses="ethics-chairs-menu-bar"
    />
  )
}

export default EthicsChairMenuBar
