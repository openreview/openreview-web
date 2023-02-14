import { prettyId } from '../../lib/utils'

import styles from '../../styles/components/ChatFilterForm.module.scss'
import Icon from '../Icon'

export default function ChatFilterForm({ readers }) {
  return (
    <form className={`form-inline chat-filter-controls ${styles.container}`}>
      {readers && (
        <p className="mb-0">
          <Icon name="info-sign" />{' '}
          <em>Chat replies are visible only to {readers.map(prettyId).join(', ')}</em>
        </p>
      )}
    </form>
  )
}
