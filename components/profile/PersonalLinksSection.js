/* globals $,promptError: false */

import { useEffect, useReducer } from 'react'
import DblpImportModal from '../DblpImportModal'
import Icon from '../Icon'
import { isValidURL } from '../../lib/utils'
import ORCIDImportModal from '../ORCIDImportModal'

const PersonalLinkInput = ({ type, links, setLinks }) => {
  const handleBlur = (e) => {
    const value = e.target.value.trim()
    if (!value) return

    switch (type) {
      case 'gscholar': {
        const isValid = value.startsWith('https://scholar.google')
        if (!isValid) {
          promptError(`${value} is not a valid Google Scholar URL`, { scrollToTop: false })
        }
        setLinks({ type, data: { value, valid: isValid } })
        break
      }
      case 'semanticScholar': {
        const isValid = /^https:\/\/www\.semanticscholar\.org/.test(value)
        if (!isValid) {
          promptError(`${value} is not a valid Semantic Scholar URL`, { scrollToTop: false })
        }
        setLinks({ type, data: { value, valid: isValid } })
        break
      }
      case 'aclanthology': {
        const isValid = /^https:\/\/aclanthology\.org\/people\/.+$/.test(value)
        if (!isValid) {
          promptError(`${value} is not a valid ACL Anthology URL`, { scrollToTop: false })
        }
        setLinks({ type, data: { value, valid: isValid } })
        break
      }
      default: {
        const isValid = isValidURL(value)
        if (!isValid) {
          promptError(`${value} is not a valid ${type} URL`, { scrollToTop: false })
        }
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
  renderPublicationsEditor,
  hideImportButton,
}) => {
  const linksReducer = (state, action) => {
    if (action.type === 'overwrite') return action.data
    return {
      ...state,
      [action.type]: {
        value: action.data.value,
        valid: action.data.valid,
      },
    }
  }

  const [links, setLinks] = useReducer(linksReducer, profileLinks ?? {})

  const handleAddDBLPButtonClick = () => {
    $('#dblp-import-modal').modal({
      show: true,
      backdrop: 'static',
      keyboard: false,
    })
  }

  const handleAddORCIDButtonClick = () => {
    $('#orcid-import-modal').modal({
      show: true,
      backdrop: 'static',
      keyboard: false,
    })
  }

  useEffect(() => {
    if (profileLinks?.homepage?.valid === false)
      setLinks({ type: 'overwrite', data: profileLinks })
  }, [profileLinks?.homepage])

  useEffect(() => {
    updateLinks(links)
    if ($('#dblp-import-modal').data('bs.modal') || $('#orcid-import-modal').data('bs.modal'))
      return
    $('#dblp-import-modal').on('hidden.bs.modal', () => {
      renderPublicationsEditor()
    })
    $('#orcid-import-modal').on('hidden.bs.modal', () => {
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

      {hideImportButton ? (
        <>
          <div className="row">
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">
                DBLP URL
                <a
                  className="personal-links__faqlink"
                  href="https://docs.openreview.net/getting-started/creating-an-openreview-profile/importing-papers-from-dblp"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="info-sign" />
                </a>
              </div>
              <PersonalLinkInput type="dblp" links={links} setLinks={setLinks} />
            </div>
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">ORCID URL</div>
              <PersonalLinkInput type="orcid" links={links} setLinks={setLinks} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="row">
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">
                DBLP URL
                <a
                  className="personal-links__faqlink"
                  href="https://docs.openreview.net/getting-started/creating-an-openreview-profile/importing-papers-from-dblp"
                  target="_blank"
                  rel="noreferrer"
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
              <button
                className="btn btn-primary personal-links__adddblpbtn"
                type="button"
                disabled={!links.dblp?.value}
                onClick={handleAddDBLPButtonClick}
              >
                Add DBLP Papers to Profile
              </button>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">ORCID URL</div>
              <PersonalLinkInput type="orcid" links={links} setLinks={setLinks} />
            </div>
            <div className="col-md-4 personal-links__column">
              <div className="row ml-0 hidden-xs hidden-sm">
                <div className="small-heading">&nbsp;</div>
              </div>
              <button
                className="btn btn-primary personal-links__addorcidbtn"
                type="button"
                disabled={!links.orcid?.value}
                onClick={handleAddORCIDButtonClick}
              >
                Add ORCID Papers to Profile
              </button>
            </div>
          </div>
        </>
      )}

      <div className="row">
        <div className="col-md-4 personal-links__column">
          <div className="small-heading">Wikipedia URL</div>
          <PersonalLinkInput type="wikipedia" links={links} setLinks={setLinks} />
        </div>
        <div className="col-md-4 personal-links__column">
          <div className="small-heading">Linkedin URL</div>
          <PersonalLinkInput type="linkedin" links={links} setLinks={setLinks} />
        </div>
      </div>

      <div className="row">
        <div className="col-md-4 personal-links__column">
          <div className="small-heading">
            Semantic Scholar URL
            <a
              className="personal-links__faqlink"
              href="https://docs.openreview.net/getting-started/creating-an-openreview-profile/finding-and-adding-a-semantic-scholar-url-to-your-profile"
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="info-sign" />
            </a>
          </div>
          <PersonalLinkInput type="semanticScholar" links={links} setLinks={setLinks} />
        </div>
        <div className="col-md-4 personal-links__column">
          <div className="small-heading">
            ACL Anthology URL
            <a
              className="personal-links__faqlink"
              href="https://docs.openreview.net/getting-started/creating-an-openreview-profile/finding-and-adding-your-acl-anthology-url-to-your-profile"
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="info-sign" />
            </a>
          </div>
          <PersonalLinkInput type="aclanthology" links={links} setLinks={setLinks} />
        </div>
      </div>

      <DblpImportModal
        profileId={profileId}
        profileNames={names?.filter((p) => !p.newRow)}
        updateDBLPUrl={(url) => {
          setLinks({ type: 'dblp', data: { value: url } })
        }}
      />
      <ORCIDImportModal profileId={profileId} profileNames={names?.filter((p) => !p.newRow)} />
    </div>
  )
}

export default PersonalLinksSection
