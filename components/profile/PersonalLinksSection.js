/* globals $,promptError: false */

import { useEffect, useReducer } from 'react'
import DblpImportModal from '../DblpImportModal'
import Icon from '../Icon'
import { isValidURL } from '../../lib/utils'

const PersonalLinkInput = ({ type, links, setLinks }) => {
  const handleBlur = (e) => {
    const { value } = e.target
    if (!value.trim()?.length) return
    switch (type) {
      case 'gscholar': {
        const isValid = isValidURL(value.trim()) && value.startsWith('https://scholar.google')
        if (!isValid)
          promptError(`${value} is not a valid Google Scholar URL`, { scrollToTop: false })
        setLinks({ type, data: { value, valid: isValid } })
        break
      }
      case 'semanticScholar': {
        const isValid =
          isValidURL(value.trim()) && value.startsWith('https://www.semanticscholar.org')
        if (!isValid)
          promptError(`${value} is not a valid Semantic Scholar URL`, { scrollToTop: false })
        setLinks({ type, data: { value, valid: isValid } })
        break
      }
      default: {
        const isValid = isValidURL(value.trim())
        if (!isValid)
          promptError(`${value} is not a valid ${type} URL`, { scrollToTop: false })
        setLinks({ type, data: { value, valid: isValid } })
      }
    }
  }
  return (
    <input
      id={`${type}_url`}
      className={`form-control personal-links__input ${
        links[type]?.valid === false ? 'invalid-value' : ''
      }`}
      value={links[type]?.value ?? ''}
      onChange={(e) => {
        setLinks({ type, data: { value: e.target.value } })
      }}
      onBlur={handleBlur}
    />
  )
}

const PersonalLinksSection = ({
  profileLinks,
  updateLinks,
  profileId,
  names,
  preferredEmail,
  renderPublicationsEditor,
  hideDblpButton,
}) => {
  const linksReducer = (state, action) => ({
    ...state,
    [action.type]: {
      value: action.data.value,
      valid: action.data.valid,
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
          <div className="small-heading">
            DBLP URL
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              className="personal-links__faqlink"
              href="/faq#question-dblp-import"
              target="_blank"
            >
              <Icon name="info-sign" />
            </a>
          </div>
          <PersonalLinkInput type="dblp" links={links} setLinks={setLinks} />
        </div>
        <div className="col-md-4 personal-links__column">
          <div className="row ml-0 hidden-xs hidden-sm">
            <div className="small-heading">&nbsp;</div>
          </div>
          {!hideDblpButton && (
            <button
              className="btn btn-primary personal-links__adddblpbtn"
              type="button"
              disabled={!links.dblp?.value}
              onClick={handleAddDBLPButtonClick}
            >
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
          <div className="small-heading">
            Semantic Scholar URL
            <a
              className="personal-links__faqlink"
              href="/faq#question-semantic-scholar"
              target="_blank"
            >
              <Icon name="info-sign" />
            </a>
          </div>
          <PersonalLinkInput type="semanticScholar" links={links} setLinks={setLinks} />
        </div>
      </div>

      <DblpImportModal
        profileId={profileId}
        profileNames={names?.filter((p) => !p.newRow)}
        updateDBLPUrl={(url) => {
          setLinks({ type: 'dblp', data: { value: url } })
        }}
      />
    </div>
  )
}

export default PersonalLinksSection
