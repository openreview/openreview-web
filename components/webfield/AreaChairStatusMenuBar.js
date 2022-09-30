import BaseMenuBar from './BaseMenuBar'
import { MessageAreaChairsModal } from './MessageModal'
import QuerySearchInfoModal from './QuerySearchInfoModal'

const AreaChairStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  selectedNoteIds,
  setAreaChairStatusTabData,
  shortPhrase,
  enableQuerySearch,
  filterOperators: filterOperatorsConfig,
  propertiesAllowed: propertiesAllowedConfig,
  bidEnabled,
  recommendationEnabled,
  messageParentGroup,
}) => {
  const filterOperators = filterOperatorsConfig ?? ['!=', '>=', '<=', '>', '<', '=']
  const propertiesAllowed = propertiesAllowedConfig ?? {
    number: ['number'],
    name: ['areaChairProfile.preferredName'],
    email: ['areaChairProfile.preferredEmail'],
    sac: ['areaChairProfile.seniorAreaChair.seniorAreaChairId'],
  }
  const messageAreaChairOptions = [
    ...(bidEnabled
      ? [
          {
            label: 'Area Chairs with 0 bids',
            value: 'noBids',
          },
        ]
      : []),
    ...(recommendationEnabled
      ? [
          {
            label: 'Area Chairs with 0 recommendations',
            value: 'noRecommendations',
          },
        ]
      : []),
    { label: 'Area Chairs with unsubmitted reviews', value: 'missingReviews' },
    { label: 'Area Chairs with 0 submitted meta reviews', value: 'noMetaReviews' },
    {
      label: 'Area Chairs with unsubmitted meta reviews',
      value: 'missingMetaReviews',
    },
  ]
  const exportColumns = [
    { header: 'id', getValue: (p) => p },
    { header: 'id', getValue: (p) => p },
    { header: 'id', getValue: (p) => p },
    { header: 'id', getValue: (p) => p },
    { header: 'id', getValue: (p) => p },
    { header: 'id', getValue: (p) => p },
  ]
  const sortOptions = [
    {
      label: 'Area Chair',
      value: 'Area Chair',
      getValue: (p) => p.areaChairProfile?.preferredName,
    },
    {
      label: 'Bids Completed',
      value: 'Bids Completed',
      getValue: (p) => p.completedBids,
    },
    {
      label: 'Reviewer Recommendations Completed',
      value: 'Reviewer Recommendations Completed',
      getValue: (p) => p.completedRecommendations,
    },
    {
      label: 'Papers Assigned',
      value: 'Papers Assigned',
      getValue: (p) => p.notes?.length,
    },
    {
      label: 'Papers with Completed Review Missing',
      value: 'Papers with Completed Review Missing',
      getValue: (p) => p.notes?.length ?? 0 - p.numCompletedReviews ?? 0,
    },
    {
      label: 'Papers with Completed Review',
      value: 'Papers with Completed Review',
      getValue: (p) => p.numCompletedReviews,
    },
    {
      label: 'Papers with Completed MetaReview Missing',
      value: 'Papers with Completed MetaReview Missing',
      getValue: (p) => p.notes?.length ?? 0 - p.numCompletedMetaReviews,
    },
    {
      label: 'Papers with Completed MetaReview',
      value: 'Papers with Completed MetaReview',
      getValue: (p) => p.numCompletedMetaReviews,
    },
  ]
  const basicSearchFunction = (row, term) => {
    return row.areaChairProfileId.toLowerCase().includes(term)
  }
  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      selectedIds={selectedNoteIds}
      setData={setAreaChairStatusTabData}
      shortPhrase={shortPhrase}
      enableQuerySearch={enableQuerySearch}
      filterOperators={filterOperators}
      propertiesAllowed={propertiesAllowed}
      messageDropdownLabel="Message Area Chairs"
      messageOptions={messageAreaChairOptions}
      messageModalId="message-areachairs"
      messageParentGroup={messageParentGroup}
      exportColumns={exportColumns}
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      messageModal={(props) => <MessageAreaChairsModal {...props} />}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
      extraClasses="ac-status-menu"
    />
  )
}

export default AreaChairStatusMenuBar
