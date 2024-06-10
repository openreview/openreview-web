/* globals promptError: false */
import { useContext } from 'react'
import WebFieldContext from '../../WebFieldContext'
import ConsoleTaskList from '../ConsoleTaskList'
import { prettyField } from '../../../lib/utils'

const SeniorAreaChairTasks = () => {
  const { venueId, seniorAreaChairName } = useContext(WebFieldContext)
  const referrer = encodeURIComponent(
    `[${prettyField(
      seniorAreaChairName
    )} Console](/group?id=${venueId}/${seniorAreaChairName}#${seniorAreaChairName}-tasks)`
  )

  return (
    <ConsoleTaskList venueId={venueId} roleName={seniorAreaChairName} referrer={referrer} />
  )
}

export default SeniorAreaChairTasks
