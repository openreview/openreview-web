/* eslint-disable no-use-before-define */
/* globals promptError: false */
import { useEffect, useState } from 'react'
import withAdminAuth from '../../components/withAdminAuth'
import api from '../../lib/api-client'
import Icon from '../../components/Icon'

const Merge = ({ groupId, accessToken, appContext }) => {
  const [profiles, setProfiles] = useState(null)
  const [clickedLinks, setClickedLinks] = useState([])
  const { setBannerHidden } = appContext
  useEffect(() => {
    setBannerHidden(true)
    setClickedLinks(Object.keys(localStorage))
    getProfiles(groupId, accessToken)
  }, [])

  // eslint-disable-next-line no-shadow
  const getProfiles = async (groupId, accessToken) => {
    try {
      const result = await api.get('/profiles/merge', { groupId }, { accessToken })
      setProfiles(result)
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleCompareClick = (rightProfileId) => {
    if (!localStorage.getItem(rightProfileId)) {
      localStorage.setItem(rightProfileId, '1')
    }
    setClickedLinks(Object.keys(localStorage))
  }

  return (
    <>
      <header>
        <h1>Group Merges</h1>
      </header>
      <div>
        <ol>
          <table>
            <tbody>
              {
                profiles && Object.keys(profiles).map(leftProfile => (
                  <tr key={leftProfile} style={{ borderBottom: '1pt solid grey', borderTop: '1pt solid grey' }}>
                    <td>
                      <li>
                        {leftProfile}
                        :
                      </li>
                    </td>
                    {
                      profiles[leftProfile].map(rightProfile => (
                        <td key={`${leftProfile} ${rightProfile}`}>
                          {clickedLinks.includes(rightProfile) ? <Icon name="eye-open" /> : null}
                          <span style={{ marginRight: '0.5rem' }} />
                          <a className="profile-id" href={`/admin/compare?left=${leftProfile}&right=${rightProfile}`} target="_blank" rel="noreferrer" onClick={() => { handleCompareClick(rightProfile) }}>{rightProfile}</a>
                        </td>
                      ))
                    }
                  </tr>
                ))
              }
            </tbody>
          </table>
        </ol>
      </div>
    </>
  )
}

Merge.bodyClass = 'merge'

export default withAdminAuth(Merge)
