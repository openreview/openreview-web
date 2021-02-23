const Icon = ({ name, tooltip, extraClasses = '' }) => (
  <span
    className={`glyphicon glyphicon-${name} ${extraClasses}`}
    data-toggle={tooltip ? 'tooltip' : null}
    data-placement={tooltip ? 'top' : null}
    data-container="body"
    title={tooltip || null}
    aria-hidden="true"
  />
)

export default Icon
