import { EnvironmentFilled, SafetyCertificateOutlined } from '@ant-design/icons'
import { Col, Flex, Row, Space, Tag, Tooltip } from 'antd'
import copy from 'copy-to-clipboard'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { nanoid } from 'nanoid'
import Link from 'next/link'
import ServiceRoles from '../../app/profile/ServiceRoles'
import { prettyList } from '../../lib/utils'
import Icon from '../Icon'
import ProfileViewSection from './ProfileViewSection'

import {
  colors,
  getBootstrap337LabelColor,
  moderation as moderationStyles,
  profile as profileStyles,
} from '../../lib/legacy-bootstrap-styles'

dayjs.extend(utc)

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

// A verification badge next to a piece of profile data, with the entities that
// verified it in the tooltip. Verifications come from profile edits, so the verifier
// is the support team today but can be another profile (a voucher) or a third party
// identity provider in the future. A verified value that is not listed in the
// profile (or differs from it) is still shown, in the accent color, so the mismatch
// is visible instead of silently dropped.
const VerificationBadge = ({ verifiers, mismatch = false }) => {
  if (!verifiers?.length) return null
  return (
    <Tooltip
      title={`Verified by ${prettyList([...new Set(verifiers)])}${
        mismatch ? ', but does not match the information listed in the profile' : ''
      }`}
    >
      <span
        style={{
          ...profileStyles.vouchedRelationIcon,
          ...(mismatch && { color: colors.orRed }),
        }}
      >
        <SafetyCertificateOutlined />
      </span>
    </Tooltip>
  )
}

// Merges the entries verifying the same piece of data into one item listing all of
// its verifiers.
const groupVerified = (entries, keyFn) => {
  const groups = new Map()
  entries.forEach((entry) => {
    const key = keyFn(entry)
    if (!groups.has(key)) groups.set(key, { ...entry, verifiers: [] })
    groups.get(key).verifiers.push(entry.verifiedBy)
  })
  return [...groups.values()]
}

const ProfileName = ({ name, verifiers, mismatch = false }) => (
  <ProfileItem itemMeta={name.meta}>
    <span style={mismatch ? { color: colors.orRed } : undefined}>{name.fullname}</span>{' '}
    {name.preferred && <small style={{ color: colors.orRed }}>(Preferred)</small>}
    <VerificationBadge verifiers={verifiers} mismatch={mismatch} />
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
        <span style={profileStyles.linkText}>{`(${linkUrlWithProtocol})`}</span>
      )}
    </ProfileItem>
  )
}

const ProfileHistory = ({ history, verifiers, dateMismatches, mismatch = false }) => (
  <Row align="top" gutter={[15, 15]} style={mismatch ? { color: colors.orRed } : undefined}>
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
        <VerificationBadge verifiers={verifiers} mismatch={mismatch} />
      </span>
    </Col>
    <Col xs={24} sm={4}>
      <em>
        {history.start}
        {history.start && <span> &ndash; </span>}
        {history.end ? history.end : 'Present'}
      </em>
      {dateMismatches?.map((verified) => (
        <div key={`${verified.start}-${verified.end}`} style={{ color: colors.orRed }}>
          <em>
            {verified.start}
            {verified.start && <span> &ndash; </span>}
            {verified.end ? verified.end : 'Present'}
          </em>
          <VerificationBadge verifiers={verified.verifiers} mismatch />
        </div>
      ))}
    </Col>
  </Row>
)

const ProfileRelation = ({ relation, verifiers, mismatch = false }) => (
  <Row align="top" gutter={[15, 15]} style={mismatch ? { color: colors.orRed } : undefined}>
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
      <VerificationBadge verifiers={verifiers} mismatch={mismatch} />
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

const DateOfBirth = ({ dob, verifiers }) => {
  const dateOfBirth = dayjs.utc(dob)
  if (!dateOfBirth.isValid()) return null

  const age = dayjs.utc().diff(dateOfBirth, 'year')
  const isMinor = age >= 13 && age < 18

  return (
    <Space>
      <span>{`${dateOfBirth.format('MMMM DD, YYYY')} - ${age} years old`}</span>
      <VerificationBadge verifiers={verifiers} />
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

const BasicProfileView = ({
  profile,
  publicProfile,
  serviceRoles,
  showLinkText = false,
  moderation = false,
  verifications = null,
  contentToShow = ['names', 'emails', 'links', 'history', 'relations', 'expertise'],
}) => {
  const uniqueNames = profile.names.filter((name) => !name.duplicate)
  const sortedNames = [
    ...uniqueNames.filter((p) => p.preferred),
    ...uniqueNames.filter((p) => !p.preferred),
  ]

  // Match each verification record (asserted through profile edits) to the piece of
  // profile data it verifies.
  const nameVerifiers = (name) =>
    verifications?.names
      .filter((verified) => verified.fullname === name.fullname)
      .map((verified) => verified.verifiedBy)

  const historyMatches = (verified, history) =>
    verified.position === history.position &&
    verified.institution?.domain === history.institution?.domain

  // A verification may assert the same affiliation with different dates, e.g. a
  // student ID showing the position ends in a given year while the profile says
  // Present. "Present" is only consistent with a verified end year that has not
  // passed yet: a 2017-2026 verification agrees with "2017 - Present" today but
  // becomes a mismatch in 2027.
  const historyDatesConsistent = (verified, history) => {
    if (
      verified.start !== undefined &&
      verified.start !== null &&
      history.start !== undefined &&
      history.start !== null &&
      verified.start !== history.start
    ) {
      return false
    }
    if (verified.end === undefined || verified.end === null) return true
    if (history.end === undefined || history.end === null) {
      return verified.end >= new Date().getFullYear()
    }
    return verified.end === history.end
  }

  const historyVerifiers = (history) =>
    verifications?.history
      .filter(
        (verified) => historyMatches(verified, history) && historyDatesConsistent(verified, history)
      )
      .map((verified) => verified.verifiedBy)

  const historyDateMismatches = (history) =>
    groupVerified(
      verifications?.history.filter(
        (verified) =>
          historyMatches(verified, history) && !historyDatesConsistent(verified, history)
      ) ?? [],
      (verified) => `${verified.start}|${verified.end}`
    )

  const relationVerifiers = (relation) =>
    verifications?.relations
      .filter(
        (verified) =>
          verified.relation === relation.relation &&
          ((verified.username && verified.username === relation.username) ||
            (verified.name && verified.name === relation.name) ||
            (verified.email && verified.email === relation.email))
      )
      .map((verified) => verified.verifiedBy)

  const dobVerifiers = verifications?.dob
    .filter((verified) => verified.value === profile.dob)
    .map((verified) => verified.verifiedBy)

  // Verified values that are not listed in the profile (or differ from it) are still
  // shown, in the accent color, so a mismatch between a verification and the profile
  // is visible.
  const unmatchedNames = groupVerified(
    verifications?.names.filter(
      (verified) => !uniqueNames.some((name) => name.fullname === verified.fullname)
    ) ?? [],
    (verified) => verified.fullname
  )

  const unmatchedHistories = groupVerified(
    verifications?.history.filter(
      (verified) => !profile.history?.some((history) => historyMatches(verified, history))
    ) ?? [],
    (verified) => `${verified.position}|${verified.institution?.domain}`
  )

  const unmatchedRelations = groupVerified(
    verifications?.relations.filter(
      (verified) =>
        !profile.relations?.some(
          (relation) =>
            relation.relation === verified.relation &&
            ((verified.username && verified.username === relation.username) ||
              (verified.name && verified.name === relation.name) ||
              (verified.email && verified.email === relation.email))
        )
    ) ?? [],
    (verified) => `${verified.relation}|${verified.username ?? verified.name ?? verified.email}`
  )

  const unmatchedDobs = groupVerified(
    verifications?.dob.filter((verified) => verified.value !== profile.dob) ?? [],
    (verified) => verified.value
  )

  return (
    <Flex vertical gap="large">
      {contentToShow.includes('names') && (
        <ProfileViewSection title="Names">
          <Space separator={<span>{`,\u00a0`}</span>} wrap={true} size={0}>
            {sortedNames.map((name, i) => (
              <ProfileName
                key={name.username || name.fullname}
                name={name}
                verifiers={nameVerifiers(name)}
              />
            ))}
            {unmatchedNames.map((verified) => (
              <ProfileName
                key={verified.fullname}
                name={{ fullname: verified.fullname }}
                verifiers={verified.verifiers}
                mismatch
              />
            ))}
          </Space>
        </ProfileViewSection>
      )}

      {contentToShow.includes('dob') &&
        ((profile.dob !== null && profile.dob !== undefined) || unmatchedDobs.length > 0) && (
          <ProfileViewSection title="Date of Birth">
            <Flex vertical gap={2}>
              {profile.dob !== null && profile.dob !== undefined && (
                <DateOfBirth dob={profile.dob} verifiers={dobVerifiers} />
              )}
              {unmatchedDobs.map((verified) => (
                <Space key={verified.value}>
                  <span style={{ color: colors.orRed }}>
                    {dayjs.utc(verified.value).format('MMMM DD, YYYY')}
                  </span>
                  <VerificationBadge verifiers={verified.verifiers} mismatch />
                </Space>
              ))}
            </Flex>
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
            {profile.history?.length > 0
              ? profile.history.map((history) => (
                  <ProfileHistory
                    key={nanoid()}
                    history={history}
                    verifiers={historyVerifiers(history)}
                    dateMismatches={historyDateMismatches(history)}
                  />
                ))
              : unmatchedHistories.length === 0 && (
                  <p className="empty-message">No history added</p>
                )}
            {unmatchedHistories.map((verified) => (
              <ProfileHistory
                key={nanoid()}
                history={{
                  position: verified.position,
                  start: verified.start,
                  end: verified.end,
                  institution: verified.institution ?? {},
                }}
                verifiers={verified.verifiers}
                mismatch
              />
            ))}
          </Flex>
        </ProfileViewSection>
      )}

      {contentToShow.includes('relations') && (
        <ProfileViewSection title="Advisors, Relations &amp; Conflicts">
          <Flex vertical gap="small">
            {profile.relations?.length > 0
              ? profile.relations.map((relation) => (
                  <ProfileRelation
                    key={
                      relation.relation +
                      (relation.username ?? relation.name) +
                      relation.start +
                      (relation.end ?? '')
                    }
                    relation={relation}
                    verifiers={relationVerifiers(relation)}
                  />
                ))
              : unmatchedRelations.length === 0 && (
                  <p className="empty-message">No relations added</p>
                )}
            {unmatchedRelations.map((verified) => (
              <ProfileRelation
                key={verified.relation + (verified.username ?? verified.name ?? verified.email)}
                relation={verified}
                verifiers={verified.verifiers}
                mismatch
              />
            ))}
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
