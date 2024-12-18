import Banner from '../components/Banner'

export default function CommonLayout({ children, banner = true, editBanner }) {
  return (
    <>
      {banner !== null && (banner === true ? <Banner /> : banner)}
      {editBanner}
      <div className="container">
        <div className="row">
          <div className="col-xs-12">
            <main id="content">{children}</main>
          </div>
        </div>
      </div>
    </>
  )
}
