import CustomBanner from './CustomBanner'
import FooterMinimal from '../components/FooterMinimal'
import Footer from './Footer'

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
      <div className={fullWidth ? 'container-fluid' : 'container'}>
        <div className="row">
          <main id="content">{children}</main>
        </div>
      </div>
      {minimalFooter ? <FooterMinimal /> : <Footer />}
    </>
  )
}
