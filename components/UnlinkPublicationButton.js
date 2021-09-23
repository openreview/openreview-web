import { useState } from 'react'
import Icon from './Icon'

const UnlinkPublicationButton = ({ noteId, linkUnlinkPublication }) => {
  const [iconType, setIconType] = useState('minus-sign')
  const extraClasses = iconType === 'minus-sign' ? 'unlink-publication' : 'unlink-publication mirror'

  const handleClick = () => {
    const shouldUnlink = iconType === 'minus-sign'
    setIconType(shouldUnlink ? 'repeat' : 'minus-sign')
    linkUnlinkPublication(noteId, shouldUnlink)
  }

  return (
    <Icon name={iconType} extraClasses={extraClasses} tooltip="Privately revealed to you" onClick={handleClick} />
  )
}

export default UnlinkPublicationButton
