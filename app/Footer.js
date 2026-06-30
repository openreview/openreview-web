import { Col, Flex, Row } from 'antd'
import Link from 'next/link'

import styles from './Footer.module.scss'

export default function Footer() {
  return (
    <footer>
      <Flex vertical>
        <div className={styles.sitemap}>
          <Flex justify="center">
            <Row gutter={[0, 8]} className={styles.sitemapRow}>
            <Col xs={12} md={8}>
              <Link href="/about">About OpenReview</Link>
            </Col>
            <Col xs={12} md={8}>
              <Link href="/contact">Contact</Link>
            </Col>
            <Col xs={12} md={8}>
              <a href="https://docs.openreview.net/getting-started/frequently-asked-questions">
                FAQ
              </a>
            </Col>
            <Col xs={12} md={8}>
              <Link href={`/group?id=${process.env.SUPER_USER}/Support`}>Hosting a Venue</Link>
            </Col>
            <Col xs={12} md={8}>
              <Link href="/sponsors">Sponsors</Link>
            </Col>
            <Col xs={12} md={8}>
              <Link href="/legal/terms">Terms of Use</Link>
              {' / '}
              <Link href="/legal/privacy">Privacy Policy</Link>
            </Col>
            <Col xs={12} md={8}>
              <Link href="/venues">All Venues</Link>
            </Col>
            <Col xs={12} md={8}>
              <Link href="/donate">
                <strong>Donate</strong>
              </Link>
            </Col>
            <Col xs={0} md={8}>
              <Link href={`/group?id=${process.env.SUPER_USER}/News&referrer=[Homepage](/)`}>
                News
              </Link>
            </Col>
            </Row>
          </Flex>
        </div>

        <div className={styles.sponsor}>
          <Flex justify="center">
            <p className={styles.sponsorText}>
            <a
              href="/about"
              target="_blank"
              className={styles.sponsorLink}
            >
              OpenReview
            </a>{' '}
            is a long-term project to advance science through improved peer review with legal
            nonprofit status. We gratefully acknowledge the support of the{' '}
            <a
              href="/sponsors"
              target="_blank"
              className={styles.sponsorLink}
            >
              OpenReview Sponsors
            </a>
            . &copy; {new Date().getFullYear()} OpenReview
          </p>
          </Flex>
        </div>
      </Flex>
    </footer>
  )
}
