import { useContext } from 'react'
import WebFieldContext from '../../WebFieldContext'
import { prettyField } from '../../../lib/utils'
import BaseMenuBar from '../BaseMenuBar'

const SeniorAreaChairStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  setSeniorAreaChairStatusTabData,
}) => {
  const { seniorAreaChairName } = useContext(WebFieldContext)
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

export default SeniorAreaChairStatusMenuBar
