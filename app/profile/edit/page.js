'use client'

/* globals promptMessage,promptError: false */
import { useEffect, useState } from 'react'
import { marked } from 'marked'
import { useRouter } from 'next/navigation'
import ProfileEditor from '../../../components/profile/ProfileEditor'
import api from '../../../lib/api-client'
import { formatProfileData } from '../../../lib/profiles'
import useUser from '../../../hooks/useUser'
import LimitedStateAlert from './LimitedStateAlert'
import styles from './Edit.module.scss'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function Page() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saveProfileErrors, setSaveProfileErrors] = useState(null)
  const router = useRouter()
  const { user, accessToken, isRefreshing } = useUser()

  const unlinkPublication = async (profileId, noteId) => {
    const note = await api.getNoteById(noteId, accessToken)
    let authorIds
    let invitation
    if (note.invitations) {
      authorIds = note.content.authorids?.value
      invitation = note.invitations[0]
    } else {
      authorIds = note.content.authorids
      // eslint-disable-next-line prefer-destructuring
      invitation = note.invitation
    }
    const invitationMap = {
      'dblp.org/-/record': 'dblp.org/-/author_coreference',
      'OpenReview.net/Archive/-/Imported_Record':
        'OpenReview.net/Archive/-/Imported_Record_Revision',
      'OpenReview.net/Archive/-/Direct_Upload':
        'OpenReview.net/Archive/-/Direct_Upload_Revision',
      'DBLP.org/-/Record': 'DBLP.org/-/Author_Coreference',
      [`${process.env.SUPER_USER}/Public_Article/ORCID.org/-/Record`]: `${process.env.SUPER_USER}/Public_Article/-/Author_Removal`,
    }
    if (!authorIds) {
      throw new Error(`Note ${noteId} is missing author ids`)
    }
    if (!invitationMap[invitation]) {
      throw new Error(`Note ${noteId} uses an unsupported invitation`)
    }
    const allAuthorIds = [
      ...(profile.emails?.filter((p) => p.confirmed).map((p) => p.email) ?? []),
      ...(profile.names?.map((p) => p.username).filter((p) => p) ?? []),
    ]

    const matchedIdx = authorIds.reduce((matchedIndex, authorId, index) => {
      // find all matched index of all author ids
      if (allAuthorIds.includes(authorId)) matchedIndex.push(index)
      return matchedIndex
    }, [])
    if (matchedIdx.length !== 1) {
      // no match or multiple match
      throw new Error(`Multiple matches found in authors of paper ${noteId}.`)
    }

    const isV2Note = note.apiVersion === 2
    if (!isV2Note) authorIds[matchedIdx[0]] = null // the only match

    const updateAuthorIdsObject = isV2Note
      ? {
          invitation: invitationMap[invitation],
          signatures: [profileId],
          note: {
            id: note.id,
          },
          content: {
            author_index: { value: matchedIdx[0] },
            author_id: { value: '' },
          },
        }
      : {
          id: null,
          referent: noteId,
          invitation: invitationMap[invitation],
          signatures: [profileId],
          readers: ['everyone'],
          writers: [],
          content: {
            authorids: authorIds,
          },
        }
    return isV2Note
      ? api.post('/notes/edits', updateAuthorIdsObject, { accessToken })
      : api.post('/notes', updateAuthorIdsObject, { accessToken, version: 1 })
  }

  // eslint-disable-next-line consistent-return
  const loadProfile = async () => {
    try {
      const { profiles } = await api.get('/profiles', {}, { accessToken })
      if (profiles?.length > 0) {
        const formattedProfile = formatProfileData(profiles[0], { useLinkObjectFormat: true })
        setProfile(formattedProfile)
        return formattedProfile
      }
      promptError('Profile not found')
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const saveProfile = async (profileContent, profileReaders, publicationIdsToUnlink) => {
    setLoading(true)
    setSaveProfileErrors(null)
    const dataToSubmit = {
      id: profile.id,
      content: profileContent,
      signatures: [profile.id],
      readers: profileReaders,
    }
    try {
      const apiRes = await api.post('/profiles', dataToSubmit, { accessToken })
      const prefName = apiRes.content?.names?.find((name) => name.preferred === true)
      if (prefName !== user.profile.fullname) {
        router.refresh()
      }

      await Promise.all(
        publicationIdsToUnlink.map((publicationId) =>
          unlinkPublication(profile.id, publicationId)
        )
      )
      promptMessage('Your profile information has been successfully updated', {
        timeout: 2000,
      })
      loadProfile()
    } catch (apiError) {
      promptError(marked(`**Error:** ${apiError.message}`), { html: true })
      setSaveProfileErrors(
        apiError.errors?.map((p) => p.details?.path) ?? [apiError?.details?.path]
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!accessToken) router.replace('/login?redirect=/profile/edit')
    loadProfile()
  }, [isRefreshing])

  if (!profile) return <LoadingSpinner />

  return (
    <div className={styles.edit}>
      <LimitedStateAlert profile={profile} />
      <header>
        <h1>Edit Profile</h1>
      </header>
      <ProfileEditor
        loadedProfile={profile}
        submitHandler={saveProfile}
        cancelHandler={() => router.push('/profile')}
        loading={loading}
        saveProfileErrors={saveProfileErrors}
        loadProfile={loadProfile}
      />
    </div>
  )
}
