/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import omit from 'lodash/omit'
import LegacyProfileEditor from '../LegacyProfileEditor'
import ErrorDisplay from '../ErrorDisplay'
import LoadingSpinner from '../LoadingSpinner'
import DblpImportModal from '../DblpImportModal'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { formatProfileData } from '../../lib/profiles'
import { viewProfileLink } from '../../lib/banner-links'

export default function ProfileEditLegacy({ appContext }) {
  const { accessToken } = useLoginRedirect()
  const { updateUserName } = useUser()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()
  const { setBannerContent } = appContext

  const loadProfile = async () => {
    try {
      const { profiles } = await api.get('/profiles', {}, { accessToken })
      if (profiles?.length > 0) {
        setProfile(formatProfileData(profiles[0]))
      } else {
        setError({ statusCode: 404, message: 'Profile not found' })
      }
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  const unlinkPublication = async (profileId, noteId) => {
    const notes = await api.get('/notes', { id: noteId }, { accessToken })
    const authorIds = get(notes, 'notes[0].content.authorids')
    const invitation = get(notes, 'notes[0].invitation')
    const invitationMap = {
      'dblp.org/-/record': 'dblp.org/-/author_coreference',
      'OpenReview.net/Archive/-/Imported_Record': 'OpenReview.net/Archive/-/Imported_Record_Revision',
      'OpenReview.net/Archive/-/Direct_Upload': 'OpenReview.net/Archive/-/Direct_Upload_Revision',
    }
    if (!authorIds) {
      throw new Error(`Note ${noteId} is missing author ids`)
    }
    if (!invitationMap[invitation]) {
      throw new Error(`Note ${noteId} uses an unsupported invitation`)
    }
    const allAuthorIds = [
      ...(profile.emails?.filter(p => p.confirmed).map(p => p.email) ?? []),
      ...(profile.names?.map(p => p.username).filter(p => p) ?? []),
    ]

    const matchedIdx = authorIds.reduce((matchedIndex, authorId, index) => { // find all matched index of all author ids
      if (allAuthorIds.includes(authorId)) matchedIndex.push(index)
      return matchedIndex
    }, [])
    if (matchedIdx.length !== 1) { // no match or multiple match
      throw new Error(`Multiple matches found in authors of paper ${noteId}.`)
    }
    authorIds[matchedIdx[0]] = null // the only match

    const updateAuthorIdsObject = {
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
    return api.post('/notes', updateAuthorIdsObject, { accessToken })
  }

  const saveProfile = async (newProfileData, done) => {
    // Save profile handler
    const { publicationIdsToUnlink } = newProfileData.content
    const dataToSubmit = {
      id: newProfileData.id,
      content: omit(newProfileData.content, [
        'preferredName', 'currentInstitution', 'options', 'publicationIdsToUnlink',
      ]),
      signatures: [newProfileData.id],
    }
    try {
      const apiRes = await api.post('/profiles', dataToSubmit, { accessToken })
      const prefName = apiRes.content?.names?.find(name => name.preferred === true)
      if (prefName) {
        updateUserName(prefName.first, prefName.middle, prefName.last) // update nav dropdown
      }

      await Promise.all(publicationIdsToUnlink.map(publicationId => unlinkPublication(profile.id, publicationId)))
      promptMessage('Your profile information has been successfully updated')
      router.push('/profile')
    } catch (apiError) {
      promptError(apiError.message)
      done()
    }
  }

  const returnToProfilePage = () => {
    router.push('/profile').then(() => window.scrollTo(0, 0))
  }

  useEffect(() => {
    if (!accessToken) return

    setBannerContent(viewProfileLink())

    loadProfile()
  }, [accessToken])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  if (!profile) return <LoadingSpinner />

  return (
    <div>
      <Head>
        <title key="title">Edit Profile | OpenReview</title>
      </Head>

      <header>
        <h1>Edit Profile</h1>
      </header>

      <LegacyProfileEditor
        profile={profile}
        onSubmit={saveProfile}
        onCancel={returnToProfilePage}
        submitButtonText="Save Profile Changes"
      />

      <DblpImportModal
        profileId={profile.id}
        profileNames={profile.names.map(name => (
          name.middle ? `${name.first} ${name.middle} ${name.last}` : `${name.first} ${name.last}`
        ))}
        email={profile.preferredEmail}
      />
    </div>
  )
}

ProfileEditLegacy.bodyClass = 'profile-edit'
