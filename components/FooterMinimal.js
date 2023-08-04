import Link from 'next/link'

const FooterMinimal = () => (
  <footer className="container minimal">
    <div className="row">
      <div className="col-xs-12">
        <p className="text-center">
          &copy; 2023 OpenReview.net &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <Link href="/legal/terms">Terms &amp; Conditions</Link>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <Link href="/legal/privacy">Privacy Policy</Link>
        </p>
      </div>
    </div>
  </footer>
)

export default FooterMinimal
