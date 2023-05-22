/* globals promptError: false */
import { useContext } from 'react'
import WebFieldContext from '../../WebFieldContext'
import ConsoleTaskList from '../ConsoleTaskList'

const SeniorAreaChairTasks = () => {
  const { venueId, seniorAreaChairName } = useContext(WebFieldContext)
  const referrer = encodeURIComponent(
    `[Senior Area Chair Console](/group?id=${venueId}/${seniorAreaChairName}#seniorareachair-tasks)`
  )

  return (
    <ConsoleTaskList venueId={venueId} roleName={seniorAreaChairName} referrer={referrer} />
  )
}

export default SeniorAreaChairTasks
