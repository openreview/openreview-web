import { useContext } from 'react'
import BaseMenuBar from '../BaseMenuBar'
import WebFieldContext from '../../WebFieldContext'
import { pluralizeString, prettyField } from '../../../lib/utils'
import QuerySearchInfoModal from '../QuerySearchInfoModal'
import { MessageACSACModal } from './AreaChairStatusMenuBar'

const SeniorAreaChairStatusMenuBarForDirectPaperAssignment = ({
  tableRowsAll,
  tableRows,
  setSeniorAreaChairStatusTabData,
}) => {
  const {
    venueId,
    shortPhrase,
    seniorAreaChairsId,
    enableQuerySearch,
    sacEmailFuncs,
    areaChairStatusExportColumns: exportColumnsConfig,
    filterOperators: filterOperatorsConfig,
    sacStatuspropertiesAllowed: propertiesAllowedConfig,
    seniorAreaChairName = 'Senior_Area_Chairs',
    officialReviewName,
    officialMetaReviewName = 'Meta_Review',
    submissionName,
  } = useContext(WebFieldContext)
  const filterOperators = filterOperatorsConfig ?? ['!=', '>=', '<=', '>', '<', '==', '=']
  const propertiesAllowed = propertiesAllowedConfig ?? {
    number: ['number'],
    name: ['sacProfile.preferredName'],
    email: ['areaChairProfile.preferredEmail'],
  }
  const messageSeniorAreaChairOptions = [
    {
      label: `${prettyField(seniorAreaChairName)} with unsubmitted ${pluralizeString(
        prettyField(officialReviewName)
      ).toLowerCase()}`,
      value: 'missingReviews',
    },
    {
      label: `${prettyField(seniorAreaChairName)} with 0 submitted ${pluralizeString(
        prettyField(officialMetaReviewName)
      ).toLowerCase()}`,
      value: 'noMetaReviews',
    },
    {
      label: `${prettyField(seniorAreaChairName)} with unsubmitted ${pluralizeString(
        prettyField(officialMetaReviewName)
      ).toLowerCase()}`,
      value: 'missingMetaReviews',
    },
    {
      label: `${prettyField(seniorAreaChairName)} with 0 assignments`,
      value: 'missingAssignments',
    },
    ...(sacEmailFuncs ?? []),
  ]
  const exportColumns = [
    { header: 'id', getValue: (p) => p.sacProfileId },
    {
      header: 'name',
      getValue: (p) => p.sacProfile?.preferredName ?? p.sacProfileId,
    },
    {
      header: 'email',
      getValue: (p) => p.sacProfile?.preferredEmail ?? p.sacProfileId,
    },
    { header: `assigned ${submissionName}`, getValue: (p) => p.notes?.length },
    {
      header: `${prettyField(officialReviewName)} completed`,
      getValue: (p) => p.numCompletedReviews,
    },
    {
      header: `${prettyField(officialMetaReviewName)} completed`,
      getValue: (p) => p.numCompletedMetaReviews,
    },
    ...(exportColumnsConfig ?? []),
  ]
  const sortOptions = [
    {
      label: prettyField(seniorAreaChairName),
      value: 'Senior Area Chair',
      getValue: (p) => p.number,
    },
    {
      label: `${prettyField(seniorAreaChairName)} Name`,
      value: 'Senior Area Chair Name',
      getValue: (p) => p.sacProfile?.preferredName ?? p.sacProfileId,
    },
    {
      label: `Number of ${pluralizeString(submissionName)} Assigned`,
      value: 'Number of Papers Assigned',
      getValue: (p) => p.notes?.length,
      initialDirection: 'desc',
    },
    {
      label: `Number of ${pluralizeString(submissionName)} with Missing ${pluralizeString(
        prettyField(officialReviewName)
      )}`,
      value: 'Number of Papers with Missing Reviews',
      getValue: (p) => (p.notes?.length ?? 0) - p.numCompletedReviews ?? 0,
      initialDirection: 'desc',
    },
    {
      label: `Number of ${pluralizeString(submissionName)} with Completed ${pluralizeString(
        prettyField(officialReviewName)
      )}`,
      value: 'Number of Papers with Completed Reviews',
      getValue: (p) => p.numCompletedReviews,
      initialDirection: 'desc',
    },
    {
      label: `Number of Missing ${pluralizeString(prettyField(officialMetaReviewName))}`,
      value: 'Number of Missing MetaReviews',
      getValue: (p) => (p.notes?.length ?? 0) - p.numCompletedMetaReviews,
      initialDirection: 'desc',
    },
    {
      label: `Number of Completed ${pluralizeString(prettyField(officialMetaReviewName))}`,
      value: 'Number of Completed MetaReviews',
      getValue: (p) => p.numCompletedMetaReviews,
      initialDirection: 'desc',
    },
  ]
  const basicSearchFunction = (row, term) =>
    (row.sacProfile?.preferredName.toLowerCase() ?? row.sacProfileId.toLowerCase()).includes(
      term
    )

  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      setData={setSeniorAreaChairStatusTabData}
      shortPhrase={shortPhrase}
      enableQuerySearch={enableQuerySearch}
      filterOperators={filterOperators}
      propertiesAllowed={propertiesAllowed}
      messageDropdownLabel={`Message ${prettyField(seniorAreaChairName)}`}
      messageOptions={messageSeniorAreaChairOptions}
      messageModalId="message-seniorareachairs"
      messageParentGroup={seniorAreaChairsId}
      messageSignature={venueId}
      exportColumns={exportColumns}
      exportFileName={`${prettyField(seniorAreaChairName)} Status`}
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      messageModal={(props) => <MessageACSACModal {...props} isMessageSeniorAreaChairs />}
      querySearchInfoModal={(props) => <QuerySearchInfoModal {...props} />}
      extraClasses="ac-status-menu"
    />
  )
}

const SeniorAreaChairStatusMenuBarForACAssignment = ({
  tableRowsAll,
  tableRows,
  setSeniorAreaChairStatusTabData,
}) => {
  const { seniorAreaChairName = 'Senior_Area_Chairs', } = useContext(WebFieldContext)
  const sortOptions = [
    {
      label: prettyField(seniorAreaChairName),
      value: 'Senior Area Chair',
      getValue: (p) => p.number,
    },
    {
      label: `${prettyField(seniorAreaChairName)} Name`,
      value: 'Senior Area Chair Name',
      getValue: (p) => p.sacProfile?.preferredName ?? p.sacProfileId,
    },
  ]
  const basicSearchFunction = (row, term) =>
    (row.sacProfile?.preferredName.toLowerCase() ?? row.sacProfileId.toLowerCase()).includes(
      term
    )

  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      setData={setSeniorAreaChairStatusTabData}
      enableQuerySearch={false}
      sortOptions={sortOptions}
      exportFileName={`${prettyField(seniorAreaChairName)} Status`}
      basicSearchFunction={basicSearchFunction}
      searchPlaceHolder={`Search all ${prettyField(seniorAreaChairName)}`}
      extraClasses="sac-status-menu"
    />
  )
}
const SeniorAreaChairStatusMenuBar = (props) => {
  const { sacDirectPaperAssignment, ...otherProps } = props
  if (sacDirectPaperAssignment) {
    return <SeniorAreaChairStatusMenuBarForDirectPaperAssignment {...otherProps} />
  }
  return <SeniorAreaChairStatusMenuBarForACAssignment {...otherProps} />
}

export default SeniorAreaChairStatusMenuBar
