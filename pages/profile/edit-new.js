/* eslint-disable no-cond-assign */
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
import RelationsSection from '../../components/profile/RelationsSection'
import ExpertiseSection from '../../components/profile/ExpertiseSection'
import ImportedPublicationsSection from '../../components/profile/ImportedPublicationsSection'
import useUser from '../../hooks/useUser'
import {
  isValidDomain, isValidEmail, isValidURL, isValidYear,
} from '../../lib/utils'
import EducationHistorySection from '../../components/profile/EducationHistorySection'

const profileEditNew = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const { updateUserName } = useUser()
  const router = useRouter()
  const [error, setError] = useState(null)
  const { setBannerContent } = appContext
  const [dropdownOptions, setDropdownOptions] = useState(null)
  const [publicationIdsToUnlink, setPublicationIdsToUnlink] = useState([])
  const prefixedRelations = dropdownOptions?.prefixedRelations
  const relationReaders = dropdownOptions?.relationReaders
  const positions = dropdownOptions?.prefixedPositions
  const institutions = dropdownOptions?.institutions
  const submitButtontext = 'Save Profile Changes'
  const personalLinkNames = ['homepage', 'gscholar', 'dblp', 'orcid', 'linkedin', 'wikipedia', 'semanticScholar']

  const profileReducer = (state, action) => {
    if (action.type === 'load') {
      return {
        ...action.data,
        links: personalLinkNames.reduce(
          (previous, current) => (
            { ...previous, [current]: { value: action.data.links.find(p => p.key === current)?.url ?? '' } }
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
  const [renderPublicationEditor, setRenderPublicationEditor] = useState(false)

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
    const { isValid, profileContent } = validateCleanProfile()
    // eslint-disable-next-line no-use-before-define
    if (isValid) saveProfile(profileContent)
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

  const promptInvalidValue = (type, invalidKey, message) => {
    promptError(message)
    setProfile({
      type,
      data: profile[type].map((p) => {
        if (p.key === invalidKey) return { ...p, valid: false }
        return p
      }),
    })
    return { isValid: false, profileContent: null }
  }

  const promptInvalidLink = (link, message) => {
    promptError(message)
    setProfile({
      type: 'links',
      data: {
        ...profile.links,
        [link]: {
          ...profile.links[link],
          valid: false,
        },
      },
    })
    return { isValid: false, profileContent: null }
  }

  // validate and remove empty/not required data
  const validateCleanProfile = () => {
    // filter out empty rows, keep row key
    let profileContent = {
      ...profile,
      names: profile.names.flatMap(p => (p.first || p.middle || p.last ? p : [])),
      emails: profile.emails.flatMap(p => (p.email ? p : [])),
      links: undefined,
      ...profile.links,
      history: profile.history.flatMap(p => (p.position || p.institution?.domain || p.institution?.name ? p : [])),
      expertise: profile.expertise.flatMap(p => (p.expertise ? p : [])),
      relations: profile.relations.flatMap(p => (p.relation ? p : [])),
      preferredEmail: profile.emails.find(p => p.confirmed)?.email,
      preferredName: undefined,
      currentInstitution: undefined,
      id: undefined,
      preferredId: undefined,
    }
    console.log(profileContent)
    // profileContent = {
    //   ...profile,
    //   names: profile.names.map((p) => { const { altUsernames, key, ...rest } = p; return rest }),
    //   emails: profile.emails.map(p => p.email),
    //   links: undefined,
    //   ...profile.links,
    //   history: profile.history.flatMap((p) => {
    //     const { key, ...rest } = p
    //     return p.position || p.institution?.domain || p.institution?.name ? rest : []
    //   }),
    //   expertise: profile.expertise.flatMap((p) => {
    //     const { key, ...rest } = p
    //     return p.expertise ? rest : []
    //   }),
    //   relations: profile.relations.flatMap((p) => {
    //     const { key, ...rest } = p
    //     return p.relation ? rest : []
    //   }),
    //   preferredEmail: profile.emails.find(p => p.confirmed)?.email,
    //   preferredName: undefined,
    //   currentInstitution: undefined,
    //   id: undefined,
    //   preferredId: undefined,
    // }
    let invalidRecord = null
    // validate names
    if (invalidRecord = profileContent.names.find(p => !p.first || !p.last)) {
      return promptInvalidValue('names', invalidRecord.key, 'First and last name cannot be empty')
    }
    // validate emails
    if (invalidRecord = profileContent.emails.find(p => !isValidEmail(p.email))) {
      return promptInvalidValue('emails', invalidRecord.key, `${invalidRecord.email} is not a valid email address`)
    }
    // #region validate personal links
    // eslint-disable-next-line consistent-return
    ['homepage', 'dblp', 'orcid', 'wikipedia', 'linkedin'].forEach((p) => {
      if (profileContent[p].value && !isValidURL(profileContent[p].value)) {
        return promptInvalidLink(p, `${profileContent[p].value} is not a valid URL`)
      }
    })
    if (profileContent.gscholar.value && !(isValidURL(profileContent.gscholar.value) && profileContent.gscholar.value.startsWith('https://scholar.google'))) {
      return promptInvalidLink('gscholar', `${profileContent.gscholar.value} is not a valid Google Scholar URL`)
    }
    if (profileContent.semanticScholar.value && !(isValidURL(profileContent.semanticScholar.value) && profileContent.semanticScholar.value.startsWith('https://www.semanticscholar.org'))) {
      return promptInvalidLink('semanticScholar', `${profileContent.semanticScholar.value} is not a valid Semantic Scholar URL`)
    }
    // must have >1 links
    if (!personalLinkNames.some(p => profileContent[p].value)) {
      return promptInvalidLink('homepage', 'You must enter at least one personal link')
    }
    // #endregion
    // #region validate history
    if (invalidRecord = profileContent.history.find(p => !p.institution?.domain)) {
      return promptInvalidValue('history', invalidRecord.key, 'Domain is required for all positions')
    }
    if (invalidRecord = profileContent.history.find(p => p.institution.domain.startsWith('www') || !isValidDomain(p.institution.domain))) {
      return promptInvalidValue('history', invalidRecord.key, `${invalidRecord.institution.domain} is not a valid domain. Domains should not contain "http", "www", or and special characters like "?" or "/".`)
    }
    if (invalidRecord = profileContent.history.find(p => p.start && !isValidYear(p.start))) {
      return promptInvalidValue('history', invalidRecord.key, 'Start date should be a valid year')
    }
    if (invalidRecord = profileContent.history.find(p => p.end && !isValidYear(p.end))) {
      return promptInvalidValue('history', invalidRecord.key, 'End date should be a valid year')
    }
    if (invalidRecord = profileContent.history.find(p => p.start && p.end && p.start > p.end)) {
      return promptInvalidValue('history', invalidRecord.key, 'End date should be higher than start date')
    }
    if (invalidRecord = profileContent.history.find(p => !p.start && p.end)) {
      return promptInvalidValue('history', invalidRecord.key, 'Start date can not be empty')
    }
    // if (!profileContent.history.length) { // may not happen
    //   promptError('You must enter at least one position for your education and career history')
    // }
    if (invalidRecord = profileContent.history.find(p => !p.position || !p.institution.name || !p.institution.domain)) {
      return promptInvalidValue('history', invalidRecord.key, 'You must enter position, institution, and domain information for each entry in your education and career history')
    }
    // #endregion
    // #region validate relations
    if (invalidRecord = profileContent.relations.find(p => !p.relation || !p.name || !p.email)) {
      return promptInvalidValue('relations', invalidRecord.key, 'You must enter relation, name and email information for each entry in your advisor and other relations')
    }
    if (invalidRecord = profileContent.relations.find(p => !isValidEmail(p.email))) {
      return promptInvalidValue('relations', invalidRecord.key, `${invalidRecord.email} is not a valid email address`)
    }
    if (invalidRecord = profileContent.relations.find(p => p.start && !isValidYear(p.start))) {
      return promptInvalidValue('relations', invalidRecord.key, 'Start date should be a valid year')
    }
    if (invalidRecord = profileContent.relations.find(p => p.end && !isValidYear(p.end))) {
      return promptInvalidValue('relations', invalidRecord.key, 'End date should be a valid year')
    }
    if (invalidRecord = profileContent.relations.find(p => p.start && p.end && p.start > p.end)) {
      return promptInvalidValue('relations', invalidRecord.key, 'End date should be higher than start date')
    }
    if (invalidRecord = profileContent.relations.find(p => !p.start && p.end)) {
      return promptInvalidValue('relations', invalidRecord.key, 'Start date can not be empty')
    }
    // #endregion
    // #region validate expertise
    if (invalidRecord = profileContent.expertise.find(p => p.start && !isValidYear(p.start))) {
      return promptInvalidValue('expertise', invalidRecord.key, 'Start date should be a valid year')
    }
    if (invalidRecord = profileContent.expertise.find(p => p.end && !isValidYear(p.end))) {
      return promptInvalidValue('expertise', invalidRecord.key, 'End date should be a valid year')
    }
    if (invalidRecord = profileContent.expertise.find(p => p.start && p.end && p.start > p.end)) {
      return promptInvalidValue('expertise', invalidRecord.key, 'End date should be higher than start date')
    }
    if (invalidRecord = profileContent.expertise.find(p => !p.start && p.end)) {
      return promptInvalidValue('expertise', invalidRecord.key, 'Start date can not be empty')
    }
    // #endregion
    // #region validate expertise
    return { isValid: true, profileContent }
  }

  const saveProfile = async (profileContent) => {
    const dataToSubmit = {
      id: profile.id,
      content: profileContent,
      signatures: [profile.id],
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
        <PersonalLinksSection
          profileLinks={profile?.links}
          updateLinks={links => setProfile({ type: 'links', data: links })}
          id={profile?.id}
          names={profile?.names}
          preferredEmail={profile?.preferredEmail}
          renderPublicationsEditor={() => setRenderPublicationEditor(current => !current)}
        />
        <EducationHistorySection
          profileHistory={profile?.history}
          positions={positions}
          institutions={institutions}
          updateHistory={history => setProfile({ type: 'history', data: history })}
        />
        <RelationsSection
          profileRelation={profile?.relations}
          prefixedRelations={prefixedRelations}
          relationReaders={relationReaders}
          updateRelations={relations => setProfile({ type: 'relations', data: relations })}
        />
        <ExpertiseSection profileExpertises={profile?.expertise} updateExpertise={expertise => setProfile({ type: 'expertise', data: expertise })} />
        <ImportedPublicationsSection
          profileId={profile?.id}
          updatePublicationIdsToUnlink={ids => setPublicationIdsToUnlink(ids)}
          reRender={renderPublicationEditor}
        />
        <button type="button" className="btn mr-1" onClick={handleSubmitButtonClick}>{submitButtontext}</button>
        <button type="button" className="btn">Cancel</button>
      </div>
    </div>
  )
}

profileEditNew.bodyClass = 'profile-edit'
export default profileEditNew
