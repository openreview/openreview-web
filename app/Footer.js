import { Col, Flex, Row, Space } from 'antd'
import Link from 'next/link'

import styles from '../styles/components/Footer.module.scss'

export default function Footer() {
  return (
    <Flex vertical align="center" justify="center" wrap="wrap">
      <Row
        align="center"
        justify="space-around"
        gutter={['3rem', '0.5rem']}
        className={styles.footerNavigation}
      >
        <Col>
          <Space className={styles.column}>
            <Link className={styles.footerNavigationLink} href="/about">
              About OpenReview
            </Link>
            <Link
              className={styles.footerNavigationLink}
              href={`/group?id=${process.env.SUPER_USER}/Support`}
            >
              Hosting a Venue
            </Link>
            <Link className={styles.footerNavigationLink} href="/venues">
              All Venues
            </Link>
          </Space>
        </Col>
        <Col>
          <Space className={styles.column}>
            <Link className={styles.footerNavigationLink} href="/contact">
              Contact
            </Link>
            <Link className={styles.footerNavigationLink} href="/sponsors">
              Sponsors
            </Link>
            <Link className={styles.footerNavigationLink} href="/donate">
              <strong>Donate</strong>
            </Link>
          </Space>
        </Col>
        <Col>
          <Space className={styles.column}>
            <a
              className={styles.footerNavigationLink}
              href="https://docs.openreview.net/getting-started/frequently-asked-questions"
            >
              FAQ
            </a>
            <span>
              <Link className={styles.footerNavigationLink} href="/legal/terms">
                Terms of Use
              </Link>{' '}
              /{' '}
              <Link className={styles.footerNavigationLink} href="/legal/privacy">
                Privacy Policy
              </Link>
            </span>
            <Link
              className={styles.footerNavigationLink}
              href={`/group?id=${process.env.SUPER_USER}/News&referrer=[Homepage](/)`}
            >
              News
            </Link>
          </Space>
        </Col>
      </Row>
      <div
        style={{
          backgroundColor: '#2c3a4a',
          width: '100%',
          textAlign: 'center',
          padding: '0.75rem 0',
          color: '#a3a3a3',
          fontSize: '0.75rem',
        }}
      >
        <a
          href="/about"
          target="_blank"
          style={{
            color: '#a3a3a3',
          }}
        >
          OpenReview
        </a>{' '}
        is a long-term project to advance science through improved peer review with legal
        nonprofit status. We gratefully acknowledge the support of the{' '}
        <a
          href="/sponsors"
          target="_blank"
          style={{
            color: '#a3a3a3',
          }}
        >
          OpenReview Sponsors
        </a>
        <span>. &copy; {new Date().getFullYear()} OpenReview</span>
      </div>
    </Flex>
  )
  return (
    <>
      <footer className="sitemap">
        <div className="container">
          {/* 3 Column Layout for Tablet and Desktop */}
          <div className="row hidden-xs">
            <div className="col-sm-4">
              <ul className="list-unstyled">
                <li>
                  <Link href="/about">About OpenReview</Link>
                </li>
                <li>
                  <Link href={`/group?id=${process.env.SUPER_USER}/Support`}>
                    Hosting a Venue
                  </Link>
                </li>
                <li>
                  <Link href="/venues">All Venues</Link>
                </li>
              </ul>
            </div>

            <div className="col-sm-4">
              <ul className="list-unstyled">
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
                <li>
                  <Link href="/sponsors">Sponsors</Link>
                </li>
                <li>
                  <Link href="/donate">
                    <strong>Donate</strong>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-sm-4">
              <ul className="list-unstyled">
                <li>
                  <a href="https://docs.openreview.net/getting-started/frequently-asked-questions">
                    FAQ
                  </a>
                </li>
                <li>
                  <Link href="/legal/terms">Terms of Use</Link> /{' '}
                  <Link href="/legal/privacy">Privacy Policy</Link>
                </li>
                <li>
                  <Link
                    href={`/group?id=${process.env.SUPER_USER}/News&referrer=[Homepage](/)`}
                  >
                    News
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* 2 Column Layout for Mobile */}
          <div className="row visible-xs-block">
            <div className="col-xs-6">
              <ul className="list-unstyled">
                <li>
                  <Link href="/about">About OpenReview</Link>
                </li>
                <li>
                  <Link href={`/group?id=${process.env.SUPER_USER}/Support`}>
                    Hosting a Venue
                  </Link>
                </li>
                <li>
                  <Link href="/venues">All Venues</Link>
                </li>
                <li>
                  <Link href="/sponsors">Sponsors</Link>
                </li>
                <li>
                  <Link
                    href={`/group?id=${process.env.SUPER_USER}/News&referrer=[Homepage](/)`}
                  >
                    News
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-xs-6">
              <ul className="list-unstyled">
                <li>
                  <a href="https://docs.openreview.net/getting-started/frequently-asked-questions">
                    FAQ
                  </a>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
                <li>
                  <Link href="/donate">
                    <strong>Donate</strong>
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms">Terms of Use</Link>
                </li>
                <li>
                  <Link href="/legal/privacy">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <div className="sponsor">
        <div className="container">
          <div className="row">
            <div className="col-sm-10 col-sm-offset-1">
              <p className="text-center">
                <a href="/about" target="_blank">
                  OpenReview
                </a>{' '}
                is a long-term project to advance science through improved peer review with
                legal nonprofit status. We gratefully acknowledge the support of the{' '}
                <a href="/sponsors" target="_blank">
                  OpenReview Sponsors
                </a>
                . &copy; {new Date().getFullYear()} OpenReview
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
