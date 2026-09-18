import {
  CheckOutlined,
  EnvironmentFilled,
  FolderOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Col, Flex, Popover, Row, Space, Tag, Tooltip } from 'antd'
import copy from 'copy-to-clipboard'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { orderBy } from 'lodash'
import { nanoid } from 'nanoid'
import Link from 'next/link'
import { Fragment } from 'react'
import ServiceRoles from '../../app/profile/ServiceRoles'
import { formatDateTime, normalizeName, prettyId, prettyList } from '../../lib/utils'
import Icon from '../Icon'
import ProfileViewSection from './ProfileViewSection'

import {
  colors,
  getBootstrap337LabelColor,
  moderation as moderationStyles,
  profile as profileStyles,
} from '../../lib/legacy-bootstrap-styles'

dayjs.extend(utc)

const matchedColor = getBootstrap337LabelColor('success')
const disputedColor = getBootstrap337LabelColor('warning')

const AssertionPopover = ({
  assertion: { signatures, source, tcdate, comment, details = [] },
  children,
}) => (
  <Popover
    content={
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          gap: '0.125rem 0.75rem',
        }}
      >
        {source && (
          <>
            <span>Document:</span>
            <span>{source}</span>
          </>
        )}
        {details.map(([label, value]) => (
          <Fragment key={label}>
            <span>{label}:</span>
            <span>{value}</span>
          </Fragment>
        ))}
        <span>By:</span>
        <span>{prettyId(signatures[0])}</span>
        <span>Date</span>
        <span>{formatDateTime(tcdate)}</span>
        {comment && (
          <>
            <span>Comment:</span>
            <span>{comment}</span>
          </>
        )}
      </div>
    }
  >
    {children}
  </Popover>
)

const AssertionCheck = ({ assertion, disputed = false }) => (
  <AssertionPopover assertion={assertion}>
    <CheckOutlined
      style={{ color: disputed ? disputedColor : matchedColor, marginLeft: '0.25rem' }}
    />
  </AssertionPopover>
)

const AssertedRecord = ({ assertion, disputed = false, indented = false, children }) => (
  <div
    style={{
      display: 'flex',
      gap: '0.5rem',
      background: disputed ? '#fdf8f0' : '#ecf0f2',
      borderRadius: 3,
      padding: '6px 8px',
      margin: indented ? '2px -8px 0 0.75rem' : '0.25rem -8px 0',
      color: colors.subtleGray,
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    <AssertionPopover assertion={assertion}>
      <FolderOutlined style={{ color: disputed ? disputedColor : colors.mediumDarkBlue }} />
    </AssertionPopover>
  </div>
)

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

const NamesSection = ({ names, profileEdits }) => {
  const normalizedProfileNames = names.map((p) => normalizeName(p.fullname))
  const namesAsserted = orderBy(
    profileEdits.flatMap((p) => {
      if (!p.profile.content?.fullname) return []
      const normalizedValue = normalizeName(p.profile.content.fullname.value)
      return {
        value: p.profile.content.fullname.value,
        source: p.content?.source?.value,
        comment: p.content?.comment?.value,
        signatures: p.signatures,
        tcdate: p.tcdate,
        normalizedValue,
        existInProfile:
          normalizedProfileNames.find((q) => q === normalizedValue) !== undefined,
      }
    }),
    ['tcdate'],
    ['desc']
  )

  return (
    <>
      <Space separator={<span>{`,\u00a0`}</span>} wrap={true} size={0}>
        {names.map((name) => {
          const latestNameAssertion = namesAsserted.find(
            (p) => p.normalizedValue === normalizeName(name.fullname)
          )
          return (
            <span key={name.username || name.fullname} style={{ display: 'inline-flex' }}>
              <ProfileName name={name} />
              {latestNameAssertion && <AssertionCheck assertion={latestNameAssertion} />}
            </span>
          )
        })}
      </Space>

      {namesAsserted
        .filter((p) => !p.existInProfile)
        .map((assertion) => (
          <AssertedRecord key={`${assertion.value}-${assertion.tcdate}`} assertion={assertion}>
            {assertion.value}
          </AssertedRecord>
        ))}
    </>
  )
}

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
        <span style={profileStyles.linkText}>{`(${linkUrlWithProtocol})`}</span>
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
              <EnvironmentFilled style={profileStyles.geolocationIcon} />
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

const historyIdentity = (record) =>
  [
    record?.institution?.domain,
    record?.position?.toLowerCase(),
    record?.start ?? '',
    record?.end ?? '',
  ].join('|')

const correspondingRecord = (records, asserted) => {
  const domain = asserted?.institution?.domain
  const start = asserted?.start
  if (!domain || !start) return undefined
  const candidates = records.filter(
    (record) => record.institution?.domain === domain && record.start === start
  )
  return candidates.length === 1 ? candidates[0] : undefined
}

const HistorySection = ({ history, profileEdits }) => {
  const records = history ?? []
  const historyAsserted = orderBy(
    profileEdits.flatMap((p) => {
      if (!p.profile.content?.history) return []
      const { value } = p.profile.content.history
      const identity = historyIdentity(value)
      const existInProfile = records.some((record) => historyIdentity(record) === identity)
      return {
        value,
        source: p.content?.source?.value,
        comment: p.content?.comment?.value,
        signatures: p.signatures,
        tcdate: p.tcdate,
        identity,
        existInProfile,
        contradicts: existInProfile ? undefined : correspondingRecord(records, value),
      }
    }),
    ['tcdate'],
    ['desc']
  )

  return (
    <Flex vertical gap="small">
      {records.length > 0 ? (
        records.map((record) => {
          const identity = historyIdentity(record)
          const agreeing = historyAsserted.find(
            (p) => p.existInProfile && p.identity === identity
          )
          const contradicting = historyAsserted.filter((p) => p.contradicts === record)
          return (
            <div key={nanoid()}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ProfileHistory history={record} />
                </div>
                {agreeing && <AssertionCheck assertion={agreeing} />}
                {!agreeing && contradicting.length > 0 && (
                  <AssertionCheck assertion={contradicting[0]} disputed />
                )}
              </div>
              {contradicting.map((assertion) => (
                <AssertedRecord
                  key={`${assertion.identity}-${assertion.tcdate}`}
                  assertion={assertion}
                  disputed
                  indented
                >
                  <ProfileHistory history={assertion.value} />
                </AssertedRecord>
              ))}
            </div>
          )
        })
      ) : (
        <p className="empty-message">No history added</p>
      )}
      {historyAsserted
        .filter((p) => !p.existInProfile && !p.contradicts)
        .map((assertion) => (
          <AssertedRecord
            key={`${assertion.identity}-${assertion.tcdate}`}
            assertion={assertion}
          >
            <ProfileHistory history={assertion.value} />
          </AssertedRecord>
        ))}
    </Flex>
  )
}

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
      {relation.vouched && (
        <Tooltip title="Vouched relation">
          <span style={profileStyles.vouchedRelationIcon}>
            <SafetyCertificateOutlined />
          </span>
        </Tooltip>
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
    <Col xs={12} sm={20} style={{ overflowWrap: 'anywhere' }}>
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

const MinorTag = ({ parentalConsent }) => {
  const minorTagProps = {
    color: getBootstrap337LabelColor('warning'),
    variant: 'solid',
    styles: { root: moderationStyles.statusTag },
  }
  if (!parentalConsent) return <Tag {...minorTagProps}>Minor</Tag>

  const { relation, name, email, start, end } = parentalConsent
  const details = [
    ['Relation', relation],
    ['Name', name],
    ['Email', email],
    ['Years', [start, end].filter(Boolean).join(' – ')],
  ].filter(([, value]) => value)
  return (
    <AssertionPopover assertion={{ ...parentalConsent, details }}>
      <Tag {...minorTagProps}>
        Minor <CheckOutlined />
      </Tag>
    </AssertionPopover>
  )
}

const DateOfBirth = ({ dob, parentalConsent }) => {
  const dateOfBirth = dayjs.utc(dob)
  if (!dateOfBirth.isValid()) return null

  const age = dayjs.utc().diff(dateOfBirth, 'year')

  return (
    <Space>
      <span>{`${dateOfBirth.format('MMMM DD, YYYY')} - ${age} years old`}</span>
      {age < 13 && (
        <Tag
          color={getBootstrap337LabelColor('error')}
          variant="solid"
          styles={{ root: moderationStyles.statusTag }}
        >
          Under 13
        </Tag>
      )}
      {age >= 13 && age < 18 && <MinorTag parentalConsent={parentalConsent} />}
    </Space>
  )
}

const DateOfBirthSection = ({ dob, profileEdits }) => {
  const dobAsserted = orderBy(
    profileEdits.flatMap((p) => {
      if (!p.profile.content?.dob) return []
      const { value } = p.profile.content.dob
      return {
        value,
        source: p.content?.source?.value,
        comment: p.content?.comment?.value,
        signatures: p.signatures,
        tcdate: p.tcdate,
        existInProfile: value === dob,
      }
    }),
    ['tcdate'],
    ['desc']
  )

  const agreeing = dobAsserted.find((p) => p.existInProfile)
  const contradicting = dobAsserted.filter((p) => !p.existInProfile)

  const latestParentalConsent = orderBy(
    profileEdits.flatMap((p) => {
      const relation = p.profile.content?.relations?.value
      if (!relation) return []
      return {
        ...relation,
        comment: p.content?.comment?.value,
        signatures: p.signatures,
        tcdate: p.tcdate,
      }
    }),
    ['tcdate'],
    ['desc']
  )[0]

  return (
    <>
      <Space>
        <DateOfBirth dob={dob} parentalConsent={latestParentalConsent} />
        {agreeing && <AssertionCheck assertion={agreeing} />}
        {!agreeing && contradicting.length > 0 && (
          <AssertionCheck assertion={contradicting[0]} disputed />
        )}
      </Space>
      {contradicting.map((assertion) => (
        <AssertedRecord
          key={`${assertion.value}-${assertion.tcdate}`}
          assertion={assertion}
          disputed
          indented
        >
          {dayjs.utc(assertion.value).format('MMMM DD, YYYY')}
        </AssertedRecord>
      ))}
    </>
  )
}

const BasicProfileView = ({
  profile,
  publicProfile,
  serviceRoles,
  showLinkText = false,
  moderation = false,
  contentToShow = ['names', 'emails', 'links', 'history', 'relations', 'expertise'],
  profileEdits = [],
}) => {
  const activeProfileEdits = profileEdits.filter((p) => !p.ddate)
  const uniqueNames = profile.names.filter((name) => !name.duplicate)
  const sortedNames = [
    ...uniqueNames.filter((p) => p.preferred),
    ...uniqueNames.filter((p) => !p.preferred),
  ]

  return (
    <Flex vertical gap="large">
      {contentToShow.includes('names') && (
        <ProfileViewSection title="Names">
          <NamesSection names={sortedNames} profileEdits={activeProfileEdits} />
        </ProfileViewSection>
      )}

      {contentToShow.includes('dob') && profile.dob !== null && profile.dob !== undefined && (
        <ProfileViewSection title="Date of Birth">
          <DateOfBirthSection dob={profile.dob} profileEdits={activeProfileEdits} />
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
          <HistorySection history={profile.history} profileEdits={activeProfileEdits} />
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
