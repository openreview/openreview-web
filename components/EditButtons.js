/* eslint-disable import/prefer-default-export */
import Icon from './Icon'

// eslint-disable-next-line arrow-body-style
export const TrashButton = ({ onClick, disableButton = false, disableReason = null }) => {
  return (
    <button type="button" className="btn btn-xs" onClick={onClick} title={disableReason ?? 'deleted the edit'} disabled={disableButton}>
      <Icon name="trash" />
    </button>
  )
}

// eslint-disable-next-line arrow-body-style
export const RestoreButton = ({ onClick, disableButton = false, disableReason = null }) => {
  return (
    <button type="button" className="btn btn-xs" onClick={onClick} title={disableReason ?? 'restore deleted edit'} disabled={disableButton}>
      <Icon name="repeat" extraClasses="mirror" />
    </button>
  )
}

// eslint-disable-next-line arrow-body-style
export const EditButton = ({ onClick, disableButton = false, disableReason = null }) => {
  return (
    <button type="button" className="btn btn-xs" onClick={onClick} title={disableReason ?? 'modify the edit'} disabled={disableButton}>
      <Icon name="edit" />
    </button>
  )
}
