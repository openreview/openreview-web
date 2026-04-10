'use client'

import { PlusOutlined } from '@ant-design/icons'
import { Button, Col, Flex, Input, Modal, Pagination, Row, Select, Space } from 'antd'
import { useMemo, useState } from 'react'
import Icon from '../../../../components/Icon'
import api from '../../../../lib/api-client'

import { moderation as legacyStyles } from '../../../../lib/legacy-bootstrap-styles'

const pageSize = 25
const modalWidth = { xs: '90%', sm: '70%', md: '50%' }

export default function InstitutionTab() {
  const [institutions, setInstitutions] = useState(null)
  const [page, setPage] = useState(1)
  const [countryOptions, setCountryOptions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [modalData, setModalData] = useState({})
  const [isEditMode, setIsEditMode] = useState(null)

  const institutionsToShow = useMemo(() => {
    if (!institutions) return null
    return institutions.slice(pageSize * (page - 1), pageSize * page)
  }, [institutions, page])

  const loadInstitutionsDomains = async () => {
    try {
      const result = await api.get(`/settings/institutionDomains?cache=false`)

      return result
    } catch (error) {
      promptError(error.message)
      return null
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

  const loadAndFilterInstitutions = async (termOverride) => {
    const cleanTerm = (termOverride ?? searchTerm)?.trim()?.toLowerCase()
    setPage(1)
    const domains = await loadInstitutionsDomains()
    if (!cleanTerm.length) {
      setInstitutions(domains)
    } else {
      setInstitutions(domains.filter((p) => p.toLowerCase().includes(cleanTerm)))
    }
  }

  const openAddModal = async () => {
    if (!countryOptions.length) await loadCountryOptions()
    setModalData({})
    setIsEditMode(false)
  }

  const openEditModal = async (institutionDomain) => {
    if (!countryOptions.length) await loadCountryOptions()
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
      setModalData({
        ...institution,
        domains: institution.domains.join(','),
        webPages: institution.webPages?.join(',') ?? '',
      })
      setIsEditMode(true)
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleModalOk = async () => {
    const institutionId = modalData.id?.trim()?.toLowerCase()
    if (!institutionId) {
      promptError('Institution ID is required.')
      return
    }

    try {
      await api.post('/settings/institutions', {
        id: institutionId,
        shortname: modalData.shortname?.trim() || null,
        fullname: modalData.fullname?.trim() || null,
        parent: modalData.parent?.trim() || null,
        domains: modalData.domains
          ? modalData.domains
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : [],
        country: modalData.country || null,
        alphaTwoCode: modalData.alphaTwoCode || null,
        stateProvince: modalData.stateProvince?.trim() || null,
        webPages: modalData.webPages
          ? modalData.webPages
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
          : null,
      })
      promptMessage(`${institutionId} ${isEditMode ? 'saved' : 'added'}.`)
      setIsEditMode(null)
      setModalData({})
      await loadInstitutionsDomains()
      if (institutions) loadAndFilterInstitutions()
    } catch (error) {
      promptError(error.message)
    }
  }

  const deleteInstitution = async (institutionId) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${institutionId}?`)
    if (!confirmed) return
    try {
      await api.delete(`/settings/institutions/${institutionId}`)
      promptMessage(`${institutionId} is deleted.`)
      await loadInstitutionsDomains()
      if (institutions) loadAndFilterInstitutions()
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <>
      <Row gutter={[8, 8]} align="middle" style={{ marginBottom: '0.75rem' }}>
        <Col xs={24} sm={12} md={10}>
          <Input
            allowClear
            placeholder="Search institution domain"
            style={legacyStyles.formInput}
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value ?? ''
              setSearchTerm(value)
              if (!value) {
                loadAndFilterInstitutions('')
              }
            }}
            onPressEnter={() => loadAndFilterInstitutions()}
          />
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              styles={{ root: legacyStyles.formButton }}
              onClick={() => loadAndFilterInstitutions()}
            >
              Search
            </Button>
            <Button
              type="primary"
              styles={{ root: legacyStyles.formButton }}
              icon={<PlusOutlined />}
              onClick={openAddModal}
            >
              Add Institution
            </Button>
          </Space>
        </Col>
      </Row>

      {institutionsToShow && (
        <>
          <Flex vertical gap="middle" style={{ marginBottom: '1.5rem', minHeight: '600px' }}>
            {institutionsToShow.map((institutionDomain) => (
              <Row key={institutionDomain} align="middle" gutter={[8, 0]}>
                <Col flex="none">
                  <Space size={4}>
                    <Button
                      size="small"
                      type="primary"
                      styles={{ root: legacyStyles.actionButton }}
                      onClick={() => openEditModal(institutionDomain)}
                    >
                      <span style={{ top: '0px' }}>
                        <Icon name="edit" />
                      </span>
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      styles={{ root: legacyStyles.actionButton }}
                      onClick={() => deleteInstitution(institutionDomain)}
                    >
                      <span style={{ top: '0px' }}>
                        <Icon name="trash" />
                      </span>
                    </Button>
                  </Space>
                </Col>
                <Col flex="auto">{institutionDomain}</Col>
              </Row>
            ))}
          </Flex>

          {institutions.length === 0 ? (
            <p>No matching domains found.</p>
          ) : (
            <Pagination
              align="center"
              current={page}
              pageSize={pageSize}
              total={institutions.length}
              onChange={(newPage) => setPage(newPage)}
              showSizeChanger={false}
              hideOnSinglePage
            />
          )}
        </>
      )}

      <Modal
        title={isEditMode ? 'Edit Institution' : 'Add Institution'}
        open={isEditMode !== null}
        okText={isEditMode ? 'Save' : 'Add'}
        onCancel={() => {
          setIsEditMode(null)
          setModalData({})
        }}
        onOk={handleModalOk}
        destroyOnHidden
        width={modalWidth}
      >
        <Flex vertical gap="small" style={{ marginTop: 12 }}>
          <div>
            <label>Institution ID (domain)</label>
            <Input
              style={legacyStyles.formInput}
              value={modalData.id ?? ''}
              disabled={isEditMode}
              onChange={(e) => setModalData((p) => ({ ...p, id: e.target.value }))}
            />
          </div>
          <div>
            <label>Short Name</label>
            <Input
              style={legacyStyles.formInput}
              value={modalData.shortname ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, shortname: e.target.value }))}
            />
          </div>
          <div>
            <label>Full Name</label>
            <Input
              style={legacyStyles.formInput}
              value={modalData.fullname ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, fullname: e.target.value }))}
            />
          </div>
          <div>
            <label>Parent</label>
            <Input
              style={legacyStyles.formInput}
              value={modalData.parent ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, parent: e.target.value }))}
            />
          </div>
          <div>
            <label>Domains (comma-separated)</label>
            <Input
              style={legacyStyles.formInput}
              value={modalData.domains ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, domains: e.target.value }))}
            />
          </div>
          <div>
            <label>Country/Region</label>
            <Select
              showSearch
              allowClear
              variant="outlined"
              style={{ width: '100%' }}
              options={countryOptions}
              getPopupContainer={(triggerNode) => triggerNode.parentElement}
              onChange={(_value, option) =>
                setModalData((p) => ({
                  ...p,
                  country: option?.label ?? null,
                  alphaTwoCode: option?.value ?? null,
                }))
              }
              value={modalData.alphaTwoCode ?? null}
              placeholder="Select country/region"
            />
          </div>
          <div>
            <label>State/Province</label>
            <Input
              style={legacyStyles.formInput}
              value={modalData.stateProvince ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, stateProvince: e.target.value }))}
            />
          </div>
          <div>
            <label>Web Pages (comma-separated)</label>
            <Input
              style={legacyStyles.formInput}
              value={modalData.webPages ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, webPages: e.target.value }))}
            />
          </div>
        </Flex>
      </Modal>
    </>
  )
}
