import { useContext, useState } from 'react'
import useUser from '../../hooks/useUser'
import EditorComponentHeader from './EditorComponentHeader'

import styles from '../../styles/components/ProfileSearchWidget.module.scss'
import EditorComponentContext from '../EditorComponentContext'

const AuthorRow = () => {
  return <div className={styles.authorRow}></div>
}

const ProfileSearchWidget = () => {
  const { user } = useUser()
  const { field, onChange, value, isWebfield } = useContext(EditorComponentContext)
  const [authorIds, setAuthorIds] = useState([])

  const getProfiles = async () => {
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
  return (
    <EditorComponentHeader fieldNameOverwrite="Authors">
      <div className={styles.profileSearch}>search widget</div>
    </EditorComponentHeader>
  )
}

export default ProfileSearchWidget
