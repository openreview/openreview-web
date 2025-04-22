'use client'

/* globals promptMessage,promptError: false */
import { useEffect, useState } from 'react'
import Table from '../../../../components/Table'
import PaginationLinks from '../../../../components/PaginationLinks'
import Icon from '../../../../components/Icon'
import Dropdown from '../../../../components/Dropdown'
import InstituitonSearchForm from './InstitutionSearchForm'
import api from '../../../../lib/api-client'
import LoadingSpinner from '../../../../components/LoadingSpinner'

const pageSize = 25

export default function InstitutionTab({ accessToken }) {
  const [institutions, setInstitutions] = useState(null)
  const [institutionsToShow, setInstitutionsToShow] = useState(null)
  const [page, setPage] = useState(1)
  const [institutionToEdit, setInstitutionToEdit] = useState(null)
  const [countryOptions, setCountryOptions] = useState([])

  const loadInstitutionsDomains = async (noCache) => {
    try {
      const result = await api.get(
        `/settings/institutiondomains${noCache ? '?cache=false' : ''}`
      )
      setInstitutions(result)
    } catch (error) {
      promptError(error.message)
    }
  }

  const loadCountryOptions = async () => {
    try {
      const result = await api.get('/settings/countries')
      setCountryOptions(
        Object.entries(result ?? {})?.map(([name, details]) => ({
          value: details.alphaTwoCode,
          label: name,
        }))
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  const saveInstitution = async () => {
    try {
      await api.post(
        '/settings/institutions',
        {
          id: institutionToEdit.id,
          shortname: institutionToEdit.shortname ? institutionToEdit.shortname.trim() : null,
          fullname: institutionToEdit.fullname ? institutionToEdit.fullname.trim() : null,
          parent: institutionToEdit.parent ? institutionToEdit.parent.trim() : null,
          domains: institutionToEdit.domains
            ? institutionToEdit.domains.split(',').map((p) => p.trim())
            : [],
          country: institutionToEdit.country,
          alphaTwoCode: institutionToEdit.alphaTwoCode,
          stateProvince: institutionToEdit.stateProvince
            ? institutionToEdit.stateProvince.trim()
            : null,
          webPages: institutionToEdit.webPages
            ? institutionToEdit.webPages.split(',').map((p) => p.trim())
            : null,
        },
        { accessToken }
      )
      promptMessage(`${institutionToEdit.id} saved.`)
      setInstitutionToEdit(null)
      loadInstitutionsDomains()
    } catch (error) {
      promptError(error.message)
    }
  }

  const getInstitutionDetails = async (institutionDomain) => {
    try {
      const result = await api.get('/settings/institutions', { domain: institutionDomain })
      const institution = result.institutions[0]
      if (!institution) {
        promptError(`Institution ${institutionDomain} not found.`)
        return
      }
      if (institution.id !== institutionDomain) {
        promptError(`Id of ${institutionDomain} is ${institution.id}`)
        return
      }
      setInstitutionToEdit({
        ...institution,
        domains: institution.domains.join(','),
        webPages: institution.webPages?.join(',') ?? '',
      })
    } catch (error) {
      promptError(error.message)
    }
  }

  const deleteInstitution = async (institutionId) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(`Are you sure you want to delete ${institutionId}?`)
    if (!confirmed) return
    try {
      await api.delete(`/settings/institutions/${institutionId}`, undefined, { accessToken })
      promptMessage(`${institutionId} is deleted.`)
      loadInstitutionsDomains(true)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!institutions) return
    setInstitutionsToShow(
      institutions.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize)
    )
  }, [page, institutions])

  useEffect(() => {
    loadInstitutionsDomains(true)
    loadCountryOptions()
  }, [])

  if (!institutionsToShow) return <LoadingSpinner />

  return (
    <div className="institution-container">
      <InstituitonSearchForm
        accessToken={accessToken}
        countryOptions={countryOptions}
        setInstitutions={setInstitutions}
        setPage={setPage}
        reloadInstitutionsDomains={loadInstitutionsDomains}
        institutions={institutions}
      />
      <>
        <Table
          headings={[
            { content: '', width: '8%' },
            { content: 'Id', width: '15%' },
            { content: 'Short Name', width: '25%' },
            { content: 'Full Name', width: '25%' },
            { content: 'Parent', width: '25%' },
            { content: 'Domains', width: '15%' },
          ]}
        />
        {institutionsToShow.map((institutionDomain) => (
          <div className="institution-row" key={institutionDomain}>
            <span className="col-actions">
              {institutionDomain === institutionToEdit?.id ? (
                <button type="button" className="btn btn-xs " onClick={saveInstitution}>
                  <Icon name="floppy-disk" />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-xs "
                  onClick={() => {
                    getInstitutionDetails(institutionDomain)
                  }}
                >
                  <Icon name="edit" />
                </button>
              )}
              <button
                type="button"
                className="btn btn-xs btn-delete-institution"
                onClick={() => {
                  deleteInstitution(institutionDomain)
                }}
              >
                <Icon name="trash" />
              </button>
            </span>

            {institutionDomain === institutionToEdit?.id ? (
              <>
                <span className="col-id">
                  <input
                    className="form-control input-sm"
                    value={institutionToEdit.id ?? ''}
                    onChange={() => {}}
                  />
                </span>
                <span className="col-short-name">
                  <input
                    className="form-control input-sm"
                    value={institutionToEdit.shortname ?? ''}
                    onChange={(e) => {
                      setInstitutionToEdit((p) => ({
                        ...p,
                        shortname: e.target.value,
                      }))
                    }}
                  />
                </span>
                <span className="col-full-name">
                  <input
                    className="form-control input-sm"
                    value={institutionToEdit.fullname ?? ''}
                    onChange={(e) => {
                      setInstitutionToEdit((p) => ({
                        ...p,
                        fullname: e.target.value,
                      }))
                    }}
                  />
                </span>
                <span className="col-parent">
                  <input
                    className="form-control input-sm"
                    value={institutionToEdit.parent ?? ''}
                    onChange={(e) => {
                      setInstitutionToEdit((p) => ({
                        ...p,
                        parent: e.target.value,
                      }))
                    }}
                  />
                </span>
                <span className="col-domains">
                  <input
                    className="form-control input-sm"
                    value={institutionToEdit.domains ?? ''}
                    onChange={(e) => {
                      setInstitutionToEdit((p) => ({
                        ...p,
                        domains: e.target.value,
                      }))
                    }}
                  />
                </span>
                <th key="empty" scope="col" style={{ width: '8%' }}></th>
                <th key="country" scope="col" style={{ width: '20%' }}>
                  Country/Region
                </th>
                <th key="state" scope="col" style={{ width: '20%' }}>
                  State/Province
                </th>
                <th key="webpages" scope="col" style={{ width: '50%' }}>
                  Webpages
                </th>
                <span className="col-actions"></span>
                <span className="col-country">
                  <Dropdown
                    options={countryOptions}
                    onChange={(e) => {
                      setInstitutionToEdit((p) => ({
                        ...p,
                        country: e?.label ?? null,
                        alphaTwoCode: e?.value ?? null,
                      }))
                    }}
                    value={
                      countryOptions?.find(
                        (q) => q.value === institutionToEdit.alphaTwoCode
                      ) ?? null
                    }
                    placeholder="Institution Country/Region"
                    className="dropdown-select dropdown-sm"
                    hideArrow
                    isClearable
                  />
                </span>
                <span className="col-state">
                  <input
                    className="form-control input-sm"
                    value={institutionToEdit.stateProvince ?? ''}
                    onChange={(e) => {
                      setInstitutionToEdit((p) => ({
                        ...p,
                        stateProvince: e.target.value,
                      }))
                    }}
                  />
                </span>
                <span className="col-webpages">
                  <input
                    className="form-control input-sm"
                    value={institutionToEdit.webPages ?? ''}
                    onChange={(e) => {
                      setInstitutionToEdit((p) => ({
                        ...p,
                        webPages: e.target.value,
                      }))
                    }}
                  />
                </span>
              </>
            ) : (
              <span className="col-id">{institutionDomain}</span>
            )}
          </div>
        ))}
        {institutions.length === 0 ? (
          <p className="empty-message">No matching domains found.</p>
        ) : (
          <PaginationLinks
            currentPage={page}
            itemsPerPage={pageSize}
            totalCount={institutions.length}
            options={{ useShallowRouting: true }}
            setCurrentPage={setPage}
          />
        )}
      </>
    </div>
  )
}
