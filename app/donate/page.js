'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '../../lib/api-client'
import styles from '../../styles/components/Donate.module.scss'
import { prettyId } from '../../lib/utils'

const benefits = [
  'Support the long-term sustainability of open science infrastructure.',
  'Enjoy a distraction-free experience with no donation prompts while logged in.',
  'Help fund new community features and reviewer tooling.',
  'Have your name listed among our supporters (optional).',
]

export default function Page() {
  const [supporters, setSupporters] = useState([])

  const loadSupporters = async () => {
    try {
      const result = api.get('/tags', { label: 'supporter' })
      setSupporters(['~Andrew_McCallum1', '~Melisa_Bok1'])
    } catch (error) {
      /* empty */
    }
  }

  useEffect(() => {
    loadSupporters()
  }, [])
  return (
    <div className={styles.donateContainer}>
      <div className={styles.section}>
        <div className={styles.messageDonate}>
          <div className={styles.message}>
            <h2>A Message from Founder</h2>
            <hr />
            <p>
              Since we launched OpenReview, our goal has been simple: to make scientific
              knowledge accessible, transparent, and useful for everyone — researchers,
              educators, and curious minds alike. We have built a platform that centers open
              dialogue, rigorous peer review, and community-led improvements. None of this
              would have been possible without your contributions, feedback, and trust.
            </p>
            <p>
              Today, we need your help to keep this mission thriving. Running a secure, fast,
              and feature-rich platform takes ongoing investment: server costs, developer time
              to build and maintain tooling, and support for community programs that broaden
              participation. Your donation directly enables us to continue operating without
              paywalls or advertising — preserving independence and user privacy.
            </p>
            <p>
              Donations fund priorities like performance improvements, reviewer tooling,
              accessibility enhancements, and moderation resources that keep conversations
              constructive and welcoming. Even a modest monthly gift allows us to plan
              longer-term work and respond quickly to community needs.
            </p>
            <p>
              If you believe in the value of open science and want to help sustain a platform
              that serves researchers around the world, please consider donating. We’re
              committed to transparency and will share how donations are used to support the
              community. Thank you for being part of this project and for helping us keep
              knowledge open and accessible to all.
            </p>
            <p>Andrew McCallum</p>
            <p>Founder, OpenReview</p>
          </div>
          <div className={styles.donateButton}>
            <a
              href="https://donate.stripe.com/eVqdR8fP48bK1R61fi0oM00"
              className="btn btn-primary"
            >
              Make a Donation
            </a>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.statistics}>
          <h2>Some statistics</h2>
          <div className={styles.statisticsCards}>
            <div className={styles.card}>
              <h3>1.7M</h3>
              <p>Monthly Active Users</p>
            </div>
            <div className={styles.card}>
              <h3>3,000+</h3>
              <p>Active Venues</p>
            </div>
            <div className={styles.card}>
              <h3>470K</h3>
              <p>Active Profiles</p>
            </div>
            <div className={styles.card}>
              <h3>500K+</h3>
              <p>Papers Reviewed</p>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.benefits}>
          <h2>Benefits of supporting OpenReview</h2>
          <ul>
            {benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </div>
      </div>
      {supporters.length > 0 && (
        <div className={styles.section}>
          <div className={styles.supporters}>
            <h2>Supporters</h2>
            <ul>
              {supporters.map((profileId, index) => (
                <li key={index}>
                  <Link href={`/profile?id=${profileId}`}>
                    <strong>{prettyId(profileId)}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
