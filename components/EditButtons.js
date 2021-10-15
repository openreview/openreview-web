/* eslint-disable import/prefer-default-export */
import Icon from './Icon'

// eslint-disable-next-line arrow-body-style
export const TrashButton = ({ onClick }) => {
  return (
    <button type="button" className="btn btn-xs" onClick={onClick} title="deleted the edit">
      <Icon name="trash" />
    </button>
  )
}

// eslint-disable-next-line arrow-body-style
export const RestoreButton = ({ onClick }) => {
  return (
    <button type="button" className="btn btn-xs" onClick={onClick} title="restore deleted edit">
      <Icon name="repeat" extraClasses="mirror" />
    </button>
  )
}

// eslint-disable-next-line arrow-body-style
export const EditButton = ({ onClick }) => {
  return (
    <button type="button" className="btn btn-xs" onClick={onClick} title="modify the edit">
      <Icon name="edit" />
    </button>
  )
}
