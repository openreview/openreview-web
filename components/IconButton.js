import Icon from './Icon'

const IconButton = ({
  onClick,
  disableButton = false,
  disableReason = null,
  title = null,
  name,
  extraClasses,
  text,
}) => (
  <button
    type="button"
    className="btn btn-xs"
    onClick={onClick}
    title={disableButton && disableReason ? disableReason : title}
    disabled={disableButton}
    aria-label={name}
  >
    <Icon name={name} extraClasses={extraClasses} /> {text}
  </button>
)

export const TrashButton = (props) => <IconButton name="trash" {...props} />

export const RestoreButton = (props) => (
  <IconButton name="repeat" extraClasses="mirror" {...props} />
)

export const EditButton = (props) => <IconButton name="edit" {...props} />

export const SearchButton = (props) => <IconButton name="search" {...props} />

export const ClearButton = (props) => <IconButton name="remove" {...props} />

export default IconButton
