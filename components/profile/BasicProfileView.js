import random from 'lodash/random'
import Link from 'next/link'
import Icon from '../Icon'
import ProfileViewSection from './ProfileViewSection'
import { prettyList } from '../../lib/utils'

const ProfileItem = ({ itemMeta, className = '', editBadgeDiv = false, children }) => {
  if (!itemMeta) {
    return (
      <div className={className}>
        {children}
        {editBadgeDiv && <div className="edited">&nbsp;</div>}
      </div>
    )
  }

  const editBadge = itemMeta.signatures && (
    <Icon
      name="info-sign"
      extraClasses="edit-badge"
      tooltip={`Edited by ${prettyList(itemMeta.signatures)}`}
    />
  )
  return (
    <div className={`${className}${itemMeta.confirmed ? ' edit-confirmed' : ''}`}>
      {children} {editBadgeDiv ? <div className="edited">{editBadge}</div> : editBadge}
    </div>
  )
}

const ProfileName = ({ name }) => (
  <ProfileItem itemMeta={name.meta}>
    <span>{name.fullname}</span> {name.preferred && <small>(Preferred)</small>}
  </ProfileItem>
)

const ProfileEmail = ({ email, publicProfile }) => (
  <ProfileItem itemMeta={email.meta}>
    <span>{email.email}</span>{' '}
    {!publicProfile && email.confirmed && <small>(Confirmed)</small>}{' '}
    {!publicProfile && email.preferred && <small>(Preferred)</small>}
  </ProfileItem>
)

const ProfileLink = ({ link, showLinkText }) => {
  const linkUrlWithProtocol = link.url?.startsWith('http') ? link.url : `//${link.url}`
  return (
    <ProfileItem itemMeta={link.meta}>
      <a href={linkUrlWithProtocol} target="_blank" rel="noopener noreferrer">
        {link.name}
      </a>
      {showLinkText && <span className="link-text">{`(${linkUrlWithProtocol})`}</span>}
    </ProfileItem>
  )
}

const ProfileHistory = ({ history }) => (
  <ProfileItem className="table-row" itemMeta={history.meta} editBadgeDiv>
    <div className="position">
      <strong>{history.position}</strong>
    </div>
    <div className="institution">
      {history.institution.name}{' '}
      {history.institution.domain && <small>{`(${history.institution.domain})`}</small>}
      {(history.institution.city ||
        history.institution.stateProvince ||
        history.institution.country) && (
        <Icon
          name="map-marker"
          tooltip={[
            history.institution.city,
            history.institution.stateProvince,
            history.institution.country,
          ]
            .filter(Boolean)
            .join(', ')}
          extraClasses="geolocation"
        />
      )}
    </div>
    <div className="timeframe">
      <em>
        {history.start}
        {history.start && <span> &ndash; </span>}
        {history.end ? history.end : 'Present'}
      </em>
    </div>
  </ProfileItem>
)

const ProfileRelation = ({ relation }) => (
  <ProfileItem className="table-row" itemMeta={relation.meta} editBadgeDiv>
    <div>
      <strong>{relation.relation}</strong>
    </div>
    <div>
      {relation.username ? (
        <Link href={`/profile?id=${relation.username}`}>{relation.name}</Link>
      ) : (
        <span>{relation.name}</span>
      )}
    </div>
    <div>
      <small>{relation.email}</small>
    </div>
    <div>
      <em>
        {relation.start}
        {relation.start && <span> &ndash; </span>}
        {relation.end ? relation.end : 'Present'}
      </em>
    </div>
    <div className="relation-visible">
      {relation.readers && !relation.readers.includes('everyone') && (
        <Icon
          name="eye-close"
          extraClasses="relation-visible-icon"
          tooltip="Privately revealed to you"
        />
      )}
    </div>
  </ProfileItem>
)

const ProfileExpertise = ({ expertise }) => (
  <ProfileItem className="table-row" itemMeta={expertise.meta} editBadgeDiv>
    <div>
      <span>{expertise.keywords.join(', ')}</span>
    </div>
    <div className="start-end-year">
      <em>
        {expertise.start}
        {expertise.start && <span> &ndash; </span>}
        {expertise.end ? expertise.end : 'Present'}
      </em>
    </div>
  </ProfileItem>
)

const BasicProfileView = ({
  profile,
  publicProfile,
  showLinkText = false,
  contentToShow = ['names', 'emails', 'links', 'history', 'relations', 'expertise'],
}) => {
  const uniqueNames = profile.names.filter((name) => !name.duplicate)
  const sortedNames = [
    ...uniqueNames.filter((p) => p.preferred),
    ...uniqueNames.filter((p) => !p.preferred),
  ]

  return (
    <>
      {contentToShow.includes('names') && (
        <ProfileViewSection name="names" title="Names" actionLink="Suggest Name">
          <div className="list-compact">
            {sortedNames.flatMap((name, i) => [
              i > 0 ? <span key={i}>, </span> : null,
              <ProfileName key={name.username || name.fullname} name={name} />,
            ])}
          </div>
        </ProfileViewSection>
      )}

      {contentToShow.includes('emails') && (
        <ProfileViewSection name="emails" title="Emails" actionLink="Suggest Email">
          <div className="list-compact">
            {profile.emails
              .filter((email) => !email.hidden)
              .flatMap((email, i) => [
                i > 0 ? <span key={i}>, </span> : null,
                <ProfileEmail key={email.email} email={email} publicProfile={publicProfile} />,
              ])}
          </div>
        </ProfileViewSection>
      )}

      {contentToShow.includes('links') && (
        <ProfileViewSection name="links" title="Personal Links" actionLink="Suggest URL">
          {profile.links.map((link) => (
            <ProfileLink key={link.name} link={link} showLinkText={showLinkText} />
          ))}
        </ProfileViewSection>
      )}

      {contentToShow.includes('history') && (
        <ProfileViewSection
          name="history"
          title="Education &amp; Career History"
          actionLink="Suggest Position"
        >
          {profile.history?.length > 0 ? (
            profile.history.map((history) => (
              <ProfileHistory
                key={
                  history.institution.name +
                  (history.position || random(1, 100)) +
                  (history.start || '') +
                  (history.end || '')
                }
                history={history}
              />
            ))
          ) : (
            <p className="empty-message">No history added</p>
          )}
        </ProfileViewSection>
      )}

      {contentToShow.includes('relations') && (
        <ProfileViewSection
          name="relations"
          title="Advisors, Relations &amp; Conflicts"
          actionLink="Suggest Relation"
        >
          {profile.relations?.length > 0 ? (
            profile.relations.map((relation) => (
              <ProfileRelation
                key={
                  relation.relation +
                  relation.name +
                  relation.email +
                  relation.start +
                  relation.end
                }
                relation={relation}
              />
            ))
          ) : (
            <p className="empty-message">No relations added</p>
          )}
        </ProfileViewSection>
      )}

      {contentToShow.includes('expertise') && (
        <ProfileViewSection name="expertise" title="Expertise" actionLink="Suggest Expertise">
          {profile.expertise?.length > 0 ? (
            profile.expertise.map((expertise) => (
              <ProfileExpertise key={expertise.keywords.toString()} expertise={expertise} />
            ))
          ) : (
            <p className="empty-message">No areas of expertise listed</p>
          )}
        </ProfileViewSection>
      )}
    </>
  )
}

export default BasicProfileView
