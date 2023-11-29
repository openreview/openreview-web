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

// eslint-disable-next-line react/jsx-props-no-spreading
export const TrashButton = (props) => <IconButton name="trash" {...props} />

// eslint-disable-next-line react/jsx-props-no-spreading
export const RestoreButton = (props) => (
  <IconButton name="repeat" extraClasses="mirror" {...props} />
)

// eslint-disable-next-line react/jsx-props-no-spreading
export const EditButton = (props) => <IconButton name="edit" {...props} />

// eslint-disable-next-line react/jsx-props-no-spreading
export const SearchButton = (props) => <IconButton name="search" {...props} />

export default IconButton
