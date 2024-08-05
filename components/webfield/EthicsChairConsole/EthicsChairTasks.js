import { useContext } from 'react'
import ConsoleTaskList from '../ConsoleTaskList'
import WebFieldContext from '../../WebFieldContext'
import { getRoleHashFragment } from '../../../lib/utils'

const EthicsChairTasks = () => {
  const { venueId, ethicsChairsName } = useContext(WebFieldContext)
  const ethicsChairsUrlFormat = getRoleHashFragment(ethicsChairsName)
  const referrer = encodeURIComponent(
    `[Ethics Chair Console](/group?id=${venueId}/${ethicsChairsName}#${ethicsChairsUrlFormat}-tasks)`
  )

  return <ConsoleTaskList venueId={venueId} roleName={ethicsChairsName} referrer={referrer} />
}

export default EthicsChairTasks
