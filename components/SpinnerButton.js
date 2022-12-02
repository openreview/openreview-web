export default function SpinnerButton({
  type,
  onClick,
  disabled,
  loading,
  className,
  children,
  size = 'sm',
}) {
  return (
    <button
      type="button"
      className={`btn btn-${size} btn-${type}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}{' '}
      {loading && (
        <div className="spinner-small">
          <div className="rect1" />
          <div className="rect2" />
          <div className="rect3" />
          <div className="rect4" />
        </div>
      )}
    </button>
  )
}
