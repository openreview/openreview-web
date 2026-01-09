import CustomBanner from './CustomBanner'
import FooterMinimal from '../components/FooterMinimal'
import Footer from './Footer'
import { Row, Col } from 'antd'

export default function CommonLayout({
  children,
  banner,
  editBanner,
  fullWidth,
  minimalFooter,
}) {
  return (
    <>
      <CustomBanner banner={banner} />
      {editBanner}
      <Row justify="center" style={{ flexGrow: 1, margin: ' 0 20px' }}>
        <Col
          md={24}
          lg={fullWidth ? 24 : 18}
          xl={fullWidth ? 24 : 16}
          xxl={fullWidth ? 24 : 14}
        >
          {children}
        </Col>
      </Row>
      {minimalFooter ? <FooterMinimal /> : <Footer />}
    </>
  )
}
