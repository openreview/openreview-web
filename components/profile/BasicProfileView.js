import { EnvironmentFilled, SafetyCertificateOutlined } from '@ant-design/icons'
import { Col, Flex, Popover, Row, Space, Tag, Tooltip } from 'antd'
import copy from 'copy-to-clipboard'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { orderBy } from 'lodash'
import Link from 'next/link'
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

const parentalConsentInvitationId = `${process.env.SUPER_USER}/Support/-/Parent_Consent`

const assertionStatuses = {
  agreeing: { color: colors.mediumDarkBlue, title: 'Matches the profile' },
  contradicting: {
    color: getBootstrap337LabelColor('warning'),
    title: 'Differs from the profile',
  },
  missing: { color: colors.orRed, title: 'Not listed in the profile' },
  consent: { color: colors.mediumDarkBlue, title: 'Parental consent' },
}

const AssertionPopover = ({
  assertion: { signatures, source, tcdate, comment },
  status,
  children,
}) => (
  <Popover
    title={assertionStatuses[status].title}
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

const AssertionBadge = ({ assertion, status }) => (
  <AssertionPopover assertion={assertion} status={status}>
    <SafetyCertificateOutlined
      style={{
        fontSize: '0.85rem',
        marginLeft: '0.35rem',
        verticalAlign: 'middle',
        color: assertionStatuses[status].color,
      }}
    />
  </AssertionPopover>
)

const MissingAssertedValue = ({ status, inline = false, children }) => {
  const Element = inline ? 'span' : 'div'
  return <Element style={{ color: assertionStatuses[status].color }}>{children}</Element>
}

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

const ProfileName = ({ name, badge }) => (
  <ProfileItem itemMeta={name.meta}>
    <span>{name.fullname}</span>{' '}
    {name.preferred && <small style={{ color: colors.orRed }}>(Preferred)</small>}
    {badge}
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
            <ProfileName
              key={name.username || name.fullname}
              name={name}
              badge={
                latestNameAssertion && (
                  <AssertionBadge assertion={latestNameAssertion} status="agreeing" />
                )
              }
            />
          )
        })}
        {namesAsserted
          .filter((p) => !p.existInProfile)
          .map((assertion) => (
            <MissingAssertedValue
              key={`${assertion.value}-${assertion.tcdate}`}
              status="missing"
              inline
            >
              {assertion.value}
              <AssertionBadge assertion={assertion} status="missing" />
            </MissingAssertedValue>
          ))}
      </Space>
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

const positionsDiffer = (a, b) =>
  (a.position ?? '').toLowerCase() !== (b.position ?? '').toLowerCase()
const datesDiffer = (a, b) =>
  (a.start ?? '') !== (b.start ?? '') || (a.end ?? '') !== (b.end ?? '')

const HistoryDates = ({ history }) => (
  <em>
    {history.start}
    {history.start && <span> &ndash; </span>}
    {history.end ? history.end : 'Present'}
  </em>
)

const ProfileHistory = ({ history, badge, contradictions = [] }) => (
  <Row align="top" gutter={[15, 15]}>
    <Col xs={24} sm={6}>
      <strong>{history.position}</strong>
      {contradictions
        .filter((assertion) => positionsDiffer(assertion.value, history))
        .map((assertion) => (
          <MissingAssertedValue
            key={`${assertion.identity}-${assertion.tcdate}`}
            status="contradicting"
          >
            <strong>{assertion.value.position}</strong>
            <AssertionBadge assertion={assertion} status="contradicting" />
          </MissingAssertedValue>
        ))}
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
      {badge}
    </Col>
    <Col xs={24} sm={4}>
      <HistoryDates history={history} />
      {contradictions
        .filter((assertion) => datesDiffer(assertion.value, history))
        .map((assertion) => (
          <MissingAssertedValue
            key={`${assertion.identity}-${assertion.tcdate}`}
            status="contradicting"
          >
            <HistoryDates history={assertion.value} />
            <AssertionBadge assertion={assertion} status="contradicting" />
          </MissingAssertedValue>
        ))}
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
        records.map((record, index) => {
          const identity = historyIdentity(record)
          const agreeing = historyAsserted.find(
            (p) => p.existInProfile && p.identity === identity
          )
          const contradicting = historyAsserted.filter((p) => p.contradicts === record)
          return (
            <ProfileHistory
              key={`${identity}-${index}`}
              history={record}
              badge={agreeing && <AssertionBadge assertion={agreeing} status="agreeing" />}
              contradictions={contradicting}
            />
          )
        })
      ) : (
        <p className="empty-message">No history added</p>
      )}
      {historyAsserted
        .filter((p) => !p.existInProfile && !p.contradicts)
        .map((assertion) => (
          <MissingAssertedValue
            key={`${assertion.identity}-${assertion.tcdate}`}
            status="missing"
          >
            <ProfileHistory
              history={assertion.value}
              badge={<AssertionBadge assertion={assertion} status="missing" />}
            />
          </MissingAssertedValue>
        ))}
    </Flex>
  )
}

const ProfileRelation = ({ relation, badge }) => (
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
      {badge}
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

const relationKey = (relation) =>
  relation.relation +
  (relation.username ?? relation.name) +
  relation.start +
  (relation.end ?? '')

const RelationsSection = ({ relations, parentalConsents }) => {
  const consents = orderBy(
    parentalConsents.map((p) => ({
      value: p.profile.content.relations.value,
      comment: p.content?.comment?.value,
      signatures: p.signatures,
      tcdate: p.tcdate,
    })),
    ['tcdate'],
    ['desc']
  )
  const listed = relations ?? []

  return (
    <Flex vertical gap="small">
      {listed.length === 0 && consents.length === 0 && (
        <p className="empty-message">No relations added</p>
      )}
      {listed.map((relation) => (
        <ProfileRelation key={relationKey(relation)} relation={relation} />
      ))}
      {consents.map((consent) => (
        <ProfileRelation
          key={`${relationKey(consent.value)}-${consent.tcdate}`}
          relation={consent.value}
          badge={<AssertionBadge assertion={consent} status="consent" />}
        />
      ))}
    </Flex>
  )
}

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

const DateOfBirth = ({ dob, badge }) => {
  const dateOfBirth = dayjs.utc(dob)
  if (!dateOfBirth.isValid()) return null

  const age = dayjs.utc().diff(dateOfBirth, 'year')

  return (
    <Space>
      <span>
        {`${dateOfBirth.format('MMMM DD, YYYY')} - ${age} years old`}
        {badge}
      </span>
      {age < 13 && (
        <Tag
          color={getBootstrap337LabelColor('error')}
          variant="solid"
          styles={{ root: moderationStyles.statusTag }}
        >
          Under 13
        </Tag>
      )}
      {age >= 13 && age < 18 && (
        <Tag
          color={getBootstrap337LabelColor('warning')}
          variant="solid"
          styles={{ root: moderationStyles.statusTag }}
        >
          Minor
        </Tag>
      )}
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
  const dobBadgeAssertion = agreeing ?? contradicting[0]

  return (
    <>
      <DateOfBirth
        dob={dob}
        badge={
          dobBadgeAssertion && (
            <AssertionBadge
              assertion={dobBadgeAssertion}
              status={agreeing ? 'agreeing' : 'contradicting'}
            />
          )
        }
      />
      {contradicting.map((assertion) => (
        <MissingAssertedValue
          key={`${assertion.value}-${assertion.tcdate}`}
          status="contradicting"
        >
          {dayjs.utc(assertion.value).format('MMMM DD, YYYY')}
          <AssertionBadge assertion={assertion} status="contradicting" />
        </MissingAssertedValue>
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
  const parentalConsents = activeProfileEdits.filter(
    (p) => p.invitation === parentalConsentInvitationId
  )
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
          <RelationsSection
            relations={profile.relations}
            parentalConsents={parentalConsents}
          />
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
