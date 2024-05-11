const Icon = ({ name, tooltip, extraClasses = '', onClick}) => (
  <span
    className={`glyphicon glyphicon-${name} ${extraClasses}`}
    data-toggle={tooltip ? 'tooltip' : null}
    data-placement={tooltip ? 'top' : null}
    title={tooltip || null}
    aria-hidden="true"
    onClick={onClick}
  />
)

export default Icon
