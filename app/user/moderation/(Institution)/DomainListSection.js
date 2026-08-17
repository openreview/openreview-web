import { Flex, Input, Tag } from 'antd'
import { useEffect, useState } from 'react'
import Icon from '../../../../components/Icon'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import api from '../../../../lib/api-client'

import styles from './domainList.module.scss'
import { getBootstrap337LabelColor } from '../../../../lib/legacy-bootstrap-styles'

const TYPE_CONFIG = {
  moderate: {
    endpoint: '/settings/domainsToModerate',
    addLabel: 'Add moderate domain',
    color: getBootstrap337LabelColor('warning'),
  },
  disallowed: {
    endpoint: '/settings/disallowedDomains',
    addLabel: 'Add disallowed domain',
    color: getBootstrap337LabelColor('error'),
  },
}

export default function DomainListSection({ type }) {
  const { endpoint, addLabel, color } = TYPE_CONFIG[type]
  const [domains, setDomains] = useState(null)
  const [domainToAdd, setDomainToAdd] = useState('')

  const loadDomains = async () => {
    try {
      const result = await api.get(endpoint)
      setDomains(result ?? [])
    } catch (error) {
      promptError(error.message)
    }
  }

  const deleteDomain = async (domain) => {
    if (!window.confirm(`Are you sure you want to remove ${domain}?`)) return
    try {
      await api.patch(endpoint, { remove: [domain] })
      loadDomains()
      promptMessage(`${domain} removed.`)
    } catch (error) {
      promptError(error.message)
    }
  }

  const addDomain = async () => {
    const cleanDomainToAdd = domainToAdd.trim().toLowerCase()
    if (!cleanDomainToAdd) return
    try {
      await api.patch(endpoint, { add: [cleanDomainToAdd] })
      setDomainToAdd('')
      loadDomains()
      promptMessage(`${cleanDomainToAdd} added.`)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadDomains()
  }, [type])

  if (!domains) return <LoadingSpinner inline />

  return (
    <Flex vertical gap="small">
      <Flex gap={6} align="center" wrap>
        {domains.length > 0 &&
          domains.map((domain) => (
            <Tag
              key={domain}
              variant="solid"
              color={color}
              closable
              closeIcon={
                <span
                  aria-label={`Remove ${domain}`}
                  style={{ marginLeft: 4, color: 'white' }}
                >
                  <Icon name="trash" />
                </span>
              }
              onClose={(e) => {
                e.preventDefault()
                deleteDomain(domain)
              }}
              className={styles.domainTag}
            >
              {domain}
            </Tag>
          ))}
      </Flex>

      <div className={styles.addInputWrapper}>
        <Input
          placeholder={addLabel}
          value={domainToAdd}
          onChange={(e) => setDomainToAdd(e.target.value)}
          onPressEnter={addDomain}
        />
      </div>
    </Flex>
  )
}
