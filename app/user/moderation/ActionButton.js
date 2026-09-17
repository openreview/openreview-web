import { Button } from 'antd'

import { moderation as legacyStyles } from '../../../lib/legacy-bootstrap-styles'

const ActionButton = (props) => (
  <Button
    type="primary"
    size="small"
    styles={{ root: legacyStyles.actionButton }}
    {...props}
  />
)

export default ActionButton
