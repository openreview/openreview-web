/* globals promptMessage,promptError: false */
import { useReducer } from 'react'
import Dropdown from '../../../../components/Dropdown'
import api from '../../../../lib/api-client'

export default function InstituitonSearchForm({
  countryOptions,
  accessToken,
  setInstitutions,
  setPage,
  reloadInstitutionsDomains,
  institutions,
}) {
  const [searchAddForm, setSearchAddForm] = useReducer((state, action) => {
    if (action.type === 'reset') return {}
    return { ...state, [action.type]: action.payload }
  }, {})

  const searchInstitution = () => {
    const institutionIdToSearch = searchAddForm.institutionIdToSearch?.trim()
    setPage(1)
    if (!institutionIdToSearch?.length) {
      reloadInstitutionsDomains()
      return
    }

    setInstitutions(
      institutions.filter((p) => p.toLowerCase().includes(institutionIdToSearch.toLowerCase()))
    )
  }

  const addInstitution = async () => {
    const institutionId = searchAddForm.id?.trim()?.toLowerCase()
    if (!institutionId) {
      promptError('Institution ID is required.')
      return
    }

    const institutionDomains = searchAddForm.domains
      ?.split(',')
      .flatMap((p) => (p.trim().toLowerCase()?.length ? p.trim().toLowerCase() : []))
    const webPages = searchAddForm.webPages
      ?.split(',')
      .flatMap((p) => (p.trim().toLowerCase()?.length ? p.trim().toLowerCase() : []))

    try {
      await api.post(
        '/settings/institutions',
        {
          id: institutionId,
          shortname: searchAddForm.shortname?.trim(),
          fullname: searchAddForm.fullname?.trim(),
          parent: searchAddForm.parent?.trim(),
          domains: institutionDomains,
          country: searchAddForm.country?.label,
          alphaTwoCode: searchAddForm.country?.value,
          stateProvince: searchAddForm.stateProvince?.trim(),
          webPages,
        },
        { accessToken }
      )
      promptMessage(`${searchAddForm.id} added.`)
      setSearchAddForm({ type: 'reset' })
      reloadInstitutionsDomains(true)
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <div className="well search-forms">
      <div className="institution-search-form">
        <input
          type="text"
          name="institutionId"
          className="form-control input-sm"
          placeholder="Institution ID to Search"
          value={searchAddForm.institutionIdToSearch ?? ''}
          onChange={(e) => {
            if (!e.target.value?.trim()?.length) {
              setPage(1)
              reloadInstitutionsDomains(true)
            }
            setSearchAddForm({ type: 'institutionIdToSearch', payload: e.target.value })
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              searchInstitution()
            }
          }}
        />
        {/* <div className="search-button"> */}
        <button type="submit" className="btn btn-xs search-button" onClick={searchInstitution}>
          Search
        </button>
        {/* </div> */}
      </div>
      <div className="institution-add-form">
        <input
          type="text"
          name="institutionId"
          className="form-control input-sm"
          placeholder="Institution ID (the domain)"
          value={searchAddForm.id ?? ''}
          onChange={(e) => {
            setSearchAddForm({ type: 'id', payload: e.target.value })
          }}
        />
        <input
          type="text"
          name="institutionId"
          className="form-control input-sm"
          placeholder="Short Name"
          value={searchAddForm.shortname ?? ''}
          onChange={(e) => {
            setSearchAddForm({ type: 'shortname', payload: e.target.value })
          }}
        />
        <input
          type="text"
          name="institutionId"
          className="form-control input-sm"
          placeholder="Full Name"
          value={searchAddForm.fullname ?? ''}
          onChange={(e) => {
            setSearchAddForm({ type: 'fullname', payload: e.target.value })
          }}
        />
        <input
          type="text"
          name="institutionId"
          className="form-control input-sm"
          placeholder="Parent"
          value={searchAddForm.parent ?? ''}
          onChange={(e) => {
            setSearchAddForm({ type: 'parent', payload: e.target.value })
          }}
        />
        <input
          type="text"
          name="institutionId"
          className="form-control input-sm"
          placeholder="Domains"
          value={searchAddForm.domains ?? ''}
          onChange={(e) => {
            setSearchAddForm({ type: 'domains', payload: e.target.value })
          }}
        />
        <Dropdown
          options={countryOptions}
          onChange={(e) => {
            setSearchAddForm({
              type: 'country',
              payload: e,
            })
          }}
          value={countryOptions?.find((q) => q.value === searchAddForm.country?.value) ?? null}
          placeholder="Institution Country/Region"
          className="dropdown-select dropdown-sm"
          hideArrow
          isClearable
        />
        <input
          type="text"
          name="institutionId"
          className="form-control input-sm"
          placeholder="State/Province"
          value={searchAddForm.stateProvince ?? ''}
          onChange={(e) => {
            setSearchAddForm({ type: 'stateProvince', payload: e.target.value })
          }}
        />
        <input
          type="text"
          name="institutionId"
          className="form-control input-sm"
          placeholder="Web pages e.g. https://www.umass.edu"
          value={searchAddForm.webPages ?? ''}
          onChange={(e) => {
            setSearchAddForm({ type: 'webPages', payload: e.target.value })
          }}
        />
        <button type="submit" className="btn btn-xs add-button" onClick={addInstitution}>
          Add
        </button>
      </div>
    </div>
  )
}
