'use client'

/* globals promptError,promptMessage: false */

import { useEffect, useReducer } from 'react'
import { useSearchParams } from 'next/navigation'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'

import styles from '../../styles/components/Donate.module.scss'

const Max = 10000
const feeRate = 1.03

const defaultDonateForum = {
  mode: 'subscription',
  presetAmount: null,
  customAmount: '',
  showCoverFeesCheckbox: false,
  coverFees: false,
  finalAmount: null,
  disableDonateButton: true,
  donateButtonText: 'Make a Donation',
  maxAmountError: null,
}

const donationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        showCoverFeesCheckbox: true,
        mode: action.payload.mode,
        donateButtonText: state.finalAmount
          ? `Make a Donation of $${state.finalAmount.toFixed(2)}${action.payload.mode === 'subscription' ? ' /month' : ''}`
          : 'Make a Donation',
      }
    case 'SET_PRESET_AMOUNT':
      return {
        ...state,
        showCoverFeesCheckbox: true,
        presetAmount: action.payload.amount,
        customAmount: '',
        finalAmount: state.coverFees ? action.payload.amount * feeRate : action.payload.amount,
        disableDonateButton: false,
        donateButtonText: `Make a Donation of $${state.coverFees ? (action.payload.amount * feeRate).toFixed(2) : action.payload.amount.toFixed(2)}${state.mode === 'subscription' ? ' /month' : ''}`,
        coverFeesCheckboxText: `I would like to add $${(action.payload.amount * (feeRate - 1)).toFixed(2)} to cover the transaction fees`,
      }
    case 'SET_CUSTOM_AMOUNT': {
      const rawAmount = action.payload.amount
      const cleanValue = Number(rawAmount.replace(/^\$ /, '').replace(/[^0-9]/g, ''))
      if (Number.isNaN(cleanValue) || cleanValue <= 0) return defaultDonateForum
      const updatedFinalAmount = state.coverFees ? cleanValue * feeRate : cleanValue
      if (updatedFinalAmount > Max) {
        return {
          ...defaultDonateForum,
          maxAmountError: true,
        }
      }
      return {
        ...state,
        showCoverFeesCheckbox: true,
        customAmount: cleanValue,
        presetAmount: null,
        finalAmount: updatedFinalAmount,
        disableDonateButton: false,
        donateButtonText: `Make a Donation of $${updatedFinalAmount.toFixed(2)}${state.mode === 'subscription' ? ' /month' : ''}`,
        coverFeesCheckboxText: `I would like to add $${(cleanValue * (feeRate - 1)).toFixed(2)} to cover the transaction fees`,
      }
    }
    case 'TOGGLE_COVER_FEE': {
      if (!state.finalAmount) return state
      const updatedFinalAmount = Number(
        state.coverFees ? state.finalAmount / feeRate : state.finalAmount * feeRate.toFixed(2)
      )
      if (updatedFinalAmount > Max) {
        return {
          ...defaultDonateForum,
          maxAmountError: true,
        }
      }
      return {
        ...state,
        coverFees: !state.coverFees,
        finalAmount: updatedFinalAmount,
        disableDonateButton: false,
        donateButtonText: `Make a Donation of $${updatedFinalAmount.toFixed(2)}${state.mode === 'subscription' ? ' /month' : ''}`,
      }
    }
    case 'SUBMIT':
      return {
        ...state,
        disableDonateButton: true,
      }
    default:
      return state
  }
}

export default function Page() {
  const { accessToken, user } = useUser()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')

  const [donateForm, setDonateForm] = useReducer(donationReducer, defaultDonateForum)

  const email = user?.profile?.preferredEmail

  const handlePresetAmountClick = (amount) => {
    setDonateForm({ type: 'SET_PRESET_AMOUNT', payload: { amount } })
  }

  const handleDonate = async () => {
    setDonateForm({ type: 'SUBMIT' })
    try {
      const result = await api.post(
        '/donate-session',
        { amount: donateForm.finalAmount, mode: donateForm.mode, email },
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
    if (donateForm.maxAmountError) {
      promptMessage(
        `To make a donation over $${Max}, please contact us at [donate@openreview.net](mailto:donate@openreview.net)`,
        8
      )
    }
  }, [donateForm.maxAmountError])

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
                className={donateForm.mode === 'subscription' ? styles.active : ''}
                onClick={() =>
                  setDonateForm({ type: 'SET_MODE', payload: { mode: 'subscription' } })
                }
              >
                Monthly
              </button>
              <button
                className={donateForm.mode === 'payment' ? styles.active : ''}
                onClick={() =>
                  setDonateForm({ type: 'SET_MODE', payload: { mode: 'payment' } })
                }
              >
                One-Time
              </button>
            </div>
            <div className={styles.amountButtons}>
              <div
                className={`${styles.amountButton} ${donateForm.presetAmount === 10 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(10)}
              >
                $10
              </div>
              <div
                className={`${styles.amountButton} ${donateForm.presetAmount === 50 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(50)}
              >
                $50
              </div>
              <div
                className={`${styles.amountButton} ${donateForm.presetAmount === 100 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(100)}
              >
                $100
              </div>
              <div
                className={`${styles.amountButton} ${donateForm.presetAmount === 500 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(500)}
              >
                $500
              </div>
            </div>
            <div className={styles.amountButtons}>
              <div
                className={`${styles.amountButton} ${donateForm.presetAmount === 1000 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(1000)}
              >
                $1k
              </div>
              <div
                className={`${styles.amountButton} ${donateForm.presetAmount === 5000 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(5000)}
              >
                $5k
              </div>
              <div
                className={styles.amountButton}
                onClick={() =>
                  promptMessage(
                    `To make a donation over $${Max}, please contact us at [donate@openreview.net](mailto:donate@openreview.net)`,
                    8
                  )
                }
              >
                {'> $10k'}
              </div>
            </div>
            <div className={styles.amountButtons}>
              <div
                className={`${styles.amountButton} ${donateForm.customAmount !== '' ? styles.activeAmountInput : ''}`}
              >
                <input
                  type="text"
                  placeholder="$ Other Amount"
                  value={donateForm.customAmount ? `$ ${donateForm.customAmount}` : ''}
                  onChange={(e) =>
                    setDonateForm({
                      type: 'SET_CUSTOM_AMOUNT',
                      payload: {
                        amount: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            {donateForm.showCoverFeesCheckbox && (
              <div>
                <input
                  type="checkbox"
                  id="coverFees"
                  checked={donateForm.coverFees}
                  onChange={(e) => setDonateForm({ type: 'TOGGLE_COVER_FEE' })}
                />
                <label htmlFor="coverFees" className={styles.coverFeesLabel}>
                  {donateForm.coverFeesCheckboxText}
                </label>
              </div>
            )}
            <button
              className="btn"
              onClick={handleDonate}
              disabled={donateForm.disableDonateButton}
            >
              {donateForm.donateButtonText}
            </button>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.statistics}>
          <h2>Some statistics</h2>
          <div className={styles.statisticsCards}>
            <div className={styles.card}>
              <h3>3.5M</h3>
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
    </div>
  )
}
