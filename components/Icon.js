const Icon = ({ name, tooltip, extraClasses = '', style }) => (
  <span
    className={`glyphicon glyphicon-${name} ${extraClasses}`}
    style={style}
    data-toggle={tooltip ? 'tooltip' : null}
    data-placement={tooltip ? 'top' : null}
    title={tooltip || null}
    aria-hidden="true"
  />
)

export default Icon
