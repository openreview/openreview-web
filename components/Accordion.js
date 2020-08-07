import Icon from './Icon'

const Accordion = ({ title, sections, options }) => (
  <div
    id={options.id}
    className={`webfield-accordion panel-group ${options.extraClasses}`}
    role="tablist"
    aria-multiselectable="true"
  >
    <h3>{title}</h3>
    {sections.map((section, i) => {
      const sectionId = section.id || `${options.id}-section-${i}`
      return (
        <div key={sectionId} className="panel panel-default">
          <SectionHeading id={sectionId} heading={section.heading} options={options} />
          <SectionBody id={sectionId} body={section.body} options={options} />
          <hr className="webfield-accordion-divider" />
        </div>
      )
    })}
  </div>
)

const SectionHeading = ({ id, heading, options }) => (
  <div className="panel-heading" role="tab">
    <h4 className="panel-title">
      <SectionHeadingLink targetId={id} parentId={options.id}>
        <Icon name="triangle-bottom" />
      </SectionHeadingLink>
      {' '}
      <SectionHeadingLink targetId={id} parentId={options.id}>
        {heading}
      </SectionHeadingLink>
    </h4>
  </div>
)

const SectionHeadingLink = ({ targetId, parentId, children }) => (
  <a
    href={`#${targetId}`}
    className="collapse-btn collapsed"
    role="button"
    data-toggle="collapse"
    data-parent={parentId}
    aria-controls={targetId}
  >
    {children}
  </a>
)

const SectionBody = ({ id, body, options }) => (
  <div
    id={id}
    className="panel-collapse collapse"
    role="tabpanel"
  >
    <div className="panel-body">
      {options.html ? (
        // eslint-disable-next-line react/no-danger
        <div dangerouslySetInnerHTML={{ __html: body }} />
      ) : (
        <p>{body}</p>
      )}
    </div>
  </div>
)

export default Accordion
