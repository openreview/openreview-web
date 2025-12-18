'use client'

/* globals promptError,promptMessage: false */

import { useEffect, useReducer } from 'react'
import { useSearchParams } from 'next/navigation'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import Icon from '../../components/Icon'

import styles from '../../styles/components/Donate.module.scss'

const Max = 10000
const MaxString = Max.toLocaleString('en-GB')

const defaultDonateForum = {
  mode: 'payment',
  presetAmount: null,
  customAmount: '',
  requireIRSReceipt: false,
  finalAmount: null,
  disableDonateButton: true,
  donateButtonText: 'Make a Donation through Stripe',
  maxAmountError: null,
}

const donationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload.mode,
        donateButtonText: state.finalAmount
          ? `Make a Donation of $${state.finalAmount.toFixed(2)}${action.payload.mode === 'subscription' ? ' /month' : ''} through Stripe`
          : 'Make a Donation through Stripe',
      }
    case 'SET_PRESET_AMOUNT': {
      return {
        ...state,
        presetAmount: action.payload.amount,
        customAmount: '',
        finalAmount: action.payload.amount,
        disableDonateButton: false,
        donateButtonText: `Make a Donation of $${action.payload.amount.toLocaleString('en-GB')}${state.mode === 'subscription' ? ' /month' : ''} through Stripe`,
        requireIRSReceipt: action.payload.amount >= 250 ? true : state.requireIRSReceipt,
      }
    }
    case 'SET_CUSTOM_AMOUNT': {
      const rawAmount = action.payload.amount
      const cleanValue = Number(rawAmount.replace(/^\$ /, '').replace(/[^0-9]/g, ''))
      if (Number.isNaN(cleanValue) || cleanValue <= 0) return defaultDonateForum
      if (cleanValue > Max) {
        return {
          ...defaultDonateForum,
          maxAmountError: true,
        }
      }
      return {
        ...state,
        customAmount: cleanValue,
        presetAmount: null,
        finalAmount: cleanValue,
        disableDonateButton: false,
        donateButtonText: `Make a Donation of $${cleanValue.toLocaleString('en-GB')}${state.mode === 'subscription' ? ' /month' : ''} through Stripe`,
        requireIRSReceipt: cleanValue >= 250 ? true : state.requireIRSReceipt,
        maxAmountError: null,
      }
    }
    case 'TOGGLE_IRS_RECEIPT':
      return {
        ...state,
        requireIRSReceipt: !state.requireIRSReceipt,
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
        {
          amount: donateForm.finalAmount,
          mode: donateForm.mode,
          email,
          irsReceipt: donateForm.requireIRSReceipt,
        },
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
        `To make a donation of greater than $${MaxString}, or to donate appreciated stock, please email [donations@openreview.net](mailto:donations@openreview.net)`,
        8
      )
    }
  }, [donateForm.maxAmountError])

  useEffect(() => {
    if (success === 'true') {
      promptMessage('Thank you for your generous donation to support OpenReview!')
      window.history.replaceState({}, null, '/donate')
    }
  }, [success])

  return (
    <div className={styles.donateContainer}>
      <div className={styles.section}>
        <h2 className={styles.headerText}>Donate to the nonprofit OpenReview Foundation</h2>
        <hr />
      </div>
      <div className={styles.section}>
        <div className={styles.messageDonate}>
          <div className={styles.message}>
            <p><b>A letter from recent supporters:</b></p>
            <p>
              OpenReview is a pillar of progress in the AI research community.  Now it needs our increased support.
            </p>
            <p>
              As a nonprofit dedicated to improving scientific dialogue, OpenReview has earned tremendous respect through its tireless, highly customized support for leading research venues. Today, OpenReview underpins the vast majority of the flagship AI conferences we know and love, including NeurIPS, ICLR, ICML, AAAI, UAI, AISTATS, CVPR, ICCV, ECCV, ACL, EMNLP, NAACL, ARR, COLM, TMLR, The Web Conference, KDD, and many more.
            </p>
            <p>
              In 2025 alone, OpenReview supported more than 1,300 conferences and workshops, served a community of 3.3 million active monthly users, and handled over 278,000 paper submissions—exceeding the annual submission volume of ArXiv and more than doubling that of ACM.
            </p>
            <p>
              Yet despite its crucial role in the AI research ecosystem, OpenReview remains chronically underfunded, operating under severe financial constraints, with a staff less than one-third the size of ArXiv’s.
            </p>
            <p>
              At this time when the impact of artificial intelligence is expanding at an unprecedented pace, we must ensure that this infrastructure supporting open scientific exchange and debate in AI has the resources to stay strong, innovative, independent, and secure.
            </p>
            <p>
              We applaud the companies, philanthropic foundations, and conferences that already <a href="https://openreview.net/supporters">support OpenReview</a>. However, many organizations that benefit enormously from AI innovation have not yet chosen to contribute. We believe the moment has come for broader participation.
            </p>
            <p>
              It is also time for individuals to step forward.
            </p>
            <p>
              We, the undersigned, are collectively committing a total of <b>$1,000,000</b> to the OpenReview Foundation.
            </p>
            <p>
              We invite researchers, leaders, and beneficiaries of AI to join us and demonstrate their commitment to scientific dialogue by joining the roster of OpenReview supporters. Contributions at any level make a difference.
            </p>
            <p>
              To donate more than $10,000, or appreciated securities, please contact <a href="mailto:donations@openreview.net">donations@openreview.net</a>.
            </p>
            <p>
              To donate online in amounts from $10 to $10,000, please use the interface to the right.
            </p>
            <p>
              Signed: Joelle Pineau, Doina Precup, Kyunghyun Cho, Andrew Ng, Yoshua Bengio, Ruslan Salakhutdinov, and (Anonymous)

            </p>
          </div>
          <div className={styles.donateContainer}>
            {/* <div className={styles.frequencyButtons}>
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
            </div> */}
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
                $1,000
              </div>
              <div
                className={`${styles.amountButton} ${donateForm.presetAmount === 5000 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(5000)}
              >
                $5,000
              </div>
              <div
                className={`${styles.amountButton} ${donateForm.presetAmount === 10000 ? styles.activeAmountButton : ''}`}
                onClick={() => handlePresetAmountClick(10000)}
              >
                $10,000
              </div>
            </div>
            <div className={styles.maxAmountMessage}>
              <span>
                {`To make a donation of greater than $${MaxString}, or to donate appreciated stock`}
              </span>
              <br />
              <span>please email{' '}
                <a href="mailto:donations@openreview.net">donations@openreview.net</a>
              </span>
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

            <div className={styles.irsReceiptContainer}>
              <input
                type="checkbox"
                id="irsReceipt"
                checked={donateForm.requireIRSReceipt}
                onChange={(e) => setDonateForm({ type: 'TOGGLE_IRS_RECEIPT' })}
              />
              <label htmlFor="irsReceipt" className={styles.irsReceiptLabel}>
                Email me a charitable donation receipt for tax purposes.
              </label>
            </div>
            <div className={styles.poweredByStripe}>
              <div className={styles.secureTitle}>
                <Icon name="lock" />
                Secure Payment
              </div>
              <div className={styles.securityFeature}>
                Encrypted payment processing by Stripe
              </div>
              <div className={styles.securityFeature}>
                Your credit card details are only handled by Stripe
              </div>
              <hr />
              <div className={styles.poweredBy}>
                Powered by <span className={styles.stripeText}>Stripe</span>
              </div>
            </div>
            <button
              className="btn"
              onClick={handleDonate}
              disabled={donateForm.disableDonateButton}
            >
              {donateForm.donateButtonText}
            </button>
            <div className={styles.redirectText}>
              <span>
                You&apos;ll be securely redirected to Stripe to complete your payment
              </span>
            </div>
            <div className={styles.csrText}>
              <span>
                The OpenReview Foundation nonprofit is registered with <a href="https://causes.benevity.org/causes/840-994025250">Benevity</a>
                <br />
                for employer gift matching. Employer matching donation may be
                <br />
                requested on Benevity after your donation here.
                <br />
                The OpenReview Foundation is not yet registered with other
                <br />
                matching programs.
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className={`${styles.section} ${styles.qna}`}>
        <strong>What is OpenReview?</strong>
        <ul>
          <li>
            <span>
              OpenReview is a nonprofit dedicated to improving scientific dialogue by providing
              the peer-review infrastructure on which the majority of the artificial
              intelligence research community’s flagship publication venues depend.
            </span>
          </li>
          <li>
            <span>
              <strong>A widely used, fast-growing service.</strong> OpenReview has earned deep
              respect through tireless, highly customized support for leading AI research
              venues. As a result, its usage has grown dramatically—approximately doubling each
              of the past nine years in the number of venues, users, and publications.
            </span>
          </li>
          <li>
            <span>
              <strong>Critical infrastructure for AI research.</strong> OpenReview underpins
              the vast majority of the flagship AI conferences we know and love: NeurIPS, ICLR,
              ICML, AAAI, UAI, AISTATS, CVPR, ICCV, ECCV, ACL, EMNLP, NAACL, ARR, COLM, TMLR,
              TheWebConf, KDD, and many more.
            </span>
          </li>
          <li>
            <span>
              <strong>Size of service.</strong> In 2025 alone, OpenReview supported more than
              1,300 conferences and workshops, serving a community of 3.3 million active
              monthly users, handling more than 278,000 papers (more than all of ArXiv, double
              that of ACM).
            </span>
          </li>
          <li>
            <span>
              <strong>Designed as a laboratory for peer-review innovation.</strong> Since
              OpenReview’s inception, founder Andrew McCallum has believed that the time is
              ripe for revolutionary new ideas in peer review. OpenReview was intentionally
              designed to support not just one style of peer review, but to offer great
              flexibility for designing innovations in peer review, so that different
              publication venues and communities could experiment with new ideas, as many of
              its venues have, including ICLR's style and TMLR's style of open review, and the peer review experiments
              at ICML and NeurIPS.
            </span>
          </li>
          <li>
            <span>
              <strong>Born from the community it serves.</strong> OpenReview emerged
              organically from the AI research community. It is designed by researchers, for
              researchers, for the benefit of the research community, and governed in service
              of scientific values—not commercial trends or external agendas.
            </span>
          </li>
        </ul>
        <strong>Why is OpenReview important?</strong>
        <ul>
          <li>
            <span>
              <strong>
                AI is reshaping the world—and peer review is where its science is debated and
                refined.
              </strong>{' '}
              As the world grapples with the promise and peril of artificial intelligence,
              OpenReview has become a central venue where AI research is rigorously
              scrutinized, openly examined. Many of the most important AI research advances of
              the last decade have gone through OpenReview, and have been shaped by the
              feedback of the community.
            </span>
          </li>
          <li>
            <span>
              <strong>Scientific evaluation is under growing pressure.</strong> Commercial,
              political, and geopolitical interests increasingly press on AI research.
              Independent, trusted peer review has never been more essential.
            </span>
          </li>
          <li>
            <span>
              <strong>There is no practical alternative at scale.</strong> Conferences like
              NeurIPS, ICML, and AAAI would struggle to function without OpenReview. No other
              platform today can reliably support submission volumes of 30,000+ papers per
              conference deadline, and the ensuing reviewer matching and dialog.
            </span>
          </li>
        </ul>
        <strong>Why is OpenReview a nonprofit?</strong>
        <ul>
          <li>
            <span>
              <strong>Peer review must remain a public good.</strong> Peer review and the
              scientific discussion at its core should be sacrosanct, not monetized or
              distorted to enrich investors.
            </span>
          </li>
          <li>
            <span>
              <strong>For-profit incentives inevitably diverge.</strong> Commercial publishing,
              discussion, and review platforms face unavoidable pressure to optimize for
              revenue, lock-in, or control. Over time, these incentives risk conflict with the
              openness, fairness, and scientific integrity that the research community depends
              on. Nonprofit stewardship is the most reliable way to safeguard these values for
              the scientific community and society at large.
            </span>
          </li>
          <li>
            <span>
              To sustain its vital mission, OpenReview relies on the generosity of its donors:
              corporations, philanthropic foundations, conferences, and individuals.
            </span>
          </li>
        </ul>
        <strong>Why donate now?</strong>
        <ul>
          <li>
            <span>
              <strong>
                AI is rapidly becoming a foundational technology with wide-ranging and
                long-lasting societal impact.
              </strong>{' '}
              The science of AI—its innovation, evaluation, safety, and governance—will shape
              society for generations. The AI research community needs a robust, open,
              unbiased, nonprofit institution to support scientific debate and peer review at
              scale.
            </span>
          </li>
          <li>
            <span>
              <strong>OpenReview is at a true inflection point.</strong> The OpenReview
              organization is transitioning from its roots as (1) a university lab project,
              through its current status as (2) a scrappy nonprofit, to a (3) fully staffed,
              professionally structured, high-velocity and adaptive organization capable of
              building sophisticated features in response to rapidly evolving community needs.
            </span>
          </li>
          <li>
            <span>
              <strong>Attracting exceptional talent.</strong> Visible financial commitments
              send a powerful signal of confidence and stability, significantly strengthening
              OpenReview’s ability to attract a truly outstanding additional executive and
              technical talent across key roles.
            </span>
          </li>
          <li>
            <span>
              <strong>The stakes have risen.</strong> AI institutions—and peer review
              itself—are increasingly targeted by cyberattacks, coordinated manipulation, and
              social engineering attacks. OpenReview must rapidly strengthen its security,
              resilience, and operational maturity.
            </span>
          </li>
          <li>
            <span>
              <strong>A narrow window for multiplicative impact.</strong> These are the final
              weeks of the calendar year ahead of changes to U.S. charitable-giving tax
              policy.
            </span>
          </li>
        </ul>
        <strong>How can we have confidence in OpenReview's future?</strong>
        <ul>
          <li>
            <span>
              <strong>The community is stepping up.</strong> Leading conferences—including
              NeurIPS, ICML, and ICLR—have doubled or more their financial support for
              OpenReview.
            </span>
          </li>
          <li>
            <span>
              <strong>More than a decade of earned trust.</strong> Since its founding in 2012,
              OpenReview has built extraordinary goodwill, credibility, and admiration within
              the global AI research community.
            </span>
          </li>
          <li>
            <span>
              <strong>Strong governance.</strong> The OpenReview Foundation is a 501(c)(3)
              nonprofit with an established Board, robust governance structures, and active community
              engagement and oversight.
            </span>
          </li>
        </ul>
        <strong>What will the donated funds enable?</strong>
        <ul>
          <li>
            <span>
              <strong>Scaling the organization.</strong> Growing staff from roughly one-third
              the size of ArXiv’s to a level commensurate with OpenReview’s scope and
              responsibility (from ~8 today toward ~25+).
            </span>
          </li>
          <li>
            <span>
              <strong>Security and resilience.</strong> Immediate investment in higher-tier
              professional security audits, dedicated security staff, and long-term robustness
              against technical and social attacks.
            </span>
          </li>
          <li>
            <span>
              <strong>Eventually, endowment for stability.</strong> Building an endowment to
              ensure OpenReview’s independence, financial stability, and longevity—so this
              infrastructure remains strong and trusted beyond any individual’s lifetime.
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
