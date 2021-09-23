/* eslint-disable no-param-reassign */
/* globals promptMessage,promptError: false */
import Head from 'next/head'
import { useEffect, useReducer, useState } from 'react'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import GenderSection from '../../components/profile/GenderSection'
import NamesSection from '../../components/profile/NameSection'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import api from '../../lib/api-client'
import { viewProfileLink } from '../../lib/banner-links'
import { formatProfileData } from '../../lib/profiles'
import '../../styles/pages/profile-edit.less'
import EmailsSection from '../../components/profile/EmailsSection'
import PersonalLinksSection from '../../components/profile/PersonalLinksSection'
import EducationHisotrySection from '../../components/profile/EducationHisotrySection'
import RelationsSection from '../../components/profile/RelationsSection'
import ExpertiseSection from '../../components/profile/ExpertiseSection'
import ImportedPublicationsSection from '../../components/profile/ImportedPublicationsSection'
import useUser from '../../hooks/useUser'

const profileEditNew = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const { updateUserName } = useUser()
  const router = useRouter()
  const [error, setError] = useState(null)
  const { setBannerContent } = appContext
  const [dropdownOptions, setDropdownOptions] = useState(null)
  const [publicationIdsToUnlink, setPublicationIdsToUnlink] = useState([])
  const relations = dropdownOptions?.prefixedRelations
  const relationReaders = dropdownOptions?.relationReaders
  const positions = dropdownOptions?.prefixedPositions
  const institutions = dropdownOptions?.institutions
  const submitButtontext = 'Save Profile Changes'

  const profileReducer = (state, action) => {
    if (action.type === 'load') {
      return {
        ...action.data,
        links: ['homepage', 'gscholar', 'dblp', 'orcid', 'linkedin', 'wikipedia', 'semanticScholar'].reduce(
          (previous, current) => (
            { ...previous, [current]: action.data.links.find(p => p.key === current)?.url ?? '' }
          ), {},
        ),
      }
    }
    return {
      ...state,
      [action.type]: action.data,
    }
  }
  const [profile, setProfile] = useReducer(profileReducer, null)

  const loadProfile = async () => {
    try {
      const { profiles } = await api.get('/profiles', {}, { accessToken })
      if (profiles?.length > 0) {
        setProfile({ type: 'load', data: formatProfileData(profiles[0]) })
      } else {
        setError({ statusCode: 404, message: 'Profile not found' })
      }
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  const handleSubmitButtonClick = () => {
    // eslint-disable-next-line no-use-before-define
    saveProfile(profile)
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
      ...profile.emails?.filter(p => p.confirmed).map(p => p.email),
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
    const dataToSubmit = {
      id: newProfileData.id,
      content: {
        ...newProfileData,
        names: newProfileData.names.map((p) => { const { altUsernames, key, ...rest } = p; return rest }),
        emails: newProfileData.emails.map(p => p.email),
        links: undefined,
        ...newProfileData.links,
        history: newProfileData.history.map((p) => { const { key, ...rest } = p; return rest }),
        expertise: newProfileData.expertise.map((p) => { const { key, ...rest } = p; return rest }),
        preferredName: undefined,
        currentInstitution: undefined,
        id: undefined,
        preferredId: undefined,
      },
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
      // done()
    }
  }

  useEffect(() => {
    if (!accessToken) return
    setBannerContent(viewProfileLink())
    loadProfile()
  }, [accessToken])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const result = await api.get('/profiles/options')
        setDropdownOptions(result)
      } catch (apiError) {
        setDropdownOptions({})
      }
    }
    loadOptions()
  }, [])

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
      <div className="profile-edit-container">
        <NamesSection profileNames={profile?.names} updateNames={names => setProfile({ type: 'names', data: names })} />
        <GenderSection profileGender={profile?.gender} updateGender={gender => setProfile({ type: 'gender', data: gender })} />
        <EmailsSection profileEmails={profile?.emails} profileId={profile?.id} updateEmails={emails => setProfile({ type: 'emails', data: emails })} />
        <PersonalLinksSection profileLinks={profile?.links} updateLinks={links => setProfile({ type: 'links', data: links })} />
        <EducationHisotrySection
          profileHistory={profile?.history}
          positions={positions}
          institutions={institutions}
          updateHistory={history => setProfile({ type: 'history', data: history })}
        />
        <RelationsSection
          profileRelation={profile?.relations}
          relations={relations}
          relationReaders={relationReaders}
          updateRelations={updatedRelations => setProfile({ type: 'relations', data: updatedRelations })}
        />
        <ExpertiseSection profileExpertises={profile?.expertise} updateExpertise={expertise => setProfile({ type: 'expertise', data: expertise })} />
        <ImportedPublicationsSection
          profileId={profile?.id}
          updatePublicationIdsToUnlink={ids => setPublicationIdsToUnlink(ids)}
        />
        <button type="button" className="btn mr-1" onClick={handleSubmitButtonClick}>{submitButtontext}</button>
        <button type="button" className="btn">Cancel</button>
      </div>
    </div>
  )
}

profileEditNew.bodyClass = 'profile-edit'
export default profileEditNew
