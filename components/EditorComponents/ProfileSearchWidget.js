import { debounce } from 'lodash'
import { useContext, useState, useEffect, useCallback } from 'react'
import useUser from '../../hooks/useUser'
import { isValidEmail } from '../../lib/utils'
import api from '../../lib/api-client'

import styles from '../../styles/components/ProfileSearchWidget.module.scss'
import EditorComponentContext from '../EditorComponentContext'

const AuthorRow = () => {
  return <div className={styles.authorRow}></div>
}

const ProfileSearchWidget = () => {
  const { user, accessToken } = useUser()
  const { field, onChange, value, isWebfield } = useContext(EditorComponentContext)
  const [selectedAuthors, setSelectedAuthors] = useState([])
  const [profileSearchResults, setProfileSearchResults] = useState([])
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const getProfiles = async (authorids) => {
    try {
      const ids = authorIds.filter((p) => p.startsWith('~'))
      const emails = authorIds.filter((p) => p.match(/.+@.+/))
      const getProfilesByIdsP = ids.length
        ? api.post(
            '/profiles/search',
            {
              ids,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const getProfilesByEmailsP = emails.length
        ? api.post(
            '/profiles/search',
            {
              emails,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const profileResults = await Promise.all([getProfilesByIdsP, getProfilesByEmailsP])
    } catch (error) {
      promptError(error.message)
    }
  }

  const searchProfile = async (searchTerm) => {
    const cleanSearchTerm = searchTerm.trim().toLowerCase()
    const isEmail = isValidEmail(cleanSearchTerm)
    try {
      const result = await api.get(
        '/profiles/search',
        {
          ...(isEmail ? { email: cleanSearchTerm } : { fullname: cleanSearchTerm }),
        },
        { accessToken }
      )
      setProfileSearchResults(result.profiles)
    } catch (error) {
      promptError(error.message)
    }
  }

  const delaySearch = useCallback(
    debounce((term) => setSearchTerm(term), 300),
    []
  )

  useEffect(() => {
    setSelectedAuthors([user])
  }, [])

  useEffect(() => {
    if (!searchTerm) {
      setProfileSearchResults([])
      return
    }
    searchProfile(searchTerm)
  }, [searchTerm])

  return (
    <div className={styles.profileSearch}>
      {selectedAuthors.map((author) => {
        return <span key={author.id}>{author.id}</span>
      })}
      <input
        type="text"
        className="form-control"
        value={immediateSearchTerm}
        placeholder="search profiles by name or email"
        onChange={(e) => {
          setImmediateSearchTerm(e.target.value)
          delaySearch(e.target.value)
        }}
      />
      {profileSearchResults.map((author) => {
        return <span key={author.id}>{author.id}</span>
      })}
    </div>
  )
}

export default ProfileSearchWidget
