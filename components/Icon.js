const Icon = ({ name, extraClasses = '' }) => (
  <span className={`glyphicon glyphicon-${name} ${extraClasses}`} aria-hidden="true" />
)

export default Icon
