'use client'

import Icon from './Icon'

const Accordion = ({ sections, options }) => (
  <div
    id={options.id}
    className={`webfield-accordion panel-group ${options.extraClasses ?? ''}`}
    role="tablist"
    aria-multiselectable="true"
  >
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
      <SectionHeadingLink targetId={id} collapsed={options.collapsed}>
        <Icon name="triangle-bottom" />
      </SectionHeadingLink>{' '}
      <SectionHeadingLink
        targetId={id}
        collapsed={options.collapsed}
        shouldCollapse={options.shouldCollapse}
      >
        {heading}
      </SectionHeadingLink>
    </h4>
  </div>
)

const SectionHeadingLink = ({ targetId, children, collapsed, shouldCollapse = true }) => {
  if (shouldCollapse === false) {
    return (
      <a href={`#${targetId}`} className={`collapse-btn${collapsed ? ' collapsed' : ''}`}>
        {children}
      </a>
    )
  }
  // eslint-disable-next-line jsx-a11y/anchor-is-valid
  return (
    <a
      className={`collapse-btn${collapsed ? ' collapsed' : ''}`}
      role="button"
      data-toggle="collapse"
      data-target={`#${targetId}`}
      aria-controls={targetId}
    >
      {children}
    </a>
  )
}

const SectionBody = ({ id, body, options }) => {
  const renderBody = () => {
    switch (options.bodyContainer) {
      case 'div':
        return <div>{body}</div>
      case '':
        return body
      default:
        return <p>{body}</p>
    }
  }
  return (
    <div
      id={id}
      className={`panel-collapse collapse${options.collapsed ? '' : ' in'}`}
      role="tabpanel"
    >
      <div className="panel-body">
        {options.html ? (
          // eslint-disable-next-line react/no-danger
          <div dangerouslySetInnerHTML={{ __html: body }} />
        ) : (
          renderBody()
        )}
      </div>
    </div>
  )
}

export default Accordion
