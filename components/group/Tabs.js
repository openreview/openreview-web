export default function Tabs({ sections }) {
  return (
    <div className="tabs-container">
      <div className="mobile-full-width">
        <ul className="nav nav-tabs" role="tablist">
          {sections.map((section, i) => (
            <li key={section.id} role="presentation" className={section.active ? 'active' : null}>
              <a href={`#${section.id}`} aria-controls={section.id} role="tab" data-toggle="tab" data-tab-index={i} data-modify-history="true">
                {section.heading}
                {' '}
                {section.headingCount && (
                  <span className="badge">{section.headingCount}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="tab-content">
        {sections.map(section => (
          <div
            key={section.id}
            id={section.id}
            className={`tab-pane fade ${section.extraClasses}} ${section.active ? 'active' : ''}`}
            role="tabpanel"
          >
            {section.content}
          </div>
        ))}
      </div>
    </div>
  )
}
