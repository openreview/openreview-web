import { useContext } from 'react'
import ConsoleTaskList from '../ConsoleTaskList'
import WebFieldContext from '../../WebFieldContext'

const EthicsChairTasks = () => {
  const { venueId, ethicsChairsName } = useContext(WebFieldContext)
  const referrer = encodeURIComponent(
    `[Ethics Chair Console](/group?id=${venueId}/${ethicsChairsName}#ethicschair-tasks)`
  )

  return <ConsoleTaskList venueId={venueId} roleName={ethicsChairsName} referrer={referrer} />
}

export default EthicsChairTasks
