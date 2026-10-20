'use client'

import Icon from './Icon'

const UnlinkPublicationButton = ({ noteId, linkUnlinkPublication, isUnlinked }) => {
  const label = isUnlinked ? 'relink this paper' : 'unlink this paper'

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => linkUnlinkPublication(noteId, !isUnlinked)}
      aria-label={label}
    >
      <Icon
        name={isUnlinked ? 'repeat' : 'minus-sign'}
        extraClasses={isUnlinked ? 'unlink-publication mirror' : 'unlink-publication'}
        tooltip={label}
      />
    </span>
  )
}

export default UnlinkPublicationButton
