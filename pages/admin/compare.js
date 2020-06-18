/* eslint-disable no-unused-expressions */
/* eslint-disable no-use-before-define */
import { useEffect, useState } from 'react'
import withAdminAuth from '../../components/withAdminAuth'
import api from '../../lib/api-client'

// eslint-disable-next-line object-curly-newline
const Compare = ({ left, right, accessToken, appContext }) => {
  const { setBannerHidden } = appContext
  const [leftProfile, setLeftProfile] = useState(null)
  const [rightProfile, setRightProfile] = useState(null)
  const [leftPublications, setLeftPublications] = useState([])
  const [rightPublications, setRightPublications] = useState([])
  const [fields, setFields] = useState([])

  useEffect(() => {
    console.log(Object.keys(leftProfile))
    console.log(Object.keys(rightProfile))
    if (leftProfile && rightProfile) setFields([...new Set([...Object.keys(leftProfile), ...Object.keys(rightProfile)])])
  }, [leftProfile, rightProfile])

  useEffect(() => {
    setBannerHidden(true)
    getProfile(left, 'left')
    getProfile(right, 'right')
  }, [])

  const getProfile = async (id, side) => {
    const result = await api.get('/profiles', { ...(id.includes('@') && { email: id }), ...(!id.includes('@') && { id }) }, { accessToken })
    side === 'left' ? setLeftProfile(result.profiles[0]) : setRightProfile(result.profiles[0])
    getPublications(result.profiles[0].id, side)
  }

  const getPublications = async (profileId, side) => {
    if (profileId) {
      const result = await api.get('/notes', { 'content.authorids': profileId, sort: 'cdate' }, { accessToken })
      // eslint-disable-next-line arrow-parens
      const reducedPublications = result.notes.map(publication => ({
        forum: publication.forum,
        title: publication.content.title,
        authors: publication.content.authors,
        authorids: publication.content.authorids.filter(id => (id)),
      }))
      side === 'left' ? setLeftPublications(reducedPublications) : setRightPublications(reducedPublications)
    }
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
                  <a href="/profile?id={{profiles.id.[0]}}" target="_blank">{leftProfile?.id}</a>
                </th>
                <th colSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  {/* eslint-disable-next-line react/button-has-type */}
                  <button className="btn merge-btn-left" style={{ marginBottom: '5px' }}>&laquo;</button>
                  <br />
                  {/* eslint-disable-next-line react/button-has-type */}
                  <button className="btn merge-btn-right">&raquo;</button>
                </th>
                <th className=".profile-right" style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <a href="/profile?id={{profiles.id.[1]}}" target="_blank">{rightProfile?.id}</a>
                </th>
              </tr>
            </thead>
            <tbody>
              <h1>{fields.length}</h1>
            </tbody>

          </table>
        </div>
      </div>
    </>
  )
}

export default withAdminAuth(Compare)
