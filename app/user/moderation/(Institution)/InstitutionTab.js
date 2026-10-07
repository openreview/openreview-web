'use client'

import { PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  Collapse,
  Flex,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
} from 'antd'
import { useMemo, useState } from 'react'
import Icon from '../../../../components/Icon'
import api from '../../../../lib/api-client'
import DomainListSection from './DomainListSection'

import { moderation as legacyStyles } from '../../../../lib/legacy-bootstrap-styles'

const pageSize = 25
const modalWidth = { xs: '90%', sm: '70%', md: '50%' }

const domainModerationConfig = [
  {
    key: 'moderate',
    label: 'Domains to Moderate',
    children: <DomainListSection type="moderate" />,
  },
  {
    key: 'disallowed',
    label: 'Disallowed Domains',
    children: <DomainListSection type="disallowed" />,
  },
]

export default function InstitutionTab() {
  const [institutions, setInstitutions] = useState(null)
  const [page, setPage] = useState(1)
  const [countryOptions, setCountryOptions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [modalData, setModalData] = useState({})
  const [isEditMode, setIsEditMode] = useState(null)

  const institutionsToShow = useMemo(() => {
    if (!institutions) return null
    return institutions.slice(pageSize * (page - 1), pageSize * page)
  }, [institutions, page])

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

  // An institution owns many domains, so searching by domain returns the single
  // institution that owns it, keyed by its id rather than by the domain searched for.
  const searchInstitutions = async (termOverride) => {
    const cleanTerm = (termOverride ?? searchTerm)?.trim()?.toLowerCase()
    setPage(1)
    if (!cleanTerm?.length) {
      setInstitutions(null)
      return
    }
    setIsSearching(true)
    try {
      const result = await api.get('/settings/institutions', { domain: cleanTerm })
      setInstitutions(result?.institutions ?? [])
    } catch (error) {
      promptError(error.message)
      setInstitutions([])
    } finally {
      setIsSearching(false)
    }
  }

  const openAddModal = async () => {
    if (!countryOptions.length) await loadCountryOptions()
    setModalData({})
    setIsEditMode(false)
  }

  const openEditModal = async (institution) => {
    if (!countryOptions.length) await loadCountryOptions()
    setModalData({
      ...institution,
      domains: institution.domains?.join(',') ?? '',
      webPages: institution.webPages?.join(',') ?? '',
    })
    setIsEditMode(true)
  }

  const handleModalOk = async () => {
    const institutionId = modalData.id?.trim()?.toLowerCase()
    if (!institutionId) {
      promptError('Institution ID is required.')
      return
    }
    const fullname = modalData.fullname?.trim()
    const domains = (modalData.domains ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    const webPages = (modalData.webPages ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)

    try {
      await api.post('/settings/institutions', {
        id: institutionId,
        // parent and shortname are not nullable in the API, an empty string clears them
        shortname: modalData.shortname?.trim() ?? '',
        parent: modalData.parent?.trim() ?? '',
        ...(fullname ? { fullname } : {}),
        ...(domains.length ? { domains } : {}),
        country: modalData.country || null,
        alphaTwoCode: modalData.alphaTwoCode || null,
        stateProvince: modalData.stateProvince?.trim() || null,
        webPages: webPages.length ? webPages : null,
      })
      promptMessage(`${institutionId} ${isEditMode ? 'saved' : 'added'}.`)
      setIsEditMode(null)
      setModalData({})
      await searchInstitutions()
    } catch (error) {
      promptError(error.message)
    }
  }

  const deleteInstitution = async (institution) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${institution.id} and its domains ${institution.domains?.join(', ')}?`
    )
    if (!confirmed) return
    try {
      await api.delete(`/settings/institutions/${institution.id}`)
      promptMessage(`${institution.id} is deleted.`)
      await searchInstitutions()
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <>
      <Collapse
        size="small"
        style={{ marginBottom: '1.25rem' }}
        items={domainModerationConfig}
      />

      <Row gutter={[8, 8]} style={{ marginBottom: '0.75rem' }}>
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
                searchInstitutions('')
              }
            }}
            onPressEnter={() => searchInstitutions()}
          />
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              loading={isSearching}
              styles={{ root: legacyStyles.formButton }}
              onClick={() => searchInstitutions()}
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

      {!institutions && (
        <p>Search an institution domain to edit or delete the institution that owns it.</p>
      )}

      {institutionsToShow && (
        <>
          <Flex vertical gap="middle" style={{ marginBottom: '1.5rem', minHeight: '600px' }}>
            {institutionsToShow.map((institution) => {
              const otherDomains = (institution.domains ?? []).filter(
                (p) => p !== institution.id
              )
              return (
                <Row key={institution.id} align="middle" gutter={[8, 0]}>
                  <Col flex="none">
                    <Space size={4}>
                      <Button
                        size="small"
                        type="primary"
                        styles={{ root: legacyStyles.actionButton }}
                        onClick={() => openEditModal(institution)}
                      >
                        <span style={{ top: '0px' }}>
                          <Icon name="edit" />
                        </span>
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        styles={{ root: legacyStyles.actionButton }}
                        onClick={() => deleteInstitution(institution)}
                      >
                        <span style={{ top: '0px' }}>
                          <Icon name="trash" />
                        </span>
                      </Button>
                    </Space>
                  </Col>
                  <Col flex="auto">
                    <Space size={8} wrap>
                      <strong>{institution.id}</strong>
                      {institution.fullname && <span>{institution.fullname}</span>}
                      {otherDomains.length > 0 && (
                        <span style={{ color: '#8c8c8c' }}>
                          +{otherDomains.length} domain
                          {otherDomains.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </Space>
                  </Col>
                </Row>
              )
            })}
          </Flex>

          {institutions.length === 0 ? (
            <p>No matching institutions found.</p>
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
