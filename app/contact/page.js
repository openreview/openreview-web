'use client'

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
  const [hasSearched, setHasSearched] = useState(false)
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
      <h1>Help &amp; Support</h1>
      <p className={styles.scopeNote}>
        The documentation covers the OpenReview platform: running a venue as a program chair,
        and submitting, reviewing, and managing your profile as a user. Each venue sets its own
        deadlines, policies, review process, and decisions. For those, ask the organizers at
        the contact address on your invitation.
      </p>

      <DocsSearch onNeedSupport={openForm} onSearched={() => setHasSearched(true)} />

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

      <div className={styles.supportRequest} ref={formRef}>
        {showForm && (
          <>
            <h2>Send a request to support</h2>
            <p>
              Tell us which part of OpenReview your question is about. Including a profile ID,
              venue ID or submission ID lets support resolve the request much faster. Support
              can only help with the platform itself; for anything decided by a venue, contact
              its organizers instead.
            </p>
            <SupportRequestForm prefill={prefill} />
          </>
        )}
        {!showForm && hasSearched && (
          <p className={styles.supportHint}>
            Still stuck after checking the documentation? You can{' '}
            <button type="button" className={styles.quietAction} onClick={() => openForm()}>
              send a request to the support team
            </button>
            .
          </p>
        )}
      </div>
    </div>
  )
}
