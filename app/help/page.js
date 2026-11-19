'use client'

import { Button, Card, Col, Flex, Row, Typography } from 'antd'
import { useEffect, useState } from 'react'
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
    title: 'Find a venue and contact organizers',
    description: 'How to locate a venue and reach the organizers with questions.',
    path: '/getting-started/frequently-asked-questions/how-do-i-find-a-venue-and-contact-the-venue-organizers',
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

const contactPromptKey = 'helpContactPromptShown'
const showContactFormKey = 'helpShowContactForm'

const storeFlag = () => {
  try {
    localStorage.setItem(contactPromptKey, 'true')
  } catch {
    /* empty */
  }
}

export default function Page() {
  const [showForm, setShowForm] = useState(false)
  const [showContactPrompt, setShowContactPrompt] = useState(false)

  const handleDocsClick = () => {
    storeFlag()
    setShowContactPrompt(true)
  }

  useEffect(() => {
    try {
      if (localStorage.getItem(contactPromptKey) === 'true') setShowContactPrompt(true)
      if (sessionStorage.getItem(showContactFormKey) === '1') {
        sessionStorage.removeItem(showContactFormKey)
        setShowForm(true)
      }
    } catch {
      /* empty */
    }
  }, [])

  return (
    <Flex vertical gap={16} style={{ maxWidth: '54rem' }}>
      <div>
        <h1>Help</h1>
        <p className="mt-3">
          <Text>
            Our documentation site has answers to many common questions. You can{' '}
            <a
              href="https://docs.openreview.net/?ask="
              target="_blank"
              rel="noreferrer"
              onClick={handleDocsClick}
              onAuxClick={(event) => {
                if (event.button === 1) handleDocsClick()
              }}
            >
              ask a question
            </a>{' '}
            or browse the topics below to find what you need.
          </Text>
        </p>
      </div>

      <div className="help-docs">
        <Row gutter={[12, 12]}>
          {docsSections.map((section) => (
            <Col xs={24} md={12} key={section.path}>
              <a
                href={`${docsBaseUrl}${section.path}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', height: '100%' }}
                onClick={handleDocsClick}
                onAuxClick={(event) => {
                  if (event.button === 1) handleDocsClick()
                }}
              >
                <Card
                  size="small"
                  styles={{
                    body: { padding: '12px 16px' },
                  }}
                  style={{ height: '100%', borderColor: '#d9d9d9' }}
                >
                  <Text strong style={{ display: 'block', color: '#3e6775' }}>
                    {section.title}
                  </Text>
                  <Text type="secondary">{section.description}</Text>
                </Card>
              </a>
            </Col>
          ))}
        </Row>
      </div>

      {showContactPrompt && (
        <Text>
          If you need more help, please{' '}
          <Button
            type="link"
            style={{ padding: 0, height: 'auto', lineHeight: 'inherit' }}
            onClick={() => setShowForm(true)}
          >
            contact us
          </Button>
          .
        </Text>
      )}

      {showForm && (
        <div>
          <Title level={2} style={{ marginTop: 0 }}>
            Send a request to support
          </Title>
          <SupportRequestForm />
        </div>
      )}
    </Flex>
  )
}
