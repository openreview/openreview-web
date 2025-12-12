'use client'

/* globals promptError,promptMessage: false */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'

import styles from '../../styles/components/Donate.module.scss'

const benefits = [
  'Support the long-term sustainability of open science infrastructure.',
  'Enjoy a distraction-free experience with no donation prompts while logged in.',
  'Help fund new community features and reviewer tooling.',
  'Have your name listed among our supporters (optional).',
]

const Max = 10000

export default function Page() {
  const [presetAmount, setPresetAmount] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [baseAmount, setBaseAmount] = useState(null)
  const [coverFees, setCoverFees] = useState(false)
  const [mode, setMode] = useState('subscription')
  const { accessToken, user } = useUser()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')

  const finalAmount = baseAmount && coverFees ? baseAmount * 1.03 : baseAmount

  const disableDonateButton =
    !finalAmount || Number.isNaN(finalAmount) || Number(finalAmount) <= 0
  const donateButtonText = disableDonateButton
    ? 'Make a Donation'
    : `Make a Donation ${finalAmount && !Number.isNaN(finalAmount) ? `of $${finalAmount.toFixed(2)}` : ''}
              ${mode === 'subscription' ? ' /month' : ''}`

  const email = user?.profile?.preferredEmail

  const handleCustomAmountChange = (value) => {
    let cleanValue = Number(value.replace(/^\$ /, '').replace(/[^0-9]/g, ''))
    if (cleanValue > Max) {
      cleanValue = Max
      promptMessage(
        `To make a donation over $${Max}, please contact us at [donate@openreview.net](mailto:donate@openreview.net)`,
        8
      )
    }
    setCustomAmount(cleanValue)
    setBaseAmount(cleanValue)
    setPresetAmount(null)
  }

  const handlePresetAmountClick = (amount) => {
    setPresetAmount(amount)
    setBaseAmount(amount)
    setCustomAmount('')
  }

  const handleDonate = async () => {
    try {
      if (!finalAmount || Number.isNaN(finalAmount) || Number(finalAmount) <= 0) {
        throw new Error('Please enter a valid donation amount')
      }
      const result = await api.post(
        '/user/donate-session',
        { amount: finalAmount, mode, email },
        { accessToken }
      )
      if (!result.url) {
        throw new Error('Failed to create donation session')
      }
      window.location.href = result.url
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (success === 'true') {
      promptMessage('Thank you for your generous donation to support OpenReview!')
    }
  }, [success])

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
          <div className={styles.donateContainer}>
            <div className={styles.frequencyButtons}>
              <button
                className={mode === 'subscription' ? styles.active : ''}
                onClick={() => setMode('subscription')}
              >
                Monthly
              </button>
              <button
                className={mode === 'payment' ? styles.active : ''}
                onClick={() => setMode('payment')}
              >
                One-Time
              </button>
            </div>
            <div className={styles.amountButtons}>
              <div
                className={`${styles.amountButton} ${presetAmount === 10 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(10)}
              >
                $10
              </div>
              <div
                className={`${styles.amountButton} ${presetAmount === 50 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(50)}
              >
                $50
              </div>
              <div
                className={`${styles.amountButton} ${presetAmount === 100 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(100)}
              >
                $100
              </div>
            </div>
            <div className={styles.amountButtons}>
              <div
                className={`${styles.amountButton} ${presetAmount === 500 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(500)}
              >
                $500
              </div>
              <div
                className={`${styles.amountButton} ${presetAmount === 1000 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(1000)}
              >
                $1k
              </div>
              <div
                className={`${styles.amountButton} ${presetAmount === 5000 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(5000)}
              >
                $5k
              </div>
              <div
                className={`${styles.amountButton} ${presetAmount === 10000 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(10000)}
              >
                $10k
              </div>
            </div>
            <div className={styles.amountButtons}>
              <div
                className={`${styles.amountButton} ${customAmount !== '' ? styles.activeAmountInput : ''}`}
              >
                <input
                  type="text"
                  placeholder="$ Other Amount"
                  value={customAmount ? `$ ${customAmount}` : ''}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                />
              </div>
            </div>
            <div>
              <input
                type="checkbox"
                name="coverFees"
                checked={coverFees}
                disabled={!baseAmount || Number.isNaN(baseAmount)}
                onChange={(e) => setCoverFees(e.target.checked)}
              />
              <label htmlFor="coverFees" className={styles.coverFeesLabel}>
                I would like to cover the transaction fees
              </label>
            </div>
            <button className="btn" onClick={handleDonate} disabled={disableDonateButton}>
              {donateButtonText}
            </button>
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
    </div>
  )
}
