const Contact = () => (
  <div>
    <div className="row">
      <div className="col-xs-12 col-md-10 col-md-offset-1"><h1>Contact Us</h1></div>
    </div>

    <div className="row">
      <div className="col-xs-12 col-md-10 col-md-offset-1">
        <p>
          We are currently supporting several computer science conferences and
          workshops, and are open to hosting journals and conferences in any
          field; please contact us at <a href="mailto:info@openreview.net">info@openreview.net</a>
          for more information.
        </p>
        <p>
          If you'd like to send feedback to the developers, please use the{' '}
          <a href="#" data-toggle="modal" data-target="#feedback-modal">Feedback form</a>.
        </p>
      </div>
    </div>
  </div>
)

Contact.title = 'Contact'

export default Contact
