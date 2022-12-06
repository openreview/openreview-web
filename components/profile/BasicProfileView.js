import random from 'lodash/random'
import { nanoid } from 'nanoid'
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
    <span>{name.first}</span> <span>{name.middle}</span> <span>{name.last}</span>{' '}
    {name.preferred && <small>(Preferred)</small>}
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
      <span>{relation.name}</span>
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

const BasicProfileView = ({ profile, publicProfile, showLinkText = false }) => {
  const uniqueNames = profile.names.filter((name) => !name.duplicate)
  const sortedNames = [
    ...uniqueNames.filter((p) => p.preferred),
    ...uniqueNames.filter((p) => !p.preferred),
  ]
  return (
    <>
      <ProfileViewSection
        name="names"
        title="Names"
        instructions="How do you usually write your name as author of a paper?
      Also add any other names you have authored papers under."
        actionLink="Suggest Name"
      >
        <div className="list-compact">
          {sortedNames
            .map((name) => (
              <ProfileName key={name.username || name.first + name.last} name={name} />
            ))
            .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
        </div>
      </ProfileViewSection>

      <ProfileViewSection
        name="emails"
        title="Emails"
        instructions="Enter email addresses associated with all of your current and historical
      institutional affiliations, as well as all your previous publications,
      and the Toronto Paper Matching System. This information is crucial for
      deduplicating users, and ensuring you see your reviewing assignments."
        actionLink="Suggest Email"
      >
        <div className="list-compact">
          {profile.emails
            .filter((email) => !email.hidden)
            .map((email) => (
              <ProfileEmail key={nanoid()} email={email} publicProfile={publicProfile} />
            ))
            .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
        </div>
      </ProfileViewSection>

      <ProfileViewSection
        name="links"
        title="Personal Links"
        instructions="Add links to your profiles on other sites. (Optional)"
        actionLink="Suggest URL"
      >
        {profile.links.map((link) => (
          <ProfileLink key={link.name} link={link} showLinkText={showLinkText} />
        ))}
      </ProfileViewSection>

      <ProfileViewSection
        name="history"
        title="Education &amp; Career History"
        instructions="Enter your education and career history. The institution domain is
      used for conflict of interest detection and institution ranking.
      For ongoing positions, leave the end field blank."
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

      <ProfileViewSection
        name="relations"
        title="Advisors, Relations &amp; Conflicts"
        instructions="Enter all advisors, co-workers, and other people that should be
      included when detecting conflicts of interest."
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

      <ProfileViewSection
        name="expertise"
        title="Expertise"
        instructions="For each line, enter comma-separated keyphrases representing an
      intersection of your interests. Think of each line as a query for papers in
      which you would have expertise and interest. For example: deep learning, RNNs,
      dependency parsing"
        actionLink="Suggest Expertise"
      >
        {profile.expertise?.length > 0 ? (
          profile.expertise.map((expertise) => (
            <ProfileExpertise key={expertise.keywords.toString()} expertise={expertise} />
          ))
        ) : (
          <p className="empty-message">No areas of expertise listed</p>
        )}
      </ProfileViewSection>
    </>
  )
}

export default BasicProfileView
