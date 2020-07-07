import Link from 'next/link'
import { useState } from 'react'
import FeedbackModal from './FeedbackModal'

import '../styles/components/footer.less'

const Footer = () => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  return (
    <>
      <footer className="sitemap">
        <div className="container">

          {/* 3 Column Layout for Tablet and Desktop */}
          <div className="row hidden-xs">
            <div className="col-sm-4">
              <ul className="list-unstyled">
                <li><Link href="/about"><a>About OpenReview</a></Link></li>
                <li><Link href="/group?id=OpenReview.net/Support"><a>Hosting a Venue</a></Link></li>
                <li><Link href="/venues"><a>All Venues</a></Link></li>
              </ul>
            </div>

            <div className="col-sm-4">
              <ul className="list-unstyled">
                <li><Link href="/contact"><a>Contact</a></Link></li>
                { /* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="" data-toggle="modal" data-target="#feedback-modal" onClick={() => setShowFeedbackModal(true)}>Feedback</a></li>
                <li><a href="https://codeforscience.org/jobs?job=OpenReview-Developer" target="_blank" rel="noopener noreferrer"><strong>Join the Team</strong></a></li>
              </ul>
            </div>

            <div className="col-sm-4">
              <ul className="list-unstyled">
                <li><Link href="/faq"><a>Frequently Asked Questions</a></Link></li>
                <li><Link href="/terms"><a>Terms of Service</a></Link></li>
                <li><Link href="/privacy"><a>Privacy Policy</a></Link></li>
              </ul>
            </div>
          </div>

          {/* 2 Column Layout for Mobile */}
          <div className="row visible-xs-block">
            <div className="col-xs-6">
              <ul className="list-unstyled">
                <li><Link href="/about"><a>About OpenReview</a></Link></li>
                <li><Link href="/group?id=OpenReview.net/Support"><a>Hosting a Venue</a></Link></li>
                <li><Link href="/venues"><a>All Venues</a></Link></li>
                <li><a href="https://codeforscience.org/jobs?job=OpenReview-Developer" target="_blank" rel="noopener noreferrer"><strong>Join the Team</strong></a></li>
              </ul>
            </div>

            <div className="col-xs-6">
              <ul className="list-unstyled">
                <li><Link href="/faq"><a>Frequently Asked Questions</a></Link></li>
                <li><Link href="/contact"><a>Contact</a></Link></li>
                { /* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="" data-toggle="modal" data-target="#feedback-modal" onClick={() => setShowFeedbackModal(true)}>Feedback</a></li>
                <li><Link href="/terms"><a>Terms of Service</a></Link></li>
                <li><Link href="/privacy"><a>Privacy Policy</a></Link></li>
              </ul>
            </div>
          </div>

        </div>
      </footer>

      <footer className="sponsor">
        <div className="container">
          <div className="row">
            <div className="col-sm-10 col-sm-offset-1">
              <p className="text-center">
                OpenReview is created by the
                {' '}
                <a href="http://www.iesl.cs.umass.edu/" target="_blank" rel="noopener noreferrer">
                  Information Extraction and Synthesis Laboratory
                </a>
                , College of Information and Computer Science, University of Massachusetts Amherst.
                We gratefully acknowledge the support of the OpenReview sponsors:  Google,  Facebook,
                NSF, the University of Massachusetts Amherst Center for Data Science, and Center for
                Intelligent Information Retrieval, as well as the Google Cloud Platform for donating
                the computing and networking services on which OpenReview.net runs.
              </p>
            </div>
          </div>
        </div>
      </footer>
      <FeedbackModal displayFlag={showFeedbackModal} cancelClickHandler={() => setShowFeedbackModal(false)} />
    </>
  )
}

export default Footer
