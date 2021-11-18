/* globals $,promptError: false */
import { useEffect, useReducer } from 'react'
import { isValidURL } from '../../lib/utils'
import DblpImportModal from '../DblpImportModal'
import Icon from '../Icon'
import ProfileSectionHeader from './ProfileSectionHeader'

const PersonalLinkInput = ({ type, links, setLinks }) => {
  const handleBlur = (e) => {
    const { value } = e.target
    if (!value.trim()?.length) return
    switch (type) {
      case 'gscholar': {
        const isValid = isValidURL(value) && value.startsWith('https://scholar.google')
        if (!isValid) promptError(`${value} is not a valid Google Scholar URL`, { scrollToTop: false })
        setLinks({ type, payload: { data: value, valid: isValid } })
        break
      }
      case 'semanticScholar': {
        const isValid = isValidURL(value) && value.startsWith('https://www.semanticscholar.org')
        if (!isValid) promptError(`${value} is not a valid Semantic Scholar URL`, { scrollToTop: false })
        setLinks({ type, payload: { data: value, valid: isValid } })
        break
      }
      default: {
        const isValid = isValidURL(value)
        if (!isValid) promptError(`${value} is not a valid ${type} URL`, { scrollToTop: false })
        setLinks({ type, payload: { data: value, valid: isValid } })
      }
    }
  }
  return (
    <input
      id={`${type}_url`}
      className={`form-control personal-links__input ${links[type]?.valid === false ? 'invalid-value' : ''}`}
      value={links[type]?.value ?? ''}
      onChange={(e) => { setLinks({ type, payload: { data: e.target.value } }) }}
      onBlur={handleBlur}
    />
  )
}

const PersonalLinksSection = ({
  profileLinks, updateLinks, profileId, names, preferredEmail, renderPublicationsEditor, hideDblpButton,
}) => {
  const linksReducer = (state, action) => ({
    ...state,
    [action.type]: {
      value: action.payload.data,
      valid: action.payload.valid,
    },
  })

  const [links, setLinks] = useReducer(linksReducer, profileLinks ?? {})

  const handleAddDBLPButtonClick = () => {
    $('#dblp-import-modal').modal({
      show: true,
      backdrop: 'static',
      keyboard: false,
    })
  }

  useEffect(() => {
    updateLinks(links)
    $('#dblp-import-modal').on('hidden.bs.modal', () => {
      renderPublicationsEditor()
    })
  }, [links])

  return (
    <>
      <section>
        <ProfileSectionHeader type="personalLinks" />
        <div className="container personal-links">
          <div className="row">
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">Homepage URL</div>
              <PersonalLinkInput type="homepage" links={links} setLinks={setLinks} />
            </div>
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">Google Scholar URL</div>
              <PersonalLinkInput type="gscholar" links={links} setLinks={setLinks} />
            </div>
          </div>

          <div className="row">
            <div className="col-md-4 personal-links__column">
              <div className="row ml-0">
                <div className="small-heading">DBLP URL</div>
                <a className="personal-links__faqlink" href="/faq#question-dblp-import" target="_blank" rel="noreferrer">
                  <Icon name="info-sign" />
                </a>
              </div>
              <PersonalLinkInput type="dblp" links={links} setLinks={setLinks} />
            </div>
            <div className="col-md-4 personal-links__column">
              <div className="row ml-0">
                <div className="small-heading" />
              </div>
              {!hideDblpButton && (
                <button className="btn btn-primary personal-links__adddblpbtn" type="button" disabled={!links.dblp?.value} onClick={handleAddDBLPButtonClick}>
                  Add DBLP Papers to Profile
                </button>
              )}
            </div>
          </div>

          <div className="row">
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">ORCID URL</div>
              <PersonalLinkInput type="orcid" links={links} setLinks={setLinks} />
            </div>
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">Wikipedia URL</div>
              <PersonalLinkInput type="wikipedia" links={links} setLinks={setLinks} />
            </div>
          </div>

          <div className="row">
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">Linkedin URL</div>
              <PersonalLinkInput type="linkedin" links={links} setLinks={setLinks} />
            </div>
            <div className="col-md-4 personal-links__column">
              <div className="row ml-0">
                <div className="small-heading">Semantic Scholar URL</div>
                <a className="personal-links__faqlink" href="/faq#question-semantic-scholar" target="_blank" rel="noreferrer">
                  <Icon name="info-sign" />
                </a>
              </div>
              <PersonalLinkInput type="semanticScholar" links={links} setLinks={setLinks} />
            </div>
          </div>
        </div>
      </section>

      <DblpImportModal
        profileId={profileId}
        profileNames={names?.map(name => (
          name.middle ? `${name.first} ${name.middle} ${name.last}` : `${name.first} ${name.last}`
        ))}
        email={preferredEmail}
        updateDBLPUrl={(url) => { setLinks({ type: 'dblp', data: url }) }}
      />
    </>
  )
}

export default PersonalLinksSection
