import Icon from './Icon'

const Accordion = ({ sections, options }) => (
  <div
    id={options.id}
    className={`panel-group webfield-accordion ${options.extraClasses}`}
    role="tablist"
    aria-multiselectable="true"
  >
    {sections.map((section, i) => {
      const sectionId = section.id || `${options.id}-section-${i}`
      return (
        <div key={sectionId} className="panel panel-default">
          <SectionHeading id={sectionId} heading={section.heading} options={options} />
          <SectionBody id={sectionId} body={section.body} options={options} />
          <hr className="webfied-accordion-divider" />
        </div>
      )
    })}
  </div>
)

const SectionHeading = ({ id, heading, options }) => (
  <div className="panel-heading" role="tab">
    <h4 className="panel-title">
      <SectionHeadingLink targetId={id} parentId={options.id} collapsed={options.collapsed}>
        <Icon name="triangle-bottom" />
      </SectionHeadingLink>
      <SectionHeadingLink targetId={id} parentId={options.id} collapsed={options.collapsed}>
        {heading}
      </SectionHeadingLink>
    </h4>
  </div>
)

const SectionHeadingLink = ({
  targetId, parentId, collapsed, children,
}) => (
  <a
    href={`#${targetId}`}
    className={`collapse-btn ${collapsed ? 'collapsed' : ''}`}
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
    className={`panel-collapse collapse ${options.collapsed ? '' : 'in'}`}
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
