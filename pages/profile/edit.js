/* globals promptMessage,promptError,marked: false */

import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProfileEditor from '../../components/profile/ProfileEditor'
import LimitedStateAlert from '../../components/profile/LimitedStateAlert'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { formatProfileData } from '../../lib/profiles'

export default function ProfileEdit({ appContext }) {
  const { accessToken } = useLoginRedirect()
  const { updateUserName } = useUser()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [saveProfileErrors, setSaveProfileErrors] = useState(null)
  const router = useRouter()
  const { setBannerHidden, setEditBanner } = appContext

  const loadProfile = async () => {
    try {
      const { profiles } = await api.get('/profiles', {}, { accessToken })
      if (profiles?.length > 0) {
        const formattedProfile = formatProfileData(profiles[0], true)
        setProfile(formattedProfile)
        return formattedProfile
      }
      setError({ statusCode: 404, message: 'Profile not found' })
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
    return null
  }

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
      [`${process.env.SUPER_USER}/Public_Article/-/ORCID_Record`]: `${process.env.SUPER_USER}/Public_Article/-/Author_Removal`,
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
      if (prefName) {
        updateUserName(prefName.fullname) // update nav dropdown
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
    if (!accessToken) return

    setBannerHidden(true)
    loadProfile()
  }, [accessToken])

  useEffect(() => {
    if (!error) return

    setBannerHidden(false)
    setEditBanner(null)
  }, [error])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  if (!profile) return <LoadingSpinner />

  return (
    <div>
      <Head>
        <title key="title">Edit Profile | OpenReview</title>
      </Head>

      {profile.state === 'Limited' && <LimitedStateAlert />}

      <header>
        <h1>Edit Profile</h1>
      </header>

      <ProfileEditor
        loadedProfile={profile}
        submitHandler={saveProfile}
        cancelHandler={() => router.push('/profile').then(() => window.scrollTo(0, 0))}
        loading={loading}
        saveProfileErrors={saveProfileErrors}
        loadProfile={loadProfile}
      />
    </div>
  )
}

ProfileEdit.bodyClass = 'profile-edit'
