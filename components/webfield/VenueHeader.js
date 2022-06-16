import Icon from '../Icon'

const VenueHeader = ({ headerInfo }) => {
  if (!headerInfo) return null

  const {
    title,
    subtitle,
    noIcons,
    location,
    website,
    groupInfoLink,
    contact,
    instructions,
    deadline,
    date,
  } = headerInfo
  return (
    <div className="venue-header" id="header">
      <h1>{title}</h1>
      <h3>{subtitle}</h3>

      {noIcons ? (
        <>
          <h4>{location}</h4>
          <h4>
            <a href={website} target="_blank" rel="noreferrer">
              {website}
            </a>
          </h4>
          {groupInfoLink && (
            <h4>
              <a href={groupInfoLink} target="_blank" rel="noreferrer" title="Group Details">
                More Info
              </a>
            </h4>
          )}
        </>
      ) : (
        <h4>
          {location && (
            <span className="venue-location">
              <Icon name="globe" />
              {location}
            </span>
          )}
          {date && (
            <span className="venue-date">
              <Icon name="calendar" />
              {date}
            </span>
          )}
          {website && (
            <span className="venue-website">
              <Icon name="new-window" />
              <a href={website} title={`${title} Homepage`} target="_blank" rel="noreferrer">
                {website}
              </a>
            </span>
          )}
          {contact && (
            <span className="venue-contact">
              <Icon name="envelope" />
              <a href={`mailto:${contact}`} target="_blank" rel="noreferrer">
                {contact}
              </a>
            </span>
          )}
          {groupInfoLink && (
            <span className="venue-info">
              <Icon name="info-sign" />
              <a href={groupInfoLink} title="Group Details" target="_blank" rel="noreferrer">
                More Info
              </a>
            </span>
          )}
        </h4>
      )}

      <div className="description">
        {instructions ? (
          { instructions }
        ) : (
          <p className="no-margin">Please see the venue website for more information.</p>
        )}
        <p>{deadline}</p>
      </div>
    </div>
  )
}

export default VenueHeader
