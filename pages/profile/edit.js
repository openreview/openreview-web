/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useContext } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import omit from 'lodash/omit'
import UserContext from '../../components/UserContext'
import LegacyProfileEditor from '../../components/LegacyProfileEditor'
import DblpImportModal from '../../components/DblpImportModal'
import withError from '../../components/withError'
import api from '../../lib/api-client'
import { auth } from '../../lib/auth'
import { formatProfileData } from '../../lib/profiles'
import { referrerLink } from '../../lib/banner-links'

// Page Styles
import '../../styles/pages/profile-edit.less'

function ProfileEdit({ profile, appContext }) {
  const { accessToken } = useContext(UserContext)
  const router = useRouter()
  const { setBannerContent, clientJsLoading } = appContext
  const profileNames = profile.names.map(name => (
    name.middle ? `${name.first} ${name.middle} ${name.last}` : `${name.first} ${name.last}`
  ))

  const unlinkPublication = async (profileId, noteId) => {
    const notes = await api.get('/notes', { id: noteId }, { accessToken })
    const authorIds = get(notes, 'notes[0].content.authorids')
    if (!authorIds) {
      return Promise.reject()
    }
    const idx = authorIds.indexOf(profileId)
    if (idx < 0) {
      Promise.reject()
    }
    authorIds[idx] = null

    const updateAuthorIdsObject = {
      id: null,
      referent: noteId,
      invitation: 'dblp.org/-/author_coreference',
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
    }
    try {
      await api.post('/profiles', dataToSubmit, { accessToken })
      await Promise.all(publicationIdsToUnlink.map(publicationId => unlinkPublication(profile.id, publicationId)))
      promptMessage('Your profile information has been successfully updated')
      router.push(`/profile?id=${profile.id}`)
    } catch (error) {
      promptError(error.message)
      done()
    }
  }

  const returnToProfilePage = () => {
    router.push(`/profile?id=${profile.id}`)
  }

  useEffect(() => {
    if (clientJsLoading) return

    setBannerContent(referrerLink('[public profile](/profile)'))
  }, [clientJsLoading])

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

      <DblpImportModal profileId={profile.id} profileNames={profileNames} />
    </div>
  )
}

ProfileEdit.getInitialProps = async (ctx) => {
  const { token } = auth(ctx)
  const profileRes = await api.get('/profiles', {}, { accessToken: token })
  if (!profileRes.profiles?.length) {
    return { statusCode: 404, message: 'Profile not found' }
  }

  const profileFormatted = formatProfileData(profileRes.profiles[0])
  return {
    profile: profileFormatted,
  }
}

ProfileEdit.bodyClass = 'profile-edit'

export default withError(ProfileEdit)
