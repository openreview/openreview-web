function Alert({ color, dismissible, children }) {
  return (
    <div
      className={`alert alert-${color} ${dismissible ? 'alert-dismissible' : ''}`}
      role="alert"
    >
      {dismissible && (
        <button type="button" className="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      )}
      {children}
    </div>
  )
}

export default Alert
