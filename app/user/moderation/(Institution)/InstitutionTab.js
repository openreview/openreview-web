'use client'

import { PlusOutlined } from '@ant-design/icons'
import { Button, Col, Flex, Input, Modal, Pagination, Row, Select, Space } from 'antd'
import { useMemo, useState } from 'react'
import api from '../../../../lib/api-client'

import styles from './institution.module.scss'

const pageSize = 25
const modalWidth = { xs: '90%', sm: '70%', md: '50%' }

export default function InstitutionTab() {
  const [allInstitutions, setAllInstitutions] = useState(null)
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

  const loadInstitutionsDomains = async (noCache) => {
    try {
      const result = await api.get(
        `/settings/institutiondomains${noCache ? '?cache=false' : ''}`
      )
      setAllInstitutions(result)
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

  const searchInstitution = async () => {
    let domains = allInstitutions
    if (!domains) {
      domains = await loadInstitutionsDomains(true)
    }
    if (!domains) return

    const term = searchTerm.trim()
    setPage(1)
    if (!term.length) {
      setInstitutions(domains)
      return
    }
    setInstitutions(domains.filter((p) => p.toLowerCase().includes(term.toLowerCase())))
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
      await loadInstitutionsDomains(true)
      if (institutions) searchInstitution()
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
      await loadInstitutionsDomains(true)
      if (institutions) searchInstitution()
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
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value ?? ''
              setSearchTerm(value)
              if (!value && allInstitutions) {
                setPage(1)
                setInstitutions(allInstitutions)
              }
            }}
            onPressEnter={searchInstitution}
          />
        </Col>
        <Col>
          <Space>
            <Button type="primary" onClick={searchInstitution}>
              Search
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
              Add Institution
            </Button>
          </Space>
        </Col>
      </Row>

      {institutionsToShow && (
        <>
          <Flex vertical style={{ marginBottom: '1.5rem', minHeight: '600px' }}>
            {institutionsToShow.map((institutionDomain) => (
              <Row
                key={institutionDomain}
                align="middle"
                gutter={[8, 0]}
                style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}
              >
                <Col flex="auto" className={styles.truncatedtext}>
                  {institutionDomain}
                </Col>
                <Col flex="none">
                  <Space size={4}>
                    <Button
                      size="small"
                      type="primary"
                      classNames={{ content: styles.actionbuttoncontent }}
                      onClick={() => openEditModal(institutionDomain)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      classNames={{ content: styles.actionbuttoncontent }}
                      onClick={() => deleteInstitution(institutionDomain)}
                    >
                      Delete
                    </Button>
                  </Space>
                </Col>
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
              value={modalData.id ?? ''}
              disabled={isEditMode}
              onChange={(e) => setModalData((p) => ({ ...p, id: e.target.value }))}
            />
          </div>
          <div>
            <label>Short Name</label>
            <Input
              value={modalData.shortname ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, shortname: e.target.value }))}
            />
          </div>
          <div>
            <label>Full Name</label>
            <Input
              value={modalData.fullname ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, fullname: e.target.value }))}
            />
          </div>
          <div>
            <label>Parent</label>
            <Input
              value={modalData.parent ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, parent: e.target.value }))}
            />
          </div>
          <div>
            <label>Domains (comma-separated)</label>
            <Input
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
              value={modalData.stateProvince ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, stateProvince: e.target.value }))}
            />
          </div>
          <div>
            <label>Web Pages (comma-separated)</label>
            <Input
              value={modalData.webPages ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, webPages: e.target.value }))}
            />
          </div>
        </Flex>
      </Modal>
    </>
  )
}
