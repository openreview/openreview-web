import Banner from '../../components/Banner'
import { referrerLink } from '../../lib/banner-links'
import CommonLayout from '../CommonLayout'

export default function Layout({ children }) {
  const banner = <Banner>{referrerLink('[All Venues](/venues)')}</Banner>
  return (
    <CommonLayout banner={banner} editBanner={null}>
      {children}
    </CommonLayout>
  )
}
