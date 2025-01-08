import Banner from '../components/Banner'
import FooterMinimal from '../components/FooterMinimal'
import Footer from './Footer'

export default function CommonLayout({
  children,
  banner = true,
  editBanner,
  fullWidth,
  minimalFooter,
}) {
  return (
    <>
      {banner !== null && (banner === true ? <Banner /> : banner)}
      {editBanner}
      <div className={fullWidth ? 'container-fluid' : 'container'}>
        <div className="row">
          <div className="col-xs-12">
            <main id="content">{children}</main>
          </div>
        </div>
      </div>
      {minimalFooter ? <FooterMinimal /> : <Footer />}
    </>
  )
}
