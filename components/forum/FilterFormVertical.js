export default function FilterFormVertical() {
  return (
    <aside className="filters">
      <form className="form-horizontal">
        <div className="form-group">
          <label htmlFor="keyword-input" className="col-sm-3 control-label">Sort:</label>
          <div className="col-sm-9">
            <select className="form-control">
              <option>Most Recent</option>
              <option>Most Tagged</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="keyword-input" className="col-sm-3 control-label">Type:</label>
          <div className="col-sm-9">
            <select className="form-control">
              <option>All</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="keyword-input" className="col-sm-3 control-label">Author:</label>
          <div className="col-sm-9">
            <select className="form-control">
              <option>All</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="keyword-input" className="col-sm-3 control-label">Tag:</label>
          <div className="col-sm-9">
            <select className="form-control" disabled>
              <option> </option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="keyword-input" className="col-sm-3 control-label">Search:</label>
          <div className="col-sm-9">
            <input type="text" className="form-control" id="keyword-input" placeholder="Keywords" />
          </div>
        </div>
      </form>
    </aside>
  )
}
