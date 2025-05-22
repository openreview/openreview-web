'use client'

import { useState } from 'react'
import Icon from './Icon'

const UnlinkPublicationButton = ({ noteId, linkUnlinkPublication, isUnlinked }) => {
  const [iconType, setIconType] = useState(isUnlinked ? 'repeat' : 'minus-sign')
  const shouldUnlink = iconType === 'minus-sign'
  const extraClasses = shouldUnlink ? 'unlink-publication' : 'unlink-publication mirror'

  const handleClick = () => {
    setIconType(shouldUnlink ? 'repeat' : 'minus-sign')
    linkUnlinkPublication(noteId, shouldUnlink)
  }

  return (
    <span role="button" tabIndex={0} onClick={handleClick}>
      <Icon
        name={iconType}
        extraClasses={extraClasses}
        tooltip={shouldUnlink ? 'unlink this paper' : 'relink this paper'}
      />
    </span>
  )
}

export default UnlinkPublicationButton
