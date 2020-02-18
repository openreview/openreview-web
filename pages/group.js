import Link from 'next/link'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../lib/api-client'
import { prettyId, formatTimestamp } from '../lib/utils'

// Page Styles
import '../styles/pages/group.less'

const Group = () => (
  <div id="group-container">
    <LoadingSpinner />
  </div>
)

export default Group
