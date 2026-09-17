import { Button } from 'antd'

import { moderation as legacyStyles } from '../../../lib/legacy-bootstrap-styles'

/**
 * The small primary button the moderation rows use for accept, block, delete and the rest,
 * so every action a moderator can take on a profile looks the same wherever it appears.
 */
const ActionButton = (props) => (
  <Button
    type="primary"
    size="small"
    styles={{ root: legacyStyles.actionButton }}
    {...props}
  />
)

export default ActionButton
