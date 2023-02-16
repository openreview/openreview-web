import { debounce } from 'lodash'
import { useContext, useState, useEffect, useCallback } from 'react'
import useUser from '../../hooks/useUser'
import { isValidEmail } from '../../lib/utils'

import styles from '../../styles/components/ProfileSearchWidget.module.scss'
import EditorComponentContext from '../EditorComponentContext'

const AuthorRow = () => {
  return <div className={styles.authorRow}></div>
}

const ProfileSearchWidget = () => {
  const { user, accessToken } = useUser()
  const { field, onChange, value, isWebfield } = useContext(EditorComponentContext)
  const [selectedAuthors, setSelectedAuthors] = useState([])
  const [authorSearchResults, setAuthorSearchResults] = useState([])
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

  const searchProfile = async (term) => {
    const isEmail = isValidEmail(term)
    try {
    } catch (error) {}
  }

  const delaySearch = useCallback(
    debounce((term) => setSearchTerm(term), 300),
    []
  )

  useEffect(() => {
    console.log(user)
    setAuthors([user])
  }, [])

  useEffect(() => {
    if (!searchTerm) setAuthors([])
  }, [searchTerm])

  return (
    <div className={styles.profileSearch}>
      {authors.map((author) => {
        return <>{author.id}</>
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
    </div>
  )
}

export default ProfileSearchWidget
