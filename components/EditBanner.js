export default function EditBanner({ children }) {
  if (!children) return null

  return (
    <div id="edit-banner" className="alert alert-warning" role="alert">
      <div className="container">
        <div className="row">
          <div className="col-xs-12">
            <div className="alert-content">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
