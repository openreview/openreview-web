/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-use-before-define */
import { useEffect, useState } from 'react'
import withAdminAuth from '../../components/withAdminAuth'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

// eslint-disable-next-line object-curly-newline
const Compare = ({ left, right, accessToken, appContext }) => {
  const { setBannerHidden } = appContext
  const [basicProfiles, setBasicProfiles] = useState(null)
  const [withSignatureProfiles, setWithSignatureProfiles] = useState(null)
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
    }
  }, [withSignatureProfiles])

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
    const localProfile = { ...profile }
    const profileUsernames = localProfile.content.names ? localProfile.content.names.map(name => (name.username)) : []
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

  const renderSubComponent = (profile, fieldName, side) => { // side is used for classname
    switch (fieldName) {
      case 'names':
        return <Names names={profile.names} side={side} />
      default:
        return profile?.[fieldName]?.toString()
    }
  }

  // eslint-disable-next-line arrow-body-style
  const Names = ({ names, side }) => {
    return (
      <table>
        <tbody>
          {/* eslint-disable-next-line arrow-body-style */}
          {names.map((name) => {
            return (
              <tr key={name}>
                <td>
                  <div className="name" {...(name.signatures && { 'data-toggle': 'tooltip', title: `Edited by ${name.signatures}` })} style={name.confirmed ? undefined : { color: '#8c1b13' }}>
                    <span className={`${side}-profile-value`}>{name.first} {name.middle} {name.last}</span> {name.preferred && <small>(Preferred)</small>}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  const StandardField = () => {

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
                  <a href="/profile?id={{profiles.id.[0]}}" target="_blank">{basicProfiles?.left?.id}</a>
                </th>
                <th colSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  {/* eslint-disable-next-line react/button-has-type */}
                  <button className="btn merge-btn-left" style={{ marginBottom: '5px' }}>&laquo;</button>
                  <br />
                  {/* eslint-disable-next-line react/button-has-type */}
                  <button className="btn merge-btn-right">&raquo;</button>
                </th>
                <th className=".profile-right" style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <a href="/profile?id={{profiles.id.[1]}}" target="_blank">{basicProfiles?.right?.id}</a>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line arrow-body-style */}
              {fields.map((field) => {
                return (
                  <tr key={field}>
                    <td>
                      <strong>{field}</strong>
                    </td>
                    <td colSpan="2">
                      {renderSubComponent(withSignatureProfiles?.left, field, 'left')}
                    </td>
                    <td colSpan="2">
                      {renderSubComponent(withSignatureProfiles?.right, field, 'right')}
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

export default withAdminAuth(Compare)
