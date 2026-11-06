'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import DocsSearch from './DocsSearch'
import SupportRequestForm from './SupportRequestForm'

import styles from './Contact.module.scss'

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
  const shouldScrollToForm = useRef(false)

  const openForm = (message) => {
    if (message) setPrefill({ message })
    shouldScrollToForm.current = true
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
    } catch (e) {
      /* empty */
    }
  }, [])

  useEffect(() => {
    if (!showForm || !shouldScrollToForm.current) return
    shouldScrollToForm.current = false
    formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [showForm])

  return (
    <div className={styles.contactContainer}>
      <h1>Help</h1>
      <p className="mt-3">
        OpenReview currently supports numerous computer science conferences and workshops, and
        we are open to hosting journals and conferences in any field; please fill out the{' '}
        <Link href="/group?id=OpenReview.net/Support">venue request form</Link> to get started.
      </p>
      <p>
        To report a bug or suggest a feature to the developers,{' '}
        <a
          href="https://github.com/openreview/openreview/issues/new/choose"
          target="_blank"
          rel="noreferrer"
        >
          open an issue
        </a>{' '}
        in the OpenReview repository on GitHub.
      </p>
      <p className={styles.scopeNote}>
        For questions about a specific venue, use the contact address on the venue invitation.
      </p>

      <DocsSearch onNeedSupport={openForm} />

      <h2>Browse the documentation</h2>
      <div className={styles.docsSections}>
        {docsSections.map((section) => (
          <a
            key={section.path}
            className={styles.docsSection}
            href={`${docsBaseUrl}${section.path}`}
            target="_blank"
            rel="noreferrer"
          >
            <strong>{section.title}</strong>
            <span>{section.description}</span>
          </a>
        ))}
      </div>

      {showForm && (
        <div className={styles.supportRequest} ref={formRef}>
          <h2>Send a request to support</h2>
          <SupportRequestForm prefill={prefill} />
        </div>
      )}
    </div>
  )
}
