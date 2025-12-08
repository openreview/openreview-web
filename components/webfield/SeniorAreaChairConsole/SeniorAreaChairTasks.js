/* globals promptError: false */
import { useContext } from 'react'
import WebFieldContext from '../../WebFieldContext'
import ConsoleTaskList from '../ConsoleTaskList'
import { prettyField, getRoleHashFragment } from '../../../lib/utils'

const SeniorAreaChairTasks = () => {
  const { venueId, seniorAreaChairName, additionalDomains = [] } = useContext(WebFieldContext)
  const seniorAreaChairUrlFormat = getRoleHashFragment(seniorAreaChairName)
  const referrer = encodeURIComponent(
    `[${prettyField(
      seniorAreaChairName
    )} Console](/group?id=${venueId}/${seniorAreaChairName}#${seniorAreaChairUrlFormat}-tasks)`
  )

  return (
    <ConsoleTaskList
      venueId={venueId}
      roleName={seniorAreaChairName}
      referrer={referrer}
      additionalDomains={additionalDomains}
    />
  )
}

export default SeniorAreaChairTasks
