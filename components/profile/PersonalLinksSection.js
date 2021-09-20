const PersonalLinksSection = () => {
  const abc = 123
  return (
    <section>
      <h4>Personal Links</h4>
      <p className="instructions">Enter full URLs of your public profiles on other sites. All URLs should begin with http or https.</p>
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <div className="small-heading">Homepage URL</div>
            <input className="form-control personal-links__input" />
          </div>
          <div className="col-md-6">
            <div className="small-heading">Google Scholar URL</div>
            <input className="form-control personal-links__input" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default PersonalLinksSection
