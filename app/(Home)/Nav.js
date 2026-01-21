import Link from 'next/link'
import NavUserLinks from './NavUserLinks'
import NavSearch from './NavSearch'
import { Col, Row } from 'antd'

function Nav() {
  return (
    <Row
      style={{ backgroundColor: '#8c1b13', padding: '0.5rem 1rem', margin: 0 }}
      justify="space-between"
      align="middle"
      gutter={{ xs: 8, sm: 16, md: 24 }}
      wrap={false}
    >
      <Col>
        <Link href="/" style={{ fontSize: '1.375rem', color: '#b8b8b8' }}>
          <span style={{ fontWeight: 'bold', color: 'white' }}>OpenReview</span>
          .net
        </Link>
      </Col>
      <Col flex="3">
        <NavSearch />
      </Col>
      <Col flex="2">
        <NavUserLinks />
      </Col>
    </Row>
  )
}

export default Nav
