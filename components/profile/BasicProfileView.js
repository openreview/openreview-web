import { EnvironmentFilled } from '@ant-design/icons'
import { Col, Flex, Row, Space, Tooltip } from 'antd'
import copy from 'copy-to-clipboard'
import { nanoid } from 'nanoid'
import Link from 'next/link'
import ServiceRoles from '../../app/profile/ServiceRoles'
import { prettyList } from '../../lib/utils'
import Icon from '../Icon'
import ProfileViewSection from './ProfileViewSection'

import {
  colors,
  profile as profileStyles,
} from '../../lib/legacy-bootstrap-styles'

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
    <Tooltip title={`Edited by ${prettyList(itemMeta.signatures)}`}>
      <span style={profileStyles.editBadge}>
        <Icon name="info-sign" />
      </span>
    </Tooltip>
  )
  return (
    <div className={`${className}${itemMeta.confirmed ? ' edit-confirmed' : ''}`}>
      {children} {editBadgeDiv ? <div className="edited">{editBadge}</div> : editBadge}
    </div>
  )
}

const ProfileName = ({ name }) => (
  <ProfileItem itemMeta={name.meta}>
    <span>{name.fullname}</span>{' '}
    {name.preferred && <small style={{ color: colors.orRed }}>(Preferred)</small>}
  </ProfileItem>
)

const ProfileEmail = ({ email, publicProfile, allowCopyEmail }) => {
  const copyEmailToClipboard = () => {
    copy(`${email.email}`)
  }
  return (
    <ProfileItem itemMeta={email.meta}>
      <span {...(allowCopyEmail && { onClick: copyEmailToClipboard })}>{email.email}</span>{' '}
      {email.confirmed && <small style={{ color: colors.orRed }}>(Confirmed)</small>}
      {!publicProfile && email.preferred && (
        <small style={{ color: colors.orRed }}>(Preferred)</small>
      )}
      {allowCopyEmail && email.confirmed && (
        <>
          <a
            href={`https://bing.com?q="${email.email}"`}
            target="_blank"
            rel="nofollow noreferrer"
            className="ml-1"
          >
            Bing
          </a>
          <a
            href={`https://google.com/search?q="${email.email}"`}
            target="_blank"
            rel="nofollow noreferrer"
            className="ml-1"
          >
            Google
          </a>
        </>
      )}
    </ProfileItem>
  )
}

const ProfileLink = ({ link, showLinkText }) => {
  const linkUrlWithProtocol = link.url?.startsWith('http') ? link.url : `//${link.url}`

  return (
    <ProfileItem itemMeta={link.meta}>
      <a
        href={linkUrlWithProtocol}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontWeight: '700' }}
      >
        {link.name}
      </a>
      {showLinkText && (
        <span
          style={profileStyles.linkText}
        >{`(${linkUrlWithProtocol})`}</span>
      )}
    </ProfileItem>
  )
}

const ProfileHistory = ({ history }) => (
  <Row align="top" gutter={[15, 15]}>
    <Col xs={24} sm={6}>
      <strong>{history.position}</strong>
    </Col>
    <Col xs={24} sm={14}>
      {history.institution.department && (
        <span>
          {history.institution.department}
          {', '}
        </span>
      )}
      <span>
        {history.institution.name}
        {history.institution.domain && (
          <small style={{ color: colors.orRed }}>{` (${history.institution.domain})`}</small>
        )}
        {(history.institution.city ||
          history.institution.stateProvince ||
          history.institution.country) && (
          <>
            <Tooltip
              title={[
                history.institution.city,
                history.institution.stateProvince,
                history.institution.country,
              ]
                .filter(Boolean)
                .join(', ')}
            >
              <EnvironmentFilled
                style={profileStyles.geolocationIcon}
              />
            </Tooltip>
          </>
        )}
      </span>
    </Col>
    <Col xs={24} sm={4}>
      <em>
        {history.start}
        {history.start && <span> &ndash; </span>}
        {history.end ? history.end : 'Present'}
      </em>
    </Col>
  </Row>
)

const ProfileRelation = ({ relation }) => (
  <Row align="top" gutter={[15, 15]}>
    <Col xs={12} sm={6}>
      <strong>{relation.relation}</strong>
    </Col>
    <Col xs={12} sm={14}>
      {relation.username ? (
        <Link
          href={`/profile?id=${relation.username}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {relation.name}
        </Link>
      ) : (
        <Space>
          {relation.name}
          <small style={{ color: colors.orRed }}>{relation.email}</small>
        </Space>
      )}
    </Col>
    <Col xs={12} sm={4}>
      <Space>
        <em>
          {relation.start}
          {relation.start && <span> &ndash; </span>}
          {relation.end ? relation.end : 'Present'}
        </em>
        {relation.readers && !relation.readers.includes('everyone') && (
          <Tooltip title="Privately revealed to you">
            <span style={profileStyles.relationVisibleIcon}>
              <Icon name="eye-close" />
            </span>
          </Tooltip>
        )}
      </Space>
    </Col>
  </Row>
)

const ProfileExpertise = ({ expertise }) => (
  <Row align="top" gutter={[15, 15]}>
    <Col xs={12} sm={20}>
      <Space wrap separator={<span>{`,\u00a0`}</span>} size={0}>
        {expertise.keywords.map((p) => p)}
      </Space>
    </Col>
    <Col xs={12} sm={4}>
      <em>
        {expertise.start}
        {expertise.start && <span> &ndash; </span>}
        {expertise.end ? expertise.end : 'Present'}
      </em>
    </Col>
  </Row>
)

const BasicProfileView = ({
  profile,
  publicProfile,
  serviceRoles,
  showLinkText = false,
  moderation = false,
  contentToShow = ['names', 'emails', 'links', 'history', 'relations', 'expertise'],
}) => {
  const uniqueNames = profile.names.filter((name) => !name.duplicate)
  const sortedNames = [
    ...uniqueNames.filter((p) => p.preferred),
    ...uniqueNames.filter((p) => !p.preferred),
  ]

  return (
    <Flex vertical gap="large">
      {contentToShow.includes('names') && (
        <ProfileViewSection title="Names">
          <Space separator={<span>{`,\u00a0`}</span>} wrap={true} size={0}>
            {sortedNames.map((name, i) => (
              <ProfileName key={name.username || name.fullname} name={name} />
            ))}
          </Space>
        </ProfileViewSection>
      )}

      {contentToShow.includes('emails') && (
        <ProfileViewSection title="Emails">
          <Space separator={<span>{`,\u00a0`}</span>} wrap={true} size={0}>
            {profile.emails
              .filter((email) => !email.hidden)
              .map((email, i) => (
                <ProfileEmail
                  key={`${email.email}-${i}`}
                  email={email}
                  publicProfile={publicProfile}
                  allowCopyEmail={moderation}
                />
              ))}
          </Space>
        </ProfileViewSection>
      )}

      {contentToShow.includes('links') && (
        <ProfileViewSection title="Personal Links">
          <Row gutter={[{ xs: 8, sm: 8, md: 16, lg: 40 }, 10]} wrap={true}>
            {profile.links.map((link) => (
              <Col key={link.name}>
                <ProfileLink link={link} showLinkText={showLinkText} />
              </Col>
            ))}
          </Row>
        </ProfileViewSection>
      )}

      {contentToShow.includes('history') && (
        <ProfileViewSection title="Career &amp; Education History">
          <Flex vertical gap="small">
            {profile.history?.length > 0 ? (
              profile.history.map((history) => (
                <ProfileHistory key={nanoid()} history={history} />
              ))
            ) : (
              <p className="empty-message">No history added</p>
            )}
          </Flex>
        </ProfileViewSection>
      )}

      {contentToShow.includes('relations') && (
        <ProfileViewSection title="Advisors, Relations &amp; Conflicts">
          <Flex vertical gap="small">
            {profile.relations?.length > 0 ? (
              profile.relations.map((relation) => (
                <ProfileRelation
                  key={
                    relation.relation +
                    (relation.username ?? relation.name) +
                    relation.start +
                    (relation.end ?? '')
                  }
                  relation={relation}
                />
              ))
            ) : (
              <p className="empty-message">No relations added</p>
            )}
          </Flex>
        </ProfileViewSection>
      )}

      {contentToShow.includes('expertise') && (
        <ProfileViewSection title="Expertise">
          <Flex vertical gap="small">
            {profile.expertise?.length > 0 ? (
              profile.expertise.map((expertise) => (
                <ProfileExpertise key={expertise.keywords.toString()} expertise={expertise} />
              ))
            ) : (
              <p className="empty-message">No areas of expertise listed</p>
            )}
          </Flex>
        </ProfileViewSection>
      )}
      {serviceRoles?.length > 0 && (
        <ProfileViewSection title="Service Roles">
          <ServiceRoles serviceRoles={serviceRoles} />
        </ProfileViewSection>
      )}
    </Flex>
  )
}

export default BasicProfileView
