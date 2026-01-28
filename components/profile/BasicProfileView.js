import Link from 'next/link'
import copy from 'copy-to-clipboard'
import { nanoid } from 'nanoid'
import Icon from '../Icon'
import ProfileViewSection from './ProfileViewSection'
import { prettyList } from '../../lib/utils'
import ServiceRoles from '../../app/profile/ServiceRoles'
import { Col, Flex, Row, Space, Tooltip } from 'antd'
import { EnvironmentOutlined, EyeInvisibleOutlined } from '@ant-design/icons'

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

const ProfileEmail = ({ email, publicProfile, allowCopyEmail }) => {
  const copyEmailToClipboard = () => {
    copy(`${email.email}`)
  }
  return (
    <ProfileItem itemMeta={email.meta}>
      <span {...(allowCopyEmail && { onClick: copyEmailToClipboard })}>{email.email}</span>{' '}
      {email.confirmed && <small>(Confirmed)</small>}
      {!publicProfile && email.preferred && <small>(Preferred)</small>}
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
        style={{ fontWeight: showLinkText ? 'normal' : 'bold' }}
      >
        {link.name}
      </a>
      {showLinkText && <span className="link-text">{`(${linkUrlWithProtocol})`}</span>}
    </ProfileItem>
  )
}

const ProfileHistory = ({ history }) => (
  <Row align="top" gutter={[15, 15]}>
    <Col xs={24} sm={6}>
      <strong>{history.position}</strong>
    </Col>
    <Col xs={24} sm={12}>
      <Space align="end" wrap={true}>
        {history.institution.department && (
          <span>
            {history.institution.department}
            {','}
          </span>
        )}
        <span>
          {history.institution.name}
          {history.institution.domain && <small>{` (${history.institution.domain})`}</small>}
        </span>
        {(history.institution.city ||
          history.institution.stateProvince ||
          history.institution.country) && (
          <Tooltip
            title={[
              history.institution.city,
              history.institution.stateProvince,
              history.institution.country,
            ]
              .filter(Boolean)
              .join(', ')}
          >
            <EnvironmentOutlined />
          </Tooltip>
        )}
      </Space>
    </Col>
    <Col xs={24} sm={6}>
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
    <Col xs={12} sm={12}>
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
          <small>{relation.email}</small>
        </Space>
      )}
    </Col>
    <Col xs={12} sm={6}>
      <Space>
        <em>
          {relation.start}
          {relation.start && <span> &ndash; </span>}
          {relation.end ? relation.end : 'Present'}
        </em>
        {relation.readers && !relation.readers.includes('everyone') && (
          <Tooltip title="Privately revealed to you">
            <EyeInvisibleOutlined />
          </Tooltip>
        )}
      </Space>
    </Col>
  </Row>
)

const ProfileExpertise = ({ expertise }) => (
  <Row align="top" gutter={[15, 15]}>
    <Col xs={12} sm={18}>
      <Space wrap separator=",">
        {expertise.keywords.map((p) => p)}
      </Space>
    </Col>
    <Col xs={12} sm={6}>
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
    <Flex vertical gap="small">
      {contentToShow.includes('names') && (
        <ProfileViewSection title="Names">
          <Space separator="," wrap={true}>
            {sortedNames.map((name, i) => (
              <ProfileName key={name.username || name.fullname} name={name} />
            ))}
          </Space>
        </ProfileViewSection>
      )}

      {contentToShow.includes('emails') && (
        <ProfileViewSection title="Emails">
          <Space separator="," wrap={true}>
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
          <Space wrap={true} orientation={showLinkText ? 'vertical' : 'horizontal'}>
            {profile.links.map((link) => (
              <ProfileLink key={link.name} link={link} showLinkText={showLinkText} />
            ))}
          </Space>
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
      {/* {serviceRoles?.length > 0 && (
        <ProfileViewSection name="serviceRoles" title="Service Roles">
          <ServiceRoles serviceRoles={serviceRoles} />
        </ProfileViewSection>
      )} */}
    </Flex>
  )
}

export default BasicProfileView
