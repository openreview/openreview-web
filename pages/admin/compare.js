/* eslint-disable object-curly-newline */
/* eslint-disable max-len */
/* eslint-disable no-shadow */
/* eslint-disable arrow-body-style */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-use-before-define */
import React, { useEffect, useState } from 'react'
import withAdminAuth from '../../components/withAdminAuth'
import api from '../../lib/api-client'
import { prettyId, prettyField } from '../../lib/utils'
import '../../styles/pages/admin-compare.less'

// eslint-disable-next-line object-curly-newline
const Compare = ({ left, right, accessToken, appContext }) => {
  const { setBannerHidden } = appContext
  const [basicProfiles, setBasicProfiles] = useState(null)
  const [withSignatureProfiles, setWithSignatureProfiles] = useState(null)
  const [highlightValues, setHighlightValues] = useState(null)
  const [fields, setFields] = useState([])

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
      const rightHightlightValue = getHighlightValue(withSignatureProfiles.right)
      setHighlightValues({ left: leftHighlightValue, right: rightHightlightValue })
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
            compareFields.push(relation?.domain)
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
            publication?.authors?.forEach((author) => {
              compareFields.push(author)
            })
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
    const baiscProfile = await api.get('/profiles', { ...(id.includes('@') && { email: id }), ...(!id.includes('@') && { id }) }, { accessToken })
    const publications = await getPublications(baiscProfile.profiles[0].id, side)
    return { ...baiscProfile.profiles?.[0], publications }
  }

  const getBasicProfiles = async (leftId, rightId) => {
    const leftBasicProfile = await getBasicProfile(leftId)
    const rightBasicProfile = await getBasicProfile(rightId)
    setBasicProfiles({
      left: leftBasicProfile,
      right: rightBasicProfile,
    })
  }

  const addMetadata = (profile, fieldName) => {
    const localProfile = { ...profile } // avoid pollution as property will be updated
    const profileUsernames = localProfile.content.names ? localProfile.content.names.map(name => (name.username)) : [] // for checking signature to decide if confirmed
    if (!localProfile.content[fieldName]) return null
    if (!localProfile.metaContent || !localProfile.metaContent[fieldName]) return localProfile.content[fieldName]
    if (typeof localProfile.content[fieldName] === 'string') localProfile.content[fieldName] = [localProfile.content[fieldName]]
    if (!localProfile.content[fieldName].length) return null
    // TODO plain object check
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
      const result = await api.get('/notes', { 'content.authorids': profileId, sort: 'cdate' }, { accessToken })
      // eslint-disable-next-line arrow-parens
      const reducedPublications = result.notes.map(publication => ({
        forum: publication.forum,
        title: publication.content.title,
        authors: publication.content.authors,
        authorids: publication.content.authorids.filter(id => (id)),
      }))
      return reducedPublications
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

  // eslint-disable-next-line arrow-body-style
  const Names = ({ names, highlightValue }) => {
    return (
      <table>
        <tbody>
          {/* eslint-disable-next-line arrow-body-style */}
          {names && names.map((name, index) => {
            const shouldHighlight = highlightValue.includes(`${name?.first ?? ''} ${name?.middle ?? ''} ${name?.last ?? ''}`.replace(/\s{2,}/g, ' '))
            return (
              <tr key={name}>
                <td>
                  <div className="name" {...(name.signatures && { 'data-toggle': 'tooltip', title: `Edited by ${name.signatures}` })} style={name.confirmed ? undefined : { color: '#8c1b13' }}>
                    <span className={shouldHighlight ? 'highlight ' : undefined}>{name.first} {name.middle} {name.last}</span> {name.preferred && <small>(Preferred)</small>}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  // eslint-disable-next-line arrow-body-style
  const History = ({ historys, highlightValue }) => {
    return (
      <table style={{ width: '100%' }}>
        <tbody>
          {/* eslint-disable-next-line arrow-body-style */}
          {historys && historys.map((history, index) => {
            return (
              <tr key={`${history.position}${history.institution.name}${history.start}${history.end}`} {...(history.signatures && { 'data-toggle': 'tooltip', title: `Edited by ${history.signatures}` })} style={history.confirmed ? undefined : { color: '#8c1b13' }}>
                <td className="position">
                  <strong>{history.position}</strong>
                </td>
                <td className="institution">
                  <span className={highlightValue.includes(history.institution.name) ? 'highlight' : undefined}>{history.institution.name}</span>
                  {history.institution.domain && <small className={highlightValue.includes(history.institution.domain) ? 'highlight' : undefined}>{`(${history.institution.domain})`}</small>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  // eslint-disable-next-line arrow-body-style
  const Relation = ({ relationships, highlightValue }) => {
    return (
      <table style={{ width: '100%' }}>
        <tbody>
          {/* eslint-disable-next-line arrow-body-style */}
          {relationships && relationships.map((relationship, index) => {
            return (
              <tr key={`${relationship.name}${relationship.relation}${relationship.start}${relationship.end}`} {...(relationship.signatures && { 'data-toggle': 'tooltip', title: `Edited by ${relationship.signatures}` })} style={relationship.confirmed ? undefined : { color: '#8c1b13' }}>
                <td>
                  <strong className={highlightValue.includes(relationship.name) ? 'hightlight' : undefined}>{relationship.name}</strong>
                </td>
                <td>
                  <small className={highlightValue.includes(relationship.email) ? 'hightlight' : undefined}>{relationship.email}</small>
                </td>
                <td>
                  <span>{relationship.relation}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  // eslint-disable-next-line arrow-body-style
  const Expertise = ({ expertises, highlightValues }) => {
    return (
      <table>
        <tbody>
          {/* eslint-disable-next-line arrow-body-style */}
          {expertises && expertises.map((expertise, index) => {
            return (
              <tr key={expertise.keywords} {...(expertise.signatures && { 'data-toggle': 'tooltip', title: `Edited by ${expertise.signatures}` })} style={expertise.confirmed ? undefined : { color: '#8c1b13' }}>
                <td>
                  <span className={highlightValues.includes(expertise.keywords.join(', ')) ? 'highlight' : undefined}>{expertise.keywords.join(', ')}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  // eslint-disable-next-line arrow-body-style
  const Publications = ({ publications, highlightValue }) => {
    return (
      <table style={{ width: '100%' }}>
        <tbody>
          {/* eslint-disable-next-line arrow-body-style */}
          {publications && publications.map((publication) => {
            return (
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
                      publication.authors.map((author) => {
                        return (
                          <React.Fragment key={author}>
                            <span className={highlightValue.includes(author) ? 'highlight' : undefined}>{author}</span>
                            <span>, </span>
                          </React.Fragment>
                        )
                      })
                    }
                  </td>
                </tr>
                <tr>
                  <td>
                    {
                      publication.authorids.map((authorid, index) => {
                        return (
                          // eslint-disable-next-line react/no-array-index-key
                          <a key={`${authorid}${index}`} href={`/group?id=${authorid}`} target="_blank" rel="noreferrer">
                            <span className={highlightValue.includes(authorid) ? 'highlight' : undefined}>
                              {authorid}
                            </span>
                            <span>, </span>
                          </a>
                        )
                      })
                    }
                  </td>
                </tr>
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    )
  }

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
          {/* eslint-disable-next-line arrow-body-style */}
          {fieldContent && fieldContent.map((content, index) => {
            return (
              <tr key={content.value} {...(content.signatures && { 'data-toggle': 'tooltip', title: `Edited by ${content.signatures}` })} style={content.confirmed ? undefined : { color: '#8c1b13' }}>
                <td>
                  <div {...(content.signatures && { 'data-toggle': 'tooltip', title: `Edited by ${content.signatures}` })} style={content.confirmed ? undefined : { color: '#8c1b13' }}>
                    {content.value.startsWith('http') ? (
                      <a href={content.value} target="_blank" rel="noreferrer">
                        <span className={highlightValue.includes(content.value) ? 'highlight' : undefined}>{content.value}</span>
                      </a>
                    )
                      : <span className={highlightValue.includes(content.value) ? 'highlight' : undefined}>{content.value}</span>}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <>
      <header>
        <h1>Merge Profiles</h1>
        <hr />
      </header>
      <div>
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
                  {/* eslint-disable-next-line react/button-has-type */}
                  <button className="btn merge-btn-left" style={{ marginBottom: '5px' }}>&laquo;</button>
                  <br />
                  {/* eslint-disable-next-line react/button-has-type */}
                  <button className="btn merge-btn-right">&raquo;</button>
                </th>
                <th className=".profile-right" style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <a href={`/profile?id=${basicProfiles?.right?.id}`} target="_blank" rel="noreferrer">{basicProfiles?.right?.id}</a>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line arrow-body-style */}
              {fields.map((field) => {
                return (
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
                )
              })}
            </tbody>

          </table>
        </div>
      </div>
    </>
  )
}

Compare.bodyClass = 'compare'

export default withAdminAuth(Compare)
