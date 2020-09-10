/* globals promptMessage: false */
/* globals promptError: false */

import { useEffect, useContext } from 'react'
import Head from 'next/head'
import Router, { useRouter } from 'next/router'
import get from 'lodash/get'
import omit from 'lodash/omit'
import UserContext from '../../components/UserContext'
import LegacyProfileEditor from '../../components/LegacyProfileEditor'
import DblpImportModal from '../../components/DblpImportModal'
import withError from '../../components/withError'
import api from '../../lib/api-client'
import { auth } from '../../lib/auth'
import { formatProfileData } from '../../lib/profiles'
import { viewProfileLink } from '../../lib/banner-links'

// Page Styles
import '../../styles/pages/profile-edit.less'

function ProfileEdit({ profile, appContext }) {
  const { accessToken, updateUserName } = useContext(UserContext)
  const router = useRouter()
  const { setBannerContent, clientJsLoading } = appContext
  const profileNames = profile.names.map(name => (
    name.middle ? `${name.first} ${name.middle} ${name.last}` : `${name.first} ${name.last}`
  ))

  const unlinkPublication = async (profileId, noteId) => {
    const notes = await api.get('/notes', { id: noteId }, { accessToken })
    const authorIds = get(notes, 'notes[0].content.authorids')
    const invitation = get(notes, 'notes[0].invitation')
    const invitationMap = {
      'dblp.org/-/record': 'dblp.org/-/author_coreference',
      'OpenReview.net/Archive/-/Imported_Record': 'OpenReview.net/Archive/-/Imported_Record_Revision',
      'OpenReview.net/Archive/-/Direct_Upload': 'OpenReview.net/Archive/-/Direct_Upload_Revision',
    }
    if (!authorIds || !invitationMap[invitation]) {
      throw new Error(`Something wrong with the paper ${noteId}.`)
    }
    const allAuthorIds = [
      ...profile.emailsConfirmed,
      ...profile.names?.map(p => p.username).filter(p => p),
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
      const result = await api.post('/profiles', dataToSubmit, { accessToken })
      const prefName = result.content?.names?.find(name => name.preferred === true)
      if (prefName) updateUserName(prefName.first, prefName.middle, prefName.last) // for nav to get updated name

      await Promise.all(publicationIdsToUnlink.map(publicationId => unlinkPublication(profile.id, publicationId)))
      promptMessage('Your profile information has been successfully updated')
      router.push('/profile')
    } catch (error) {
      promptError(error.message)
      done()
    }
  }

  const returnToProfilePage = () => {
    router.push('/profile').then(() => window.scrollTo(0, 0))
  }

  useEffect(() => {
    if (clientJsLoading) return

    setBannerContent(viewProfileLink())
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

      <DblpImportModal profileId={profile.id} profileNames={profileNames} email={profile.preferredEmail} />
    </div>
  )
}

ProfileEdit.getInitialProps = async (ctx) => {
  const { token } = auth(ctx)
  if (!token) {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` }).end()
    } else {
      Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
    }
  }

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
