'use client'

import { Card, Col, Flex, Row, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import DocsSearch from './DocsSearch'
import SupportRequestForm from './SupportRequestForm'

const { Text, Title } = Typography

const docsBaseUrl = 'https://docs.openreview.net'

const docsSections = [
  {
    title: 'Frequently Asked Questions',
    description: 'The answers to the questions support receives most often.',
    path: '/getting-started/frequently-asked-questions',
  },
  {
    title: 'Creating and activating a profile',
    description:
      'Signing up, activating a limited profile, institutional emails, DBLP and Semantic Scholar imports.',
    path: '/getting-started/creating-an-openreview-profile',
  },
  {
    title: 'Hosting a venue',
    description:
      'What OpenReview provides to conferences, workshops and journals, and how to set a venue up.',
    path: '/getting-started/hosting-a-venue-on-openreview',
  },
  {
    title: 'Running your review workflow',
    description:
      'Deadlines, stages, recruitment, bidding, and the settings program chairs need during review.',
    path: '/how-to-guides/workflow',
  },
  {
    title: 'Paper matching and assignment',
    description: 'Affinity scores, conflicts, quotas, and deploying reviewer assignments.',
    path: '/how-to-guides/paper-matching-and-assignment',
  },
  {
    title: 'API and developer reference',
    description: 'Querying notes, groups and edits with the OpenReview API and Python client.',
    path: '/getting-started/using-the-api',
  },
]

export default function Page() {
  const [showForm, setShowForm] = useState(false)
  const [prefill, setPrefill] = useState(null)
  const formRef = useRef(null)
  const shouldRevealForm = useRef(false)

  const revealForm = () => {
    formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    formRef.current?.querySelector('input, textarea')?.focus({ preventScroll: true })
  }

  const openForm = (message) => {
    if (message) setPrefill({ message })
    if (showForm) {
      revealForm()
      return
    }
    shouldRevealForm.current = true
    setShowForm(true)
  }

  useEffect(() => {
    try {
      const userEmail = sessionStorage.getItem('feedbackInstitution')
      if (userEmail) {
        setPrefill({
          from: userEmail,
          subject: 'Please add my domain to your list of publishing institutions',
        })
        setShowForm(true)
        sessionStorage.removeItem('feedbackInstitution')
      }
    } catch {
      /* empty */
    }
  }, [])

  useEffect(() => {
    if (!showForm || !shouldRevealForm.current) return
    shouldRevealForm.current = false
    revealForm()
  }, [showForm])

  return (
    <Flex vertical gap={24} style={{ maxWidth: '54rem' }}>
      <Title level={1}>Help</Title>

      <Row gutter={[12, 12]}>
        {docsSections.map((section) => (
          <Col xs={24} md={12} key={section.path}>
            <a
              href={`${docsBaseUrl}${section.path}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', height: '100%' }}
            >
              <Card size="small" hoverable style={{ height: '100%' }}>
                <Text strong style={{ display: 'block' }}>
                  {section.title}
                </Text>
                <Text type="secondary">{section.description}</Text>
              </Card>
            </a>
          </Col>
        ))}
      </Row>

      <DocsSearch onNeedSupport={openForm} />

      {showForm && (
        <div ref={formRef} style={{ scrollMarginTop: '1rem' }}>
          <Title level={2} style={{ marginTop: 0 }}>
            Send a request to support
          </Title>
          <SupportRequestForm prefill={prefill} />
        </div>
      )}
    </Flex>
  )
}
