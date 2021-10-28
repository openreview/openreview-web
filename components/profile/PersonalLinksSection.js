/* globals $: false */
import { useEffect, useReducer } from 'react'
import DblpImportModal from '../DblpImportModal'
import Icon from '../Icon'
import ProfileSectionHeader from './ProfileSectionHeader'

const PersonalLinksSection = ({
  profileLinks, updateLinks, id, names, preferredEmail, renderPublicationsEditor, hideDblpButton,
}) => {
  const linksReducer = (state, action) => ({ ...state, [action.type]: { value: action.data } })

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
              <input className={`form-control personal-links__input ${profileLinks?.homepage?.valid === false ? 'invalid-value' : ''}`} value={links.homepage?.value ?? ''} onChange={(e) => { setLinks({ type: 'homepage', data: e.target.value }) }} />
            </div>
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">Google Scholar URL</div>
              <input className={`form-control personal-links__input ${profileLinks?.gscholar?.valid === false ? 'invalid-value' : ''}`} value={links.gscholar?.value ?? ''} onChange={(e) => { setLinks({ type: 'gscholar', data: e.target.value }) }} />
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
              <input id="dblp_url" className={`form-control personal-links__input ${profileLinks?.dblp?.valid === false ? 'invalid-value' : ''}`} value={links.dblp?.value ?? ''} onChange={(e) => { setLinks({ type: 'dblp', data: e.target.value }) }} />
            </div>
            <div className="col-md-4 personal-links__column">
              <div className="row ml-0">
                <div className="small-heading" />
              </div>
              {!hideDblpButton && <button className="btn btn-primary personal-links__adddblpbtn" type="button" disabled={!links.dblp?.value} onClick={handleAddDBLPButtonClick}>Add DBLP Papers to Profile</button>}
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">ORCID URL</div>
              <input className="form-control personal-links__input" value={links.orcid?.value ?? ''} onChange={(e) => { setLinks({ type: 'orcid', data: e.target.value }) }} />
            </div>
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">Wikipedia URL</div>
              <input className="form-control personal-links__input" value={links.wikipedia?.value ?? ''} onChange={(e) => { setLinks({ type: 'wikipedia', data: e.target.value }) }} />
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 personal-links__column">
              <div className="small-heading">Linkedin URL</div>
              <input className="form-control personal-links__input" value={links.linkedin?.value ?? ''} onChange={(e) => { setLinks({ type: 'linkedin', data: e.target.value }) }} />
            </div>
            <div className="col-md-4 personal-links__column">
              <div className="row ml-0">
                <div className="small-heading">Semantic Scholar URL</div>
                <a className="personal-links__faqlink" href="/faq#question-semantic-scholar" target="_blank" rel="noreferrer">
                  <Icon name="info-sign" />
                </a>
              </div>
              <input className="form-control personal-links__input" value={links.semanticScholar?.value ?? ''} onChange={(e) => { setLinks({ type: 'semanticScholar', data: e.target.value }) }} />
            </div>
          </div>
        </div>
      </section>
      <DblpImportModal
        profileId={id}
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
