/* eslint-disable no-cond-assign */
/* globals promptError: false */
import { useEffect, useReducer, useState } from 'react'
import EducationHistorySection from './EducationHistorySection'
import EmailsSection from './EmailsSection'
import ExpertiseSection from './ExpertiseSection'
import GenderSection from './GenderSection'
import ImportedPublicationsSection from './ImportedPublicationsSection'
import NamesSection from './NameSection'
import PersonalLinksSection from './PersonalLinksSection'
import RelationsSection from './RelationsSection'
import '../../styles/pages/profile-edit.less'
import api from '../../lib/api-client'
import {
  isValidDomain, isValidEmail, isValidURL, isValidYear,
} from '../../lib/utils'
import LoadingSpinner from '../LoadingSpinner'

const ProfileEditor = ({
  loadedProfile,
  submitButtonText,
  submitHandler,
  cancelHandler,
  hideCancelButton,
  hideDblpButton,
  hidePublicationEditor,
  personalLinkNames,
  loading,
}) => {
  const profileReducer = (state, action) => ({
    ...state,
    [action.type]: action.data,
  })
  const [profile, setProfile] = useReducer(profileReducer, loadedProfile)
  const [dropdownOptions, setDropdownOptions] = useState(null)
  const [publicationIdsToUnlink, setPublicationIdsToUnlink] = useState([])
  const [renderPublicationEditor, setRenderPublicationEditor] = useState(false)
  const prefixedRelations = dropdownOptions?.prefixedRelations
  const relationReaders = dropdownOptions?.relationReaders
  const positions = dropdownOptions?.prefixedPositions
  const institutions = dropdownOptions?.institutions
  const submitButtontext = submitButtonText ?? 'Save Profile Changes'

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
      // eslint-disable-next-line max-len
      history: profile.history.flatMap(p => (p.position || p.institution?.domain || p.institution?.name ? p : [])),
      expertise: profile.expertise.flatMap(p => (p.expertise ? p : [])),
      relations: profile.relations.flatMap(p => (p.relation || p.name || p.email ? p : [])),
      preferredEmail: profile.emails.find(p => p.confirmed)?.email,
      preferredName: undefined,
      currentInstitution: undefined,
      id: undefined,
      preferredId: undefined,
    }

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
      if (profileContent[p]?.value && !isValidURL(profileContent[p].value)) {
        return promptInvalidLink(p, `${profileContent?.[p]?.value} is not a valid URL`)
      }
    })
    if (profileContent.gscholar?.value && !(isValidURL(profileContent.gscholar.value) && profileContent.gscholar.value.startsWith('https://scholar.google'))) {
      return promptInvalidLink('gscholar', `${profileContent.gscholar.value} is not a valid Google Scholar URL`)
    }
    if (profileContent.semanticScholar?.value && !(isValidURL(profileContent.semanticScholar.value) && profileContent.semanticScholar.value.startsWith('https://www.semanticscholar.org'))) {
      return promptInvalidLink('semanticScholar', `${profileContent.semanticScholar.value} is not a valid Semantic Scholar URL`)
    }
    // must have >1 links
    if (!personalLinkNames.some(p => profileContent[p]?.value)) {
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
    if (!profileContent.history.length) {
      return promptInvalidValue('history', profile.history?.[0]?.key, 'You must enter at least one position for your education and career history')
    }
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

    // remove unused props
    profileContent = {
      ...profileContent,
      names: profileContent.names.map((p) => {
        const {
          altUsernames, newRow, key, ...rest
        } = p
        return rest
      }),
      emails: profileContent.emails.map(p => p.email),
      history: profileContent.history.map((p) => { const { key, ...rest } = p; return rest }),
      expertise: profileContent.expertise.map((p) => { const { key, ...rest } = p; return rest }),
      relations: profileContent.relations.map((p) => { const { key, ...rest } = p; return rest }),
      preferredEmail: profileContent.emails.find(p => p.preferred)?.email,
      homepage: profileContent.homepage?.value,
      gscholar: profileContent.gscholar?.value,
      dblp: profileContent.dblp?.value,
      orcid: profileContent.orcid?.value,
      wikipedia: profileContent.wikipedia?.value,
      linkedin: profileContent.linkedin?.value,
      semanticScholar: profileContent.semanticScholar?.value,
    }
    return { isValid: true, profileContent }
  }

  const handleSubmitButtonClick = () => {
    const { isValid, profileContent } = validateCleanProfile()
    if (isValid) submitHandler(profileContent, publicationIdsToUnlink)
  }

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
  return (
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
        hideDblpButton={hideDblpButton}
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
      {
        !hidePublicationEditor
        && (
          <ImportedPublicationsSection
            profileId={profile?.id}
            updatePublicationIdsToUnlink={ids => setPublicationIdsToUnlink(ids)}
            reRender={renderPublicationEditor}
          />
        )
      }
      <div className="buttons-row">
        <button type="button" className="btn submit-button" disabled={loading} onClick={() => handleSubmitButtonClick()}>
          {submitButtontext}
          {loading && <LoadingSpinner inline text="" extraClass="spinner-small" />}
        </button>
        {!hideCancelButton && <button type="button" className="btn btn-default" onClick={cancelHandler}>Cancel</button>}
      </div>
    </div>
  )
}

export default ProfileEditor
