/* globals promptError: false */
/* eslint-disable no-cond-assign */

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import pick from 'lodash/pick'
import Steps from 'rc-steps'
import EducationHistorySection from './EducationHistorySection'
import EmailsSection from './EmailsSection'
import ExpertiseSection from './ExpertiseSection'
import GenderSection from './GenderSection'
import PronounSection from './PronounSection'
import ImportedPublicationsSection from './ImportedPublicationsSection'
import LoadingSpinner from '../LoadingSpinner'
import NamesSection from './NameSection'
import PersonalLinksSection from './PersonalLinksSection'
import ProfileSection from './ProfileSection'
import RelationsSection from './RelationsSection'
import api from '../../lib/api-client'
import { isValidDomain, isValidEmail, isValidYear } from '../../lib/utils'
import BirthDateSection from './BirthDateSection'

export default function ProfileEditor({
  loadedProfile,
  submitButtonText,
  submitHandler,
  cancelHandler,
  hideCancelButton,
  hideImportButton,
  hidePublicationEditor,
  loading,
  isNewProfile,
  saveProfileErrors,
  loadProfile,
}) {
  const profileReducer = (state, action) => {
    if (action.type === 'reset') return action.data
    return {
      ...state,
      [action.type]: action.data,
    }
  }
  const [profile, setProfile] = useReducer(profileReducer, loadedProfile)
  const [dropdownOptions, setDropdownOptions] = useState(null)
  const [publicationIdsToUnlink, setPublicationIdsToUnlink] = useState([])
  const [renderPublicationEditor, setRenderPublicationEditor] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [invalidSteps, setInvalidSteps] = useState([])
  const stepRef = useRef(null)
  const renderPublicationsEditor = useCallback(() => {
    setRenderPublicationEditor((current) => !current)
  }, [])

  const prefixedRelations = dropdownOptions?.prefixedRelations
  const relationReaders = dropdownOptions?.relationReaders
  const positions = dropdownOptions?.prefixedPositions
  const institutionDomains = dropdownOptions?.institutionDomains
  const countries = dropdownOptions?.countries

  const personalLinkNames = [
    'homepage',
    'gscholar',
    'dblp',
    'orcid',
    'wikipedia',
    'linkedin',
    'semanticScholar',
    'aclanthology',
  ]

  const promptInvalidValue = (type, invalidKey, message) => {
    promptError(message)
    setProfile({
      type,
      data: profile[type]?.map((p, index) => {
        if ((!invalidKey && index === 0) || (invalidKey && p.key === invalidKey))
          return { ...p, valid: false }
        return p
      }),
    })
    return { isValid: false, profileContent: null }
  }

  const promptInvalidHisotry = (invalidKey, fields, message) => {
    promptError(message)
    setProfile({
      type: 'history',
      data: profile.history?.map((p, index) => {
        if ((!invalidKey && index === 0) || (invalidKey && p.key === invalidKey))
          return { ...p, valid: false, invalidFields: fields }
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

  const promptInvalidSection = (message) => {
    promptError(message)
    setProfile({
      type: 'links',
      data: Object.fromEntries(
        personalLinkNames.map((p) => [p, { ...profile.links[p], valid: false }])
      ),
    })
    return { isValid: false, profileContent: null }
  }

  // validate and remove empty/not required data
  const validateCleanProfile = () => {
    // build profile content object, filtering out empty rows
    let profileContent = {
      ...profile,
      names: profile.names.map((p) => (p.fullname ? p : null)).filter(Boolean),
      yearOfBirth: profile.yearOfBirth ? Number.parseInt(profile.yearOfBirth, 10) : undefined,
      emails: profile.emails.map((p) => (p.email ? p : null)).filter(Boolean),
      links: undefined,
      ...profile.links,
      history: profile.history?.flatMap((p) =>
        p.position || p.institution?.domain || p.institution?.name ? p : []
      ),
      expertise: profile.expertise?.flatMap((p) => (p.keywords?.length ? p : [])),
      relations: profile.relations.flatMap((p) => (p.relation || p.name || p.email ? p : [])),
      preferredEmail: profile.emails.find((p) => p.confirmed)?.email,
      preferredName: undefined,
      currentInstitution: undefined,
      id: undefined,
      preferredId: undefined,
      state: undefined,
      readers: undefined,
      joined: undefined,
    }

    let invalidRecord = null

    // #region validate emails
    if ((invalidRecord = profileContent.emails.find((p) => !isValidEmail(p.email)))) {
      setInvalidSteps((current) => [...current, 2])
      return promptInvalidValue(
        'emails',
        invalidRecord.key,
        `${invalidRecord.email} is not a valid email address`
      )
    }
    // #endregion

    // #region validate personal links
    // must have at least 1 link
    if (!personalLinkNames.some((p) => profileContent[p]?.value?.trim())) {
      setInvalidSteps((current) => [...current, 3])
      return promptInvalidSection('You must enter at least one personal link')
    }
    // must not have any invalid links
    const invalidLinkName = personalLinkNames.find(
      (p) => profileContent[p]?.value && profileContent[p].valid === false
    )
    if (invalidLinkName) {
      setInvalidSteps((current) => [...current, 3])
      return promptInvalidLink(
        invalidLinkName,
        'One of your personal links is invalid. Please make sure all URLs start with http:// or https://'
      )
    }
    // #endregion

    // #region validate history
    if ((invalidRecord = profileContent.history?.find((p) => !p.institution?.domain))) {
      setInvalidSteps((current) => [...current, 4])
      return promptInvalidHisotry(
        invalidRecord.key,
        ['institution'],
        'Domain is required for all positions'
      )
    }
    if (
      (invalidRecord = profileContent.history?.find(
        (p) => p.institution.domain.startsWith('www') || !isValidDomain(p.institution.domain)
      ))
    ) {
      setInvalidSteps((current) => [...current, 4])
      return promptInvalidHisotry(
        invalidRecord.key,
        ['institution'],
        `${invalidRecord.institution.domain} is not a valid domain. Domains should not contain "http", "www", or and special characters like "?" or "/".`
      )
    }
    if (
      (invalidRecord = profileContent.history?.find((p) => p.start && !isValidYear(p.start)))
    ) {
      setInvalidSteps((current) => [...current, 4])
      return promptInvalidHisotry(
        invalidRecord.key,
        ['startYear'],
        'Start date should be a valid year'
      )
    }
    if ((invalidRecord = profileContent.history?.find((p) => p.end && !isValidYear(p.end)))) {
      setInvalidSteps((current) => [...current, 4])
      return promptInvalidHisotry(
        invalidRecord.key,
        ['endYear'],
        'End date should be a valid year'
      )
    }
    if (
      (invalidRecord = profileContent.history?.find(
        (p) => p.start && p.end && p.start > p.end
      ))
    ) {
      setInvalidSteps((current) => [...current, 4])
      return promptInvalidHisotry(
        invalidRecord.key,
        ['startYear', 'endYear'],
        'End date should be higher than start date'
      )
    }
    if ((invalidRecord = profileContent.history?.find((p) => !p.start && p.end))) {
      setInvalidSteps((current) => [...current, 4])
      return promptInvalidHisotry(
        invalidRecord.key,
        ['startYear'],
        'Start date can not be empty'
      )
    }
    if (!profileContent.history?.length) {
      setInvalidSteps((current) => [...current, 4])
      return promptInvalidHisotry(null, [], 'Career and education history cannot be empty')
    }
    if (
      (invalidRecord = profileContent.history?.find(
        (p) =>
          !p.position ||
          !p.institution.name ||
          !p.institution.domain ||
          ((!p.end || p.end >= new Date().getFullYear()) && !p.institution.country)
      ))
    ) {
      setInvalidSteps((current) => [...current, 4])
      return promptInvalidHisotry(
        invalidRecord.key,
        ['position', 'institution', 'country'],
        'You must enter position, institution, domain and country/region information for each entry in your career and education history'
      )
    }
    if (!profileContent.history.some((p) => !p.end || p.end >= new Date().getFullYear())) {
      setInvalidSteps((current) => [...current, 4])
      return promptInvalidHisotry(
        profile.history?.[0]?.key,
        ['endYear'],
        'Your Career & Education History must include at least one current position.'
      )
    }
    // #endregion

    // #region validate relations
    if (
      (invalidRecord = profileContent.relations.find(
        (p) => !p.relation || !p.name || (!p.email && !p.username)
      ))
    ) {
      setInvalidSteps((current) => [...current, 5])
      return promptInvalidValue(
        'relations',
        invalidRecord.key,
        'You must enter relation and select the profile for each entry in your advisor and other relations'
      )
    }
    if (
      (invalidRecord = profileContent.relations.find(
        (p) => !p.username && !isValidEmail(p.email)
      ))
    ) {
      setInvalidSteps((current) => [...current, 5])
      return promptInvalidValue(
        'relations',
        invalidRecord.key,
        `${invalidRecord.email} is not a valid email address`
      )
    }
    if (
      (invalidRecord = profileContent.relations.find((p) => p.start && !isValidYear(p.start)))
    ) {
      setInvalidSteps((current) => [...current, 5])
      return promptInvalidValue(
        'relations',
        invalidRecord.key,
        'Start date should be a valid year'
      )
    }
    if ((invalidRecord = profileContent.relations.find((p) => p.end && !isValidYear(p.end)))) {
      setInvalidSteps((current) => [...current, 5])
      return promptInvalidValue(
        'relations',
        invalidRecord.key,
        'End date should be a valid year'
      )
    }
    if (
      (invalidRecord = profileContent.relations.find(
        (p) => p.start && p.end && p.start > p.end
      ))
    ) {
      setInvalidSteps((current) => [...current, 5])
      return promptInvalidValue(
        'relations',
        invalidRecord.key,
        'End date should be higher than start date'
      )
    }
    if ((invalidRecord = profileContent.relations.find((p) => !p.start && p.end))) {
      setInvalidSteps((current) => [...current, 5])
      return promptInvalidValue('relations', invalidRecord.key, 'Start date can not be empty')
    }
    // #endregion

    // #region validate expertise
    if (
      (invalidRecord = profileContent.expertise?.find((p) => p.start && !isValidYear(p.start)))
    ) {
      setInvalidSteps((current) => [...current, 6])
      return promptInvalidValue(
        'expertise',
        invalidRecord.key,
        'Start date should be a valid year'
      )
    }
    if (
      (invalidRecord = profileContent.expertise?.find((p) => p.end && !isValidYear(p.end)))
    ) {
      setInvalidSteps((current) => [...current, 6])
      return promptInvalidValue(
        'expertise',
        invalidRecord.key,
        'End date should be a valid year'
      )
    }
    if (
      (invalidRecord = profileContent.expertise?.find(
        (p) => p.start && p.end && p.start > p.end
      ))
    ) {
      setInvalidSteps((current) => [...current, 6])
      return promptInvalidValue(
        'expertise',
        invalidRecord.key,
        'End date should be higher than start date'
      )
    }
    if ((invalidRecord = profileContent.expertise?.find((p) => !p.start && p.end))) {
      setInvalidSteps((current) => [...current, 6])
      return promptInvalidValue('expertise', invalidRecord.key, 'Start date can not be empty')
    }
    // #endregion

    // remove unused props
    profileContent = {
      ...profileContent,
      names: profileContent.names.map((p) => {
        const fieldsToInclude = ['fullname', 'preferred']
        if (!p.newRow && p.username) fieldsToInclude.push('username')
        return pick(p, fieldsToInclude)
      }),
      emails: profileContent.emails.map((p) => p.email),
      history: profileContent.history.map((p) =>
        pick(p, ['position', 'start', 'end', 'institution'])
      ),
      expertise: profileContent.expertise?.map((p) => pick(p, ['keywords', 'start', 'end'])),
      relations: profileContent.relations.map((p) =>
        pick(p, ['relation', 'username', 'name', 'email', 'start', 'end', 'readers'])
      ),
      preferredEmail: profileContent.emails.find((p) => p.preferred)?.email,
      homepage: profileContent.homepage?.value?.trim(),
      gscholar: profileContent.gscholar?.value?.trim(),
      dblp: profileContent.dblp?.value?.trim(),
      orcid: profileContent.orcid?.value?.trim(),
      wikipedia: profileContent.wikipedia?.value?.trim(),
      linkedin: profileContent.linkedin?.value?.trim(),
      semanticScholar: profileContent.semanticScholar?.value?.trim(),
      aclanthology: profileContent.aclanthology?.value?.trim(),
    }
    return { isValid: true, profileContent, profileReaders: profile.readers }
  }

  const handleSubmit = async () => {
    setInvalidSteps([])
    const { isValid, profileContent, profileReaders } = validateCleanProfile()
    if (isValid) {
      await submitHandler(profileContent, profileReaders, publicationIdsToUnlink)
    }
    if (currentStep === 3) {
      setRenderPublicationEditor((current) => !current)
    }
  }

  const renderStep = (step) => {
    switch (step) {
      case 0:
        return (
          <ProfileSection
            title="Names"
            instructions="Enter your full name. Also add any other names you have used in the past when authoring papers."
          >
            <NamesSection
              profileNames={profile?.names}
              updateNames={(names) => setProfile({ type: 'names', data: names })}
              preferredUsername={loadedProfile?.names?.find((p) => p.preferred)?.username}
            />
          </ProfileSection>
        )
      case 1:
        return (
          <>
            <ProfileSection
              title="Gender"
              instructions="This information helps conferences better understand their gender diversity. (Optional)"
            >
              <GenderSection
                profileGender={profile?.gender}
                updateGender={(gender) => setProfile({ type: 'gender', data: gender })}
              />
            </ProfileSection>
            <ProfileSection
              title="Pronouns"
              instructions="This information helps conferences know how to refer to you. (Optional)"
            >
              <PronounSection
                profilePronouns={profile?.pronouns}
                updatePronoun={(pronouns) => setProfile({ type: 'pronouns', data: pronouns })}
              />
            </ProfileSection>
            <ProfileSection
              title="Year Of Birth"
              instructions="This information is solely used by OpenReview to disambiguate user profiles. It will never be released publicly or shared with venue organizers. (Optional)"
            >
              <BirthDateSection
                profileYearOfBirth={profile?.yearOfBirth}
                updateYearOfBirth={(yearOfBirth) =>
                  setProfile({ type: 'yearOfBirth', data: yearOfBirth })
                }
              />
            </ProfileSection>
            {!hidePublicationEditor && (
              <ProfileSection
                title="Profile Visibility"
                instructions="Your OpenReview profile will be visible to the public by default. To hide your profile from unauthenticated users, uncheck the box below."
              >
                <div className="checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="profile-visibility"
                      value="everyone"
                      checked={profile?.readers?.includes('everyone')}
                      onChange={(e) => {
                        const newReaders = e.target.checked ? ['everyone'] : ['~']
                        setProfile({ type: 'readers', data: newReaders })
                      }}
                    />{' '}
                    Public profile page
                  </label>
                </div>
              </ProfileSection>
            )}
          </>
        )

      case 2:
        return (
          <ProfileSection
            title="Emails"
            instructions={
              <>
                <div>
                  Enter all email addresses associated with your current and historical
                  institutional affiliations, your previous publications, and any other related
                  systems, such as TPMS, CMT, and ArXiv.
                </div>
                <strong>
                  Emails associated with former affiliations (including previous employers)
                  should not be deleted.
                </strong>{' '}
                This information is crucial for deduplicating users and ensuring that you see
                your reviewing assignments. OpenReview will only send messages to the address
                marked as “Preferred”.
              </>
            }
          >
            <EmailsSection
              profileEmails={profile?.emails}
              profileId={profile?.id}
              updateEmails={(emails) => setProfile({ type: 'emails', data: emails })}
              institutionDomains={institutionDomains}
              isNewProfile={isNewProfile}
              loadProfile={loadProfile}
            />
          </ProfileSection>
        )
      case 3:
        return (
          <>
            <ProfileSection
              title={`Personal Links${isNewProfile ? ' *' : ''}`}
              instructions={`${
                isNewProfile
                  ? 'At least one URL is required that displays your name and email. '
                  : ''
              }Enter full URLs of your public profiles on other sites. All URLs should begin
          with http:// or https://`}
            >
              <PersonalLinksSection
                profileLinks={profile?.links}
                profileId={profile?.id}
                names={profile?.names}
                renderPublicationsEditor={renderPublicationsEditor}
                hideImportButton={hideImportButton}
                updateLinks={(links) => setProfile({ type: 'links', data: links })}
              />
            </ProfileSection>
            {!hidePublicationEditor && (
              <ProfileSection
                title="Imported Publications"
                instructions="Below is a list of publications imported from DBLP and other sources that
                include you as an author. To remove any publications you are not actually an author of
                from your profile, click the minus sign next to the title."
              >
                <ImportedPublicationsSection
                  profileId={profile?.id}
                  updatePublicationIdsToUnlink={(ids) => setPublicationIdsToUnlink(ids)}
                  reRender={renderPublicationEditor}
                />
              </ProfileSection>
            )}
          </>
        )
      case 4:
        return (
          <ProfileSection
            title={`Career & Education History${isNewProfile ? ' *' : ''}`}
            instructions="Enter your career and education history. The institution domain is used for
          conflict of interest detection, author deduplication, analysis of career path history, and
          tallies of institutional diversity. For ongoing positions, leave the End field blank."
          >
            <EducationHistorySection
              profileHistory={profile?.history}
              positions={positions}
              institutionDomains={institutionDomains}
              countries={countries}
              updateHistory={(history) => setProfile({ type: 'history', data: history })}
            />
          </ProfileSection>
        )
      case 5:
        return (
          <ProfileSection
            title="Advisors &amp; Other Relations"
            instructions={
              <>
                Enter all advisors, co-workers, and other people that should be included when
                detecting conflicts of interest.
                <br />
                For example, you can choose &lsquo;PhD advisor&rsquo; and enter the name of
                your PhD advisor.
              </>
            }
          >
            <RelationsSection
              profileRelation={profile?.relations}
              prefixedRelations={prefixedRelations}
              relationReaders={relationReaders}
              updateRelations={(relations) =>
                setProfile({ type: 'relations', data: relations })
              }
            />
          </ProfileSection>
        )
      case 6:
        return (
          <ProfileSection
            title="Expertise"
            instructions={
              <>
                <div>
                  For each line, enter comma-separated keyphrases representing an intersection
                  of your interests. Think of each line as a query for papers in which you
                  would have expertise and interest. For example:
                </div>
                <em>topic models, social network analysis, computational social science</em>
                <br />
                <em>deep learning, RNNs, dependency parsing</em>
              </>
            }
          >
            <ExpertiseSection
              profileExpertises={profile?.expertise}
              updateExpertise={(expertise) =>
                setProfile({ type: 'expertise', data: expertise })
              }
            />
          </ProfileSection>
        )
      default:
        return null
    }
  }

  const getStepStatus = (step) => {
    if (invalidSteps.includes(step)) {
      return 'error'
    }
    return currentStep === step ? 'process' : 'wait'
  }

  useEffect(() => {
    stepRef.current?.firstChild?.children?.[currentStep]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [currentStep])

  useEffect(() => {
    if (!saveProfileErrors?.length) return
    if (saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/names'))) {
      setInvalidSteps((current) => [...current, 0])
    }
    if (
      saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/pronouns')) ||
      saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/gender')) ||
      saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/yearOfBirth'))
    ) {
      setInvalidSteps((current) => [...current, 1])
    }
    if (saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/emails'))) {
      setInvalidSteps((current) => [...current, 2])
    }
    if (
      saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/homepage')) ||
      saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/dblp')) ||
      saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/gscholar')) ||
      saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/linkedin')) ||
      saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/orcid')) ||
      saveProfileErrors.some((errorPath) =>
        errorPath?.startsWith('content/semanticScholar')
      ) ||
      saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/aclanthology')) ||
      saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/wikipedia'))
    ) {
      setInvalidSteps((current) => [...current, 3])
    }
    if (saveProfileErrors.some((errorPath) => errorPath?.startsWith('content/history'))) {
      setInvalidSteps((current) => [...current, 4])
    }
  }, [saveProfileErrors])

  useEffect(() => {
    if (loadedProfile) {
      setProfile({ type: 'reset', data: loadedProfile })
      setInvalidSteps([])
    }
  }, [loadedProfile])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const result = await Promise.all([
          api.get('/settings/prefixedRelations'),
          api.get('/settings/relationReaders'),
          api.get('/settings/prefixedPositions'),
          api.get('/settings/institutionDomains'),
          api.get('/settings/countries'),
        ])
        setDropdownOptions({
          prefixedRelations: result[0],
          relationReaders: result[1],
          prefixedPositions: result[2],
          institutionDomains: result[3],
          countries: result[4],
        })
      } catch (apiError) {
        setDropdownOptions({})
      }
    }
    loadOptions()
  }, [])

  return (
    <div className="profile-edit-container" ref={stepRef}>
      <Steps
        type="navigation"
        current={currentStep}
        onChange={(e) => {
          setCurrentStep(e)
        }}
        items={[
          {
            step: 0,
            title: 'Names',
            status: getStepStatus(0),
          },
          {
            step: 1,
            title: 'Personal Info',
            description: isNewProfile
              ? 'Gender, Pronouns and Birth Year'
              : 'Gender, Pronouns, Birth Year and Profile Visibility',
            status: getStepStatus(1),
          },
          {
            step: 2,
            title: 'Emails',
            status: getStepStatus(2),
          },
          {
            step: 3,
            title: 'Personal Links',
            ...(!hidePublicationEditor && { description: 'Imported DBLP publications' }),
            status: getStepStatus(3),
          },
          {
            step: 4,
            title: 'History',
            description: 'Career & Education History',
            status: getStepStatus(4),
          },
          {
            step: 5,
            title: 'Relations',
            description: 'Advisors & Other Relations',
            status: getStepStatus(5),
          },
          {
            step: 6,
            title: 'Expertise',
            status: getStepStatus(6),
          },
        ]}
      />
      {renderStep(currentStep)}

      {isNewProfile && currentStep === 6 && (
        <p className="help-block">
          By registering, you agree to the{' '}
          <a href="/legal/terms" target="_blank" rel="noopener noreferrer">
            <strong>Terms of Use</strong>
          </a>
          , last updated September 24, 2024.
        </p>
      )}

      {isNewProfile && currentStep !== 6 ? (
        <div className="buttons-row">
          <button
            type="button"
            className="btn submit-button"
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            {'Next Section'}
          </button>
        </div>
      ) : (
        <div className="buttons-row">
          <button
            type="button"
            className="btn submit-button"
            disabled={loading}
            onClick={handleSubmit}
          >
            {submitButtonText ?? 'Save Profile Changes'}
            {loading && <LoadingSpinner inline text="" extraClass="spinner-small" />}
          </button>
          {!hideCancelButton && (
            <button type="button" className="btn btn-default" onClick={cancelHandler}>
              {isNewProfile ? 'Cancel' : 'Exit Edit Mode'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
