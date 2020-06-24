/* eslint-disable no-use-before-define */
/* globals promptError: false */

import React, { useEffect, useState } from 'react'
import Router from 'next/router'
import Head from 'next/head'
import withAdminAuth from '../../components/withAdminAuth'
import api from '../../lib/api-client'
import { prettyId, prettyField } from '../../lib/utils'
import LoadingSpinner from '../../components/LoadingSpinner'
import '../../styles/pages/admin-compare.less'

// #region components used by Compare (in renderField method)
const Names = ({ names, highlightValue }) => (
  <table>
    <tbody>
      {names && names.map((name) => {
        const shouldHighlight = highlightValue.includes(`${name?.first ?? ''} ${name?.middle ?? ''} ${name?.last ?? ''}`.replace(/\s{2,}/g, ' '))
        return (
          <tr key={`${name?.first ?? ''} ${name?.middle ?? ''} ${name?.last ?? ''}${name.preferred}`}>
            <td>
              <div className="name" data-toggle={name.signatures && 'tooltip'} title={name.signature && `Edited by ${name.signatures}`} style={name.confirmed ? undefined : { color: '#8c1b13' }}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                <span className={shouldHighlight ? 'highlight ' : undefined}>{name.first} {name.middle} {name.last}</span> {name.preferred && <small>(Preferred)</small>}
              </div>
            </td>
          </tr>
        )
      })}
    </tbody>
  </table>
)

const History = ({ historys, highlightValue }) => (
  <table style={{ width: '100%' }}>
    <tbody>
      {historys && historys.map(history => (
        <tr key={`${history.position}${history.institution.name}${history.start}${history.end}`} data-toggle={history.signatures && 'tooltip'} title={history.signature && `Edited by ${history.signatures}`} style={history.confirmed ? undefined : { color: '#8c1b13' }}>
          <td className="position">
            <strong>{history.position}</strong>
          </td>
          <td className="institution">
            <span className={highlightValue.includes(history.institution.name) ? 'highlight' : undefined}>{history.institution.name}</span>
            {' '}
            {history.institution.domain && <small className={highlightValue.includes(history.institution.domain) ? 'highlight' : undefined}>{`(${history.institution.domain})`}</small>}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

const Relation = ({ relationships, highlightValue }) => (
  <table style={{ width: '100%' }}>
    <tbody>
      {relationships && relationships.map(relationship => (
        <tr key={`${relationship.name}${relationship.relation}${relationship.start}${relationship.end}`} data-toggle={relationship.signatures && 'tooltip'} title={relationship.signature && `Edited by ${relationship.signatures}`} style={relationship.confirmed ? undefined : { color: '#8c1b13' }}>
          <td>
            <strong className={highlightValue.includes(relationship.name) ? 'highlight' : undefined}>{relationship.name}</strong>
          </td>
          <td>
            <small className={highlightValue.includes(relationship.email) ? 'highlight' : undefined}>{relationship.email}</small>
          </td>
          <td>
            <span>{relationship.relation}</span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

// eslint-disable-next-line no-shadow
const Expertise = ({ expertises, highlightValue }) => (
  <table>
    <tbody>
      {expertises && expertises.map(expertise => (
        <tr key={expertise.keywords} data-toggle={expertise.signatures && 'tooltip'} title={expertise.signature && `Edited by ${expertise.signatures}`} style={expertise.confirmed ? undefined : { color: '#8c1b13' }}>
          <td>
            <span className={highlightValue.includes(expertise.keywords.join(', ')) ? 'highlight' : undefined}>{expertise.keywords.join(', ')}</span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

const Publications = ({ publications, highlightValue }) => (
  <table style={{ width: '100%' }}>
    <tbody>
      {publications && publications.map(publication => (
        <React.Fragment key={publication.forum}>
          <tr key={`${publication.title}1`}>
            <td style={{ paddingTop: '10px' }}>
              <a href={`/forum?id=${publication.forum}`} target="_blank" rel="noreferrer">
                <strong className={highlightValue.includes(publication.title) ? 'highlight' : undefined}>
                  {publication.title}
                </strong>
              </a>
            </td>
          </tr>
          <tr>
            <td>
              {
                publication.authors.map(author => (
                  <React.Fragment key={author}>
                    <span className={highlightValue.includes(author) ? 'highlight' : undefined}>{author}</span>
                    <span>, </span>
                  </React.Fragment>
                ))
              }
            </td>
          </tr>
          <tr>
            <td>
              {
                publication.authorids.map((authorid, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <a key={`${authorid}${index}`} href={`/group?id=${authorid}`} target="_blank" rel="noreferrer">
                    <span className={highlightValue.includes(authorid) ? 'highlight' : undefined}>
                      {authorid}
                    </span>
                    <span>, </span>
                  </a>
                ))
              }
            </td>
          </tr>
        </React.Fragment>
      ))}
    </tbody>
  </table>
)

const Others = ({ fieldContent, highlightValue }) => {
  if (typeof fieldContent === 'string') {
    if (fieldContent.startsWith('http')) {
      return (
        <a href={fieldContent.value} target="_blank" rel="noreferrer">
          <span className={highlightValue.includes(fieldContent) ? 'highlight' : undefined}>{fieldContent}</span>
        </a>
      )
    }
    return <span className={highlightValue.includes(fieldContent) ? 'highlight' : undefined}>{fieldContent}</span>
  }
  return (
    <table>
      <tbody>
        {fieldContent && fieldContent.map(content => (
          <tr key={content.value} data-toggle={content.signatures && 'tooltip'} title={content.signature && `Edited by ${content.signatures}`} style={content.confirmed ? undefined : { color: '#8c1b13' }}>
            <td>
              <div data-toggle={content.signatures && 'tooltip'} title={content.signature && `Edited by ${content.signatures}`} style={content.confirmed ? undefined : { color: '#8c1b13' }}>
                {content.value.startsWith('http') ? (
                  <a href={content.value} target="_blank" rel="noreferrer">
                    <span className={highlightValue.includes(content.value) ? 'highlight' : undefined}>{content.value}</span>
                  </a>
                )
                  : <span className={highlightValue.includes(content.value) ? 'highlight' : undefined}>{content.value}</span>}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
// #endregion

// eslint-disable-next-line object-curly-newline
const Compare = ({ left, right, accessToken, appContext }) => {
  const { setBannerHidden } = appContext
  const [basicProfiles, setBasicProfiles] = useState(null)
  const [withSignatureProfiles, setWithSignatureProfiles] = useState(null)
  const [highlightValues, setHighlightValues] = useState(null)
  const [fields, setFields] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setBannerHidden(true)
    getBasicProfiles(left, right)
  }, [])

  useEffect(() => {
    if (basicProfiles) {
      const leftWithSignatureProfile = addSignatureToProfile(basicProfiles.left)
      const rightWithSignatureProfile = addSignatureToProfile(basicProfiles.right)
      setWithSignatureProfiles({ left: leftWithSignatureProfile, right: rightWithSignatureProfile })
    }
  }, [basicProfiles])

  useEffect(() => {
    if (withSignatureProfiles) {
      setFields([...new Set([
        // eslint-disable-next-line max-len
        ...Object.keys(withSignatureProfiles.left).filter(key => withSignatureProfiles.left?.[key] && Object.keys(withSignatureProfiles.left?.[key]).length !== 0),
        // eslint-disable-next-line max-len
        ...Object.keys(withSignatureProfiles.right).filter(key => withSignatureProfiles.right?.[key] && Object.keys(withSignatureProfiles.right?.[key]).length !== 0),
      ])])
      const leftHighlightValue = getHighlightValue(withSignatureProfiles.left)
      const rightHighlightValue = getHighlightValue(withSignatureProfiles.right)
      setHighlightValues({ left: leftHighlightValue, right: rightHighlightValue })
    }
  }, [withSignatureProfiles])

  const getHighlightValue = (withSignatureProfile) => {
    const compareFields = []
    Object.entries(withSignatureProfile).forEach(([key, value]) => {
      if (value) {
        if (typeof value === 'string') {
          compareFields.push(value)
          return
        }
        if (key === 'names') {
          value.forEach((name) => {
            compareFields.push(`${name?.first ?? ''} ${name?.middle ?? ''} ${name?.last ?? ''}`.replace(/\s{2,}/g, ' '))
          })
          return
        }
        if (key === 'history') {
          value.forEach((history) => {
            compareFields.push(history?.institution?.name)
            compareFields.push(history?.institution?.domain)
          })
          return
        }
        if (key === 'relations') {
          value.forEach((relation) => {
            compareFields.push(relation?.name)
            compareFields.push(relation?.email)
          })
          return
        }
        if (key === 'expertise') {
          value.forEach((expertise) => {
            compareFields.push(expertise?.keywords?.join(', '))
          })
          return
        }
        if (key === 'publications') {
          value.forEach((publication) => {
            compareFields.push(publication?.title)
            // eslint-disable-next-line no-unused-expressions
            publication?.authors?.forEach((author) => {
              compareFields.push(author)
            })
            // eslint-disable-next-line no-unused-expressions
            publication?.authorids?.forEach((authorids) => {
              compareFields.push(authorids)
            })
          })
          return
        }
        if (Array.isArray(value)) {
          value.forEach((p) => {
            compareFields.push(p.value)
          })
        }
      }
    })
    return compareFields.filter(p => p)
  }

  const getBasicProfile = async (id, side) => {
    if (id) {
      try {
        const baiscProfile = await api.get('/profiles', { ...(id.includes('@') && { email: id }), ...(!id.includes('@') && { id }) }, { accessToken })
        const publications = await getPublications(baiscProfile?.profiles[0]?.id, side)
        return { ...baiscProfile.profiles?.[0], publications }
      } catch (error) {
        promptError(error.message)
      }
    }
    return {}
  }

  const getBasicProfiles = async (leftId, rightId) => {
    setIsLoading(true)
    const leftBasicProfile = await getBasicProfile(leftId)
    const rightBasicProfile = await getBasicProfile(rightId)
    setBasicProfiles({
      left: leftBasicProfile,
      right: rightBasicProfile,
    })
    setIsLoading(false)
  }

  const addMetadata = (profile, fieldName) => {
    const localProfile = { ...profile } // avoid pollution as property will be updated
    const profileUsernames = localProfile.content?.names
      ? localProfile.content?.names.map(name => (name?.username))
      : [] // for checking signature to decide if confirmed
    if (!localProfile.content?.[fieldName]) return null
    if (!localProfile.metaContent || !localProfile.metaContent[fieldName]) return localProfile.content[fieldName]
    if (typeof localProfile.content[fieldName] === 'string') localProfile.content[fieldName] = [localProfile.content[fieldName]]
    if (!localProfile.content[fieldName].length) return null
    // eslint-disable-next-line max-len
    if (!Array.isArray(localProfile.metaContent[fieldName])) localProfile.metaContent[fieldName] = [localProfile.metaContent[fieldName]]
    return localProfile.content[fieldName].map((c, index) => {
      const { signatures } = localProfile.metaContent[fieldName][index]
      return {
        ...c,
        value: c,
        signatures: signatures.map(signature => (prettyId(signature))).join(', '),
        confirmed: (signatures.includes('~Super_User1') || signatures.includes('OpenReview.net')) || signatures.some(signature => profileUsernames.includes(signature)),
      }
    })
  }

  const addSignatureToProfile = (profile) => {
    if (Object.keys(profile).length === 0) return profile
    return {
      // id: profile.id,
      tcdate: formatLongDate(profile.tcdate || profile.cdate),
      tmdate: formatLongDate(profile.tmdate || profile.mdate),
      active: (!!profile.active).toString(),
      password: (!!profile.password).toString(),
      names: addMetadata(profile, 'names'),
      preferredEmail: addMetadata(profile, 'preferredEmail'),
      emails: addMetadata(profile, 'emails'),
      homepage: addMetadata(profile, 'homepage'),
      dblp: addMetadata(profile, 'dblp'),
      gscholar: addMetadata(profile, 'gscholar'),
      linkedin: addMetadata(profile, 'linkedin'),
      wikipedia: addMetadata(profile, 'wikipedia'),
      orcid: addMetadata(profile, 'orcid'),
      history: addMetadata(profile, 'history'),
      expertise: addMetadata(profile, 'expertise'),
      relations: addMetadata(profile, 'relations'),
      publications: profile.publications,
    }
  }

  const getPublications = async (profileId) => {
    if (profileId) {
      try {
        const result = await api.get('/notes', { 'content.authorids': profileId, sort: 'cdate' }, { accessToken })
        const reducedPublications = result.notes.map(publication => ({
          forum: publication.forum,
          title: publication.content.title,
          authors: publication.content.authors,
          authorids: publication.content.authorids.filter(id => (id)),
        }))
        return reducedPublications
      } catch (error) {
        promptError(error.message)
        return []
      }
    }
    return []
  }

  const formatLongDate = (date) => {
    if (!date) return ''
    // eslint-disable-next-line newline-per-chained-call
    return new Date(date).toISOString().replace(/-/g, '/').replace('T', ' ').replace('Z', '')
  }

  const renderField = (profile, fieldName, highlightValue) => {
    switch (fieldName) {
      case 'names':
        return <Names names={profile.names} highlightValue={highlightValue} />
      case 'history':
        return <History historys={profile.history} highlightValue={highlightValue} />
      case 'relations':
        return <Relation relationships={profile.relations} highlightValue={highlightValue} />
      case 'expertise':
        return <Expertise expertises={profile.expertise} highlightValue={highlightValue} />
      case 'publications':
        return <Publications publications={profile.publications} highlightValue={highlightValue} />
      default:
        return <Others fieldContent={profile[fieldName]} highlightValue={highlightValue} />
    }
  }

  const handleMergeLeftClick = () => {
    mergeProfile('right', 'left')
  }

  const handleMergeRightClick = () => {
    mergeProfile('left', 'right')
  }

  const mergeProfile = (from, to) => {
    const fromProfile = { id: basicProfiles[from].id, active: basicProfiles[from].active }
    const toProfile = { id: basicProfiles[to].id, active: basicProfiles[to].active }
    if (toProfile.active === false && fromProfile.active === true) {
      // eslint-disable-next-line no-alert
      if (window.confirm('You are merging an active Profile into an inactive Profile. Do you want to proceed?')) {
        try {
          api.post('/profiles/merge', { from: fromProfile.id, to: toProfile.id }, { accessToken })
        } catch (error) {
          promptError(error.message)
        }
        Router.reload()
        return
      }
      return
    }
    try {
      api.post('/profiles/merge', { from: fromProfile.id, to: toProfile.id }, { accessToken })
    } catch (error) {
      promptError(error.message)
    }

    Router.reload()
  }

  return (
    <>
      <Head>
        <title key="title">Compare Profiles | OpenReview</title>
      </Head>
      <header>
        <h1>Merge Profiles</h1>
        <hr />
      </header>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '110px', verticalAlign: 'middle' }}>
                Merge Direction
              </th>
              <th className=".profile-left" style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
                <a href={`/profile?id=${basicProfiles?.left?.id}`} target="_blank" rel="noreferrer">{basicProfiles?.left?.id}</a>
              </th>
              <th colSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                <button className="btn merge-btn-left" type="button" style={{ marginBottom: '5px' }} disabled={basicProfiles?.left?.id && basicProfiles?.right?.id ? undefined : '{true}'} onClick={handleMergeLeftClick}>&laquo;</button>
                <br />
                <button className="btn merge-btn-right" type="button" disabled={basicProfiles?.left?.id && basicProfiles?.right?.id ? undefined : '{true}'} onClick={handleMergeRightClick}>&raquo;</button>
              </th>
              <th className=".profile-right" style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
                <a href={`/profile?id=${basicProfiles?.right?.id}`} target="_blank" rel="noreferrer">{basicProfiles?.right?.id}</a>
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map(field => (
              <tr key={field}>
                <td>
                  <strong>{prettyField(field)}</strong>
                </td>
                <td colSpan="2">
                  {renderField(withSignatureProfiles?.left, field, highlightValues.right)}
                </td>
                <td colSpan="2">
                  {renderField(withSignatureProfiles?.right, field, highlightValues.left)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <LoadingSpinner />}
      </div>
    </>
  )
}

Compare.bodyClass = 'compare'

export default withAdminAuth(Compare)
